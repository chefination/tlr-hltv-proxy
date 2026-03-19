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
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'player id required' });
  try {
    const resp = await fetchPage(`https://www.hltv.org/stats/players/${id}/-`);
    const result = { status: 'ok', player_id: id };
    if (resp.code === 200) {
      const html = resp.body;
      const nick = html.match(/class="[^"]*summaryNickname[^"]*">([^<]+)</);
      if (nick) result.nickname = nick[1].trim();
      const rating = html.match(/Rating.*?<span[^>]*>([0-9.]+)</s);
      if (rating) result.rating = rating[1];
      const kd = html.match(/K\/D.*?<span[^>]*>([0-9.]+)</s);
      if (kd) result.kd = kd[1];
      const hs = html.match(/HS%.*?<span[^>]*>([0-9.]+)/s);
      if (hs) result.hs = hs[1];
    } else { result.error = 'HLTV returned ' + resp.code; }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
