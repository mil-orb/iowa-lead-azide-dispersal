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
  const grid = sim.dep.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(grid - t.dry - t.wet) < 1e-9, 'the deposition grid holds everything deposited');
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

test('the fine grid overrides the wide grid where it covers', () => {
  const wide = C.parseMet(fakeWeather({ dir: 45, speed: 6 }));
  const hours = 14, fill = (v) => new Array(hours).fill(v);
  const one = fakeWeather({ dir: 90, speed: 3 })[0].hourly, hourly = {};
  for (const k of Object.keys(one)) hourly[k] = one[k].slice(0, hours);
  const np = C.NEST.nx * C.NEST.ny;
  wide.nest = C.parseMet(Array.from({ length: np }, () => ({ elevation: 200, hourly })), C.NEST, 12);
  const o = {};
  assert.ok(C.sample(wide, C.SRC.lon, C.SRC.lat, 10, 2, o));
  assert.ok(Math.abs(Math.hypot(o.u, o.v) - 3) < 1e-3, 'inside the fine grid the wind is the fine one');
  assert.ok(C.sample(wide, -95, 38, 10, 2, o));
  assert.ok(Math.abs(Math.hypot(o.u, o.v) - 6) < 1e-3, 'outside it the wind is the wide one');
  assert.ok(C.sample(wide, C.SRC.lon, C.SRC.lat, 10, 30, o));
  assert.ok(Math.abs(Math.hypot(o.u, o.v) - 6) < 1e-3, 'after the fine grid ends the wide one takes over');
});
