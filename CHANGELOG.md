# Changelog

## 1.1.0 (2026-11-25)

- Release is now scaled to EPA's live air monitor readings by default, with the Army map fit kept as the high case.
- Finer weather grid over the first 150 km of the plume track.
- 48,000 particles, run in a background worker after a quick first pass.
- EPA monitors drawn on the map with measured and modeled peaks side by side.
- Automatic retry when Open-Meteo rate limits a visitor.
- The page and About box link to this repository.

## 1.0.0 (2026-11-25)

First public version.

- Particle model on live Open-Meteo weather: settling by size, spread by stability class, dry and wet deposition.
- Release fitted to the two contour areas on the Army pre-detonation deposition map.
- Town picker for 41 towns, with arrival time, peak air level and ground deposit.
- Latest Army maps pulled from the public DVIDS feed.
