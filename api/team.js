const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'team id required: ?id=6089' });
  
  let browser;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--single-process'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.executablePath(),
      headless: 'new'
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    
    await page.goto('https://www.hltv.org/team/' + id + '/a', { waitUntil: 'networkidle2', timeout: 25000 });
    
    const data = await page.evaluate(() => {
      var r = {};
      var n = document.querySelector('.profile-team-name') || document.querySelector('h1');
      if (n) r.name = n.textContent.trim();
      var rank = document.body.innerHTML.match(/World ranking[^#]*#(\d+)/);
      if (rank) r.ranking = parseInt(rank[1]);
      r.players = [];
      document.querySelectorAll('.bodyshot-team a, .playerFlagName a, a[href*="/player/"]').forEach(function(el) {
        var href = el.getAttribute('href') || '';
        var m = href.match(/\/player\/(\d+)\/([^"?]+)/);
        if (m && r.players.length < 5) {
          var name = m[2].replace(/-/g, ' ');
          if (!r.players.find(function(p) { return p.name === name; })) {
            r.players.push({ id: m[1], name: name });
          }
        }
      });
      return r;
    });
    
    data.status = 'ok';
    data.team_id = id;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message, team_id: id });
  } finally {
    if (browser) await browser.close();
  }
};
