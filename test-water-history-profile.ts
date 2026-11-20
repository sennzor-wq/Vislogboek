import { collectHistoricalWaterTemperatureObservations, deriveHistoricalWaterTemperatureProfile, HistoricalWaterTemperatureObservation } from './src/services/waterTemperatureHistory';
import { analyzeWaterThermalDevelopment } from './src/services/waterThermalEngine';
import { FishingLocation, FishingSession, PrognosisSnapshot, WeatherHourlyForecast } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, name: string) {
  if (condition) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.error(`FAIL ${name}`); }
}

const target: FishingLocation = {
  id: 'location-a',
  name: 'Testplas',
  waterType: 'Onbekend',
  latitude: 52,
  longitude: 5,
  createdAt: '',
  updatedAt: '',
};


const makeMeasuredSession = (
  id: string,
  startTime: string,
  measuredAt: string | undefined,
  temperature: number,
  method: FishingSession['waterTemperatureMeasurementMethod'] = 'thermometer',
  source: FishingSession['waterTemperatureMeasurementSource'] = 'manual',
  isBenchmark = false,
): FishingSession => ({
  id,
  locationId: target.id,
  startTime,
  outcome: 'unknown',
  waterTemperature: temperature,
  waterTemperatureMeasuredAt: measuredAt,
  waterTemperatureMeasurementSource: source,
  waterTemperatureMeasurementMethod: method,
  waterTemperatureMeasurementDepthM: 0.4,
  isBenchmark,
  createdAt: startTime,
  updatedAt: startTime,
} as unknown as FishingSession);

const measuredSessions = [
  makeMeasuredSession('session-a', '2026-06-10T08:00:00Z', '2026-06-10T10:00:00+02:00', 14),
  makeMeasuredSession('session-b', '2026-06-20T08:00:00Z', '2026-06-20T10:00:00+02:00', 15),
  makeMeasuredSession('session-c', '2026-07-01T08:00:00Z', '2026-07-01T10:00:00+02:00', 16),
  makeMeasuredSession('session-no-time', '2026-06-25T10:00:00Z', undefined, 34),
  makeMeasuredSession('session-unknown-method', '2026-06-26T10:00:00Z', '2026-06-26T10:00:00Z', 33, 'unknown'),
  makeMeasuredSession('session-unknown-source', '2026-06-27T10:00:00Z', '2026-06-27T10:00:00Z', 32, 'thermometer', 'unknown'),
  makeMeasuredSession('session-benchmark', '2026-06-28T10:00:00Z', '2026-06-28T10:00:00Z', 35, 'thermometer', 'manual', true),
];
const duplicateSnapshot = {
  id: 'snapshot-session-a',
  locationId: target.id,
  linkedSessionId: 'session-a',
  actualWaterTemperature: 14,
  actualWaterTemperatureTimestamp: '2026-06-10T08:00:00Z',
  actualWaterTemperatureMeasurementSource: 'manual',
  actualWaterTemperatureMeasurementMethod: 'thermometer',
  actualWaterTemperatureMeasurementDepthM: 0.4,
  createdAt: '2026-06-10T08:30:00Z',
} as unknown as PrognosisSnapshot;
const collectedMeasurements = collectHistoricalWaterTemperatureObservations(
  measuredSessions,
  [duplicateSnapshot],
  [target],
);
assert(collectedMeasurements.length === 4,
  'Alleen sessie- en snapshotmetingen met exact meetmoment en bekende herkomst/methode worden verzameld');
const sessionMeasurement = collectedMeasurements.find((item) => item.recordId === 'session-a');
const snapshotMeasurement = collectedMeasurements.find((item) => item.recordId === 'snapshot-session-a');
assert(sessionMeasurement?.recordType === 'session' &&
  sessionMeasurement.recordedAt === '2026-06-10T08:00:00Z' &&
  sessionMeasurement.measurementSource === 'manual' &&
  sessionMeasurement.measurementMethod === 'thermometer' &&
  sessionMeasurement.measurementDepthM === 0.4,
  'Sessiemeting bewaart record-ID, registratiemoment, bron, methode en meetdiepte apart van meettijd');
assert(snapshotMeasurement?.recordType === 'snapshot' &&
  snapshotMeasurement.recordedAt === '2026-06-10T08:30:00Z' &&
  snapshotMeasurement.measurementDepthM === 0.4,
  'Snapshotmeting bewaart eigen herkomst en meetdiepte');
assert(sessionMeasurement?.timestamp === '2026-06-10T10:00:00+02:00',
  'Een sessiemeting gebruikt het expliciete meettijdstip en niet de sessiestart');
const deduplicatedProfile = deriveHistoricalWaterTemperatureProfile(collectedMeasurements, target, '2026-07-04');
assert(deduplicatedProfile?.sampleCount === 3 && deduplicatedProfile.baselineC === 15,
  'Een sessie- en snapshotkopie van dezelfde meting telt door tijdzone-normalisatie slechts eenmaal');

const eventWeatherContext = {
  source: 'open-meteo' as const,
  weatherTimestamp: '2026-06-10T10:00:00.000Z',
  retrievedAt: '2026-06-10T10:20:00.000Z',
  offsetMinutes: 20,
  airTemperatureC: 17,
  windSpeedKmh: 4,
  windDirectionDegrees: 180,
  cloudCoverPercent: 25,
  pressureHpa: 1016,
  precipitationMm: 0,
};
const multiMeasurementSession = {
  ...makeMeasuredSession('session-multiple-events', '2026-06-10T08:00:00Z', '2026-06-10T11:00:00Z', 12.6),
  waterTemperatureMeasurements: [
    {
      id: 'event-1', locationId: target.id, temperatureC: 12.4,
      measuredAt: '2026-06-10T10:00:00.000Z', recordedAt: '2026-06-10T10:01:00.000Z',
      measurementSource: 'manual' as const, measurementMethod: 'thermometer' as const,
      measurementDepthM: 0.4, weatherContext: eventWeatherContext, weatherContextStatus: 'matched' as const,
    },
    {
      id: 'event-2', locationId: target.id, temperatureC: 12.6,
      measuredAt: '2026-06-10T11:00:00.000Z', recordedAt: '2026-06-10T11:01:00.000Z',
      measurementSource: 'manual' as const, measurementMethod: 'probe' as const,
      measurementDepthM: 0.4,
    },
    {
      id: 'event-3', locationId: target.id, temperatureC: 12.8,
      measuredAt: '2026-06-10T12:00:00.000Z', recordedAt: '2026-06-10T12:01:00.000Z',
      measurementSource: 'manual' as const, measurementMethod: 'probe' as const,
      measurementDepthM: 0.4,
    },
    {
      id: 'event-unknown-method', locationId: target.id, temperatureC: 12.8,
      measuredAt: '2026-06-10T11:30:00.000Z', recordedAt: '2026-06-10T11:31:00.000Z',
      measurementSource: 'manual' as const, measurementMethod: 'unknown' as const,
    },
  ],
} as unknown as FishingSession;
const eventDuplicateSnapshot = {
  id: 'snapshot-event-1', locationId: target.id,
  actualWaterTemperature: 12.4, actualWaterTemperatureTimestamp: '2026-06-10T10:00:00.000Z',
  actualWaterTemperatureMeasurementSource: 'manual', actualWaterTemperatureMeasurementMethod: 'thermometer',
  actualWaterTemperatureMeasurementDepthM: 0.4, createdAt: '2026-06-10T10:05:00.000Z',
} as unknown as PrognosisSnapshot;
const eventObservations = collectHistoricalWaterTemperatureObservations(
  [multiMeasurementSession], [eventDuplicateSnapshot], [target],
);
assert(eventObservations.length === 4,
  'Drie afzonderlijke fysieke meetevents plus de snapshotkopie blijven als herleidbare bronrecords beschikbaar');
assert(eventObservations.some((item) => item.measurementId === 'event-1' &&
  item.weatherContext?.airTemperatureC === 17 && item.measurementDepthM === 0.4),
  'Een meetevent behoudt zijn eigen weerscontext en meetdiepte in de historische dataset');
assert(!eventObservations.some((item) => item.measurementId === 'event-unknown-method'),
  'Een meetevent met onbekende methode blijft bewaard maar wordt niet als gevalideerde kalibratiemeting gebruikt');
const eventProfile = deriveHistoricalWaterTemperatureProfile(eventObservations, target, '2026-06-11');
assert(eventProfile?.sampleCount === 3 && eventProfile.baselineC === 12.6,
  'Meerdere meetevents binnen één sessie dragen afzonderlijk bij; een dubbele snapshotkopie telt in het profiel slechts eenmaal');

const localHistory: HistoricalWaterTemperatureObservation[] = [
  { locationId: 'location-a', temperatureC: 14, timestamp: '2026-06-10T10:00:00Z' },
  { locationId: 'location-a', temperatureC: 15, timestamp: '2026-06-20T10:00:00Z' },
  { locationId: 'location-a', temperatureC: 16, timestamp: '2026-07-01T10:00:00Z' },
  { locationId: 'location-a', temperatureC: 34, timestamp: '2026-06-25T10:00:00Z', isBenchmark: true },
  // Same target day and future observations must never leak into the profile.
  { locationId: 'location-a', temperatureC: 30, timestamp: '2026-07-04T00:00:00Z' },
  { locationId: 'location-a', temperatureC: 31, timestamp: '2026-07-05T10:00:00Z' },
];

const localProfile = deriveHistoricalWaterTemperatureProfile(localHistory, target, '2026-07-04');
assert(localProfile !== null, 'same-location profile is created from at least three earlier real measurements');
assert(localProfile?.baselineC === 15, 'same-location profile uses the median, not the mean');
assert(localProfile?.sampleCount === 3, 'same-day, future and benchmark measurements are excluded');

const layeredLocalHistory: HistoricalWaterTemperatureObservation[] = [
  { locationId: 'location-a', temperatureC: 14, timestamp: '2026-06-10T10:00:00Z', measurementDepthM: 0.4 },
  { locationId: 'location-a', temperatureC: 15, timestamp: '2026-06-20T10:00:00Z', measurementDepthM: 0.4 },
  { locationId: 'location-a', temperatureC: 16, timestamp: '2026-07-01T10:00:00Z', measurementDepthM: 0.4 },
  { locationId: 'location-a', temperatureC: 19, timestamp: '2026-06-11T10:00:00Z', measurementDepthM: 0.8 },
  { locationId: 'location-a', temperatureC: 20, timestamp: '2026-06-21T10:00:00Z', measurementDepthM: 0.8 },
  { locationId: 'location-a', temperatureC: 21, timestamp: '2026-07-02T10:00:00Z', measurementDepthM: 0.8 },
];
assert(deriveHistoricalWaterTemperatureProfile(layeredLocalHistory, target, '2026-07-04') === null,
  'Meerdere bekende meetdieptes zonder doelmeetdiepte leveren geen gemengd profiel op');
const shallowLayerProfile = deriveHistoricalWaterTemperatureProfile(layeredLocalHistory, target, '2026-07-04', 0.4);
assert(shallowLayerProfile?.sampleCount === 3 && shallowLayerProfile.baselineC === 15 &&
  shallowLayerProfile.measurementDepthM === 0.4,
  'Expliciete doelmeetdiepte gebruikt uitsluitend de overeenkomende historische meetlaag');
const deepLayerProfile = deriveHistoricalWaterTemperatureProfile(layeredLocalHistory, target, '2026-07-04', 0.8);
assert(deepLayerProfile?.sampleCount === 3 && deepLayerProfile.baselineC === 20 &&
  deepLayerProfile.measurementDepthM === 0.8,
  'Een andere verticale meetlaag krijgt een afzonderlijk profiel en eigen baseline');
const knownAndUnknownDepthHistory: HistoricalWaterTemperatureObservation[] = [
  ...layeredLocalHistory.slice(0, 3),
  { locationId: 'location-a', temperatureC: 22, timestamp: '2026-06-12T10:00:00Z' },
  { locationId: 'location-a', temperatureC: 23, timestamp: '2026-06-22T10:00:00Z' },
  { locationId: 'location-a', temperatureC: 24, timestamp: '2026-07-03T10:00:00Z' },
];
const knownDepthOnlyProfile = deriveHistoricalWaterTemperatureProfile(knownAndUnknownDepthHistory, target, '2026-07-04');
assert(knownDepthOnlyProfile?.sampleCount === 3 && knownDepthOnlyProfile.measurementDepthM === 0.4 &&
  knownDepthOnlyProfile.baselineC === 15,
  'Bekende meetdieptes worden niet met metingen van onbekende diepte samengevoegd');

const nearbyTarget: FishingLocation = {
  ...target,
  id: 'location-target',
  waterType: 'Kanaal',
  waterDepth: 1,
};
const nearbyHistory: HistoricalWaterTemperatureObservation[] = [
  { locationId: 'near-a', temperatureC: 14, timestamp: '2026-06-10T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.1, latitude: 52.01, longitude: 5.01 },
  { locationId: 'near-a', temperatureC: 15, timestamp: '2026-06-20T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.1, latitude: 52.01, longitude: 5.01 },
  { locationId: 'near-a', temperatureC: 16, timestamp: '2026-07-01T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.1, latitude: 52.01, longitude: 5.01 },
  { locationId: 'near-b', temperatureC: 15, timestamp: '2026-06-12T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.2, latitude: 52.02, longitude: 5.02 },
  { locationId: 'near-b', temperatureC: 16, timestamp: '2026-06-22T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.2, latitude: 52.02, longitude: 5.02 },
];
const nearbyProfile = deriveHistoricalWaterTemperatureProfile(nearbyHistory, nearbyTarget, '2026-07-04');
assert(nearbyProfile?.source === 'nearby_same_type', 'nearby profile requires comparable water type and nearby coordinates');
assert(nearbyProfile?.locationCount === 2, 'nearby profile records the number of contributing locations');
const layeredNearbyHistory: HistoricalWaterTemperatureObservation[] = [
  { locationId: 'near-a', temperatureC: 14, timestamp: '2026-06-10T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.1, latitude: 52.01, longitude: 5.01, measurementDepthM: 0.4 },
  { locationId: 'near-a', temperatureC: 15, timestamp: '2026-06-20T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.1, latitude: 52.01, longitude: 5.01, measurementDepthM: 0.4 },
  { locationId: 'near-a', temperatureC: 16, timestamp: '2026-07-01T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.1, latitude: 52.01, longitude: 5.01, measurementDepthM: 0.4 },
  { locationId: 'near-b', temperatureC: 15, timestamp: '2026-06-12T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.2, latitude: 52.02, longitude: 5.02, measurementDepthM: 0.4 },
  { locationId: 'near-b', temperatureC: 16, timestamp: '2026-06-22T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.2, latitude: 52.02, longitude: 5.02, measurementDepthM: 0.4 },
  { locationId: 'near-b', temperatureC: 20, timestamp: '2026-06-13T10:00:00Z', waterType: 'Kanaal', waterDepth: 1.2, latitude: 52.02, longitude: 5.02, measurementDepthM: 0.8 },
];
assert(deriveHistoricalWaterTemperatureProfile(layeredNearbyHistory, nearbyTarget, '2026-07-04') === null,
  'Nearby fallback wordt niet over verschillende meetdieptes samengesteld als doelmeetdiepte onbekend is');
const nearbyShallowLayer = deriveHistoricalWaterTemperatureProfile(layeredNearbyHistory, nearbyTarget, '2026-07-04', 0.4);
assert(nearbyShallowLayer?.sampleCount === 5 && nearbyShallowLayer.locationCount === 2 &&
  nearbyShallowLayer.measurementDepthM === 0.4,
  'Nearby fallback gebruikt meerdere stekken maar uitsluitend de gevraagde meetdiepte');
assert(deriveHistoricalWaterTemperatureProfile(nearbyHistory, { ...nearbyTarget, waterType: 'Onbekend' }, '2026-07-04') === null,
  'unknown water type does not borrow a profile from unrelated water bodies');

function makeForecasts(): WeatherHourlyForecast[] {
  const result: WeatherHourlyForecast[] = [];
  for (let day = 0; day < 5; day++) {
    const date = new Date(Date.UTC(2026, 6, 1 + day)).toISOString().slice(0, 10);
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        time: `${date}T${String(hour).padStart(2, '0')}:00`,
        temperature: 18,
        relativeHumidity: 55,
        dewPoint: 8,
        shortwaveRadiation: hour >= 8 && hour <= 18 ? 600 : 0,
        pressure: 1015,
        windSpeed: 12,
        windDirection: 225,
        windDirectionText: 'ZW',
        precipitation: 0,
        precipitationProbability: 0,
        cloudCover: 90,
        weatherCode: 3,
      });
    }
  }
  return result;
}

const forecasts = makeForecasts();
const modelResult = analyzeWaterThermalDevelopment('2026-07-04', forecasts, {
  location: target,
  historicalWaterTemperatures: localHistory,
  currentDateRef: new Date('2026-07-04T12:00:00Z'),
});
assert(modelResult.estimatedWaterTemp !== null, 'historical profile provides a usable estimate without a local current measurement');
assert(modelResult.waterTemperatureStatus === 'estimated_from_history', 'historical estimate is never labelled as a current measurement');
assert(modelResult.dataPointsAvailable.depthKnown === false && modelResult.dataPointsAvailable.waterDepthMeters === undefined,
  'unknown water depth stays unknown and is not replaced by a 2m default');
assert(modelResult.dataPointsAvailable.solarRadiationIndication === 'Sterk (zonnig)',
  'measured shortwave radiation takes precedence over a conflicting cloud-cover proxy');
assert(modelResult.dataPointsAvailable.humidityAvailable === true && modelResult.dataPointsAvailable.dewPointAvailable === true,
  'humidity and dew point availability are exposed for the evaporation assessment');
assert(modelResult.dataPointsAvailable.evaporationPotential === 'hoog',
  'dry-air and wind context is reflected in the evaporation-potential assessment');

const measuredResult = analyzeWaterThermalDevelopment('2026-07-04', forecasts, {
  location: target,
  userMeasuredWaterTemp: 16.4,
  historicalWaterTemperatures: localHistory,
  currentDateRef: new Date('2026-07-04T12:00:00Z'),
});
assert(measuredResult.hasMeasuredWaterTemp && measuredResult.measuredWaterTemp === 16.4 &&
  measuredResult.estimatedWaterTemp === 16.4 && measuredResult.waterTemperatureStatus === 'measured',
  'an actual local measurement always overrides the historical/model estimate');

console.log(`Water temperature history tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
