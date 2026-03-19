const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ body: data, code: res.statusCode }));
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'team id required: ?id=12345' });

  try {
    // Fetch team stats page
    const statsUrl = `https://www.hltv.org/stats/teams/${id}/-`;
    const resp = await fetchPage(statsUrl);
    
    const result = { status: 'ok', team_id: id };
    
    if (resp.code === 200 && resp.body.length > 3000) {
      const html = resp.body;
      
      // Team name
      const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
      if (nameMatch) result.name = nameMatch[1].trim();
      
      // Players from stats table
      result.players = [];
      const playerMatches = html.matchAll(/\/stats\/players\/(\d+)\/([^"]+)/g);
      const seen = new Set();
      for (const m of playerMatches) {
        const slug = m[2].replace(/-/g, ' ');
        if (!seen.has(slug) && slug.length > 1 && slug.length < 30) {
          seen.add(slug);
          result.players.push({ id: m[1], name: slug });
        }
        if (seen.size >= 5) break;
      }
      
      // Try to get map stats
      await new Promise(r => setTimeout(r, 1000)); // small delay
      try {
        const mapUrl = `https://www.hltv.org/stats/teams/maps/${id}/-`;
        const mapResp = await fetchPage(mapUrl);
        if (mapResp.code === 200) {
          result.maps = {};
          const mapNames = ['Mirage','Inferno','Anubis','Nuke','Ancient','Dust2','Vertigo'];
          for (const map of mapNames) {
            const mapMatch = mapResp.body.match(new RegExp(map + '[\\s\\S]*?(\\d+)%'));
            if (mapMatch) result.maps[map] = parseInt(mapMatch[1]);
          }
        }
      } catch(e) {}
      
      // Ranking
      const rankMatch = html.match(/#(\d+)/);
      if (rankMatch) result.ranking = parseInt(rankMatch[1]);
      
    } else {
      result.error = `HLTV returned ${resp.code}`;
      if (resp.code === 403) result.error = 'HLTV Cloudflare block - this Vercel instance may need redeployment';
    }
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
