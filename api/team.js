const https = require('https');
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept': 'text/html,*/*;q=0.8', 'Accept-Language': 'en-GB,en;q=0.9', 'Accept-Encoding': 'identity' } };
    https.get(url, options, (res) => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve({ body: data, code: res.statusCode })); }).on('error', reject);
  });
}
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'team id required: ?id=6089' });
  try {
    const resp = await fetchPage('https://www.hltv.org/stats/teams/' + id + '/-');
    const result = { status: 'ok', team_id: id };
    if (resp.code === 200 && resp.body.length > 3000) {
      const html = resp.body;
      const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
      if (nameMatch) result.name = nameMatch[1].trim();
      result.players = [];
      const seen = new Set();
      const playerMatches = html.matchAll(/\/stats\/players\/(\d+)\/([^"]+)/g);
      for (const m of playerMatches) {
        const slug = m[2].replace(/-/g, ' ');
        if (!seen.has(slug) && slug.length > 1 && slug.length < 30) { seen.add(slug); result.players.push({ id: m[1], name: slug }); }
        if (seen.size >= 5) break;
      }
      const rankMatch = html.match(/#(\d+)/);
      if (rankMatch) result.ranking = parseInt(rankMatch[1]);
    } else { result.error = 'HLTV returned ' + resp.code; }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
