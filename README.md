# Iowa Lead Azide Detonation Dispersal Simulator

[![ci](https://github.com/mil-orb/iowa-lead-azide-dispersal/actions/workflows/ci.yml/badge.svg)](https://github.com/mil-orb/iowa-lead-azide-dispersal/actions/workflows/ci.yml)
![no build step](https://img.shields.io/badge/build-none-lightgrey)
![runs in the browser](https://img.shields.io/badge/platform-browser-blue)
[![license: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Live: https://iowa-lead-azide-dispersal.vercel.app**

A particle model of where lead dust went after the U.S. Army's controlled detonation of degraded lead azide at the Iowa Army Ammunition Plant (Middletown, Iowa) at about 9:00 AM CST on November 25, 2026. It runs in your browser on live weather data and follows the dust for 48 hours.

![The modeled plume from the detonation to the time the picture was made](plume.gif)

**It is a model estimate. It measures nothing.** For measured lead levels use EPA's [data dashboard](https://experience.arcgis.com/experience/1ddcf8b9d8314971b00dac8893ae9cd6) and [response site](https://response.epa.gov/site/site_profile.aspx?site_id=17211). For official maps and instructions use the [Army's notification page](https://www.army.mil/asc#org-iowa-army-ammunition-plant). This project has no connection to the Army, EPA or any agency.

## What it does

- Fetches hourly winds at eight heights, boundary layer height, precipitation, sunlight and cloud cover from [Open-Meteo](https://open-meteo.com/) on a 154-point grid (36.5 to 42.5°N, 96.5 to 88.7°W). Fresh on every load, again every 30 minutes, never cached.
- Moves 12,000 particles in eight size bins (0.3 to 80 µm) in 50 second steps.
- Settling: Stokes with slip and drag corrections. Turbulent spread: set by Pasquill stability class. Dry deposition: a resistance model. Wet deposition: rain washout.
- Sets the release amount so the deposition areas match the two contour levels on the Army's pre-detonation map (29 sq mi above 100 µg/ft², 186 sq mi above 5 µg/ft²).
- Pick any of 41 towns to see when the modeled dust arrives, the peak in the air and what is left on the ground.
- Shows the Army's newest deposition maps next to the model, read from the plant's public DVIDS feed.

## Run it

There is no build step and no dependency to install.

```bash
git clone https://github.com/mil-orb/iowa-lead-azide-dispersal
```

```bash
python -m http.server 8765 --directory iowa-lead-azide-dispersal
```

Open http://localhost:8765. The model and the map work from any static server. The two small functions in `api/` (the Army map feed and the About credit) only run on Vercel, so locally those two panels show their fallback.

Tests (Node 20 or newer, no packages):

```bash
node --test test/core.test.js
```

Deploy your own copy with `vercel deploy --prod`. Set a `BUILT_BY` environment variable if you want a name in the About box.

## Limits

- Nobody has published how much lead left the site. The release is fitted to the Army's own model, so this says nothing about what was measured.
- Hours after the fetch time are forecast and will shift.
- The weather grid is about 50 by 65 km. Terrain, river valleys and local wind shifts are missing.
- No chemistry, no resuspension of settled dust, no blast or buoyancy model for the first minutes.
- Town readouts are averages over a 20 km radius and will miss hot spots.
- Each page load is one large Open-Meteo request. Their free tier allows roughly a dozen loads an hour per visitor.
- Do not use these numbers for health decisions.

## Credits

Weather: Open-Meteo (NOAA HRRR and GFS). Basemap: © OpenStreetMap contributors. Map library: Leaflet. Official maps: U.S. Army via DVIDS.

MIT license. See [LICENSE](LICENSE).
