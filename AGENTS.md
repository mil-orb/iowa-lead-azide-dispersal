# Guidance for coding assistants

## Never

- Never put a real person's name, an email address or a home location in any file or commit. The About box links to this repository and names nobody.
- Never add a bundled weather snapshot or lengthen the 10 minute shared copy. The page shows current data, with its fetch time, or nothing.
- Never remove or bury the estimate warning or the EPA and Army links.
- Never add health thresholds, safety advice or a claim that the model was validated against measurements.
- Never set network-derived text with `innerHTML`.
- Never commit `.vercel/` or `.env*`.

## Safe commands

```bash
node --test test/core.test.js
```

```bash
python -m http.server 8765
```

## Map of the code

- `index.html`: the whole app. Three parts:
  - HTML and CSS at the top.
  - `<script id="core">`: the model. No DOM access, so the tests can load it in Node. Weather requests (`metUrl`, `pointUrl`), parsing (`parseMet`), sampling (`sample`, main grid then the wide `OUTER` grid), physics (`airProps`, `settle`, `vdTurb`, `stab`), the particle run (`createSim`), and the area lookups used to fit the release (`areaCurve`, `areaAbove`, `massForArea`).
  - The second `<script>`: the UI. Leaflet map, canvas overlay (`draw`), town picker (`selectTown`, `townCard`), freshness handling (`loadMet`, `setStatus`, `clearAll`).
- `api/army-maps.js`: reads the plant's DVIDS RSS feed and returns the newest map images. Only accepts DVIDS links and its image host.
- `api/weather.js`: forwards the page's Open-Meteo request so the edge can share one copy for 10 minutes. Validates the query shape.
- `test/core.test.js`: offline tests on made-up weather.

## Rules

- `createSim` returns everything per 1 kg released. The UI multiplies by the release mass `M`. Keep it that way so the mass slider needs no rerun.
- The time step must divide 900 s, because frames are stored every 15 minutes.
- Changing the weather grid or variables changes the Open-Meteo call weight. Keep one page load well under their per-minute limit and say what it costs in the PR.
- Deposition is shown in µg/ft² because the Army maps use it.
- The default release is fitted to EPA's live monitor readings (`loadEPA`, `accept`). Never store those readings. If the feed fails, the page falls back to the Army map fit and says so.
- The model run happens in a Web Worker built from the core script's text, so the core must stay free of DOM access and of anything defined outside it.
- A physics change needs an analytic test or a published curve to compare against, in `test/core.test.js`. Do not tune a constant to make the map look right.
- Report the EPA comparison as an upper limit with its noise. Never present it as a measured release.
- Fine dust means aerodynamic diameter (`dae` in `createSim`), never physical diameter. Monitors, PM10 and PM2.5 all use it.
- The page sends the small site request first, then the main grid, then the wide grid. Together they sit at Open-Meteo's per-minute limit, so do not add variables or points without removing some.
- The Army contour areas in `ARMY` come from one dated map. If you change them, change the date in the UI text too.

## Recipes

- Add a town: add a row to `RECEPTORS` in the core. The picker, table and map pick it up.
- Check a physics change: run the tests, then load the page and compare the "Checked against the Army's map" card before and after.
