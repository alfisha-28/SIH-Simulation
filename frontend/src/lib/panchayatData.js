// Shared mock geography + deterministic forecast model for the SIH26074
// Panchayat-level weather intelligence prototype. This is the single source of
// truth reused by the Panchayat Explorer (/panchayats), the KVK dashboard, the
// advisories page and the overview: import from here, never re-declare GPs.
//
// SIMULATED DATA. There is no NWP, downscaling model or backend behind any
// number in this file. The tessellation is synthetic (Voronoi cells inside
// hand-placed block outlines), block/GP names are indicative South Gujarat
// place names, and the forecast is an analytic weather pattern plus seeded
// smooth noise. It exists to demonstrate the product idea: a coarse block
// forecast versus the same forecast downscaled to Gram Panchayat (GP) level.
// Every value is a pure function of (GP, lead time, mode): no Math.random(),
// no Date.now(), so the data is identical on every load.
//
// ---- Geography ------------------------------------------------------------
// 3 districts (Surat, Navsari, Valsad) > 8 blocks (talukas) > 50 GPs, roughly
// 70 x 60 km of South Gujarat. Block outlines share vertices, so blocks tile
// the region without gaps or overlaps; GP polygons are Voronoi cells clipped to
// their block, so they tile each block exactly. All polygons sit on land (the
// coast is the western edge, drawn slightly inland of the real shoreline; the
// Hazira spit and the Tapi estuary are deliberately left out). Block outlines
// are placed over the real taluka headquarters, and BLOCK_ANCHORS (below) pins
// that down: findPanchayatAt(anchor) must land in the named block.
//
// ---- Exports --------------------------------------------------------------
// Deep link: /panchayats?gp=<GP id>&t=<lead hours> opens the Panchayat Explorer on that GP.
//
// Constants
//   DATASET_LABEL, DATASET_NOTE         "Simulated data" chip text + a sentence for tooltips
//   LEAD_TIMES                          [{ hours, label, validTime }] for Now, +6h, +12h, +24h, +48h
//   LEAD_HOURS                          [0, 6, 12, 24, 48]
//   RISK_LEVELS                         ['low', 'moderate', 'high', 'severe'] (severity.js vocabulary)
//   RAIN_ACCUMULATION_HOURS             24: rainfall is the total in the 24 h ending at the valid time
//   THRESHOLDS                          risk thresholds per variable (see below)
//   DATA_BOUNDS                         [[south, west], [north, east]] of all blocks
// Geography (frozen arrays, stable ids)
//   DISTRICTS  [{ id, name, blockIds }]
//   BLOCKS     [{ id, name, districtId, districtName, polygon, centroid, gpIds, areaKm2 }]
//   PANCHAYATS [{ id, name, blockId, blockName, districtId, districtName,
//                 centroid: [lat, lon], polygon: [[lat, lon], ...],
//                 crops: [{ crop, stage }] (key crop first), farmers, areaKm2 }]
//   polygon rings are [lat, lon] (Leaflet order), open (first point not repeated).
// Lookups
//   getPanchayat(id) / getBlock(id) / getDistrict(id)   -> object | null
//   getBlockPanchayats(blockId)                         -> GP[]
//   listPanchayats({ districtId?, blockId? })           -> GP[]
//   findPanchayatAt(lat, lon)                           -> GP | null (point in polygon)
// Forecast
//   getForecast(gpId, leadHours, mode = 'downscaled')   -> Forecast | null
//       mode 'downscaled': the GP's own value.
//       mode 'coarse':     the block aggregate (area-weighted mean of its GPs),
//                          identical for every GP of that block.
//   getBlockForecast(blockId, leadHours)                -> Forecast | null (coarse)
//   getForecastSeries(gpId, mode)                       -> Forecast[] (one per lead time)
//   listForecasts(leadHours, mode)                      -> Forecast[] (one per GP)
//   getPeakRisk(gpId, mode = 'downscaled')              -> { risk, leadHours, leadLabel, forecast } | null
//       worst risk over the 48 h horizon (ties: higher riskScore, then earlier).
//   getDefaultPanchayatId()                             -> id of the GP with the worst peak risk
//   compareRisk(a, b) / RISK_RANK                       -> ordering helpers for risk strings
//   formatLeadHours(hours)                              -> 'Now' | '+6h' | ...
//
// Forecast = {
//   gpId, blockId, mode, leadHours, leadLabel, validTime ('14:00 IST'),
//   rainfallMm, rainfallRange: [lo, hi],        // 24 h accumulation, 10th-90th percentile
//   temperatureC, temperatureRange: [lo, hi],
//   windKmh, windRange: [lo, hi],
//   rainProbability,                            // 0-1, P(rain >= 2.5 mm in the window)
//   hazardProbability,                          // 0-1 | null: P(the risk-driving variable reaches
//                                               //   the threshold of `risk`); null when risk is low
//   confidence, confidenceLevel,                // 0-1 and 'high' | 'moderate' | 'low'
//   risk,                                       // 'low' | 'moderate' | 'high' | 'severe'
//   riskDriver,                                 // 'rain' | 'wind' | 'heat' | null (low risk)
//   riskScore,                                  // 0-1+, relative to the severe thresholds; sort key only
//   condition,                                  // 'Heavy Rainfall', 'Thunderstorm', 'Strong Wind', ...
//   // coarse mode only:
//   gpCount, spread: { rainfallMm: [min, max], temperatureC: [min, max], windKmh: [min, max] }
// }
//
// ---- Risk thresholds (THRESHOLDS) -----------------------------------------
// Rainfall, 24 h accumulation, IMD categories: moderate 15.6-64.4, heavy
// 64.5-115.5, very heavy 115.6-204.4, extremely heavy >= 204.5 mm. Risk is
// moderate from 35 mm (upper part of IMD "moderate rain", where field
// operations need re-planning), high from 64.5 (heavy), severe from 115.6 (very
// heavy or worse).
// Wind, km/h (sustained): moderate >= 35 (strong breeze), high >= 45 (banana/sugarcane
// lodging), severe >= 60 (gale).
// Temperature, deg C: heat stress moderate >= 36 (paddy/cotton flowering
// sterility begins near 35), high >= 38, severe >= 40 (IMD heat wave).
//
// ---- Weather scenario ------------------------------------------------------
// A late-monsoon rain band tracks north through South Gujarat over ~72 h:
// heaviest over the Valsad hills at "Now", over Navsari/Jalalpore around +24 h
// and over Surat district by +48 h, with orographic enhancement towards the
// Sahyadri foothills, a windy coastal strip and a hot, drier pocket in the
// north-east. A small embedded convective cell sits over Vijalpor, so the block
// average visibly hides a local hotspot: exactly what downscaling recovers.
//
// The coarse block forecast is the area-weighted mean of its GPs' downscaled
// values (downscaling redistributes the block mean, it does not change it), and
// its uncertainty range is wider because it also has to cover the spread
// between GPs inside the block.

import {
  KM_PER_DEG,
  REF_LAT,
  cleanRing,
  fromXY,
  hashString,
  mulberry32,
  pointInRing,
  ringArea,
  ringCentroid,
  ringToLatLon,
  spreadSeeds,
  toXY,
  valueNoise,
  voronoiCell,
} from './panchayatGeometry.js';

export const DATASET_LABEL = 'Simulated data';
export const DATASET_NOTE =
  'Mock Panchayat boundaries and a deterministic weather scenario for demonstration. Not real forecast output.';

// ---- lead times --------------------------------------------------------------

// Local clock at the simulated forecast cycle's "Now". Drives the diurnal
// temperature cycle, and is shown so "+6h" reads as an afternoon peak.
const BASE_HOUR_IST = 8;
export const RAIN_ACCUMULATION_HOURS = 24;

export function formatLeadHours(hours) {
  return hours === 0 ? 'Now' : `+${hours}h`;
}

// The day marker keeps Now / +24h / +48h (all 08:00) from reading as the same time.
const validTimeLabel = (hours) => {
  const clock = `${String((BASE_HOUR_IST + hours) % 24).padStart(2, '0')}:00 IST`;
  const day = Math.floor((BASE_HOUR_IST + hours) / 24);
  return day > 0 ? `${clock} (D+${day})` : clock;
};

export const LEAD_TIMES = Object.freeze(
  [0, 6, 12, 24, 48].map((hours) =>
    Object.freeze({ hours, label: formatLeadHours(hours), validTime: validTimeLabel(hours) })
  )
);
export const LEAD_HOURS = Object.freeze(LEAD_TIMES.map((l) => l.hours));

// ---- risk vocabulary ---------------------------------------------------------

export const RISK_LEVELS = Object.freeze(['low', 'moderate', 'high', 'severe']);
export const RISK_RANK = Object.freeze({ low: 0, moderate: 1, high: 2, severe: 3 });
export const compareRisk = (a, b) => (RISK_RANK[a] ?? -1) - (RISK_RANK[b] ?? -1);

// [moderate, high, severe] lower bounds per variable.
export const THRESHOLDS = Object.freeze({
  rainfallMm: Object.freeze([35, 64.5, 115.6]),
  windKmh: Object.freeze([35, 45, 60]),
  temperatureC: Object.freeze([36, 38, 40]),
});

const IMD_MODERATE_RAIN_MM = 15.6;
const LIGHT_RAIN_MM = 2.5; // "measurable rain" cut-off used for rain probability

function riskFromThresholds(value, [moderate, high, severe]) {
  if (value >= severe) return 'severe';
  if (value >= high) return 'high';
  if (value >= moderate) return 'moderate';
  return 'low';
}

// ---- geography ---------------------------------------------------------------

// Shared vertex table [lat, lon]. p<row><col>: row 0 is the northern edge and
// row 3 the southern edge, col 0 the coast and col 3 the eastern edge. Blocks
// reference vertices by key, so neighbouring blocks share their edges exactly.
const V = {
  // North edge: c0 is where the Choryasi block starts on the south bank of the
  // Tapi (the Hazira spit and the estuary itself are not part of the dataset).
  c0: [21.125, 72.712], p01: [21.14, 72.84], p02: [21.15, 73.03], p03: [21.14, 73.2],
  // Row 1 (northern edge of the Navsari district blocks). p12b and p13 are the
  // Bardoli | Navsari / Chikhli boundary: Bardoli takes in Mahuva to its south.
  p10: [20.985, 72.75], p11: [20.99, 72.892], p12: [20.985, 73.03],
  p12b: [20.925, 73.03], p13: [20.92, 73.25],
  // Row 2: the Navsari | Valsad edge and the Chikhli | Dharampur edge.
  p20: [20.77, 72.858], p21: [20.765, 72.985], p22: [20.7, 73.0], p23: [20.69, 73.27],
  // Row 3 (southern edge): Dharampur reaches about 20.505 N so Dharampur town is inside.
  p30: [20.55, 72.9], p31: [20.555, 73.05], p32: [20.505, 73.2], p33: [20.505, 73.28],
  // Shoreline shape points, each about 1 km inland of the OpenStreetMap
  // coastline so the polygons hug the coast without ever covering the sea.
  // Choryasi: the Dumas coast on the south bank of the Tapi estuary ...
  c1: [21.086, 72.709], c2: [21.072, 72.742], c3: [21.03, 72.74],
  // ... Jalalpore (Ubhrat, Dandi, Matwad coast) ...
  k1: [20.8, 72.85], k2: [20.85, 72.826], k3: [20.9, 72.8], k4: [20.94, 72.772],
  // ... and the Valsad coast (Tithal).
  v1: [20.585, 72.908], v2: [20.61, 72.903], v3: [20.67, 72.884], v4: [20.72, 72.875],
};

// Approximate shoreline [lat, lon] north -> south (traced from OpenStreetMap),
// used only by the wind model's distance-to-coast term.
const SHORELINE = [
  [21.13, 72.7], [21.075, 72.703], [21.05, 72.723], [20.98, 72.738], [20.905, 72.79],
  [20.83, 72.822], [20.775, 72.842], [20.7, 72.86], [20.61, 72.891], [20.55, 72.886],
];

const DISTRICT_DEFS = [
  { id: 'surat', name: 'Surat' },
  { id: 'navsari', name: 'Navsari' },
  { id: 'valsad', name: 'Valsad' },
];

// Crop presets: late-kharif (late September) stages for South Gujarat.
const CROP = {
  paddyFlower: { crop: 'Paddy', stage: 'Flowering' },
  paddyFill: { crop: 'Paddy', stage: 'Grain filling' },
  cane: { crop: 'Sugarcane', stage: 'Grand growth' },
  cottonFlower: { crop: 'Cotton', stage: 'Flowering' },
  cottonBoll: { crop: 'Cotton', stage: 'Boll formation' },
  mango: { crop: 'Mango', stage: 'Vegetative flush' },
  sapota: { crop: 'Sapota (Chikoo)', stage: 'Fruit development' },
  banana: { crop: 'Banana', stage: 'Bunch development' },
  okra: { crop: 'Okra', stage: 'Fruiting' },
  brinjal: { crop: 'Brinjal', stage: 'Fruiting' },
  nagli: { crop: 'Nagli (finger millet)', stage: 'Grain filling' },
  tur: { crop: 'Pigeon pea (Tur)', stage: 'Flowering' },
};

// Block definitions. Each GP row is [name, u, v, crops, farmers]: (u, v) is a
// placement hint inside the block (u: 0 west/coast -> 1 east, v: 0 north -> 1
// south) so coastal villages land on coastal cells; the cell layout itself is
// generated. `farmers` is the registered-farmer count used by the advisory
// "Send" step in later screens.
const BLOCK_DEFS = [
  {
    id: 'choryasi', name: 'Choryasi', districtId: 'surat',
    ring: ['c0', 'p01', 'p11', 'p10', 'c3', 'c2', 'c1'],
    gps: [
      ['Dumas', 0.12, 0.2, [CROP.paddyFill, CROP.cane], 1420],
      ['Magdalla', 0.5, 0.08, [CROP.paddyFlower, CROP.brinjal], 960],
      ['Gavier', 0.12, 0.6, [CROP.paddyFlower, CROP.okra], 1180],
      ['Bhimpor', 0.6, 0.4, [CROP.cane, CROP.paddyFlower], 1650],
      ['Sultanabad', 0.3, 0.9, [CROP.cane, CROP.banana], 1310],
      ['Kansad', 0.85, 0.75, [CROP.cottonFlower, CROP.cane], 1890],
    ],
  },
  {
    id: 'palsana', name: 'Palsana', districtId: 'surat',
    ring: ['p01', 'p02', 'p12', 'p11'],
    gps: [
      ['Tading', 0.2, 0.15, [CROP.cottonFlower, CROP.cane], 1740],
      ['Palsana', 0.75, 0.2, [CROP.cane, CROP.cottonBoll], 2210],
      ['Jolwa', 0.2, 0.55, [CROP.cottonBoll, CROP.paddyFill], 1520],
      ['Sanki', 0.8, 0.55, [CROP.cane, CROP.paddyFlower], 1960],
      ['Vareli', 0.25, 0.9, [CROP.cottonFlower, CROP.brinjal], 1270],
      ['Kharvasa', 0.75, 0.9, [CROP.cane, CROP.cottonBoll], 1380],
    ],
  },
  {
    id: 'bardoli', name: 'Bardoli', districtId: 'surat',
    ring: ['p02', 'p03', 'p13', 'p12b', 'p12'],
    gps: [
      ['Kadod', 0.25, 0.12, [CROP.cane, CROP.paddyFlower], 2480],
      ['Isanpor', 0.8, 0.15, [CROP.cane, CROP.cottonFlower], 1930],
      ['Sarbhon', 0.2, 0.5, [CROP.cane, CROP.paddyFill], 2050],
      ['Afva', 0.75, 0.45, [CROP.cane, CROP.banana], 1610],
      ['Haripura', 0.25, 0.88, [CROP.paddyFlower, CROP.cane], 1470],
      ['Vaghecha', 0.8, 0.85, [CROP.cottonBoll, CROP.cane], 1820],
    ],
  },
  {
    id: 'jalalpore', name: 'Jalalpore', districtId: 'navsari',
    ring: ['p10', 'p11', 'p21', 'p20', 'k1', 'k2', 'k3', 'k4'],
    gps: [
      ['Ubhrat', 0.1, 0.1, [CROP.paddyFill, CROP.mango], 690],
      ['Eru', 0.8, 0.15, [CROP.cane, CROP.paddyFlower], 1280],
      ['Dandi', 0.08, 0.5, [CROP.paddyFill, CROP.sapota], 740],
      ['Vijalpor', 0.6, 0.45, [CROP.cottonFlower, CROP.banana, CROP.cane], 1860],
      ['Matwad', 0.15, 0.9, [CROP.banana, CROP.paddyFlower], 1120],
      ['Abrama', 0.75, 0.85, [CROP.sapota, CROP.banana], 1340],
    ],
  },
  {
    id: 'navsari', name: 'Navsari', districtId: 'navsari',
    ring: ['p11', 'p12', 'p12b', 'p22', 'p21'],
    gps: [
      ['Kabilpor', 0.2, 0.1, [CROP.cane, CROP.banana], 1720],
      ['Maroli', 0.75, 0.12, [CROP.cottonBoll, CROP.cane], 1610],
      ['Chhapra', 0.45, 0.35, [CROP.paddyFlower, CROP.cane], 1560],
      ['Tighra', 0.15, 0.5, [CROP.cottonFlower, CROP.cane], 1190],
      ['Dhamdachha', 0.85, 0.5, [CROP.paddyFill, CROP.okra], 1330],
      ['Vesma', 0.4, 0.75, [CROP.banana, CROP.paddyFill], 1440],
      ['Amadpor', 0.8, 0.9, [CROP.sapota, CROP.banana], 1050],
    ],
  },
  {
    id: 'chikhli', name: 'Chikhli', districtId: 'navsari',
    ring: ['p12b', 'p13', 'p23', 'p22'],
    gps: [
      ['Rankuwa', 0.25, 0.1, [CROP.sapota, CROP.mango], 1480],
      ['Alipor', 0.75, 0.12, [CROP.banana, CROP.cane], 1390],
      ['Sadadvel', 0.45, 0.35, [CROP.cottonFlower, CROP.cane], 1140],
      ['Talavchora', 0.15, 0.55, [CROP.paddyFlower, CROP.mango], 1030],
      ['Vaghrech', 0.8, 0.55, [CROP.sapota, CROP.banana], 1270],
      ['Samarpada', 0.4, 0.8, [CROP.cane, CROP.paddyFill], 1250],
      ['Khudvel', 0.85, 0.92, [CROP.paddyFlower, CROP.nagli], 950],
    ],
  },
  {
    id: 'valsad', name: 'Valsad', districtId: 'valsad',
    ring: ['p20', 'p21', 'p22', 'p31', 'p30', 'v1', 'v2', 'v3', 'v4'],
    gps: [
      ['Halar', 0.25, 0.1, [CROP.mango, CROP.paddyFlower], 880],
      ['Bhagda', 0.8, 0.15, [CROP.paddyFlower, CROP.brinjal], 1010],
      ['Tithal', 0.08, 0.5, [CROP.mango, CROP.paddyFill], 810],
      ['Parnera', 0.75, 0.5, [CROP.mango, CROP.paddyFlower], 950],
      ['Atul', 0.2, 0.9, [CROP.paddyFill, CROP.okra], 690],
      ['Dungri', 0.75, 0.88, [CROP.paddyFlower, CROP.mango], 1210],
    ],
  },
  {
    id: 'dharampur', name: 'Dharampur', districtId: 'valsad',
    ring: ['p22', 'p23', 'p33', 'p32', 'p31'],
    gps: [
      ['Barumal', 0.2, 0.12, [CROP.paddyFlower, CROP.nagli], 870],
      ['Sidumbar', 0.75, 0.15, [CROP.nagli, CROP.tur], 780],
      ['Moti Vahiyal', 0.45, 0.45, [CROP.paddyFill, CROP.mango], 920],
      ['Dhamni', 0.88, 0.55, [CROP.paddyFlower, CROP.mango], 690],
      ['Bhavthan', 0.15, 0.8, [CROP.nagli, CROP.paddyFlower], 830],
      ['Ambosi', 0.6, 0.88, [CROP.tur, CROP.nagli], 760],
    ],
  },
];

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Cheapest one-to-one matching of GP name hints to generated cells (n <= 7, so a
// plain depth-first search is instant). Keeps coastal villages on coastal cells.
function assignByHint(hints, cellUVs) {
  const n = hints.length;
  const cost = hints.map(([hu, hv]) => cellUVs.map(([cu, cv]) => (hu - cu) ** 2 + (hv - cv) ** 2));
  let best = Infinity;
  let bestPerm = null;
  const used = new Array(n).fill(false);
  const perm = new Array(n);
  (function dfs(i, acc) {
    if (acc >= best) return;
    if (i === n) {
      best = acc;
      bestPerm = perm.slice();
      return;
    }
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      used[c] = true;
      perm[i] = c;
      dfs(i + 1, acc + cost[i][c]);
      used[c] = false;
    }
  })(0, 0);
  return bestPerm; // bestPerm[hintIndex] = cellIndex
}

const round1 = (v) => Math.round(v * 10) / 10;

// Recursively freezes plain objects/arrays so a consumer that mutates a GP, block
// or forecast (they are shared, cached objects) fails loudly instead of
// silently corrupting every page.
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
const AREA_KM2 = KM_PER_DEG * KM_PER_DEG;

function buildGeography() {
  const districts = DISTRICT_DEFS.map((d) => ({ ...d, blockIds: [] }));
  const blocks = [];
  const panchayats = [];

  for (const def of BLOCK_DEFS) {
    const district = districts.find((d) => d.id === def.districtId);
    const boundary = def.ring.map((key) => toXY(V[key]));
    const seeds = spreadSeeds(def.gps.length, boundary, mulberry32(hashString(def.id)));
    const cells = seeds.map((_, i) => cleanRing(voronoiCell(seeds, i, boundary)));

    const xs = boundary.map((p) => p[0]);
    const ys = boundary.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    // The block's west edge is its coast/left edge, but the block is a skewed
    // quad, so measure u against the row's own extent at the cell's latitude.
    const cellUVs = cells.map((cell) => {
      const [cx, cy] = ringCentroid(cell);
      return [(cx - minX) / (maxX - minX), (maxY - cy) / (maxY - minY)];
    });
    const assignment = assignByHint(def.gps.map(([, u, v]) => [u, v]), cellUVs);

    const gpIds = [];
    def.gps.forEach(([name, , , crops, farmers], gpIndex) => {
      const cell = cells[assignment[gpIndex]];
      const id = slug(name);
      gpIds.push(id);
      panchayats.push({
        id,
        name,
        blockId: def.id,
        blockName: def.name,
        districtId: district.id,
        districtName: district.name,
        centroid: fromXY(ringCentroid(cell)).map((v) => Math.round(v * 1e5) / 1e5),
        polygon: ringToLatLon(cell),
        crops: crops.map((c) => ({ ...c })),
        farmers,
        areaKm2: round1(ringArea(cell) * AREA_KM2),
      });
    });

    district.blockIds.push(def.id);
    blocks.push({
      id: def.id,
      name: def.name,
      districtId: district.id,
      districtName: district.name,
      polygon: ringToLatLon(boundary),
      centroid: fromXY(ringCentroid(boundary)).map((v) => Math.round(v * 1e5) / 1e5),
      gpIds,
      areaKm2: round1(ringArea(boundary) * AREA_KM2),
    });
  }
  return { districts, blocks, panchayats };
}

const GEO = buildGeography();

export const DISTRICTS = deepFreeze(GEO.districts);
export const BLOCKS = deepFreeze(GEO.blocks);
export const PANCHAYATS = deepFreeze(GEO.panchayats);

const GP_BY_ID = new Map(PANCHAYATS.map((g) => [g.id, g]));
const BLOCK_BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));
const DISTRICT_BY_ID = new Map(DISTRICTS.map((d) => [d.id, d]));

export const getPanchayat = (id) => GP_BY_ID.get(id) ?? null;
export const getBlock = (id) => BLOCK_BY_ID.get(id) ?? null;
export const getDistrict = (id) => DISTRICT_BY_ID.get(id) ?? null;
export const getBlockPanchayats = (blockId) =>
  (BLOCK_BY_ID.get(blockId)?.gpIds ?? []).map((id) => GP_BY_ID.get(id));

export function listPanchayats({ districtId, blockId } = {}) {
  return PANCHAYATS.filter(
    (g) => (!districtId || g.districtId === districtId) && (!blockId || g.blockId === blockId)
  );
}

export function findPanchayatAt(lat, lon) {
  const [x, y] = toXY([lat, lon]);
  return PANCHAYATS.find((g) => pointInRing(x, y, g.polygon.map(toXY))) ?? null;
}

const allLats = BLOCKS.flatMap((b) => b.polygon.map((p) => p[0]));
const allLons = BLOCKS.flatMap((b) => b.polygon.map((p) => p[1]));
export const DATA_BOUNDS = Object.freeze([
  [Math.min(...allLats), Math.min(...allLons)],
  [Math.max(...allLats), Math.max(...allLons)],
]);

// Real taluka headquarters (or a well-known town in the taluka) with the block
// that must contain each one. The blocks are placed against these, so a base map
// label such as "Chikhli" or "Dharampur" never sits inside a differently named
// block. [name, blockId, lat, lon]
export const BLOCK_ANCHORS = Object.freeze([
  ['Surat Airport (Dumas)', 'choryasi', 21.1141, 72.7418],
  ['Palsana', 'palsana', 21.1113, 72.9587],
  ['Bardoli', 'bardoli', 21.1236, 73.1128],
  ['Mahuva', 'bardoli', 21.018, 73.139],
  ['Jalalpore', 'jalalpore', 20.933, 72.905],
  ['Navsari', 'navsari', 20.95, 72.93],
  ['Chikhli', 'chikhli', 20.758, 73.06],
  ['Valsad', 'valsad', 20.61, 72.93],
  ['Dharampur', 'dharampur', 20.536, 73.174],
]);

// Dev-time guard for the table above (import.meta.env is undefined under plain Node).
if (import.meta.env?.DEV) {
  for (const [name, blockId, lat, lon] of BLOCK_ANCHORS) {
    if (findPanchayatAt(lat, lon)?.blockId !== blockId) {
      console.error(`panchayatData: ${name} (${lat}, ${lon}) is not inside the ${blockId} block`);
    }
  }
}

// ---- weather scenario --------------------------------------------------------

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const COS_REF = Math.cos((REF_LAT * Math.PI) / 180);
const lerp = (a, b, t) => a + (b - a) * t;

// Kilometres east/north of an arbitrary origin, in the same plane as the map.
const toKm = (lat, lon) => [lon * COS_REF * KM_PER_DEG, lat * KM_PER_DEG];
const distKm = (latA, lonA, latB, lonB) => {
  const [ax, ay] = toKm(latA, lonA);
  const [bx, by] = toKm(latB, lonB);
  return Math.hypot(ax - bx, ay - by);
};

// Rain-band centre, peak rain rate (mm/h) and width over time (hours relative
// to "Now"). Linear interpolation between waypoints; clamped outside them.
const STORM_TRACK = [
  { t: -24, lat: 20.28, lon: 73.08, amp: 2.0, sigma: 20 },
  { t: -12, lat: 20.42, lon: 73.1, amp: 3.5, sigma: 20 },
  { t: 0, lat: 20.56, lon: 73.12, amp: 4.5, sigma: 21 },
  { t: 12, lat: 20.72, lon: 73.12, amp: 5.5, sigma: 22 },
  { t: 24, lat: 20.9, lon: 73.1, amp: 6.0, sigma: 22 },
  { t: 36, lat: 21.1, lon: 73.14, amp: 4.0, sigma: 21 },
  { t: 48, lat: 21.3, lon: 73.2, amp: 2.5, sigma: 20 },
];
const STORM_AMP_MAX = 6.0;
const STORM_VELOCITY_KM_H = [0.4, 2.0]; // drives how the small-scale rain cells drift

function stormAt(t) {
  const tc = clamp(t, STORM_TRACK[0].t, STORM_TRACK[STORM_TRACK.length - 1].t);
  let i = 0;
  while (i < STORM_TRACK.length - 2 && tc > STORM_TRACK[i + 1].t) i++;
  const a = STORM_TRACK[i];
  const b = STORM_TRACK[i + 1];
  const f = (tc - a.t) / (b.t - a.t);
  return {
    lat: lerp(a.lat, b.lat, f),
    lon: lerp(a.lon, b.lon, f),
    amp: lerp(a.amp, b.amp, f),
    sigma: lerp(a.sigma, b.sigma, f),
  };
}

// Longitude of the shoreline at a latitude (linear between SHORELINE points).
function coastLonAt(lat) {
  if (lat >= SHORELINE[0][0]) return SHORELINE[0][1];
  for (let i = 0; i < SHORELINE.length - 1; i++) {
    const [la, lo] = SHORELINE[i];
    const [lb, lob] = SHORELINE[i + 1];
    if (lat <= la && lat >= lb) return lerp(lo, lob, (la - lat) / (la - lb));
  }
  return SHORELINE[SHORELINE.length - 1][1];
}

// Distance inland of the coast (km).
const inlandKm = (lat, lon) =>
  Math.max(0, (lon - coastLonAt(lat)) * KM_PER_DEG * Math.cos((lat * Math.PI) / 180));

const SEEDS = { rain: 11, temp: 23, wind: 37, conf: 41 };
const gauss = (d, sigma) => Math.exp(-0.5 * (d / sigma) ** 2);

// Embedded convective cell: an extra rain enhancement centred on Vijalpor, so
// the Jalalpore block average hides a local hotspot.
const HOTSPOT_GP_ID = 'vijalpor';
const HOTSPOT_GAIN = 0.95;
const HOTSPOT_SIGMA_KM = 6;
const HOTSPOT_CENTRE = GP_BY_ID.get(HOTSPOT_GP_ID).centroid;

// Rain rate in mm/h at a point and time (hours relative to Now).
function rainRate(lat, lon, t) {
  const s = stormAt(t);
  const core = s.amp * gauss(distKm(lat, lon, s.lat, s.lon), s.sigma);
  // Orographic enhancement towards the Sahyadri foothills in the east.
  const oro = 1 + 0.45 * clamp((lon - 72.95) / 0.35, 0, 1);
  const cell =
    1 + HOTSPOT_GAIN * gauss(distKm(lat, lon, HOTSPOT_CENTRE[0], HOTSPOT_CENTRE[1]), HOTSPOT_SIGMA_KM);
  // Small-scale texture drifts with the band so neighbouring GPs stay similar
  // but never identical, and changes from one lead time to the next.
  const [x, y] = toKm(lat, lon);
  const texture =
    1 +
    0.24 * valueNoise((x - STORM_VELOCITY_KM_H[0] * t) / 14, (y - STORM_VELOCITY_KM_H[1] * t) / 14, SEEDS.rain);
  return s.amp > 0 ? core * oro * cell * texture + 0.02 : 0.02;
}

function rainAccumulation(lat, lon, leadHours) {
  let total = 0;
  for (let k = leadHours - RAIN_ACCUMULATION_HOURS + 1; k <= leadHours; k++) total += rainRate(lat, lon, k);
  return total;
}

const HOT_POCKET = { lat: 21.05, lon: 73.12, gain: 3.0, sigmaKm: 22 };

function temperatureAt(lat, lon, leadHours) {
  const hour = (BASE_HOUR_IST + leadHours) % 24;
  const diurnal = 4.3 * Math.cos(((hour - 15) * 2 * Math.PI) / 24);
  const inland = 1.3 * clamp(inlandKm(lat, lon) / 30, 0, 1); // sea breeze keeps the coast cooler
  const pocket = HOT_POCKET.gain * gauss(distKm(lat, lon, HOT_POCKET.lat, HOT_POCKET.lon), HOT_POCKET.sigmaKm);
  const s = stormAt(leadHours);
  const cloud = 1.4 * gauss(distKm(lat, lon, s.lat, s.lon), s.sigma * 1.5) * (s.amp / STORM_AMP_MAX);
  const rainCooling = 0.55 * Math.min(rainRate(lat, lon, leadHours), 8);
  const [x, y] = toKm(lat, lon);
  return 29.4 + inland + pocket + diurnal - cloud - rainCooling + 0.7 * valueNoise(x / 18, y / 18, SEEDS.temp);
}

function windAt(lat, lon, leadHours) {
  const s = stormAt(leadHours);
  const inland = inlandKm(lat, lon);
  const stormWind = 32 * (s.amp / STORM_AMP_MAX) * gauss(distKm(lat, lon, s.lat, s.lon), s.sigma * 1.2);
  const coastal = 8 * Math.exp(-inland / 14);
  // Evening low-level jet along the coast, strongest around +12 h: gives the
  // coastal GPs a windy spell that is not tied to where the rain is.
  const surge = 20 * Math.exp(-inland / 12) * gauss(leadHours - 12, 8);
  const [x, y] = toKm(lat, lon);
  return Math.max(2, 11 + coastal + surge + stormWind + 3.5 * valueNoise(x / 16 - leadHours * 0.05, y / 16, SEEDS.wind));
}

// ---- uncertainty, classification --------------------------------------------

const Z80 = 1.2816; // 10th-90th percentile half-width in standard deviations

// Standard normal CDF (Abramowitz & Stegun 26.2.17), for threshold-exceedance
// probabilities from a mean and a spread.
function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

const exceedance = (mean, sigma, threshold) => clamp(1 - normalCdf((threshold - mean) / Math.max(sigma, 1e-6)), 0, 0.99);

// Ensemble spread (1 sigma) grows with lead time.
const rainSigma = (mean, h) => 1.5 + mean * (0.12 + 0.006 * h);
const tempSigma = (h) => 0.7 + 0.03 * h;
const windSigma = (wind, h) => 1.5 + 0.06 * h + 0.06 * wind;

const range = (mean, sigma, floor = 0) => [round1(Math.max(floor, mean - Z80 * sigma)), round1(mean + Z80 * sigma)];

function classify(rain, wind, temp) {
  const rainRisk = riskFromThresholds(rain, THRESHOLDS.rainfallMm);
  const windRisk = riskFromThresholds(wind, THRESHOLDS.windKmh);
  const heatRisk = riskFromThresholds(temp, THRESHOLDS.temperatureC);
  const candidates = [
    { driver: 'rain', risk: rainRisk },
    { driver: 'wind', risk: windRisk },
    { driver: 'heat', risk: heatRisk },
  ];
  // First candidate wins ties, so rain outranks wind outranks heat.
  const top = candidates.reduce((best, c) => (compareRisk(c.risk, best.risk) > 0 ? c : best));

  const riskScore = Math.max(rain / THRESHOLDS.rainfallMm[2], wind / THRESHOLDS.windKmh[2], Math.max(0, (temp - 30) / 10));

  let condition;
  if (top.risk === 'low') {
    condition = rain >= IMD_MODERATE_RAIN_MM ? 'Moderate Rain' : rain >= LIGHT_RAIN_MM ? 'Light Rain' : 'Dry';
    return { risk: 'low', driver: null, condition, riskScore };
  }
  if (rain >= THRESHOLDS.rainfallMm[0] && wind >= THRESHOLDS.windKmh[1]) condition = 'Thunderstorm';
  else if (top.driver === 'rain') {
    condition = rain >= THRESHOLDS.rainfallMm[2] ? 'Very Heavy Rainfall' : rain >= THRESHOLDS.rainfallMm[1] ? 'Heavy Rainfall' : 'Moderate Rain';
  } else if (top.driver === 'wind') condition = 'Strong Wind';
  else condition = 'Heat Stress';
  return { risk: top.risk, driver: top.driver, condition, riskScore };
}

const CONFIDENCE_HIGH = 0.78;
const CONFIDENCE_MODERATE = 0.58;
const confidenceLevel = (c) => (c >= CONFIDENCE_HIGH ? 'high' : c >= CONFIDENCE_MODERATE ? 'moderate' : 'low');

function buildForecast({ gpId, blockId, mode, leadHours, rain, temp, wind, rainSd, tempSd, windSd, confidenceBase, extra }) {
  const rainfallMm = round1(rain);
  const temperatureC = round1(temp);
  const windKmh = round1(wind);
  const { risk, driver, condition, riskScore } = classify(rainfallMm, windKmh, temperatureC);

  const sigmaR = Math.sqrt(rainSigma(rainfallMm, leadHours) ** 2 + rainSd ** 2);
  const sigmaT = Math.sqrt(tempSigma(leadHours) ** 2 + tempSd ** 2);
  const sigmaW = Math.sqrt(windSigma(windKmh, leadHours) ** 2 + windSd ** 2);

  let hazardProbability = null;
  if (driver === 'rain') hazardProbability = exceedance(rainfallMm, sigmaR, THRESHOLDS.rainfallMm[RISK_RANK[risk] - 1]);
  else if (driver === 'wind') hazardProbability = exceedance(windKmh, sigmaW, THRESHOLDS.windKmh[RISK_RANK[risk] - 1]);
  else if (driver === 'heat') hazardProbability = exceedance(temperatureC, sigmaT, THRESHOLDS.temperatureC[RISK_RANK[risk] - 1]);

  // P(rain >= 2.5 mm): an ensemble-fraction style occurrence probability. Whether
  // it rains at all is far less certain than how much, hence the wider spread.
  const occurrenceSigma = 2.5 + 0.35 * rainfallMm + 0.06 * leadHours;
  // Capped at 0.99 like hazardProbability: an ensemble is never quite certain.
  const rainProbability = clamp(1 - normalCdf((LIGHT_RAIN_MM - rainfallMm) / occurrenceSigma), 0, 0.99);

  const confidence = clamp(confidenceBase, 0.3, 0.97);
  const lead = LEAD_TIMES.find((l) => l.hours === leadHours);
  return deepFreeze({
    gpId,
    blockId,
    mode,
    leadHours,
    leadLabel: lead?.label ?? formatLeadHours(leadHours),
    validTime: validTimeLabel(leadHours),
    rainfallMm,
    rainfallRange: range(rainfallMm, sigmaR),
    temperatureC,
    temperatureRange: range(temperatureC, sigmaT, -50),
    windKmh,
    windRange: range(windKmh, sigmaW),
    rainProbability: Math.round(rainProbability * 100) / 100,
    hazardProbability: hazardProbability === null ? null : Math.round(hazardProbability * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    confidenceLevel: confidenceLevel(confidence),
    risk,
    riskDriver: driver,
    riskScore: Math.round(riskScore * 1000) / 1000,
    condition,
    ...extra,
  });
}

// ---- forecast tables (built once, lazily) -------------------------------------

let TABLE = null;

function buildTable() {
  const downscaled = new Map(); // `${gpId}|${lead}` -> Forecast
  const coarse = new Map(); // `${blockId}|${lead}` -> Forecast (block aggregate)

  for (const h of LEAD_HOURS) {
    for (const gp of PANCHAYATS) {
      const [lat, lon] = gp.centroid;
      const gpNoise = valueNoise(lat * 60, lon * 60, SEEDS.conf); // small per-GP confidence jitter
      downscaled.set(
        `${gp.id}|${h}`,
        buildForecast({
          gpId: gp.id,
          blockId: gp.blockId,
          mode: 'downscaled',
          leadHours: h,
          rain: rainAccumulation(lat, lon, h),
          temp: temperatureAt(lat, lon, h),
          wind: windAt(lat, lon, h),
          rainSd: 0.06 * rainAccumulation(lat, lon, h), // downscaling error on top of ensemble spread
          tempSd: 0.3,
          windSd: 1.0,
          confidenceBase: 0.94 - 0.0068 * h + 0.03 * gpNoise,
        })
      );
    }

    for (const block of BLOCKS) {
      const members = block.gpIds.map((id) => ({ gp: GP_BY_ID.get(id), f: downscaled.get(`${id}|${h}`) }));
      const totalArea = members.reduce((s, m) => s + m.gp.areaKm2, 0);
      const wmean = (pick) => members.reduce((s, m) => s + pick(m.f) * m.gp.areaKm2, 0) / totalArea;
      const wsd = (pick, mean) => Math.sqrt(members.reduce((s, m) => s + (pick(m.f) - mean) ** 2 * m.gp.areaKm2, 0) / totalArea);
      const minMax = (pick) => [round1(Math.min(...members.map((m) => pick(m.f)))), round1(Math.max(...members.map((m) => pick(m.f))))];

      const rain = wmean((f) => f.rainfallMm);
      const temp = wmean((f) => f.temperatureC);
      const wind = wmean((f) => f.windKmh);
      const rainSd = wsd((f) => f.rainfallMm, rain);
      const spreadRel = clamp(rainSd / (rain + 15), 0, 1);
      const meanConfidence = wmean((f) => f.confidence);

      coarse.set(
        `${block.id}|${h}`,
        buildForecast({
          gpId: null,
          blockId: block.id,
          mode: 'coarse',
          leadHours: h,
          rain,
          temp,
          wind,
          rainSd, // the block value has to cover every GP inside it
          tempSd: wsd((f) => f.temperatureC, temp),
          windSd: wsd((f) => f.windKmh, wind),
          confidenceBase: meanConfidence - (0.05 + 0.25 * spreadRel),
          extra: {
            gpCount: members.length,
            spread: {
              rainfallMm: minMax((f) => f.rainfallMm),
              temperatureC: minMax((f) => f.temperatureC),
              windKmh: minMax((f) => f.windKmh),
            },
          },
        })
      );
    }
  }
  return { downscaled, coarse };
}

const table = () => (TABLE ??= buildTable());

export function getBlockForecast(blockId, leadHours) {
  return table().coarse.get(`${blockId}|${leadHours}`) ?? null;
}

export function getForecast(gpId, leadHours, mode = 'downscaled') {
  const gp = GP_BY_ID.get(gpId);
  if (!gp || !LEAD_HOURS.includes(leadHours)) return null;
  if (mode === 'coarse') {
    const block = getBlockForecast(gp.blockId, leadHours);
    return block ? { ...block, gpId } : null;
  }
  return table().downscaled.get(`${gpId}|${leadHours}`) ?? null;
}

export const getForecastSeries = (gpId, mode = 'downscaled') =>
  LEAD_HOURS.map((h) => getForecast(gpId, h, mode)).filter(Boolean);

export const listForecasts = (leadHours, mode = 'downscaled') =>
  PANCHAYATS.map((g) => getForecast(g.id, leadHours, mode));

export function getPeakRisk(gpId, mode = 'downscaled') {
  const series = getForecastSeries(gpId, mode);
  if (series.length === 0) return null;
  const peak = series.reduce((best, f) => {
    const c = compareRisk(f.risk, best.risk);
    return c > 0 || (c === 0 && f.riskScore > best.riskScore) ? f : best;
  });
  return { risk: peak.risk, leadHours: peak.leadHours, leadLabel: peak.leadLabel, forecast: peak };
}

export function getDefaultPanchayatId() {
  let best = null;
  for (const gp of PANCHAYATS) {
    const peak = getPeakRisk(gp.id);
    if (
      !best ||
      compareRisk(peak.risk, best.peak.risk) > 0 ||
      (peak.risk === best.peak.risk && peak.forecast.riskScore > best.peak.forecast.riskScore)
    ) {
      best = { id: gp.id, peak };
    }
  }
  return best.id;
}
