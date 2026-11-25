# Iowa Lead Azide Detonation Dispersal Simulator

[![ci](https://github.com/mil-orb/iowa-lead-azide-dispersal/actions/workflows/ci.yml/badge.svg)](https://github.com/mil-orb/iowa-lead-azide-dispersal/actions/workflows/ci.yml)
![no build step](https://img.shields.io/badge/build-none-lightgrey)
![runs in the browser](https://img.shields.io/badge/platform-browser-blue)
[![license: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Live: https://iowa-lead-azide-dispersal.vercel.app**

A particle model of where lead dust went after the U.S. Army's controlled detonation of degraded lead azide at the Iowa Army Ammunition Plant (Middletown, Iowa) at about 9:00 AM CST on November 25, 2026. It runs in your browser on live weather data and follows the dust for 48 hours.

![The modeled plume from the detonation to the time the picture was made](plume.gif)

**It is a model estimate. It measures nothing.** For measured lead levels use EPA's [data dashboard](https://experience.arcgis.com/experience/1ddcf8b9d8314971b00dac8893ae9cd6) and [response site](https://response.epa.gov/site/site_profile.aspx?site_id=17211). For official maps and instructions use the [Army's notification page](https://www.army.mil/asc#org-iowa-army-ammunition-plant). This project has no connection to the Army, EPA or any agency.

## The event, from public sources

| Parameter | Value used | Source |
|---|---|---|
| Time | 9:00 AM CST (15:00 UTC), November 25, 2026 | Army advisory and news reports |
| Material | 68 drums of degraded lead azide, more than 9,700 lb net explosive weight (the Environmental Assessment says 9,500 lb) | Army statements |
| Lead in the stockpile | About 3,130 kg. Lead azide, Pb(N₃)₂, is 207.2 / 291.24 = 71.1% lead | Atomic weights |
| What the lead becomes | Fine lead oxide dust, in a cloud mostly of nitrogen, sand, soil and water vapor | Army modeling, as reported |
| Method | Two earth-covered magazines detonated at once, in place, with donor explosives | Army Environmental Assessment |
| Mitigation | Sand-filled barriers about two stories high, a water wall of more than 100,000 gallons, foam, gel blocks, misting, blast vented south and southwest | Army statements and Environmental Assessment |
| Share of lead released | Not published. A 1977 detonation of about 7,000 lb with no mitigation put about 25% in the air | Army briefing |
| Location | Not published. Near the headwaters of Long Creek in the western half of the plant. The model uses 40.802°N, 91.275°W, where the line of EPA monitors crosses the creek | Environmental Assessment, EPA monitor positions, OpenStreetMap |
| Go/no-go weather | Daylight, no precipitation, surface wind under 15 mph, no temperature inversion | Environmental Assessment |
| Observed at Burlington airport, 8:53 to 9:53 AM | Wind from 050° at 8 to 13 knots, clear below 12,000 ft, 1 °C | National Weather Service |
| Planning model | DTRA (through IMAAC). Deposition areas of 29 and 186 sq mi at 100 and 5 µg/ft², which the map legend calls EPA's limits for lead dust on window sills and floors | Army deposition map, 8:00 AM Nov 25 |
| Air measurements | Four EPA real-time lead monitors, 5 to 43 km southwest. EPA reported no detection of airborne lead | EPA data viewer and statements |
| Soil cleanup level | 200 parts per million at residential properties | Army statement |

## What it does

- Fetches hourly weather from [Open-Meteo](https://open-meteo.com/) (NOAA's 3 km HRRR model for the first day, then GFS): winds at eight heights, boundary layer height, precipitation, solar radiation and cloud cover on a 154-point grid at 0.6° (36.5 to 42.5°N, 96.5 to 88.7°W), and a wide 168-point grid at 1.5° (27 to 43.5°N, 98.5 to 79°W) for dust that travels further. Fetched on every load and every 30 minutes, through a shared copy at most 10 minutes old.
- Moves 48,000 particles in ten size bins (0.2 to 80 µm) in 50 second steps, in a background worker. A quick 12,000 particle pass shows first.
- Settling: Stokes with slip and drag corrections, using air properties from the forecast temperature and pressure. Turbulent spread: stability class from EPA's solar radiation method by day and Turner's key at night, intensities times the 10 m wind, crosswind growth matched to Draxler (1976). Dry deposition: a resistance model. Wet deposition: rain washout.
- Treats "fine" dust the way air monitors do, by aerodynamic diameter. Lead oxide is 9.5 times denser than water, so PM10 means about 3 µm physical and under, and PM2.5 about 0.8 µm. PM2.5-size lead stays airborne for days. Coarse dust is on the ground within hours.
- Draws all 43 of EPA's air sampling stations from its public location layer. Only four publish readings. The rest are marked as having none.
- Shows EPA's real-time lead readings as published: a table and chart for each of the four monitors, and the reading nearest the displayed time beside each monitor on the map.
- Reads EPA's four real-time lead monitors along the plume path, live, and turns them into a limit on the release: the dose they recorded above their pre-detonation average, plus two standard errors of the background noise, divided by the modeled dose per kilogram at the same monitors.
- The detonation point is not public and the plant is several km across. The page repeats the limit with the point moved 3 km in four directions and uses the largest. On Nov 25 two of those plumes passed beside the monitors entirely, so the monitors could not rule out the Army planning case, and the page shows that high case by default.
- Can instead scale the release to the Army's pre-detonation map (29 sq mi above 100 µg/ft², 186 sq mi above 5 µg/ft²), which implies several hundred kilograms. That map is a planning forecast and is the high case.
- Checks the forecast as time passes: the model's 10 m wind against National Weather Service observations at eight airports.
- Pick any of 61 towns, from Iowa to the Gulf coast, to see when the modeled dust arrives, the peak in the air and what is left on the ground.
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

Tests (Node 20 or newer, no packages). They cover mass conservation, settling speeds, air properties, the EPA stability tables, the logarithmic wind profile, advection at the wind speed, vertical mixing to an even profile, decay of airborne mass against the analytic rate, and crosswind spread against Draxler's curve:

```bash
node --test test/core.test.js
```

Deploy your own copy with `vercel deploy --prod`.

## Limits

- Nobody has published how much lead left the site. The monitor limit only constrains fine dust (10 µm and under, an assumed inlet size) that passed four points near the ground. Coarse dust that fell near the site, or a plume that passed overhead or to one side, would not show up, so more could have left than the limit says.
- The cloud top (300 m), the particle sizes (30 µm median) and the detonation point are assumptions. The first two were chosen because they come closest to reproducing both Army contours (28 and 203 sq mi against 29 and 186).
- Stability comes from a class scheme, with no heat-flux data. Nov 25 was overcast (neutral), where that matters least.
- Hours after the fetch time are forecast and will shift. One forecast is used, with no ensemble, so the far end of the track (a day or more out) is the least certain.
- Vertical air motion is ignored, and snow is washed out at the rate fitted for rain.
- The main weather grid is about 50 by 65 km and the wide one about 150 km. Terrain, river valleys, fronts and local wind shifts are smoothed.
- Lead oxide is treated as solid spheres. Fresh fume forms loose aggregates that fall more slowly, and lead stuck to sand or soil travels with those larger grains. Neither is modeled.
- No resuspension of settled dust, no blast or buoyancy model for the first minutes, and none of the other possible emissions (hydrochloric acid, organic combustion products).
- Town readouts are averages over a 20 km radius and will miss hot spots.
- Weather comes through a small function that holds Open-Meteo's answer for 10 minutes, so all visitors share one fetch. When that fails (Open-Meteo often limits Vercel's shared addresses) the browser asks Open-Meteo directly, which allows about one load a minute and eight an hour per visitor. The page retries on its own.
- Do not use these numbers for health decisions.

## References

Where each formula and constant in the model comes from. Entries marked † were checked against an online record when this list was written. The rest are standard references cited from the literature, so check volume and page numbers before reusing them formally.

**Transport and turbulence**

- Stability class: † U.S. EPA (2000). *Meteorological Monitoring Guidance for Regulatory Modeling Applications*, EPA-454/R-99-005. Table 6-7 (solar radiation method, used by day) and Tables 6-4 and 6-6 (Turner's key, used at night). The tests check the model against both tables. Background: Pasquill, F. (1961). The estimation of the dispersion of windborne material. *Meteorological Magazine*, 90, 33-49. Turner, D. B. (1964). A diffusion model for an urban area. *Journal of Applied Meteorology*, 3, 83-91.
- Lateral turbulence intensity for each class (σθ of 25, 20, 15, 10, 5 and 2.5 degrees for A to F): Gifford, F. A. (1976). Turbulent diffusion-typing schemes: a review. *Nuclear Safety*, 17(1), 68-86.
- Vertical turbulence intensities: about half the lateral ones, a common rule of thumb with no single source. For class D they give σw of about 1.0 times the friction velocity, a little under the neutral surface-layer ratio of about 1.25 to 1.3 in Panofsky, H. A., and Dutton, J. A. (1984). *Atmospheric Turbulence*. Wiley.
- Growth of crosswind spread with travel time, used to set the 330 s memory time and tested in `test/core.test.js`: † Draxler, R. R. (1976). Determination of atmospheric diffusion parameters. *Atmospheric Environment*, 10(2), 99-105. https://doi.org/10.1016/0004-6981(76)90226-2
- Random-walk particle models and the requirement that a well-mixed layer stays well mixed: Thomson, D. J. (1987). Criteria for the selection of stochastic models of particle trajectories in turbulent flows. *Journal of Fluid Mechanics*, 180, 529-556.
- General design (particles carrying mass, a shallow layer for dry deposition, mixing capped at the boundary layer): Stohl, A., Forster, C., Frank, A., Seibert, P., and Wotawa, G. (2005). Technical note: The Lagrangian particle dispersion model FLEXPART version 6.2. *Atmospheric Chemistry and Physics*, 5, 2461-2474. Stein, A. F., Draxler, R. R., Rolph, G. D., Stunder, B. J. B., Cohen, M. D., and Ngan, F. (2015). NOAA's HYSPLIT atmospheric transport and dispersion modeling system. *Bulletin of the American Meteorological Society*, 96, 2059-2077.
- Friction velocity from the 10 m wind, and interpolation of wind between levels in the logarithm of height (logarithmic wind profile): Stull, R. B. (1988). *An Introduction to Boundary Layer Meteorology*. Kluwer.

**Particles**

- Stokes settling, the Cunningham slip correction (constants 1.257, 0.4, 1.1), Brownian diffusivity, and the resistance form of dry deposition velocity: Seinfeld, J. H., and Pandis, S. N. (2016). *Atmospheric Chemistry and Physics: From Air Pollution to Climate Change* (3rd ed.). Wiley. Chapters 9 and 19.
- Surface-layer resistance (Schmidt and Stokes number terms): Slinn, W. G. N. (1982). Predictions for particle deposition to vegetative canopies. *Atmospheric Environment*, 16(7), 1785-1794.
- Drag correction for larger particles: Schiller, L., and Naumann, A. (1933). Über die grundlegenden Berechnungen bei der Schwerkraftaufbereitung. *Zeitschrift des Vereines Deutscher Ingenieure*, 77, 318-320.
- Lognormal size distributions by mass, and aerodynamic diameter (physical diameter times the square root of density relative to water, which is what PM10 and PM2.5 inlets select on): Hinds, W. C. (1999). *Aerosol Technology* (2nd ed.). Wiley.
- Air viscosity from temperature (Sutherland's law, 1.716×10⁻⁵ Pa·s at 273.15 K, constant 110.4 K) and mean free path scaled from 66.5 nm at 20 °C and 1 atm: Seinfeld and Pandis (2016), chapter 9.
- Rain washout rate, 8.4×10⁻⁵ × (mm/h)^0.79 per second: † Baklanov, A., and Sørensen, J. H. (2001). Parameterisation of radionuclide deposition in atmospheric long-range transport modelling. *Physics and Chemistry of the Earth (B)*, 26(10), 787-799, as tabulated in Wang, X., Zhang, L., and Moran, M. D. (2014). *Geoscientific Model Development*, 7, 799-819. Their fit is for particles under 2.8 µm. This model applies it to every size, which understates washout of coarse dust.

**Data**

- Weather: † Zippenfenig, P. (2023). Open-Meteo.com Weather API [Computer software]. Zenodo. https://doi.org/10.5281/ZENODO.7970649. Data under CC BY 4.0. A request naming NOAA's HRRR model returned the same values as the default for the first 24 hours, so that is what the first day runs on.
- Surface wind observations for the forecast check: U.S. National Weather Service, api.weather.gov.
- One-off check of winds aloft: Davenport, Iowa radiosonde at 12 UTC on Nov 25, 2026, from the Iowa Environmental Mesonet archive. Observed 925 hPa wind from 90° at 7.7 m/s against the model's 82° at 8.0 m/s; 850 hPa from 95° at 5.7 m/s against 92° at 7.9 m/s.
- Air monitor readings: U.S. EPA Region 7, Iowa Army Ammunition Plant Response Data Viewer. https://experience.arcgis.com/experience/1ddcf8b9d8314971b00dac8893ae9cd6
- Planning-case deposition areas and dispersion time markers: U.S. Army, Deposition Maps as of 8:00 AM (CST), November 25, 2026. https://www.army.mil/article/297086
- Lead content of lead azide, Pb(N₃)₂: 207.2 / 291.24 = 71.1% by mass, from standard atomic weights.
- Event facts: U.S. Army, Environmental Assessment for Lead Azide Risk Mitigation at the Iowa Army Ammunition Plant (IAAAP-EA-2026-01); Army public safety advisory of Nov 24, 2026 (https://www.army.mil/article/297039); the Army's Environmental Sampling and Analysis Plan in EPA's permit record (https://response.epa.gov/site/doc_list.aspx?site_id=17211); Army briefing statements as reported by KCCI, Valley News Live and PBS NewsHour on Nov 24 and 25, 2026.
- Creek positions used to place the detonation point: OpenStreetMap contributors.

**Not from a source**

These are this project's own choices: the 150 s vertical time scale and the 0.5 m²/s mixing rate above the boundary layer, the 0.3 factor on horizontal turbulence above the boundary layer (halving and doubling each of these moved arrival times by 15 minutes or less on the Nov 25 weather), the 30 m deposition layer, the 0.1 m surface roughness, the 1.5 km and 50 m monitor comparison volume, the 3 km detonation-point shifts, and the default cloud top and particle sizes.

## Credits

Weather: Open-Meteo (NOAA HRRR and GFS). Basemap: © OpenStreetMap contributors. Map library: Leaflet. Official maps: U.S. Army via DVIDS.

MIT license. See [LICENSE](LICENSE).
