# Security

This is a static page plus two small Vercel functions. The page fetches weather from Open-Meteo and map tiles from OpenStreetMap in the visitor's browser. `api/army-maps.js` reads one public RSS feed (DVIDS) and returns titles, links and image URLs. `api/weather.js` forwards this project's own Open-Meteo request and lets the edge cache it for 10 minutes.

## Reporting

Use [private vulnerability reporting](https://github.com/mil-orb/iowa-lead-azide-dispersal/security/advisories/new). Please don't open a public issue. Include the commit and steps that show the problem.

You'll get a reply within 7 days.

## What counts

Anything that lets:

- text from the DVIDS feed or from Open-Meteo run script or inject markup in a visitor's browser
- `api/army-maps.js` be pointed at a host other than the DVIDS feed, or return image or link URLs from other hosts
- `api/weather.js` fetch anything other than an Open-Meteo forecast request of this project's shape
- either function leak an environment variable

## Known and accepted

- **The numbers can be wrong.** It is a simplified model with a fitted source term. A wrong estimate is a modeling limit, covered in the README. Open a normal issue for those.
- **Third parties see visitors.** Open-Meteo, OpenStreetMap's tile servers, Google Fonts, cdnjs and the DVIDS image host each see the visitor's IP address. Nothing about the visitor is sent beyond the request itself.
- **No subresource integrity on Leaflet.** It is loaded from cdnjs at a pinned version without an integrity hash.
- **The functions have no rate limit** beyond what Vercel applies.

## Supported versions

Only the latest commit on `main` gets fixes.
