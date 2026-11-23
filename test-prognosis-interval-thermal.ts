import { calculateThermalIntervalCandidates } from './src/services/prognosisIntervalThermal';
import { segmentPrognosisInterval } from './src/services/prognosisIntervalEngine';
import { FishingLocation, WeatherHourlyForecast } from './src/types';
import { calculateDayPrognosis } from './src/services/prognosisEngine';

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
  segment.thermalSource !== null && segment.waterTemperatureC !== null &&
  segment.thermalEfficiency !== null && segment.candidateActivityScore !== null
)), 'Beschikbare thermische uitkomst bevat bron, temperatuur, efficiëntie en kandidaat-score');

const calibration = { appliedCorrectionC: 1.2, sampleCount: 8, season: 'herfst' as const };
const calibratedCandidates = calculateThermalIntervalCandidates(
  segmentation,
  forecasts,
  'Karper',
  { ...options, waterTemperatureCalibration: calibration }
);
assert(
  calibratedCandidates.segments.every((segment, index) => {
    const original = candidates.segments[index];
    return segment.status === 'unknown' ||
      (original.status === 'available' &&
        segment.waterTemperatureC === Math.round(((original.waterTemperatureC as number) - 1.2) * 10) / 10 &&
        segment.thermalCalibration?.appliedCorrectionC === 1.2 &&
        segment.thermalCalibration.sampleCount === 8);
  }),
  'Dezelfde gevalideerde lokale temperatuurkalibratie wordt toegepast op geschatte segmenttemperaturen en blijft herleidbaar'
);

const measuredSegmentation = segmentPrognosisInterval(
  '2026-11-23T10:00:00Z',
  '2026-11-23T11:00:00Z',
  forecasts
);
const measuredCandidates = calculateThermalIntervalCandidates(
  measuredSegmentation,
  forecasts,
  'Karper',
  {
    location,
    userMeasuredWaterTemp: 15,
    userMeasuredWaterTempAt: '2026-11-23T10:00:00Z',
    currentDateRef: new Date('2026-11-23T11:00:00Z'),
    waterTemperatureCalibration: calibration,
  }
);
assert(
  measuredCandidates.segments[0].thermalSource === 'measured' &&
  measuredCandidates.segments[0].waterTemperatureC === 15 &&
  measuredCandidates.segments[0].thermalCalibration === null,
  'Een directe watertemperatuurmeting wordt nooit door de lokale kalibratie aangepast'
);

const laterForecastChanged = forecasts.map((forecast) => {
  const time = Date.parse(forecast.time);
  return time > Date.parse(segmentation.segments[0].startTime)
    ? { ...forecast, temperature: 45 }
    : forecast;
});
const afterFutureChange = calculateThermalIntervalCandidates(segmentation, laterForecastChanged, 'Karper', options);
assert(
  candidates.segments[0].waterTemperatureC === afterFutureChange.segments[0].waterTemperatureC &&
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
    segment.waterTemperatureC === null &&
    segment.waterTemperatureRangeC === null &&
    segment.uncertaintyC === null &&
    segment.thermalEfficiency === null &&
    segment.candidateActivityScore === null
  ),
  'Zonder meetanker, historische temperatuur of bruikbare forecast blijft iedere thermische uitkomst expliciet unknown/null'
);


const simulationStart = Date.parse('2026-11-20T00:00:00Z');
const simulationTarget = '2026-11-24T12:00:00Z';
const simulationEnd = '2026-11-24T13:00:00Z';
const simulationLocation: FishingLocation = { ...location, id: 'synthetic-water', waterDepth: 2.2, waterType: 'Plas/Zandafgraving' };
const scenarioTemp = (name: string, hour: number): number => {
  if (name === 'cold_stable') return 4;
  if (name === 'mild_stable') return 12;
  if (name === 'warm_stable') return 20;
  if (name === 'hot_stable') return 30;
  if (name === 'warming') return hour < 48 ? 7 : hour < 84 ? 11 : 17;
  if (name === 'cooling') return hour < 48 ? 19 : hour < 84 ? 13 : 6;
  throw new Error('Unknown scenario ' + name);
};
const makeForecasts = (name: string): WeatherHourlyForecast[] => Array.from({ length: 120 }, (_, hour) => ({
  time: new Date(simulationStart + hour * 3600000).toISOString(),
  temperature: scenarioTemp(name, hour), pressure: 1012 + hour % 8,
  windSpeed: name === 'hot_stable' ? 3 : name === 'cooling' ? 18 : 8,
  windDirection: 225, windDirectionText: 'ZW', precipitation: name === 'cooling' ? 0.2 : 0,
  precipitationProbability: name === 'cooling' ? 20 : 0,
  cloudCover: name === 'warm_stable' ? 15 : 65, weatherCode: 1,
}));
const scenarios = ['cold_stable', 'mild_stable', 'warm_stable', 'hot_stable', 'warming', 'cooling'] as const;
const simSegmentation = segmentPrognosisInterval(simulationTarget, simulationEnd, makeForecasts('mild_stable'));
let simulationCases = 0;
const karperScenarioSummary: Array<{ scenario: string; waterTemperatureC: number; candidateActivityScore: number }> = [];
for (const scenario of scenarios) {
  const series = makeForecasts(scenario);
  for (const species of ['Karper', 'Brasem', 'Snoek', 'Baars', 'Voorn', 'Zeelt', 'Snoekbaars', 'Meerval', 'Roofblei', 'Overig'] as const) {
    const opts = { location: simulationLocation, currentDateRef: new Date(simulationStart) };
    const result = calculateThermalIntervalCandidates(simSegmentation, series, species, opts);
    const repeated = calculateThermalIntervalCandidates(simSegmentation, series, species, opts);
    const s = result.segments[0];
    assert(s.status === 'available' && s.thermalSource === 'estimated_from_weather' &&
      typeof s.waterTemperatureC === 'number' && Number.isFinite(s.waterTemperatureC),
      'Synthetisch ' + scenario + ' / ' + species + ': geldige weerafgeleide watertemperatuur');
    assert(s.thermalEfficiency !== null && s.thermalEfficiency >= 0.08 && s.thermalEfficiency <= 1 &&
      s.candidateActivityScore !== null && s.candidateActivityScore >= 1 && s.candidateActivityScore <= 10,
      'Synthetisch ' + scenario + ' / ' + species + ': efficiëntie en score binnen grenzen');
    assert(JSON.stringify(result) === JSON.stringify(repeated),
      'Synthetisch ' + scenario + ' / ' + species + ': deterministische uitvoer');
    if (species === 'Karper' && s.waterTemperatureC !== null && s.candidateActivityScore !== null) {
      karperScenarioSummary.push({ scenario, waterTemperatureC: s.waterTemperatureC, candidateActivityScore: s.candidateActivityScore });
    }
    simulationCases++;
  }
}
assert(simulationCases === 60, '6 weerscenario’s × 10 soorten = 60 synthetische combinaties');
console.log('SYNTHETIC_INTERVAL_KARPER_SCENARIOS=' + JSON.stringify(karperScenarioSummary));


const parityForecasts = makeForecasts('mild_stable');
const parityStart = '2026-11-24T14:00:00Z'; // representative 15:00 Amsterdam sample of the existing Middag slot
const paritySegmentation = segmentPrognosisInterval(parityStart, '2026-11-24T15:00:00Z', parityForecasts);
const parityCalibration = { appliedCorrectionC: 1.2, sampleCount: 8, season: 'herfst' as const };
const parityOptions = {
  location: simulationLocation,
  currentDateRef: new Date(simulationStart),
  waterTemperatureCalibration: parityCalibration,
};
const parityCandidate = calculateThermalIntervalCandidates(
  paritySegmentation, parityForecasts, 'Karper', parityOptions
).segments[0];
const existingDay = calculateDayPrognosis(
  '2026-11-24',
  parityForecasts,
  'Karper',
  [],
  undefined,
  null,
  new Date(simulationStart),
  { ...parityOptions, sessionDurationHours: 3 }
);
assert(
  parityCandidate.status === 'available' &&
  parityCandidate.candidateActivityScore === existingDay.timeSlots.Middag.activityScore &&
  parityCandidate.thermalCalibration?.appliedCorrectionC === parityCalibration.appliedCorrectionC,
  'Bij hetzelfde exacte representatieve tijdstip reproduceert de intervalkandidaat de bestaande tijdvakscore inclusief lokale kalibratie'
);
assert(
  existingDay.personalCatchChance === null,
  'Zonder historische sessies blijft de persoonlijke vangkans null, ook wanneer de thermische kandidaat beschikbaar is'
);

const futurePerturbed = makeForecasts('mild_stable').map((f) => Date.parse(f.time) > Date.parse(simulationTarget)
  ? { ...f, temperature: 55, windSpeed: 180, precipitation: 50 } : f);
const original = calculateThermalIntervalCandidates(simSegmentation, makeForecasts('mild_stable'), 'Karper', {
  location: simulationLocation, currentDateRef: new Date(simulationStart),
});
const perturbed = calculateThermalIntervalCandidates(simSegmentation, futurePerturbed, 'Karper', {
  location: simulationLocation, currentDateRef: new Date(simulationStart),
});
assert(JSON.stringify(original.segments[0]) === JSON.stringify(perturbed.segments[0]),
  'Extreem gewijzigde forecast na targetTime verandert het eerdere segment niet');

const shortSeries = makeForecasts('mild_stable').filter((f) =>
  Date.parse(f.time) >= Date.parse('2026-11-24T06:00:00Z') && Date.parse(f.time) <= Date.parse('2026-11-24T12:00:00Z'));
const shortSeg = segmentPrognosisInterval(simulationTarget, simulationEnd, shortSeries);
const shortResult = calculateThermalIntervalCandidates(shortSeg, shortSeries, 'Karper', {
  location: simulationLocation, currentDateRef: new Date(simulationStart),
});
assert(shortResult.segments[0].status === 'unknown' && shortResult.segments[0].waterTemperatureC === null &&
  shortResult.segments[0].candidateActivityScore === null,
  'Te korte weershistorie zonder lokaal meetanker blijft expliciet unknown');

const springDst = segmentPrognosisInterval('2026-03-29T00:00:00Z', '2026-03-29T03:00:00Z', []);
const autumnDst = segmentPrognosisInterval('2026-10-25T00:00:00Z', '2026-10-25T03:00:00Z', []);
assert(springDst.segments.length === 3 && springDst.totalDurationMinutes === 180 &&
  springDst.segments.reduce((sum, s) => sum + s.durationMinutes, 0) === 180,
  'Voorjaars-DST behoudt exact 180 verstreken minuten');
assert(autumnDst.segments.length === 3 && autumnDst.totalDurationMinutes === 180 &&
  autumnDst.segments.reduce((sum, s) => sum + s.durationMinutes, 0) === 180,
  'Najaars-DST behoudt exact 180 verstreken minuten bij dubbel lokaal uur');

console.log('\nThermal interval candidate contract: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
