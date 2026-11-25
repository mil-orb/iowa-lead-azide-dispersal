// Returns the newest deposition / dispersion map images the Army has posted for the
// Iowa Army Ammunition Plant, read from the plant's public DVIDS feed. Never serves a stored copy.
const FEED = 'https://www.dvidshub.net/rss/unit/6219';

function parse(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const it = m[1];
    const tag = (t) => {
      const r = new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>').exec(it);
      return r ? r[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    };
    const title = tag('title').replace(/\s*\[Image \d+ of \d+\]\s*$/i, '').replace(/&amp;/g, '&');
    const link = tag('link');
    const thumb = /<media:thumbnail[^>]*url="([^"]+)"/.exec(it);
    if (!thumb || !/^https:\/\/www\.dvidshub\.net\/image\//.test(link)) continue;
    if (!/(depo|dispo|dispers|plume)\w*/i.test(title) && !/\bmap\b/i.test(title)) continue;
    const image = thumb[1].replace(/\/\d+w_q\d+\.jpg$/, '/1000w_q95.jpg');
    if (!/^https:\/\/d1ldvf68ux039x\.cloudfront\.net\//.test(image)) continue;
    const d = Date.parse(tag('pubDate'));
    items.push({ title, link, image, date: isNaN(d) ? null : new Date(d).toISOString() });
  }
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  // keep the newest "Map 1" and the newest "Map 2" when both exist, newest first
  const out = [];
  const seen = new Set();
  for (const it of items) {
    const n = /map\s*(\d)/i.exec(it.title);
    const key = n ? n[1] : it.link;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= 2) break;
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    const r = await fetch(FEED, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; plume-sim/1.0)', accept: 'application/rss+xml,application/xml,text/xml' }, cache: 'no-store' });
    if (!r.ok) throw new Error('feed HTTP ' + r.status);
    const items = parse(await r.text());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ fetchedAt: new Date().toISOString(), source: FEED, items }));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Could not read the Army feed', items: [] }));
  }
};
module.exports.parse = parse;
