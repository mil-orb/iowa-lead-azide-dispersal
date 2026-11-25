# Changelog

## 1.5.0 (2026-11-25)

Event parameters brought in line with what has been published.

- Stockpile lead set from the Army's stated 9,700 lb net explosive weight: about 3,130 kg (was 3,200 kg).
- Detonation point moved 1.7 km west to where the line of EPA monitors crosses Long Creek, following the Environmental Assessment's description of the site.
- The 1977 unmitigated release fraction the Army cited (25%) is shown as a reference.
- Method notes now cover the chemistry (lead azide to lead oxide), what is left out, and a table of event parameters with sources in the README.

## 1.4.0 (2026-11-25)

Second audit, aimed at following suspended dust on forecast winds.

- Fine dust is now defined by aerodynamic diameter, as air monitors define it. For lead oxide, PM10 is about 3 µm physical and under. The old definition (10 µm physical) overstated what the monitors could see by a factor of about twenty.
- Ten size bins from 0.2 to 80 µm, with separate readouts for PM10-size and PM2.5-size dust.
- A wide weather grid follows fine dust after it leaves the main grid. Before this, the finest dust left the map at about 18 hours and was dropped.
- Daytime stability from EPA's solar radiation table and night-time from Turner's key, both tested against the EPA tables.
- Air viscosity, density and mean free path from the forecast temperature and pressure.
- Wind interpolated in the logarithm of height, with the log law below 10 m.
- Particles start with turbulent velocities drawn from the surrounding air.
- A live check of model wind against National Weather Service airport observations.
- A town counts as reached on the share of PM10-size dust nearby. 20 towns added along the path to the Gulf coast.
- The fine weather grid near the site was dropped to stay inside Open-Meteo's request limits.

## 1.3.0 (2026-11-25)

- References for every formula and constant in the README, with the project's own unsourced choices listed separately.
- Citations in the page's method notes and in code comments. Open-Meteo attribution next to the weather status.
- Corrected the page's claim about neutral turbulence ratios, and noted that the rain washout rate is applied outside the particle sizes it was fitted for.
- CITATION.cff.

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
