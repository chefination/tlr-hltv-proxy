const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html,*/*;q=0.8' } };
    https.get(url, options, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({body:d,code:res.statusCode})); }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { id } = req.query; // team id
  if (!id) return res.status(400).json({ error: 'team id required' });
  try {
    const resp = await fetchPage(`https://www.hltv.org/results?team=${id}`);
    const result = { status: 'ok', team_id: id, results: [] };
    if (resp.code === 200) {
      const matches = resp.body.matchAll(/class="result-con"[\s\S]*?<a href="\/matches\/(\d+)\/([\w-]+)"[\s\S]*?class="team"[^>]*>([^<]+)<[\s\S]*?class="result-score"[^>]*>[\s]*(\d+)[\s]*-[\s]*(\d+)[\s]*<[\s\S]*?class="team"[^>]*>([^<]+)</g);
      for (const m of matches) {
        result.results.push({ matchId: m[1], team1: m[3].trim(), score1: parseInt(m[4]), score2: parseInt(m[5]), team2: m[6].trim() });
        if (result.results.length >= 10) break;
      }
    } else { result.error = 'HLTV returned ' + resp.code; }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
