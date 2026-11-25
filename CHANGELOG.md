# Changelog

## 1.2.0 (2026-11-25)

Physics and statistics audit.

- Turbulence now scales with the 10 m wind instead of the wind at particle height. The class intensities are surface values, and for class D they equal 2.0 and 1.3 times the friction velocity.
- Horizontal memory time changed from 1,000 s to 330 s. Crosswind spread was about 55% wider than Draxler's 1976 curve and is now within 7% between one and three hours.
- The EPA monitor fit is reported as an upper limit with its noise, and no longer clips negative differences (which had biased it upward).
- A town counts as reached at one ten-thousandth of the release airborne within 20 km, so the answer no longer depends on particle count.
- The monitor limit is repeated for detonation points 3 km north, south, east and west, and the page uses the largest, capped at the Army case. Monitor comparison radius cut from 3 km to 1.5 km.
- Default cloud top and median particle size refitted to the Army contours under the corrected spread: 300 m and 30 µm.
- New analytic tests: even vertical mixing, exponential decay of airborne mass, and crosswind spread.

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
