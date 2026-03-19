const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'team id required: ?id=6089' });
  
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.goto('https://www.hltv.org/team/' + id + '/a', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    const data = await page.evaluate(() => {
      var result = {};
      var nameEl = document.querySelector('.profile-team-name') || document.querySelector('h1.entityname');
      if (nameEl) result.name = nameEl.textContent.trim();
      
      var rankEl = document.querySelector('.profile-team-stat .right');
      if (rankEl && rankEl.textContent.includes('#')) {
        result.ranking = parseInt(rankEl.textContent.replace(/\D/g, ''));
      }
      
      result.players = [];
      document.querySelectorAll('.bodyshot-team-bg a, .playerFlagName a').forEach(function(el) {
        var name = el.textContent.trim();
        var href = el.getAttribute('href') || '';
        var idMatch = href.match(/\/player\/(\d+)\//);
        if (name && name.length > 1 && name.length < 25) {
          result.players.push({ id: idMatch ? idMatch[1] : '', name: name });
        }
      });
      
      if (result.players.length === 0) {
        document.querySelectorAll('.overlayImageFrame a').forEach(function(el) {
          var href = el.getAttribute('href') || '';
          var idMatch = href.match(/\/player\/(\d+)\/([^"?]+)/);
          if (idMatch) {
            result.players.push({ id: idMatch[1], name: idMatch[2].replace(/-/g, ' ') });
          }
        });
      }
      
      result.recentResults = [];
      document.querySelectorAll('.team-row').forEach(function(row) {
        var teams = row.querySelectorAll('.team-name, .team');
        var score = row.querySelector('.result-score, .score');
        if (teams.length >= 2 && score) {
          var parts = score.textContent.trim().split(/\s*-\s*/);
          result.recentResults.push({
            team1: teams[0].textContent.trim(),
            score: score.textContent.trim(),
            team2: teams[1].textContent.trim(),
            won: parseInt(parts[0]) > parseInt(parts[1])
          });
        }
      });
      
      return result;
    });
    
    data.status = 'ok';
    data.team_id = id;
    data.source = 'puppeteer';
    res.json(data);
    
  } catch (e) {
    res.status(500).json({ error: e.message, team_id: id });
  } finally {
    if (browser) await browser.close();
  }
};
