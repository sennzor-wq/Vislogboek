import { calculateThermalIntervalCandidates } from './src/services/prognosisIntervalThermal';
import { segmentPrognosisInterval } from './src/services/prognosisIntervalEngine';
import { FishingLocation, WeatherHourlyForecast } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log('[PASS] ' + label); passed++; }
  else { console.error('[FAIL] ' + label); failed++; }
}

const location: FishingLocation = {
  id: 'interval-test-location',
  name: 'Testplas',
  waterDepth: 2,
  waterType: 'Plas/Zandafgraving',
  createdAt: '',
  updatedAt: '',
};
const base = Date.parse('2026-11-23T09:00:00Z');
const forecasts: WeatherHourlyForecast[] = Array.from({ length: 96 }, (_, i) => ({
  time: new Date(base + i * 3600000).toISOString(),
  temperature: i < 24 ? 14 : i < 48 ? 12 : 9,
  pressure: 1015,
  windSpeed: 8,
  windDirection: 225,
  windDirectionText: 'ZW',
  precipitation: 0,
  precipitationProbability: 0,
  cloudCover: 40,
  weatherCode: 1,
}));
const segmentation = segmentPrognosisInterval(
  '2026-11-24T10:30:00Z',
  '2026-11-24T12:00:00Z',
  forecasts
);
const options = {
  location,
  userMeasuredWaterTemp: 15,
  userMeasuredWaterTempAt: '2026-11-23T09:00:00Z',
  currentDateRef: new Date('2026-11-23T09:00:00Z'),
};

const candidates = calculateThermalIntervalCandidates(segmentation, forecasts, 'Karper', options);
assert(candidates.segments.length === 2, 'Thermische kandidaatuitvoer behoudt alle intervalsegmenten');
assert(candidates.segments[0].targetTime === segmentation.segments[0].startTime, 'Eerste segment gebruikt exact de absolute segmentstart als doelmoment');
assert(candidates.segments[1].targetTime === segmentation.segments[1].startTime, 'Tweede segment gebruikt exact de absolute segmentstart als doelmoment');
assert(candidates.segments.every((segment) => segment.status === 'available' || segment.status === 'unknown'), 'Elk segment heeft expliciete beschikbaarheidsstatus');
assert(candidates.segments.every((segment) => segment.status === 'unknown' || (
  segment.thermalSource !== null && segment.estimatedWaterTempC !== null &&
  segment.thermalEfficiency !== null && segment.candidateActivityScore !== null
)), 'Beschikbare thermische uitkomst bevat bron, temperatuur, efficiëntie en kandidaat-score');

const laterForecastChanged = forecasts.map((forecast) => {
  const time = Date.parse(forecast.time);
  return time > Date.parse(segmentation.segments[0].startTime)
    ? { ...forecast, temperature: 45 }
    : forecast;
});
const afterFutureChange = calculateThermalIntervalCandidates(segmentation, laterForecastChanged, 'Karper', options);
assert(
  candidates.segments[0].estimatedWaterTempC === afterFutureChange.segments[0].estimatedWaterTempC &&
  candidates.segments[0].thermalEfficiency === afterFutureChange.segments[0].thermalEfficiency &&
  candidates.segments[0].candidateActivityScore === afterFutureChange.segments[0].candidateActivityScore,
  'Forecastwijzigingen na segmentdoelmoment beïnvloeden de eerdere segmentuitkomst niet'
);

const partialForecasts = forecasts.filter((forecast) => forecast.time !== '2026-11-24T11:00:00.000Z');
const partial = segmentPrognosisInterval(
  '2026-11-24T10:30:00Z',
  '2026-11-24T12:00:00Z',
  partialForecasts
);
// Pass the same genuinely incomplete source series to the candidate helper.
// Passing the original full series here would silently reintroduce the missing hour.
const partialCandidates = calculateThermalIntervalCandidates(partial, partialForecasts, 'Karper', options);
assert(partial.segments.length === 2 && partialCandidates.segments.length === 2, 'Ontbrekende uurforecast verwijdert geen thermisch segment');
assert(
  partial.segments[1].weatherAvailable === false &&
  partialCandidates.segments[1].targetTime === partial.segments[1].startTime,
  'Het ontbrekende forecastuur blijft ontbrekend bij de thermische kandidaatberekening'
);
assert(
  partialCandidates.segments[1].status === 'available' &&
  partialCandidates.segments[1].thermalSource === 'estimated_from_measurement',
  'Een expliciet beschikbaar recent meetanker mag een beperkte modelschatting dragen zonder ontbrekende uurdata te verzinnen'
);

const noThermalBasis = segmentPrognosisInterval(
  '2026-11-24T10:30:00Z',
  '2026-11-24T12:00:00Z',
  []
);
const noBasisCandidates = calculateThermalIntervalCandidates(noThermalBasis, [], 'Karper', {
  location,
  currentDateRef: new Date('2026-11-23T09:00:00Z'),
});
assert(
  noBasisCandidates.segments.length === 2 &&
  noBasisCandidates.segments.every((segment) =>
    segment.status === 'unknown' &&
    segment.unknownReason === 'missing_temperature' &&
    segment.thermalSource === null &&
    segment.estimatedWaterTempC === null &&
    segment.estimatedRangeC === null &&
    segment.uncertaintyC === null &&
    segment.thermalEfficiency === null &&
    segment.candidateActivityScore === null
  ),
  'Zonder meetanker, historische temperatuur of bruikbare forecast blijft iedere thermische uitkomst expliciet unknown/null'
);

console.log('\nThermal interval candidate contract: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
