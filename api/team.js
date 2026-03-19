const HLTV = require('hltv');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'team id required: ?id=6089' });
  try {
    const team = await HLTV.HLTV.getTeam({ id: parseInt(id) });
    res.json({
      status: 'ok',
      team_id: id,
      name: team.name || '',
      ranking: team.rank || null,
      players: (team.players || []).map(p => ({ id: p.id, name: p.name })),
      recentResults: (team.recentResults || []).slice(0, 10),
      logo: team.logo || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message, tip: 'HLTV may be rate limiting. Try again in a minute.' });
  }
};
