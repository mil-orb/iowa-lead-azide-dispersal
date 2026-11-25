// Runs the model core from index.html against made-up weather. No network.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const core = /<script id="core">([\s\S]*?)<\/script>/.exec(html);
assert.ok(core, 'index.html has a <script id="core"> block');
new Function(core[1])();
const C = globalThis.Core;

// Uniform weather: wind from the given direction at every level, overcast, optional rain.
function fakeWeather({ dir = 45, speed = 6, rain = 0 } = {}) {
  const hours = 51;
  const time = [];
  for (let h = 0; h < hours; h++) time.push(new Date(Date.UTC(2026, 10, 25, 14) + h * 3600e3).toISOString().slice(0, 16));
  const fill = (v) => new Array(hours).fill(v);
  const hourly = { time, boundary_layer_height: fill(600), precipitation: fill(rain), shortwave_radiation: fill(100), cloud_cover: fill(100) };
  for (const z of [10, 80, 120, 180]) { hourly['wind_speed_' + z + 'm'] = fill(speed); hourly['wind_direction_' + z + 'm'] = fill(dir); }
  const gh = { 950: 700, 925: 920, 900: 1150, 850: 1600 };
  for (const p of Object.keys(gh)) { hourly['wind_speed_' + p + 'hPa'] = fill(speed); hourly['wind_direction_' + p + 'hPa'] = fill(dir); hourly['geopotential_height_' + p + 'hPa'] = fill(gh[p]); }
  return Array.from({ length: C.NP }, () => ({ elevation: 200, hourly }));
}
function run(met, extra) {
  const sim = C.createSim(met, Object.assign({ top: 100, mmd: 25, rho: 9500, mult: 1, hours: 48, nPer: 150, seed: 7, dt: 100, frames: false }, extra));
  while (!sim.advance(500));
  return sim;
}

test('weather request covers the whole grid', () => {
  const url = new URL(C.metUrl());
  assert.strictEqual(url.searchParams.get('latitude').split(',').length, C.NP);
  assert.strictEqual(url.searchParams.get('longitude').split(',').length, C.NP);
});

test('settling speeds match hand calculations', () => {
  const v1 = C.settle(1, 11340), v10 = C.settle(10, 9500);
  assert.ok(v1 > 3.5e-4 && v1 < 4.5e-4, '1 micron lead falls about 0.4 mm/s, got ' + v1);
  assert.ok(v10 > 0.02 && v10 < 0.04, '10 micron lead oxide falls a few cm/s, got ' + v10);
});

test('size bins add up to all the mass', () => {
  const sum = C.binFractions(25, 2.5).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('mass is conserved and the plume follows the wind', () => {
  const sim = run(C.parseMet(fakeWeather({ dir: 45, speed: 6 })));
  const t = sim.totals();
  assert.ok(Math.abs(t.air + t.dry + t.wet + t.exited - 1) < 1e-9, 'airborne + deposited + exited = released');
  const grid = sim.dep.reduce((a, b) => a + b, 0) + sim.dep2.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(grid - t.dry - t.wet) < 1e-9, 'the two deposition grids hold everything deposited');
  const f = 3 * 4; // three hours in
  const dx = (sim.cen[f * 3] - C.SRC.lon) * C.R * Math.cos(C.SRC.lat * Math.PI / 180), dy = (sim.cen[f * 3 + 1] - C.SRC.lat) * C.R;
  const bearing = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360, km = Math.hypot(dx, dy) / 1000;
  assert.ok(Math.abs(bearing - 225) < 12, 'wind from the northeast carries dust southwest, got ' + bearing.toFixed(0));
  assert.ok(km > 45 && km < 85, '6 m/s for 3 h is about 65 km, got ' + km.toFixed(0));
});

test('rain washes lead out', () => {
  const dryRun = run(C.parseMet(fakeWeather({ rain: 0 }))).totals();
  const wetRun = run(C.parseMet(fakeWeather({ rain: 4 }))).totals();
  assert.strictEqual(dryRun.wet, 0);
  assert.ok(wetRun.wet > 0.01, 'rain should deposit a visible share, got ' + wetRun.wet);
});

test('area lookups invert each other', () => {
  const sim = run(C.parseMet(fakeWeather()));
  const curve = C.areaCurve(C.smoothLoad(sim.dep));
  const target = 100 * C.MI2;
  const mass = C.massForArea(curve, target, 5);
  const area = C.areaAbove(curve, 5 / C.UGFT2 / mass);
  assert.ok(Math.abs(area - target) / target < 0.1, 'fitted release reproduces the target area');
});

test('a monitor downwind sees fine dust and one upwind sees none', () => {
  const down = { lat: C.SRC.lat - 0.1, lon: C.SRC.lon - 0.13 }, up = { lat: C.SRC.lat + 0.1, lon: C.SRC.lon + 0.13 };
  const sim = run(C.parseMet(fakeWeather({ dir: 45, speed: 6 })), { monitors: [down, up], nPer: 400, dt: 50 });
  const total = (a) => a.reduce((x, y) => x + y, 0);
  assert.ok(total(sim.monAvg[0]) > 0, 'downwind monitor records something');
  assert.strictEqual(total(sim.monAvg[1]), 0, 'upwind monitor records nothing');
});

test('the wide grid takes over outside the main grid', () => {
  const main = C.parseMet(fakeWeather({ dir: 45, speed: 6 }));
  const one = fakeWeather({ dir: 90, speed: 3 })[0];
  main.outer = C.parseMet(Array.from({ length: C.OUTER.nx * C.OUTER.ny }, () => one), C.OUTER);
  const o = {};
  assert.ok(C.sample(main, C.SRC.lon, C.SRC.lat, 10, 2, o));
  assert.ok(Math.abs(Math.hypot(o.u, o.v) - 6) < 1e-3, 'inside the main grid the wind is the main one');
  assert.ok(C.sample(main, -90, 31, 10, 2, o));
  assert.ok(Math.abs(Math.hypot(o.u, o.v) - 3) < 1e-3, 'outside it the wide grid is used');
  assert.strictEqual(C.sample(main, -70, 31, 10, 2, o), false, 'beyond both grids there is no wind');
});

test('stability classes follow the EPA tables', () => {
  // EPA-454/R-99-005 Table 6-7 (day, by solar radiation) and Table 6-4 with 6-6 (night, by cloud cover). 0 = A ... 5 = F.
  assert.strictEqual(C.stab(1.5, 950, 0), 0);   // light wind, strong sun: A
  assert.strictEqual(C.stab(2.5, 700, 0), 1);   // B
  assert.strictEqual(C.stab(4, 400, 0), 2);     // C
  assert.strictEqual(C.stab(5.5, 400, 100), 3); // D
  assert.strictEqual(C.stab(4, 100, 100), 3);   // weak sun: D at any wind
  assert.strictEqual(C.stab(7, 950, 0), 2);     // strong wind, strong sun: C
  assert.strictEqual(C.stab(1, 0, 0), 5);       // clear calm night: F
  assert.strictEqual(C.stab(2.5, 0, 100), 4);   // cloudy night, light wind: E
  assert.strictEqual(C.stab(4.5, 0, 0), 4);     // clear night, moderate wind: E
  assert.strictEqual(C.stab(4.5, 0, 100), 3);   // cloudy night, moderate wind: D
  assert.strictEqual(C.stab(7, 0, 0), 3);       // windy night: D
});

test('air properties match reference values', () => {
  const a = C.airProps(273.15, 101325), b = C.airProps(293.15, 101325);
  assert.ok(Math.abs(a.mu - 1.716e-5) < 2e-8, 'viscosity at 0 C');
  assert.ok(Math.abs(b.mu - 1.81e-5) / 1.81e-5 < 0.01, 'viscosity at 20 C, got ' + b.mu);
  assert.ok(Math.abs(b.rho - 1.204) < 0.005, 'density at 20 C, got ' + b.rho);
  assert.ok(Math.abs(b.lam - 66.5e-9) < 1e-10, 'mean free path at 20 C');
  assert.ok(C.settle(10, 9500, a) > C.settle(10, 9500, b), 'colder air is less viscous, so particles fall faster');
});

test('wind follows a logarithmic profile near the ground', () => {
  // Build a column that obeys the log law exactly and check the model reproduces it between and below the levels.
  const ust = 0.4, z0 = C.Z0, log = (z) => ust / 0.4 * Math.log(z / z0);
  const w = fakeWeather({ dir: 270, speed: 1 });
  for (const z of [10, 80, 120, 180]) w[0].hourly['wind_speed_' + z + 'm'] = w[0].hourly['wind_speed_' + z + 'm'].map(() => log(z));
  const met = C.parseMet(w), o = {};
  for (const z of [3, 10, 30, 60, 100, 150]) {
    C.sample(met, C.SRC.lon, C.SRC.lat, z, 2, o);
    assert.ok(Math.abs(o.u - log(z)) / log(z) < 0.03, 'wind at ' + z + ' m: model ' + o.u.toFixed(2) + ', log law ' + log(z).toFixed(2));
  }
});

test('the dust cloud moves at the wind speed', () => {
  // Finest particles in a uniform 6 m/s wind from the north: after 3 hours the centre should be 64.8 km south.
  const sim = C.createSim(C.parseMet(fakeWeather({ dir: 0, speed: 6 })), { top: 100, mmd: 25, rho: 9500, mult: 1, hours: 3, nPer: 2000, seed: 5, dt: 50 });
  while (!sim.advance(500));
  const f = 12, ys = [];
  for (let j = 0; j < sim.fPer; j++) { const y = sim.fy[f * sim.fN + j]; if (y === y) ys.push((C.SRC.lat - y) * C.R); }
  const km = ys.reduce((a, b) => a + b, 0) / ys.length / 1000;
  assert.ok(Math.abs(km / 64.8 - 1) < 0.02, 'moved ' + km.toFixed(1) + ' km, expected 64.8');
});

test('fine dust is defined by aerodynamic diameter', () => {
  const met = C.parseMet(fakeWeather());
  const lead = C.createSim(met, { top: 100, mmd: 25, rho: 9500, hours: 1, nPer: 10, frames: false });
  const soil = C.createSim(met, { top: 100, mmd: 25, rho: 2650, hours: 1, nPer: 10, frames: false });
  const cut = (s) => Math.max(...C.DIAM.filter((d, b) => s.dae[b] <= 10));
  assert.strictEqual(cut(lead), 3, 'for lead oxide, PM10 is 3 microns physical and under');
  assert.strictEqual(cut(soil), 5, 'for soil dust, PM10 is 5 microns physical and under');
  assert.ok(lead.fineFrac < soil.fineFrac);
});

// ---- analytic checks ----
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

test('a dust layer mixes to an even profile and stays even', () => {
  // 0.2 micron particles barely settle or deposit, so only mixing and reflection act on them.
  for (const top of [600, 60]) {
    const sim = run(C.parseMet(fakeWeather()), { top, hours: 6, nPer: 3000, dt: 50 });
    const { z, alive } = sim.state();
    const zs = []; for (let i = 0; i < 3000; i++) if (alive[i]) zs.push(z[i]);
    assert.ok(zs.length > 2900, 'almost none of the finest particles are lost');
    const m = mean(zs), low = zs.filter((v) => v < 150).length / zs.length, high = zs.filter((v) => v > 450).length / zs.length;
    assert.ok(Math.abs(m - 300) < 15, 'mean height is mid layer (600 m boundary layer), got ' + m.toFixed(0) + ' from a ' + top + ' m start');
    assert.ok(Math.abs(low - 0.25) < 0.03 && Math.abs(high - 0.25) < 0.03, 'a quarter sits in each outer quarter, got ' + low.toFixed(3) + ' and ' + high.toFixed(3));
  }
});

test('airborne mass decays at the rate settling and deposition imply', () => {
  // 10 micron lead oxide in a 600 m mixed layer. If the layer stayed perfectly mixed, the airborne share
  // would fall as exp(-(vs + vd) t / h). Real mixing lags a little near the ground, so the model may keep
  // slightly more aloft, never less.
  const hours = 2, nPer = 4000, h = 600, U10 = 6;
  const sim = run(C.parseMet(fakeWeather({ speed: U10 })), { top: h, hours, nPer, dt: 50 });
  const { m } = sim.state();
  const bin = C.DIAM.indexOf(10), frac = C.binFractions(25, 2.5)[bin];
  let left = 0; for (let i = bin * nPer; i < (bin + 1) * nPer; i++) left += m[i];
  const got = left / frac, vs = C.settle(10, 9500), vd = C.vdTurb(10, vs, 0.4 / Math.log(10 / C.Z0) * U10);
  const ideal = Math.exp(-(vs + vd) * hours * 3600 / h);
  assert.ok(got >= ideal - 0.02 && got <= ideal + 0.15, 'airborne share ' + got.toFixed(3) + ' against well-mixed ' + ideal.toFixed(3));
});

test('crosswind spread follows the Draxler (1976) curve', () => {
  // Wind from the north at 6 m/s, class D: sigma_v = 0.18 * 6. Draxler: sigma_y = sigma_v t / (1 + 0.9 sqrt(t / 1000 s)).
  const U10 = 6, nPer = 3000;
  const sim = C.createSim(C.parseMet(fakeWeather({ dir: 0, speed: U10 })), { top: 100, mmd: 25, rho: 9500, mult: 1, hours: 3, nPer, seed: 11, dt: 50 });
  while (!sim.advance(500));
  const sv = 0.18 * U10, cos = Math.cos(C.SRC.lat * Math.PI / 180);
  for (const hr of [1, 2, 3]) {
    const f = hr * 4, xs = [];
    for (let j = 0; j < sim.fPer; j++) { const x = sim.fx[f * sim.fN + j]; if (x === x) xs.push((x - C.SRC.lon) * C.R * cos); } // finest bin
    const mu = mean(xs), sd = Math.sqrt(mean(xs.map((v) => (v - mu) * (v - mu))));
    const t = hr * 3600, draxler = sv * t / (1 + 0.9 * Math.sqrt(t / 1000));
    assert.ok(Math.abs(sd / draxler - 1) < 0.2, hr + ' h: model ' + sd.toFixed(0) + ' m, Draxler ' + draxler.toFixed(0) + ' m');
  }
});
