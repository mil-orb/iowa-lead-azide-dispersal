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

- Fetches hourly winds at eight heights, boundary layer height, precipitation, sunlight and cloud cover from [Open-Meteo](https://open-meteo.com/) on a 154-point grid (36.5 to 42.5°N, 96.5 to 88.7°W), plus a finer 99-point grid over the first 150 km of the plume track. Fetched on every load and every 30 minutes, through a shared copy at most 10 minutes old.
- Moves 48,000 particles in eight size bins (0.3 to 80 µm) in 50 second steps, in a background worker. A quick 12,000 particle pass shows first.
- Settling: Stokes with slip and drag corrections. Turbulent spread: set by Pasquill stability class. Dry deposition: a resistance model. Wet deposition: rain washout.
- Reads EPA's four real-time lead monitors along the plume path, live, and scales the release until the modeled fine dust passing them matches what they recorded. On the morning of the detonation that came to roughly 0.4 kg of lead.
- Can instead scale the release to the Army's pre-detonation map (29 sq mi above 100 µg/ft², 186 sq mi above 5 µg/ft²), which implies about 500 kg. The page shows both.
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

Open http://localhost:8765. The model and the map work from any static server. The two functions in `api/` (the Army map feed and the shared weather copy) only run on Vercel. Locally the Army panel shows its fallback links and weather comes straight from Open-Meteo.

Tests (Node 20 or newer, no packages):

```bash
node --test test/core.test.js
```

Deploy your own copy with `vercel deploy --prod`.

## Limits

- Nobody has published how much lead left the site. The monitor-based figure is good to a factor of ten at best: four points on the ground can miss coarse dust that falls near the site and a plume that passes overhead or to one side. Treat it as the low case and the Army map as the high case.
- Hours after the fetch time are forecast and will shift.
- The weather grid is about 50 by 65 km. Terrain, river valleys and local wind shifts are missing.
- No chemistry, no resuspension of settled dust, no blast or buoyancy model for the first minutes.
- Town readouts are averages over a 20 km radius and will miss hot spots.
- Weather comes through a small function that holds Open-Meteo's answer for 10 minutes, so all visitors share one fetch. When that fails (Open-Meteo often limits Vercel's shared addresses) the browser asks Open-Meteo directly, which allows about one load a minute and eight an hour per visitor. The page retries on its own.
- Do not use these numbers for health decisions.

## Credits

Weather: Open-Meteo (NOAA HRRR and GFS). Basemap: © OpenStreetMap contributors. Map library: Leaflet. Official maps: U.S. Army via DVIDS.

MIT license. See [LICENSE](LICENSE).
