# TLR HLTV Proxy

Lightweight Vercel serverless proxy for fetching HLTV team/player data.

## Endpoints:
- `/api/team?id=12345` - Team stats, players, map win rates
- `/api/player?id=12345` - Player stats (rating, K/D, HS%)
- `/api/results?id=12345` - Recent match results

## Deploy:
1. Push to GitHub
2. Import in Vercel
3. Deploy

Or use the Vercel CLI: `vercel --prod`
