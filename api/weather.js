// Shared weather fetch. Every visitor's browser asks for the same two Open-Meteo requests, so this
// passes them through once and lets Vercel's edge hold the answer for 10 minutes. That keeps a busy
// office or phone network from running into Open-Meteo's per-address limits. The page falls back to
// asking Open-Meteo directly if this fails, and always shows when the data was fetched.
const UPSTREAM = 'https://api.open-meteo.com/v1/forecast?';

module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || '');
  // Only this project's own request shape: plain query characters, fixed start hour, bounded size.
  const ok = q.length > 100 && q.length < 4000 && /^[A-Za-z0-9_=&.,:%-]+$/.test(q) &&
    q.includes('start_hour=2026-11-25T14:00') && q.includes('timezone=UTC') && q.startsWith('latitude=');
  if (!ok) { res.statusCode = 400; res.setHeader('Cache-Control', 'no-store'); return res.end('bad request'); }
  try {
    const r = await fetch(UPSTREAM + q, { cache: 'no-store' });
    if (!r.ok) throw new Error('upstream ' + r.status);
    const body = await r.text();
    if (body.charAt(0) !== '[') throw new Error('unexpected body');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600');
    res.setHeader('X-Fetched-At', String(Date.now()));
    res.end(body);
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Cache-Control', 'no-store');
    res.end('weather unavailable');
  }
};
