// Advisory dataset for the KVK / AMFU workflow (SIH26074): deterministic, crop-aware
// advisories derived from the Panchayat forecasts in lib/panchayatData.js. The
// mutable review state (approve / send) lives in lib/advisoryStore.js, which
// layers on top of this module: this file is pure data and never changes.
//
// SIMULATED DATA. Advisories are generated from the mock forecast scenario, not
// from real IMD / NAU / KVK content. The agronomy in the rule table below is
// standard practice for South Gujarat crops, written to be plausible for a demo,
// and would be replaced by the AMFU's own crop-weather advisory bulletins.
//
// ---- How advisories are derived (all pure functions of the GP forecasts) -----
// 1. For every Gram Panchayat take its peak risk over the 48 h horizon
//    (getPeakRisk): risk, lead time, and the forecast at that lead. Only GPs
//    whose peak is high or severe are candidates.
// 2. Pick the GP's exposed crop: the first entry of its `crops` list (key crop
//    first) that has a rule for the risk driver (rain | wind | heat) in the rule
//    table. A GP whose crops are all unexposed gets no advisory.
// 3. Rank candidates by risk, then by the forecast's riskScore (how far beyond
//    its threshold), then id. Take EVERY severe GP, then the highest-ranked high
//    GPs, at most MAX_PER_BLOCK per block and MAX_ADVISORIES in total, so the
//    demo holds ~20 advisories spread over the blocks instead of one per high-risk
//    GP (there are 36 of those).
// 4. The recommended action, longer explanation and SMS tip come from the matched
//    rule; the probability is the forecast's own `hazardProbability` at that lead
//    (the number the Panchayat Explorer shows for the same GP and lead time).
//
// ---- Rule table (ADVISORY_RULES): driver x crop x stage -> action -----------
//   rain  Cotton / Flowering ........ avoid spraying, drain the field
//         Cotton / Boll formation ... drain, postpone sprays, pick opened bolls
//         Paddy / Flowering ......... drain excess water, postpone sprays and top-dressing
//         Paddy / Grain filling ..... drain, postpone top-dressing, watch for lodging
//         Sugarcane / Grand growth .. open drains, defer fertiliser, earth up
//         Banana / Bunch develop. ... clear drains, prop plants, skip irrigation
//         Mango / Vegetative flush .. drain basins, postpone sprays, protective fungicide after rain
//         Sapota / Fruit develop. ... harvest mature fruit early, clear drainage
//         Okra, Brinjal / Fruiting .. harvest mature fruit, drain beds, no spraying
//         Nagli / Grain filling ..... drain, postpone harvest and sprays
//         Pigeon pea / Flowering .... drain (waterlogging-sensitive), avoid spraying
//   wind  Banana, Sugarcane ......... prop / tie plants, earth up, postpone spraying
//         Paddy ..................... keep drained (lodging), postpone spraying
//         Mango, Sapota ............. stake young plants, harvest mature fruit, postpone spraying
//         Okra, Brinjal ............. stake plants, postpone spraying
//         Nagli ..................... postpone spraying, harvest mature ears if ready
//   heat  Paddy / Flowering ......... irrigate in the evening, hold shallow water
//         Cotton .................... light evening irrigation, mulch
//         Sugarcane, Banana ......... irrigate, mulch, shade bunches
//         Okra, Brinjal ............. evening irrigation, mulch
//   A crop with no rule for a driver is treated as not exposed to it (e.g. cotton
//   under strong wind), so it is skipped for that hazard.
//   The dataset's Thunderstorm condition adds a lightning-safety line to the SMS.
//
// ---- Status lifecycle -------------------------------------------------------
//   pending_review ("Pending KVK Review") -> approved ("Approved") -> sent ("Sent")
//   Forward only; the transitions are enforced in lib/advisoryStore.js. Initial
//   statuses (INITIAL_STATUS below) are seeded so every dashboard section has
//   content on first load: the earliest-hitting advisories are already handled
//   (3 sent, 3 approved), the rest, including Vijalpor, wait for review.
//
// ---- Exports ----------------------------------------------------------------
//   ADVISORY_STATUS                 { PENDING, APPROVED, SENT } string constants
//   STATUS_LABELS, STATUS_ORDER     display labels and the lifecycle order
//   ADVISORY_RULES                  the rule table (frozen)
//   MAX_ADVISORIES, MAX_PER_BLOCK   selection caps
//   DEMO_PENDING_GP                 GP whose advisory always starts pending ('vijalpor')
//   ADVISORIES                      frozen Advisory[] sorted by urgency (most urgent first)
//   getAdvisory(id) / getAdvisoryForPanchayat(gpId)      -> Advisory | null
//   formatWorkflowTime(iso)         '30 Sep, 06:40 IST' (fixed Asia/Kolkata, viewer-independent)
//   pluralFarmers(n)                '1,860 registered farmers'
//
// Advisory = {
//   id ('ADV-VIJALPOR'), gpId, gpName, blockId, blockName, districtName,
//   driver ('rain' | 'wind' | 'heat'), condition ('Very Heavy Rainfall', ...),
//   risk ('high' | 'severe'), riskScore,
//   probability (0-1, the forecast's hazardProbability), probabilityLabel
//     ('51% chance of >= 115.6 mm in 24 h'),
//   leadHours, leadLabel ('+24h'), validTime ('08:00 IST (D+1)'),
//   crop, stage, ruleId, action (short), detail (why / how), message (SMS text),
//   farmers (registered farmers in the GP: the SMS broadcast target),
//   initialStatus, initialApprovedAt, initialSentAt   (ISO strings or null)
// }

import {
  LEAD_TIMES,
  PANCHAYATS,
  RISK_RANK,
  THRESHOLDS,
  getPeakRisk,
} from './panchayatData.js';

export const ADVISORY_STATUS = Object.freeze({
  PENDING: 'pending_review',
  APPROVED: 'approved',
  SENT: 'sent',
});
export const STATUS_ORDER = Object.freeze([
  ADVISORY_STATUS.PENDING,
  ADVISORY_STATUS.APPROVED,
  ADVISORY_STATUS.SENT,
]);
export const STATUS_LABELS = Object.freeze({
  [ADVISORY_STATUS.PENDING]: 'Pending KVK Review',
  [ADVISORY_STATUS.APPROVED]: 'Approved',
  [ADVISORY_STATUS.SENT]: 'Sent',
});

export const MAX_ADVISORIES = 20;
export const MAX_PER_BLOCK = 3;
// Vijalpor mirrors the example card in issue #3, so its advisory is never seeded
// as already handled.
export const DEMO_PENDING_GP = 'vijalpor';

// ---- rule table ---------------------------------------------------------------

// `stages` omitted = any stage of that crop. First matching rule wins, so more
// specific (stage) rules are listed before broader ones.
const rule = (id, driver, crops, stages, action, detail, tip) =>
  Object.freeze({ id, driver, crops: Object.freeze(crops), stages: stages && Object.freeze(stages), action, detail, tip });

export const ADVISORY_RULES = Object.freeze([
  // ---- heavy rain ----
  rule(
    'rain-cotton-flowering', 'rain', ['Cotton'], ['Flowering'],
    'Avoid spraying and ensure field drainage',
    'Heavy rain washes sprays off the crop and causes square and flower drop. Open furrows and outlets so water does not stand around the roots for more than a day, and hold pesticide, fertiliser and irrigation until the field has drained.',
    'avoid spraying and drain excess water from the field'
  ),
  rule(
    'rain-cotton-boll', 'rain', ['Cotton'], ['Boll formation'],
    'Drain excess water and postpone pesticide spraying',
    'Waterlogging at boll formation drives boll shedding and rot. Clear drainage channels, postpone spraying until two dry days follow the rain, and pick fully opened bolls before the rain arrives.',
    'drain excess water, postpone spraying and pick opened bolls before the rain'
  ),
  rule(
    'rain-paddy-flowering', 'rain', ['Paddy'], ['Flowering'],
    'Drain excess water and postpone fertiliser and pesticide sprays',
    'Rain during flowering washes pollen and spray off the panicles. Let excess water out of the bunds (keep about 5 cm), and postpone top-dressing and sprays until the rain has passed.',
    'let excess water out of the bunds and postpone fertiliser and sprays'
  ),
  rule(
    'rain-paddy-grain', 'rain', ['Paddy'], ['Grain filling'],
    'Drain standing water and postpone top-dressing',
    'Standing water and gusts at grain filling raise lodging risk. Drain the field, skip top-dressing and sprays, and plan harvest for a dry window if the crop is close to maturity.',
    'drain standing water and postpone top-dressing and sprays'
  ),
  rule(
    'rain-sugarcane', 'rain', ['Sugarcane'], null,
    'Open drainage channels and defer fertiliser application',
    'Waterlogged cane in grand growth stalls and lodges. Clear furrow drains, earth up rows where the soil allows, and defer fertiliser and irrigation until the field can be walked.',
    'open drainage channels and defer fertiliser'
  ),
  rule(
    'rain-banana', 'rain', ['Banana'], null,
    'Clear drains, prop plants and skip irrigation',
    'Wet soil and heavy bunches make plants topple. Clear drainage around the plantation, prop or tie plants carrying bunches, and skip irrigation until the soil drains.',
    'clear drains, prop plants carrying bunches and skip irrigation'
  ),
  rule(
    'rain-mango', 'rain', ['Mango'], null,
    'Drain orchard basins and postpone spraying',
    'Wet weather on new flush favours anthracnose and leaf spots. Drain water from tree basins, postpone sprays until the rain stops, and follow with a protective fungicide on the fresh flush.',
    'drain water from tree basins and postpone spraying'
  ),
  rule(
    'rain-sapota', 'rain', ['Sapota (Chikoo)'], null,
    'Harvest mature fruit early and clear orchard drainage',
    'Rain on maturing chikoo fruit causes splitting and rot. Harvest fruit that has reached maturity ahead of the rain, clear basin drainage and avoid spraying in wet weather.',
    'harvest mature fruit before the rain and clear orchard drainage'
  ),
  rule(
    'rain-vegetables', 'rain', ['Okra', 'Brinjal'], null,
    'Harvest mature fruits, drain the beds and avoid spraying',
    'Fruiting vegetables are lost quickly in wet, waterlogged beds. Harvest marketable fruits ahead of the rain, open bed drains and avoid spraying while it is wet.',
    'harvest mature fruits before the rain, drain the beds and avoid spraying'
  ),
  rule(
    'rain-nagli', 'rain', ['Nagli (finger millet)'], null,
    'Drain excess water and postpone spraying',
    'Heavy rain at grain filling lodges nagli and encourages ear blast. Drain the plot, postpone sprays and harvest operations, and re-check the crop after the rain.',
    'drain excess water and postpone spraying'
  ),
  rule(
    'rain-tur', 'rain', ['Pigeon pea (Tur)'], null,
    'Drain immediately and avoid spraying at flowering',
    'Tur is very sensitive to waterlogging and flower drop. Open drainage furrows at once, and avoid spraying until flowers are dry again.',
    'drain the field at once and avoid spraying'
  ),

  // ---- strong wind ----
  rule(
    'wind-banana', 'wind', ['Banana'], null,
    'Prop plants, tie bunches and postpone spraying',
    'Banana with developing bunches lodges easily in gusts. Prop plants with bamboo, tie bunches to the support, and postpone spraying until the wind drops.',
    'prop banana plants, tie bunches and postpone spraying'
  ),
  rule(
    'wind-sugarcane', 'wind', ['Sugarcane'], null,
    'Tie canes together, earth up and postpone spraying',
    'Tall cane in grand growth lodges in strong wind. Tie the canes of adjacent rows together (propping), earth up the rows, and postpone spraying.',
    'tie canes together, earth up rows and postpone spraying'
  ),
  rule(
    'wind-paddy', 'wind', ['Paddy'], null,
    'Keep the field drained and postpone spraying',
    'Wind on a flowering or grain-filling paddy crop in soft, wet soil causes lodging and grain loss. Keep the field drained so roots hold, and postpone spraying until the wind drops.',
    'keep the field drained and postpone spraying'
  ),
  rule(
    'wind-mango', 'wind', ['Mango'], null,
    'Stake young plants and postpone spraying',
    'Strong wind breaks tender flush and uproots young grafts. Stake young plants, postpone sprays (drift and wash-off), and clear broken branches afterwards.',
    'stake young plants and postpone spraying'
  ),
  rule(
    'wind-sapota', 'wind', ['Sapota (Chikoo)'], null,
    'Harvest mature fruit and stake young trees',
    'Gusts cause heavy fruit drop in chikoo. Harvest mature fruit ahead of the wind, stake young trees, and avoid spraying.',
    'harvest mature fruit before the wind and stake young trees'
  ),
  rule(
    'wind-vegetables', 'wind', ['Okra', 'Brinjal'], null,
    'Stake plants and postpone spraying',
    'Fruiting plants lodge and shed fruit in gusts. Stake and tie plants, harvest mature fruits, and postpone spraying until the wind drops.',
    'stake and tie plants and postpone spraying'
  ),
  rule(
    'wind-nagli', 'wind', ['Nagli (finger millet)'], null,
    'Postpone spraying and harvest mature ears if ready',
    'Ripening ears shatter and lodge in strong wind. Postpone sprays, and harvest ears that are already mature.',
    'postpone spraying and harvest mature ears if ready'
  ),

  // ---- heat stress ----
  rule(
    'heat-paddy-flowering', 'heat', ['Paddy'], ['Flowering'],
    'Irrigate in the evening and hold shallow standing water',
    'Temperatures above 35 °C at flowering cause spikelet sterility. Keep 2 to 3 cm of water on the field, irrigate in the evening, and avoid spraying in the afternoon.',
    'irrigate in the evening and keep 2-3 cm of water on the field'
  ),
  rule(
    'heat-cotton', 'heat', ['Cotton'], null,
    'Light irrigation in the evening and mulch',
    'Heat at flowering and boll set causes square and boll shedding. Give light irrigation in the evening, mulch the rows to hold moisture, and avoid afternoon spraying.',
    'give light irrigation in the evening and mulch the rows'
  ),
  rule(
    'heat-sugarcane-banana', 'heat', ['Sugarcane', 'Banana'], null,
    'Irrigate at critical stage and mulch',
    'Tall, high-water-demand crops wilt first in a heat spell. Irrigate on schedule (early morning or evening), mulch with crop trash, and shade banana bunches with leaf sleeves.',
    'irrigate early morning or evening and mulch with crop trash'
  ),
  rule(
    'heat-vegetables', 'heat', ['Okra', 'Brinjal'], null,
    'Irrigate in the evening and mulch',
    'Heat causes flower and fruit drop in fruiting vegetables. Irrigate lightly in the evening, mulch the beds, and harvest in the cool of the morning.',
    'irrigate lightly in the evening and mulch the beds'
  ),
]);

function matchRule(driver, crop, stage) {
  return (
    ADVISORY_RULES.find(
      (r) => r.driver === driver && r.crops.includes(crop) && (!r.stages || r.stages.includes(stage))
    ) ?? null
  );
}

// ---- formatting helpers -------------------------------------------------------

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const numberFormat = new Intl.NumberFormat('en-IN');

export const pluralFarmers = (n) => `${numberFormat.format(n)} registered farmers`;

// The wording the Panchayat Explorer uses for the same number ("87% chance of >= 64.5 mm in 24 h").
function hazardProbabilityLabel(forecast) {
  if (forecast.hazardProbability === null || !forecast.riskDriver) return '--';
  const i = RISK_RANK[forecast.risk] - 1;
  const pct = `${Math.round(forecast.hazardProbability * 100)}%`;
  if (forecast.riskDriver === 'rain') return `${pct} chance of ≥ ${THRESHOLDS.rainfallMm[i]} mm in 24 h`;
  if (forecast.riskDriver === 'wind') return `${pct} chance of winds ≥ ${THRESHOLDS.windKmh[i]} km/h`;
  return `${pct} chance of ≥ ${THRESHOLDS.temperatureC[i]} °C`;
}

function headlineValue(forecast) {
  if (forecast.riskDriver === 'rain') return `~${Math.round(forecast.rainfallMm)} mm in 24 h`;
  if (forecast.riskDriver === 'wind') return `gusts near ${Math.round(forecast.windKmh)} km/h`;
  return `~${Math.round(forecast.temperatureC)} °C`;
}

// Fixed zone so the same instant reads the same for every viewer. The month is
// spelled out here because "short" month names differ between engines/locales
// ("Sep" vs "Sept"). Fallback keeps the workflow usable without Intl time zones.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TIME_FORMAT = (() => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    return null;
  }
})();

export function formatWorkflowTime(iso) {
  if (!iso) return '--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  if (!TIME_FORMAT) return date.toLocaleString();
  const p = Object.fromEntries(TIME_FORMAT.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.day} ${MONTHS[Number(p.month) - 1]}, ${p.hour}:${p.minute} IST`;
}

// "Sapota (Chikoo)" -> "Sapota": SMS text is short and the stage already adds brackets.
const shortCropName = (crop) => crop.replace(/\s*\(.*\)$/, '');

function buildMessage({ gp, forecast, crop, stage, rule: matched, leadHours }) {
  const when = leadHours === 0 ? 'now' : `in about ${leadHours} h`;
  const lightning =
    forecast.condition === 'Thunderstorm' ? ' Stay out of open fields during lightning.' : '';
  return (
    `KVK ${gp.districtName}: ${forecast.condition} (${headlineValue(forecast)}) expected in ${gp.name} ${when}. ` +
    `${shortCropName(crop)} (${stage.toLowerCase()}): ${matched.tip}.${lightning}`
  );
}

// ---- generation ---------------------------------------------------------------

const VALID_TIME_BY_LEAD = new Map(LEAD_TIMES.map((l) => [l.hours, l.validTime]));

// The first crop (key crop first) that the hazard actually threatens.
function pickExposedCrop(gp, driver) {
  for (const { crop, stage } of gp.crops) {
    const matched = matchRule(driver, crop, stage);
    if (matched) return { crop, stage, rule: matched };
  }
  return null;
}

function selectCandidates() {
  const candidates = [];
  for (const gp of PANCHAYATS) {
    const peak = getPeakRisk(gp.id);
    if (!peak || RISK_RANK[peak.risk] < RISK_RANK.high || !peak.forecast.riskDriver) continue;
    const exposed = pickExposedCrop(gp, peak.forecast.riskDriver);
    if (exposed) candidates.push({ gp, peak, exposed });
  }
  candidates.sort(
    (a, b) =>
      RISK_RANK[b.peak.risk] - RISK_RANK[a.peak.risk] ||
      b.peak.forecast.riskScore - a.peak.forecast.riskScore ||
      a.gp.id.localeCompare(b.gp.id)
  );

  const perBlock = new Map();
  const picked = [];
  for (const candidate of candidates) {
    const used = perBlock.get(candidate.gp.blockId) ?? 0;
    // Severe GPs always get an advisory; the caps only trim the high-risk tail.
    const isSevere = candidate.peak.risk === 'severe';
    if (!isSevere && (used >= MAX_PER_BLOCK || picked.length >= MAX_ADVISORIES)) continue;
    perBlock.set(candidate.gp.blockId, used + 1);
    picked.push(candidate);
  }
  return picked;
}

// Seed data: earliest-hitting advisories were handled first. Times are fixed
// (before the 08:00 IST forecast cycle) so they read the same on every load.
const SEED_DATE = '2026-09-30';
const SEED_SENT = [
  ['05:40', '06:00'],
  ['05:55', '06:10'],
  ['06:05', '06:25'],
]; // [approved, sent]
const SEED_APPROVED = ['06:35', '06:50', '07:05'];
const seedIso = (hhmm) => `${SEED_DATE}T${hhmm}:00+05:30`;

function build() {
  const picked = selectCandidates();

  const advisories = picked.map(({ gp, peak, exposed }) => {
    const { forecast } = peak;
    return {
      id: `ADV-${gp.id.toUpperCase()}`,
      gpId: gp.id,
      gpName: gp.name,
      blockId: gp.blockId,
      blockName: gp.blockName,
      districtName: gp.districtName,
      driver: forecast.riskDriver,
      condition: forecast.condition,
      risk: peak.risk,
      riskScore: forecast.riskScore,
      probability: forecast.hazardProbability,
      probabilityLabel: hazardProbabilityLabel(forecast),
      leadHours: peak.leadHours,
      leadLabel: peak.leadLabel,
      validTime: VALID_TIME_BY_LEAD.get(peak.leadHours) ?? forecast.validTime,
      crop: exposed.crop,
      stage: exposed.stage,
      ruleId: exposed.rule.id,
      action: capital(exposed.rule.action),
      detail: exposed.rule.detail,
      message: buildMessage({ gp, forecast, crop: exposed.crop, stage: exposed.stage, rule: exposed.rule, leadHours: peak.leadHours }),
      farmers: gp.farmers,
      initialStatus: ADVISORY_STATUS.PENDING,
      initialApprovedAt: null,
      initialSentAt: null,
    };
  });

  // Seed statuses: earliest lead first, then most urgent; never the demo GP.
  const seedOrder = advisories
    .filter((a) => a.gpId !== DEMO_PENDING_GP)
    .sort((a, b) => a.leadHours - b.leadHours || b.riskScore - a.riskScore);
  seedOrder.slice(0, SEED_SENT.length).forEach((a, i) => {
    a.initialStatus = ADVISORY_STATUS.SENT;
    a.initialApprovedAt = seedIso(SEED_SENT[i][0]);
    a.initialSentAt = seedIso(SEED_SENT[i][1]);
  });
  seedOrder.slice(SEED_SENT.length, SEED_SENT.length + SEED_APPROVED.length).forEach((a, i) => {
    a.initialStatus = ADVISORY_STATUS.APPROVED;
    a.initialApprovedAt = seedIso(SEED_APPROVED[i]);
  });

  // `picked` is already ordered by urgency (risk, then riskScore).
  return Object.freeze(advisories.map((a) => Object.freeze(a)));
}

export const ADVISORIES = build();

const BY_ID = new Map(ADVISORIES.map((a) => [a.id, a]));
const BY_GP = new Map(ADVISORIES.map((a) => [a.gpId, a]));

export const getAdvisory = (id) => BY_ID.get(id) ?? null;
export const getAdvisoryForPanchayat = (gpId) => BY_GP.get(gpId) ?? null;
