// Planar geometry + deterministic PRNG helpers behind the mock Panchayat map
// (lib/panchayatData.js). Nothing here touches the DOM or Leaflet, so it can be
// unit-checked from plain Node.
//
// Coordinates: public helpers take/return [lat, lon] (Leaflet order). Internally
// the maths runs in a "scaled plane" x = lon * cos(REF_LAT), y = lat. On Web
// Mercator (what Leaflet draws) one degree of latitude and cos(lat) degrees of
// longitude cover the same screen distance, so shapes built in this plane look
// isotropic on the map instead of being stretched east-west.
//
// Determinism: everything is driven by hashString() + mulberry32(). There is no
// Math.random() or Date.now() anywhere, so the geography is identical on every
// load, in every browser.

export const REF_LAT = 20.85;
const COS_REF = Math.cos((REF_LAT * Math.PI) / 180);
export const KM_PER_DEG = 111.32;

export const toXY = ([lat, lon]) => [lon * COS_REF, lat];
export const fromXY = ([x, y]) => [y, x / COS_REF];

// FNV-1a: small, stable string -> uint32 hash.
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: tiny seeded PRNG, returns a function yielding floats in [0, 1).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Integer-lattice hash -> [0, 1). Used by the smooth value noise in the
// forecast model (a stateless alternative to threading a PRNG around).
export function hash2(ix, iy, seed) {
  let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iy, 0x165667b1) ^ Math.imul(seed, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise in [-1, 1]: bilinear (smoothstep) blend of hashed lattice
// corners. Correlation length is one lattice cell, so callers divide their
// coordinates by the wavelength they want.
export function valueNoise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return (top + (bottom - top) * sy) * 2 - 1;
}

// ---- polygon maths (rings are arrays of [x, y] in the scaled plane) --------

export function ringArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

export function ringCentroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  if (Math.abs(a) < 1e-12) return ring[0];
  return [cx / (3 * a), cy / (3 * a)];
}

export function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Sutherland-Hodgman against one half-plane: keeps the part of `ring` where
// nx*x + ny*y <= d.
function clipHalfPlane(ring, nx, ny, d) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const da = nx * a[0] + ny * a[1] - d;
    const db = nx * b[0] + ny * b[1] - d;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

// Voronoi cell of seeds[index], clipped to `boundary`. Starting from the block
// outline and cutting away the half-plane closer to every other seed makes the
// cells partition the block exactly: no gaps, no overlaps, nothing outside it.
export function voronoiCell(seeds, index, boundary) {
  const [sx, sy] = seeds[index];
  let cell = boundary;
  for (let j = 0; j < seeds.length && cell.length > 2; j++) {
    if (j === index) continue;
    const [ox, oy] = seeds[j];
    cell = clipHalfPlane(cell, 2 * (ox - sx), 2 * (oy - sy), ox * ox + oy * oy - sx * sx - sy * sy);
  }
  return cell;
}

// n well-spread seeds inside `boundary`: seeded dart throwing (minimum spacing
// relaxes if the block is crowded), then a few Lloyd iterations. Stopping Lloyd
// early keeps the cells irregular like real village boundaries instead of a
// perfect hexagonal grid.
export function spreadSeeds(n, boundary, rand, lloydIterations = 4) {
  const xs = boundary.map((p) => p[0]);
  const ys = boundary.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  let spacing = 0.7 * Math.sqrt(ringArea(boundary) / n);

  let seeds = [];
  for (let attempt = 0; seeds.length < n; attempt++) {
    if (attempt > 0 && attempt % 200 === 0) spacing *= 0.9;
    const x = minX + rand() * (maxX - minX);
    const y = minY + rand() * (maxY - minY);
    if (!pointInRing(x, y, boundary)) continue;
    if (seeds.every(([sx, sy]) => Math.hypot(sx - x, sy - y) >= spacing)) seeds.push([x, y]);
  }

  for (let it = 0; it < lloydIterations; it++) {
    seeds = seeds.map((_, i) => ringCentroid(voronoiCell(seeds, i, boundary)));
  }
  return seeds;
}

// Drops consecutive (near-)duplicate vertices left behind by clipping.
export function cleanRing(ring, eps = 1e-9) {
  const out = [];
  for (const p of ring) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > eps) out.push(p);
  }
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= eps) out.pop();
  }
  return out;
}

// [lat, lon] helpers for callers outside the scaled plane.
export const roundCoord = (v) => Math.round(v * 1e5) / 1e5;
export const ringToLatLon = (ringXY) => ringXY.map((p) => fromXY(p).map(roundCoord));
export const latLonRingToXY = (ring) => ring.map(toXY);
