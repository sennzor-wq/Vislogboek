/**
 * Deterministische synthetische validatie van het waterthermische model.
 *
 * De sessies en metingen hieronder zijn uitsluitend testfixtures. Ze worden niet
 * naar IndexedDB geschreven en kunnen dus geen gebruikersprofielen trainen.
 * De referentietemperatuur wordt onafhankelijk berekend met een eerste-orde
 * thermisch responsmodel; de engine krijgt alleen eerdere sessiemetingen en
 * weersverwachtingen die op het prognosetijdstip beschikbaar zijn.
 */
import { analyzeWaterThermalDevelopment } from './src/services/waterThermalEngine';
import {
  FishingLocation,
  FishingSession,
  WeatherHourlyForecast,
} from './src/types';
import { HistoricalWaterTemperatureObservation } from './src/services/waterTemperatureHistory';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${name}`);
  } else {
    failed++;
    console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const location: FishingLocation = {
  id: 'synthetic-polder-01',
  name: 'Synthetische ondiepe polder',
  waterType: 'Polder',
  waterDepth: 1.2,
  latitude: 52.0,
  longitude: 5.0,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

const sessionDates = [
  '2026-06-01',
  '2026-06-02',
  '2026-06-03',
  '2026-06-04',
  '2026-06-05',
  '2026-06-06',
];
const measuredWaterTemps = [10.0, 10.8, 11.6, 12.5, 13.3, 14.2];
const measuredAirTemps = [12.0, 14.0, 16.0, 18.0, 20.0, 22.0];

function makeMeasuredSessions(
  waterTemps: number[] = measuredWaterTemps,
  airTemps: number[] = measuredAirTemps
): FishingSession[] {
  return sessionDates.map((date, index) => ({
    id: `synthetic-session-${index + 1}`,
    locationId: location.id,
    startTime: `${date}T12:00:00Z`,
    endTime: `${date}T15:00:00Z`,
    durationMinutes: 180,
    outcome: 'unknown',
    waterDepth: location.waterDepth,
    waterTemperature: waterTemps[index],
    weatherSnapshot: {
      temperature: airTemps[index],
      pressure: 1015,
      windSpeed: 0,
      windDirection: 0,
      cloudCover: 100,
      precipitation: 0,
      source: 'handmatig',
      capturedAt: `${date}T12:00:00Z`,
    },
    createdAt: `${date}T15:00:00Z`,
    updatedAt: `${date}T15:00:00Z`,
  }));
}

function makeForecasts(
  startIso: string,
  endIso: string,
  airTemperature: number
): WeatherHourlyForecast[] {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const result: WeatherHourlyForecast[] = [];
  for (let timestamp = start; timestamp <= end; timestamp += 3600000) {
    const time = new Date(timestamp).toISOString().slice(0, 16);
    result.push({
      time,
      temperature: airTemperature,
      relativeHumidity: 75,
      dewPoint: airTemperature - 4,
      shortwaveRadiation: 0,
      pressure: 1015,
      windSpeed: 0,
      windDirection: 0,
      windDirectionText: 'N',
      precipitation: 0,
      precipitationProbability: 0,
      cloudCover: 100,
      weatherCode: 3,
    });
  }
  return result;
}

function toHistory(sessions: FishingSession[]): HistoricalWaterTemperatureObservation[] {
  return sessions.flatMap((session) => typeof session.waterTemperature === 'number' && session.locationId
    ? [{
        locationId: session.locationId,
        temperatureC: session.waterTemperature,
        timestamp: session.startTime,
        waterType: location.waterType,
        waterDepth: session.waterDepth ?? location.waterDepth,
        latitude: location.latitude,
        longitude: location.longitude,
        isBenchmark: session.isBenchmark,
      }]
    : []);
}

const targetDate = '2026-06-09';
const forecast = makeForecasts('2026-06-06T13:00:00Z', '2026-06-09T23:00:00Z', 22);
const sessions = makeMeasuredSessions();
const latestMeasuredWaterTemp = measuredWaterTemps[measuredWaterTemps.length - 1];

// Independent synthetic reference: water temperature approaches constant ambient
// air temperature with a 52-hour response time. This is a controlled test truth,
// not a claim that every real water body has this time constant.
function syntheticReference(anchorC: number, ambientC: number, elapsedHours: number, tauHours = 52): number {
  return ambientC + (anchorC - ambientC) * Math.exp(-elapsedHours / tauHours);
}

const expectedWarmWaterTemp = syntheticReference(latestMeasuredWaterTemp, 22, 72);
const warmResult = analyzeWaterThermalDevelopment(targetDate, forecast, {
  location,
  historicalSessions: sessions,
  historicalWaterTemperatures: toHistory(sessions),
  currentDateRef: new Date('2026-06-09T12:00:00Z'),
});
const warmError = warmResult.estimatedWaterTemp === null
  ? null
  : Math.abs(warmResult.estimatedWaterTemp - expectedWarmWaterTemp);

assert(warmResult.waterTemperatureStatus === 'estimated_from_measurement',
  'Een eerdere lokale sessiemeting blijft herkenbaar als meetanker');
assert(warmResult.hasMeasuredWaterTemp === false && warmResult.measuredWaterTemp === null,
  'Een meting van drie dagen eerder wordt niet als actuele meting getoond');
assert(warmResult.estimatedWaterTemp !== null && warmError !== null && warmError <= 1.5,
  'Opwarmscenario blijft binnen 1,5 °C van de onafhankelijke synthetische referentie',
  `model=${warmResult.estimatedWaterTemp}, referentie=${expectedWarmWaterTemp.toFixed(2)}, fout=${warmError?.toFixed(2)}`);
assert(warmResult.estimatedRange !== null && warmResult.estimatedRange !== undefined &&
  warmResult.estimatedRange[0] <= expectedWarmWaterTemp && warmResult.estimatedRange[1] >= expectedWarmWaterTemp,
  'Onzekerheidsinterval omvat de onafhankelijke synthetische referentie');
assert(warmResult.anchorAgeHours === 72 && (warmResult.weatherCoverageRatio ?? 0) >= 0.95,
  'Meetankerleeftijd en voorafgaande weersdekking worden correct geregistreerd');

// Cooling case: a warm measured water mass is exposed to three days of colder air.
const coolingSessions = makeMeasuredSessions([14.0, 15.0, 16.0, 17.0, 17.5, 18.0]);
const coolingForecast = makeForecasts('2026-06-06T13:00:00Z', '2026-06-09T23:00:00Z', 12);
const coolingTruth = syntheticReference(18, 12, 72);
const coolingResult = analyzeWaterThermalDevelopment(targetDate, coolingForecast, {
  location,
  historicalSessions: coolingSessions,
  historicalWaterTemperatures: toHistory(coolingSessions),
  currentDateRef: new Date('2026-06-09T12:00:00Z'),
});
const coolingError = coolingResult.estimatedWaterTemp === null
  ? null
  : Math.abs(coolingResult.estimatedWaterTemp - coolingTruth);
assert(coolingResult.estimatedWaterTemp !== null && coolingResult.estimatedWaterTemp < 18 &&
  coolingResult.estimatedWaterTemp > 12,
  'Koude lucht leidt tot geleidelijke waterafkoeling, niet tot een directe kopie van de luchttemperatuur');
assert(coolingError !== null && coolingError <= 1.5,
  'Afkoelscenario blijft binnen 1,5 °C van de onafhankelijke synthetische referentie',
  `model=${coolingResult.estimatedWaterTemp}, referentie=${coolingTruth.toFixed(2)}, fout=${coolingError?.toFixed(2)}`);

// Historical-profile-only case: real earlier session measurements are available,
// but no recent session anchor is passed to the thermal engine.
const profileSessions = makeMeasuredSessions(
  [13.8, 14.0, 14.1, 14.2, 14.3, 14.4],
  [14.0, 14.0, 14.0, 14.0, 14.0, 14.0]
);
const profileForecast = makeForecasts('2026-06-06T13:00:00Z', '2026-06-09T23:00:00Z', 14.15);
const profileReference = 14.15;
const profileResult = analyzeWaterThermalDevelopment(targetDate, profileForecast, {
  location,
  historicalSessions: [],
  historicalWaterTemperatures: toHistory(profileSessions),
  currentDateRef: new Date('2026-06-09T12:00:00Z'),
});
const profileError = profileResult.estimatedWaterTemp === null
  ? null
  : Math.abs(profileResult.estimatedWaterTemp - profileReference);
assert(profileResult.waterTemperatureStatus === 'estimated_from_history' &&
  profileResult.historicalWaterTemperatureSamples === 6,
  'Zes eerdere echte sessiemetingen vormen zonder actueel meetanker een historisch seizoensprofiel');
assert(profileError !== null && profileError <= 0.5,
  'Historisch profiel geeft bij stabiele weersreferentie de bekende synthetische watertemperatuur terug',
  `model=${profileResult.estimatedWaterTemp}, referentie=${profileReference.toFixed(2)}, fout=${profileError?.toFixed(2)}`);

// Future measurements and benchmark sessions must not alter a prior forecast.
const futureSession: FishingSession = {
  id: 'synthetic-future-session',
  locationId: location.id,
  startTime: '2026-06-09T13:00:00Z',
  endTime: '2026-06-09T14:00:00Z',
  outcome: 'unknown',
  waterTemperature: 30,
  createdAt: '2026-06-09T14:00:00Z',
  updatedAt: '2026-06-09T14:00:00Z',
};
const benchmarkSession: FishingSession = {
  id: 'synthetic-benchmark-session',
  locationId: location.id,
  startTime: '2026-06-08T12:00:00Z',
  endTime: '2026-06-08T13:00:00Z',
  outcome: 'unknown',
  waterTemperature: 35,
  isBenchmark: true,
  createdAt: '2026-06-08T13:00:00Z',
  updatedAt: '2026-06-08T13:00:00Z',
};
const protectedInput = [...sessions, futureSession, benchmarkSession];
const protectedResult = analyzeWaterThermalDevelopment(targetDate, forecast, {
  location,
  historicalSessions: protectedInput,
  historicalWaterTemperatures: toHistory(protectedInput),
  currentDateRef: new Date('2026-06-09T12:00:00Z'),
});
assert(protectedResult.estimatedWaterTemp === warmResult.estimatedWaterTemp,
  'Toekomstige meting en benchmarkmeting lekken niet terug in de eerdere prognose');

// A current local measurement must always override all historical/model estimates.
const currentMeasurement = analyzeWaterThermalDevelopment(targetDate, forecast, {
  location,
  userMeasuredWaterTemp: 15.3,
  historicalSessions: sessions,
  historicalWaterTemperatures: toHistory(sessions),
  currentDateRef: new Date('2026-06-09T12:00:00Z'),
});
assert(currentMeasurement.waterTemperatureStatus === 'measured' &&
  currentMeasurement.hasMeasuredWaterTemp && currentMeasurement.measuredWaterTemp === 15.3 &&
  currentMeasurement.estimatedWaterTemp === 15.3,
  'Actuele lokale meting heeft altijd voorrang op historisch profiel en model');

const justAfterMidnightAmsterdam = analyzeWaterThermalDevelopment(targetDate, forecast, {
  location,
  userMeasuredWaterTemp: 15.6,
  historicalSessions: sessions,
  historicalWaterTemperatures: toHistory(sessions),
  currentDateRef: new Date('2026-06-09T00:30:00+02:00'),
});
assert(justAfterMidnightAmsterdam.waterTemperatureStatus === 'measured' &&
  justAfterMidnightAmsterdam.measuredWaterTemp === 15.6,
  'Actuele meting rond 00:30 Nederlandse zomertijd blijft aan de juiste lokale doeldag gekoppeld');

// Export a compact, deterministic series for the audit chart/report.
const chartSeries = sessionDates.map((date, index) => ({
  date,
  outdoorTemperatureC: measuredAirTemps[index],
  measuredWaterTemperatureC: measuredWaterTemps[index],
}));
console.log('SYNTHETIC_TEMPERATURE_SERIES=' + JSON.stringify(chartSeries));
console.log('SYNTHETIC_WARM_SCENARIO=' + JSON.stringify({
  predictedWaterTemperatureC: warmResult.estimatedWaterTemp,
  referenceWaterTemperatureC: Number(expectedWarmWaterTemp.toFixed(2)),
  absoluteErrorC: warmError === null ? null : Number(warmError.toFixed(2)),
  uncertaintyRangeC: warmResult.estimatedRange,
}));
console.log('SYNTHETIC_COOLING_SCENARIO=' + JSON.stringify({
  predictedWaterTemperatureC: coolingResult.estimatedWaterTemp,
  referenceWaterTemperatureC: Number(coolingTruth.toFixed(2)),
  absoluteErrorC: coolingError === null ? null : Number(coolingError.toFixed(2)),
  uncertaintyRangeC: coolingResult.estimatedRange,
}));
console.log('SYNTHETIC_PROFILE_SCENARIO=' + JSON.stringify({
  predictedWaterTemperatureC: profileResult.estimatedWaterTemp,
  referenceWaterTemperatureC: Number(profileReference.toFixed(2)),
  absoluteErrorC: profileError === null ? null : Number(profileError.toFixed(2)),
  sampleCount: profileResult.historicalWaterTemperatureSamples,
  uncertaintyRangeC: profileResult.estimatedRange,
}));

console.log(`Synthetic water-temperature validation: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
