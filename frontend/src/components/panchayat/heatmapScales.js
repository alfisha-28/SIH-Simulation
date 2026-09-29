// Colour scales + legend definitions for the Panchayat heatmap. Shared by
// PanchayatMap (fills, tooltips, legend) so the map, the legend and the
// variable selector can never disagree about a variable's classes or units.
//
// Every variable is classed (a choropleth, not a smooth gradient): six classes
// for the continuous variables, four for risk. Class breaks follow the risk
// thresholds in lib/panchayatData.js (IMD 24 h rainfall categories, heat-stress
// and wind limits) so a colour change on the map means a change in meaning.
//
// Exports:
//   HEATMAP_VARIABLES                    ordered list of { key, label, ... } for selectors
//   getHeatmapVariable(key)              variable definition (falls back to 'risk')
//   getHeatmapColor(key, forecast)       fill colour for a Forecast (grey when missing)
//   formatHeatmapValue(key, forecast)    '88 mm' | 'Severe' | '--' for tooltips and labels
//   RISK_COLORS                          low/moderate/high/severe -> hex (IMD colour-code style)

import { THRESHOLDS } from '../../lib/panchayatData';
import {
  capitalize,
  formatPercent,
  formatRainMm,
  formatTempC,
  formatWindKmh,
} from './forecastFormat';

export const NO_DATA_COLOR = '#cbd5e1';

// Green / yellow / orange / red, as in IMD colour-coded warnings. 'severe' is
// the same red-600 the severity chips use.
export const RISK_COLORS = Object.freeze({
  low: '#34d399',
  moderate: '#fbbf24',
  high: '#f97316',
  severe: '#dc2626',
});

const RISK_CLASSES = ['low', 'moderate', 'high', 'severe'].map((risk) => ({
  min: risk,
  label: capitalize(risk),
  color: RISK_COLORS[risk],
}));

// `min` is the inclusive lower bound of each class (the first class has none).
const classes = (breaks, colors, labels) =>
  colors.map((color, i) => ({ min: i === 0 ? -Infinity : breaks[i - 1], color, label: labels[i] }));

const [RAIN_MODERATE, RAIN_HIGH, RAIN_SEVERE] = THRESHOLDS.rainfallMm;
const [HEAT_MODERATE] = THRESHOLDS.temperatureC;
const [WIND_MODERATE, WIND_HIGH, WIND_SEVERE] = THRESHOLDS.windKmh;

export const HEATMAP_VARIABLES = Object.freeze([
  {
    key: 'risk',
    label: 'Risk level',
    legendTitle: 'Risk level',
    legendNote: 'Worst of rain, wind and heat',
    categorical: true,
    classes: RISK_CLASSES,
    pick: (f) => f?.risk,
    format: (f) => (f?.risk ? capitalize(f.risk) : '--'),
  },
  {
    key: 'rainfall',
    label: 'Rainfall',
    legendTitle: 'Rainfall (mm)',
    legendNote: '24 h accumulation, IMD classes',
    classes: classes(
      [2.5, 15.6, RAIN_MODERATE, RAIN_HIGH, RAIN_SEVERE],
      ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#2563eb', '#7c3aed'],
      ['<2.5', '2.5–16', '16–35', '35–65', '65–116', '≥116']
    ),
    pick: (f) => f?.rainfallMm,
    format: (f) => (f ? `${formatRainMm(f.rainfallMm)} mm` : '--'),
  },
  {
    key: 'temperature',
    label: 'Temperature',
    legendTitle: 'Temperature (°C)',
    legendNote: 'At the valid time',
    classes: classes(
      [27, 29, 31, 33, HEAT_MODERATE],
      ['#93c5fd', '#fde68a', '#fdba74', '#fb923c', '#ef4444', '#991b1b'],
      ['<27', '27–29', '29–31', '31–33', '33–36', `≥${HEAT_MODERATE}`]
    ),
    pick: (f) => f?.temperatureC,
    format: (f) => (f ? `${formatTempC(f.temperatureC)} °C` : '--'),
  },
  {
    key: 'wind',
    label: 'Wind speed',
    legendTitle: 'Wind speed (km/h)',
    legendNote: 'Sustained wind',
    classes: classes(
      [15, 25, WIND_MODERATE, WIND_HIGH, WIND_SEVERE],
      ['#ccfbf1', '#99f6e4', '#5eead4', '#14b8a6', '#0f766e', '#134e4a'],
      ['<15', '15–25', `25–${WIND_MODERATE}`, `${WIND_MODERATE}–${WIND_HIGH}`, `${WIND_HIGH}–${WIND_SEVERE}`, `≥${WIND_SEVERE}`]
    ),
    pick: (f) => f?.windKmh,
    format: (f) => (f ? `${formatWindKmh(f.windKmh)} km/h` : '--'),
  },
  {
    key: 'rainProbability',
    label: 'Any rain',
    legendTitle: 'Chance of any rain (%)',
    legendNote: 'Any rain = at least 2.5 mm',
    classes: classes(
      [0.1, 0.3, 0.5, 0.7, 0.9],
      ['#f5f3ff', '#ddd6fe', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95'],
      ['<10', '10–30', '30–50', '50–70', '70–90', '≥90']
    ),
    pick: (f) => f?.rainProbability,
    format: (f) => (f ? formatPercent(f.rainProbability) : '--'),
  },
]);

const BY_KEY = new Map(HEATMAP_VARIABLES.map((v) => [v.key, v]));
export const getHeatmapVariable = (key) => BY_KEY.get(key) ?? HEATMAP_VARIABLES[0];

// Index of the class a value falls in (last class whose lower bound it meets).
function classIndex(variable, value) {
  let index = 0;
  variable.classes.forEach((c, i) => {
    if (variable.categorical ? c.min === value : value >= c.min) index = i;
  });
  return index;
}

export function getHeatmapColor(key, forecast) {
  const variable = getHeatmapVariable(key);
  const value = variable.pick(forecast);
  if (value === undefined || value === null || Number.isNaN(value)) return NO_DATA_COLOR;
  return variable.classes[classIndex(variable, value)].color;
}

export const formatHeatmapValue = (key, forecast) => getHeatmapVariable(key).format(forecast);
