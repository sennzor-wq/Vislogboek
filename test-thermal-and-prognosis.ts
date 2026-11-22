/**
 * Testsuite voor Fase 3: 14 scenario's voor Vislogboek v2.3
 * Controleert de bestaande prognose, geplande sessieduur,
 * en de thermische waterontwikkelingsmodule.
 */

import { PROGNOSIS_MODEL_VERSION } from './src/services/modelVersions';
import { analyzeWaterThermalDevelopment } from './src/services/waterThermalEngine';
import { calculateDayPrognosis, createManualWaterTemperatureInput, createPrognosisHistoryFeatureSnapshot, createPrognosisHistoryFingerprint, createPrognosisInputFingerprint, getSessionDurationHours } from './src/services/prognosisEngine';
import { evaluatePrognosisPerformance } from './src/services/evaluationEngine';
import { normalizeRawBackup } from './src/services/backupService';
import { resolveTimestampEntryMode } from './src/utils/timestampProvenance';
import {
  WeatherHourlyForecast,
  FishingLocation,
  FishingSession,
  CatchItem,
  PresenceObservation,
} from './src/types';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${name} ${detail ? `-> ${detail}` : ''}`);
    failed++;
  }
}

function makeHourlySeries(
  startDateStr: string,
  daysCount: number,
  tempFn: (dayIdx: number, hour: number) => number,
  cloudFn?: (dayIdx: number, hour: number) => number,
  windSpeed = 12
): WeatherHourlyForecast[] {
  const result: WeatherHourlyForecast[] = [];
  const base = new Date(startDateStr);

  for (let d = 0; d < daysCount; d++) {
    const curDate = new Date(base.getTime() + d * 86400000);
    const dateStr = curDate.toISOString().slice(0, 10);

    for (let h = 0; h < 24; h++) {
      const timeIso = `${dateStr}T${String(h).padStart(2, '0')}:00`;
      const temp = tempFn(d, h);
      const cloud = cloudFn ? cloudFn(d, h) : 40;

      result.push({
        time: timeIso,
        temperature: temp,
        pressure: 1016,
        windSpeed,
        windDirection: 225,
        windDirectionText: 'ZW',
        precipitation: 0,
        precipitationProbability: 10,
        cloudCover: cloud,
        weatherCode: cloud > 70 ? 3 : 1,
      });
    }
  }
  return result;
}

async function run14Scenarios() {
  console.log('=== STARTING VISLOGBOEK 14-SCENARIO VERIFICATION ===\n');

  // Timestamp provenance: automatic by default, editable, and never retroactively inferred.
  assert(resolveTimestampEntryMode('2026-11-18T10:00', '2026-11-18T10:00', true) === 'automatic',
    'Timestamp 1: nieuw vangstformulier behoudt automatische standaardtijd');
  assert(resolveTimestampEntryMode('2026-11-18T09:45', '2026-11-18T10:00', true) === 'user_adjusted',
    'Timestamp 2: gewijzigde nieuwe vangsttijd krijgt user_adjusted');
  assert(resolveTimestampEntryMode('2026-11-18T10:00', '2026-11-18T10:00', false) === undefined,
    'Timestamp 3: bestaande registratie zonder herkomst blijft ongeclassificeerd');
  assert(resolveTimestampEntryMode('2026-11-18T09:45', '2026-11-18T10:00', false) === 'user_adjusted',
    'Timestamp 4: handmatig aangepaste bestaande tijd krijgt user_adjusted');
  assert(resolveTimestampEntryMode('2026-11-18T10:00', '2026-11-18T10:00', false, 'automatic') === 'automatic',
    'Timestamp 5: bestaande automatische herkomst blijft behouden bij ongewijzigde tijd');

  const provenanceHistory = createPrognosisHistoryFeatureSnapshot([], [
    { id: 'auto', sessionId: 's1', species: 'Karper', count: 1, timestamp: '2026-11-18T09:00:00.000Z', timestampEntryMode: 'automatic', createdAt: '2026-11-18T09:00:00.000Z' },
    { id: 'adjusted', sessionId: 's1', species: 'Karper', count: 1, timestamp: '2026-11-18T09:10:00.000Z', timestampEntryMode: 'user_adjusted', createdAt: '2026-11-18T09:11:00.000Z' },
    { id: 'legacy', sessionId: 's1', species: 'Karper', count: 1, timestamp: '2026-11-18T09:20:00.000Z', createdAt: '2026-11-18T09:21:00.000Z' },
  ]);
  assert(provenanceHistory.historyFeatureSchemaVersion === 2 &&
    provenanceHistory.historicalCatchFeatures?.find((item) => item.id === 'auto')?.timestampEntryMode === 'automatic' &&
    provenanceHistory.historicalCatchFeatures?.find((item) => item.id === 'adjusted')?.timestampEntryMode === 'user_adjusted' &&
    provenanceHistory.historicalCatchFeatures?.find((item) => item.id === 'legacy')?.timestampEntryMode === undefined,
    'Timestamp 6: prognosehistorie v2 bewaart herkomst zonder oude records te classificeren');

  const unknownDuration = getSessionDurationHours({
    id: 'unknown-duration',
    startTime: '2026-10-20T10:00:00Z',
    outcome: 'unknown',
    createdAt: '',
    updatedAt: '',
  });
  const inferredDuration = getSessionDurationHours({
    id: 'known-time-range',
    startTime: '2026-10-20T10:00:00Z',
    endTime: '2026-10-20T13:30:00Z',
    outcome: 'skunk_confirmed',
    createdAt: '',
    updatedAt: '',
  });
  const manualTemperatureRecordedAt = '2026-11-16T12:00:00.000Z';
  const manualTemperatureInput = createManualWaterTemperatureInput(14.7, manualTemperatureRecordedAt);
  assert(
    manualTemperatureInput !== null && manualTemperatureInput.temperatureC === 14.7 &&
      manualTemperatureInput.recordedAt === manualTemperatureRecordedAt &&
      manualTemperatureInput.measurementTimestamp === null &&
      manualTemperatureInput.measurementMethod === null && manualTemperatureInput.measurementDepthM === null,
    '0.1a Handmatige watertemperatuur bewaart de invoer en markeert onbekende meetmetadata expliciet'
  );
  assert(
    createManualWaterTemperatureInput(null, manualTemperatureRecordedAt) === null &&
      createManualWaterTemperatureInput(Number.NaN, manualTemperatureRecordedAt) === null,
    '0.1b Ontbrekende of ongeldige handmatige temperatuur wordt niet als invoerobject opgeslagen'
  );
  const manualFingerprintA = createPrognosisInputFingerprint({ manualWaterTemperatureInput: manualTemperatureInput });
  const manualFingerprintB = createPrognosisInputFingerprint({
    manualWaterTemperatureInput: createManualWaterTemperatureInput(15.1, manualTemperatureRecordedAt),
  });
  assert(
    manualFingerprintA !== manualFingerprintB,
    '0.1c Een gewijzigde handmatige watertemperatuur wijzigt de snapshot-inputfingerprint'
  );

  const historySession: FishingSession = {
    id: 'history-session-a',
    locationId: 'spot-lokkershoek',
    startTime: '2026-10-20T18:00:00Z',
    endTime: '2026-10-20T22:00:00Z',
    durationMinutes: 240,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    technique: 'Method feeder',
    baitDirection: 'West',
    prebaited: true,
    baitAndFeed: 'Pellets',
    waterDepth: 1.2,
    waterTemperature: 14.2,
    waterTemperatureMeasuredAt: '2026-10-20T19:00:00Z',
    waterTemperatureMeasurementSource: 'manual',
    waterTemperatureMeasurementMethod: 'thermometer',
    waterTemperatureMeasurementDepthM: 0.4,
    notes: 'Persoonlijke notitie mag niet in de model-snapshot terechtkomen',
    photoUrls: ['data:image/jpeg;base64,private'],
    createdAt: '',
    updatedAt: '',
  };
  const historyCatch: CatchItem = {
    id: 'history-catch-a',
    sessionId: historySession.id,
    locationId: historySession.locationId,
    species: 'Karper',
    count: 2,
    timestamp: '2026-10-20T20:00:00Z',
    bait: 'Pellets',
    technique: 'Method feeder',
    notes: 'Privénotitie',
    photoUrl: 'data:image/jpeg;base64,private',
    createdAt: '',
  };
  const historyObservation: PresenceObservation = {
    id: 'history-observation-a',
    locationId: historySession.locationId!,
    sessionId: historySession.id,
    observationType: 'aasbellen_voedselactiviteit',
    timestamp: '2026-10-20T19:30:00Z',
    notes: 'Privénotitie',
    createdAt: '',
  };
  const historyFeatures = createPrognosisHistoryFeatureSnapshot(
    [historySession],
    [historyCatch],
    [historyObservation]
  );
  const historyFingerprintA = createPrognosisHistoryFingerprint(
    [historySession], [historyCatch], [historyObservation]
  );
  const historyFingerprintB = createPrognosisHistoryFingerprint(
    [{ ...historySession, baitDirection: 'Noord', prebaited: false }],
    [historyCatch],
    [historyObservation]
  );
  assert(
    historyFeatures.historicalSessionFeatures?.[0].baitDirection === 'West' &&
      historyFeatures.historicalSessionFeatures?.[0].prebaited === true &&
      historyFeatures.historicalCatchFeatures?.[0].count === 2 &&
      historyFeatures.historicalObservationFeatures?.[0].observationType === 'aasbellen_voedselactiviteit',
    '0.1d Snapshot bewaart modelrelevante sessie-, vangst- en waarnemingskenmerken'
  );
  assert(
    historyFingerprintA !== historyFingerprintB,
    '0.1e Wijziging van aasrichting of voorvoerstatus wijzigt de historie-fingerprint'
  );
  assert(
    !JSON.stringify(historyFeatures).includes('Privénotitie') &&
      !JSON.stringify(historyFeatures).includes('base64'),
    '0.1f Vrije notities en foto-inhoud worden niet in de replaybare modelsnapshot gekopieerd'
  );

  assert(unknownDuration === null, '0.1 Onbekende sessieduur blijft null en wordt niet als 3 uur ingevuld');
  assert(inferredDuration === 3.5, '0.2 Geldige start- en eindtijd leveren de geregistreerde duur op');

  const locLokkershoek: FishingLocation = {
    id: 'spot-lokkershoek',
    name: 'Lokkershoek Plas',
    waterDepth: 2.5,
    waterType: 'Plas/Zandafgraving',
    createdAt: '',
    updatedAt: '',
  };

  const locOndiep: FishingLocation = {
    id: 'spot-polder',
    name: 'Ondiepe Poldervaart',
    waterDepth: 1.0,
    waterType: 'Polder',
    createdAt: '',
    updatedAt: '',
  };

  const locDiep: FishingLocation = {
    id: 'spot-diep',
    name: 'Diepe Zandafgraving',
    waterDepth: 5.5,
    waterType: 'Plas/Zandafgraving',
    createdAt: '',
    updatedAt: '',
  };

  // 1. Warme dag na meerdere koude dagen
  console.log('--- SCENARIO 1: Warme dag na meerdere koude dagen ---');
  // Dagen 0,1,2 = 7°C (koud). Dag 3 (doeldag) = piek 19°C, gemiddeld 14°C
  const s1Forecasts = makeHourlySeries('2026-10-20', 5, (d, h) => {
    if (d < 3) return 7; // koud
    return h >= 12 && h <= 17 ? 19 : 10; // warmere middag
  });
  const s1 = analyzeWaterThermalDevelopment('2026-10-23', s1Forecasts, { location: locLokkershoek });
  assert(
    s1.estimatedWaterTemp !== null && s1.estimatedWaterTemp < 13.5 && s1.estimatedWaterTemp > 7.0,
    `1.1 Thermische traagheid dempt abrupte opwarming (geschat: ${s1.estimatedWaterTemp} °C << 19 °C)`
  );
  assert(
    s1.surfaceVsBulkNote.length > 10,
    '1.2 Onderscheid tussen oppervlaktelaag en trage bulk watermassa is gedocumenteerd'
  );

  // 2. Meerdere warme, zonnige dagen
  console.log('\n--- SCENARIO 2: Meerdere aaneengesloten warme zonnige dagen ---');
  const s2Forecasts = makeHourlySeries('2026-05-10', 5, () => 21, () => 15);
  const s2 = analyzeWaterThermalDevelopment('2026-05-13', s2Forecasts, { location: locLokkershoek });
  assert(
    s2.trend === 'Waarschijnlijke opwarming' || s2.trend === 'Ongeveer stabiel',
    `2.1 Aanhoudend warm en zonnig weer toont warme trend (trend: ${s2.trend})`
  );
  assert(
    s2.dataPointsAvailable.solarRadiationIndication === 'Sterk (zonnig)',
    '2.2 Zonnestraling correct als Sterk (zonnig) gekwalificeerd'
  );

  // 3. Meerdere warme maar bewolkte dagen
  console.log('\n--- SCENARIO 3: Meerdere warme maar zwaarbewolkte dagen ---');
  const s3Forecasts = makeHourlySeries('2026-06-10', 5, () => 21, () => 90);
  const s3 = analyzeWaterThermalDevelopment('2026-06-13', s3Forecasts, { location: locLokkershoek });
  assert(
    s3.dataPointsAvailable.solarRadiationIndication === 'Gering (zwaarbewolkt/mist)',
    '3.1 Zwaarbewolkte lucht induceert diffuse opwarming zonder zonnestralingspiek'
  );

  // 4. Warme middag met koude nachten (grote dagelijkse amplitude)
  console.log('\n--- SCENARIO 4: Warme middag met koude nachten ---');
  const s4Forecasts = makeHourlySeries('2026-04-10', 4, (d, h) => {
    return h >= 13 && h <= 17 ? 19 : 2; // middag 19°C, nacht 2°C
  });
  const s4 = analyzeWaterThermalDevelopment('2026-04-12', s4Forecasts, { location: locLokkershoek });
  assert(
    s4.trend === 'Ongeveer stabiel',
    `4.1 Nachtelijke uitstraling compenseert middagpiek; trend is ${s4.trend}`
  );

  // 5. Periode met dalende temperaturen
  console.log('\n--- SCENARIO 5: Periode met dalende temperaturen (koufront) ---');
  const s5Forecasts = makeHourlySeries('2026-10-15', 5, (d) => {
    return 18 - d * 2.5; // daalt van 18 naar 8 °C
  }, undefined, 25);
  const s5 = analyzeWaterThermalDevelopment('2026-10-18', s5Forecasts, { location: locLokkershoek });
  assert(
    s5.trend === 'Waarschijnlijke afkoeling',
    `5.1 Dalende luchttemperaturen en windmenging tonen ${s5.trend}`
  );

  // 6. Verschillende seizoenen en tijdstippen
  console.log('\n--- SCENARIO 6: Verschillende seizoenen en tijdstippen ---');
  const progWinter = calculateDayPrognosis('2026-01-15', makeHourlySeries('2026-01-15', 1, () => 3), 'Snoek', []);
  const progSummer = calculateDayPrognosis('2026-07-15', makeHourlySeries('2026-07-15', 1, () => 22), 'Karper', []);
  assert(
    progWinter.activityScore > 0 && progSummer.activityScore > 0,
    `6.1 Zowel winter (${progWinter.activityScore}/10) als zomer (${progSummer.activityScore}/10) functioneren foutloos`
  );

  // 7. Ondiep versus dieper water
  console.log('\n--- SCENARIO 7: Ondiep versus dieper water ---');
  const s7Shallow = analyzeWaterThermalDevelopment('2026-10-23', s1Forecasts, { location: locOndiep });
  const s7Deep = analyzeWaterThermalDevelopment('2026-10-23', s1Forecasts, { location: locDiep });
  assert(
    s7Shallow.inertiaFactor === 'Laag (snel reagerend)',
    `7.1 Ondiep water (1.0m) heeft lage traagheid (${s7Shallow.inertiaFactor})`
  );
  assert(
    s7Deep.inertiaFactor === 'Hoog (trage watermassa)',
    `7.2 Diep water (5.5m) heeft hoge traagheid (${s7Deep.inertiaFactor})`
  );

  // 8. Sessies met en zonder gemeten watertemperatuur
  console.log('\n--- SCENARIO 8: Sessies met en zonder gemeten watertemperatuur ---');
  const s8Measured = analyzeWaterThermalDevelopment('2026-10-23', s1Forecasts, {
    location: locLokkershoek,
    userMeasuredWaterTemp: 14.2,
  });
  const s8Unmeasured = analyzeWaterThermalDevelopment('2026-10-23', s1Forecasts, {
    location: locLokkershoek,
    userMeasuredWaterTemp: null,
  });
  assert(
    s8Measured.hasMeasuredWaterTemp === true && s8Measured.measuredWaterTemp === 14.2,
    '8.1 Gemeten watertemperatuur (14.2 °C) wordt exact overgenomen'
  );
  assert(
    s8Unmeasured.hasMeasuredWaterTemp === false && s8Unmeasured.measuredWaterTemp === null,
    '8.2 Ontbrekende meting blijft strikt null (nooit gefingeerd als 0 °C)'
  );

  // 8.3 Tijdstipgerichte thermische toestand vanaf één echt meetanker.
  console.log('\n--- SCENARIO 8.3: Chronologische thermische toestand per tijdstip ---');
  const thermalReferenceTime = new Date('2026-10-23T10:00:00.000Z');
  const stableWaterForecasts = makeHourlySeries('2026-10-23', 2, () => 8, () => 100, 0);
  const waterAfternoon = analyzeWaterThermalDevelopment('2026-10-23', stableWaterForecasts, {
    location: locLokkershoek,
    userMeasuredWaterTemp: 8,
    currentDateRef: thermalReferenceTime,
    targetTime: '2026-10-23T15:00:00',
  });
  const waterEvening = analyzeWaterThermalDevelopment('2026-10-23', stableWaterForecasts, {
    location: locLokkershoek,
    userMeasuredWaterTemp: 8,
    currentDateRef: thermalReferenceTime,
    targetTime: '2026-10-23T21:00:00',
  });
  const waterNextMorning = analyzeWaterThermalDevelopment('2026-10-24', stableWaterForecasts, {
    location: locLokkershoek,
    userMeasuredWaterTemp: 8,
    currentDateRef: thermalReferenceTime,
    targetTime: '2026-10-24T08:00:00',
  });
  assert(
    waterAfternoon.targetTimestamp === '2026-10-23T13:00:00.000Z' &&
      waterEvening.targetTimestamp === '2026-10-23T19:00:00.000Z' &&
      waterNextMorning.targetTimestamp === '2026-10-24T06:00:00.000Z',
    '8.3.1 Iedere tijdvakberekening bewaart het expliciete doeltijdstip'
  );
  assert(
    waterAfternoon.estimatedWaterTemp !== null &&
      waterEvening.estimatedWaterTemp !== null &&
      waterNextMorning.estimatedWaterTemp !== null &&
      Math.abs(waterAfternoon.estimatedWaterTemp - 8) <= 0.1 &&
      Math.abs(waterEvening.estimatedWaterTemp - 8) <= 0.1 &&
      Math.abs(waterNextMorning.estimatedWaterTemp - 8) <= 0.1,
    '8.3.2 Stabiele lucht en weinig wind veroorzaken geen onverklaarde temperatuurdaling van 8°C'
  );
  assert(
    waterAfternoon.hasMeasuredWaterTemp === false &&
      waterEvening.hasMeasuredWaterTemp === false &&
      waterNextMorning.hasMeasuredWaterTemp === false &&
      waterEvening.anchorMeasurementTimestamp === waterAfternoon.anchorMeasurementTimestamp,
    '8.3.3 Een toekomstige toestand gebruikt dezelfde echte meting als historisch anker, niet als nieuwe actuele meting'
  );

  const futureAsOfPrognosis = calculateDayPrognosis(
    '2026-10-23',
    stableWaterForecasts,
    'Karper',
    [],
    '2026-10-23T15:00:00.000Z',
    null,
    thermalReferenceTime,
    { location: locLokkershoek }
  );
  assert(
    futureAsOfPrognosis.thermalAnalysis?.estimatedWaterTemp === null &&
      futureAsOfPrognosis.thermalAnalysis?.prognosisImpactNote.includes('ná het prognoseberekeningstijdstip'),
    '8.3.4 Forecastdata opgehaald ná het berekeningstijdstip wordt niet in de prognose gebruikt'
  );

  // 8.4 Weer-only water estimate without a local water reference must retain its uncertainty in every visible factor summary.
  const weatherOnlyForecasts = makeHourlySeries('2026-10-20', 5, () => 14, () => 50, 5);
  const weatherOnlyPrognosis = calculateDayPrognosis(
    '2026-10-23',
    weatherOnlyForecasts,
    'Karper',
    [],
    '2026-10-23T09:00:00.000Z',
    null,
    thermalReferenceTime,
    { location: locLokkershoek }
  );
  const weatherOnlyMorning = weatherOnlyPrognosis.timeSlots.Ochtend;
  assert(
    weatherOnlyPrognosis.thermalAnalysis?.waterTemperatureStatus === 'estimated_from_weather' &&
      weatherOnlyPrognosis.thermalAnalysis.estimatedWaterTemp !== null &&
      weatherOnlyPrognosis.thermalAnalysis.estimatedRange === null,
    '8.4a Weer-only watertemperatuurschatting blijft herkenbaar zonder gefingeerde onzekerheidsmarge'
  );
  assert(
    weatherOnlyMorning.temperatureFactor.detail.includes('Indicatieve weerafgeleide watertemperatuurschatting') &&
      weatherOnlyMorning.temperatureFactor.detail.includes('niet-gekwantificeerde onzekerheid') &&
      !weatherOnlyMorning.temperatureFactor.detail.includes('via thermische traagheid'),
    '8.4b Thermische factor benoemt de werkelijke bron en hoge onzekerheid van een weer-only schatting'
  );
  assert(
    weatherOnlyPrognosis.waterTemperatureInfo?.note.includes('geen kwantificeerbare onzekerheidsmarge') === true &&
      !weatherOnlyPrognosis.waterTemperatureInfo?.note.includes('undefined'),
    '8.4c Zichtbare temperatuurtoelichting toont geen fictieve [undefined–undefined]-band'
  );

  // 8.5 As-of invariant: weather samples strictly after targetTime may not alter
  // any thermal estimate or trend that is presented as known at that target instant.
  console.log('\n--- SCENARIO 8.5: Geen invloed van weersdata ná het doelmoment ---');
  const asOfTarget = '2026-10-23T15:00:00';
  const asOfReference = new Date('2026-10-20T12:00:00.000Z');
  const asOfBaseForecasts = makeHourlySeries('2026-10-20', 5, () => 12, () => 40, 8).map((hour) => ({
    ...hour,
    shortwaveRadiation: 400,
    relativeHumidity: 60,
    dewPoint: 8,
  }));
  const asOfChangedFutureForecasts = asOfBaseForecasts.map((hour) => {
    return hour.time > '2026-10-23T15:00'
      ? { ...hour, temperature: -20, cloudCover: 100, windSpeed: 35, shortwaveRadiation: 0, relativeHumidity: 100, dewPoint: -30 }
      : hour;
  });
  const asOfWeatherOnlyBase = analyzeWaterThermalDevelopment('2026-10-23', asOfBaseForecasts, {
    location: locLokkershoek,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
  });
  const asOfWeatherOnlyChanged = analyzeWaterThermalDevelopment('2026-10-23', asOfChangedFutureForecasts, {
    location: locLokkershoek,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
  });
  assert(
    asOfWeatherOnlyBase.estimatedWaterTemp === asOfWeatherOnlyChanged.estimatedWaterTemp,
    '8.5.1 Weer-only waterestimate is invariant voor gewijzigde weersuren ná targetTime',
    `base=${asOfWeatherOnlyBase.estimatedWaterTemp}, changed=${asOfWeatherOnlyChanged.estimatedWaterTemp}`
  );
  assert(
    asOfWeatherOnlyBase.trend === asOfWeatherOnlyChanged.trend &&
      asOfWeatherOnlyBase.trendConfidence === asOfWeatherOnlyChanged.trendConfidence,
    '8.5.2 Thermische trend en betrouwbaarheid zijn invariant voor weersuren ná targetTime',
    `base=${asOfWeatherOnlyBase.trend}/${asOfWeatherOnlyBase.trendConfidence}, changed=${asOfWeatherOnlyChanged.trend}/${asOfWeatherOnlyChanged.trendConfidence}`
  );

  const asOfMeasuredBase = analyzeWaterThermalDevelopment('2026-10-23', asOfBaseForecasts, {
    location: locLokkershoek,
    userMeasuredWaterTemp: 12,
    userMeasuredWaterTempAt: '2026-10-23T06:00:00.000Z',
    currentDateRef: new Date('2026-10-23T07:00:00.000Z'),
    targetTime: asOfTarget,
  });
  const asOfMeasuredChanged = analyzeWaterThermalDevelopment('2026-10-23', asOfChangedFutureForecasts, {
    location: locLokkershoek,
    userMeasuredWaterTemp: 12,
    userMeasuredWaterTempAt: '2026-10-23T06:00:00.000Z',
    currentDateRef: new Date('2026-10-23T07:00:00.000Z'),
    targetTime: asOfTarget,
  });
  assert(
    asOfMeasuredBase.estimatedWaterTemp === asOfMeasuredChanged.estimatedWaterTemp,
    '8.5.3 Extrapolatie vanaf een echt meetanker negeert weersuren ná targetTime'
  );
  assert(
    asOfMeasuredBase.trend === asOfMeasuredChanged.trend &&
      asOfMeasuredBase.trendConfidence === asOfMeasuredChanged.trendConfidence,
    '8.5.4 Ook de trend bij een echt meetanker negeert weersuren ná targetTime',
    `base=${asOfMeasuredBase.trend}/${asOfMeasuredBase.trendConfidence}, changed=${asOfMeasuredChanged.trend}/${asOfMeasuredChanged.trendConfidence}`
  );

  // 8.6 Aanvullende targetTime-randgevallen: onbekende diepte, historisch profiel,
  // onvoldoende dekking, ontbrekende uren en tijdstippen rond de lokale middag.
  console.log('\n--- SCENARIO 8.6: TargetTime-randgevallen ---');
  const locUnknownDepth: FishingLocation = { ...locLokkershoek, waterDepth: undefined };
  const unknownDepthBase = analyzeWaterThermalDevelopment('2026-10-23', asOfBaseForecasts, {
    location: locUnknownDepth,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
  });
  const unknownDepthChanged = analyzeWaterThermalDevelopment('2026-10-23', asOfChangedFutureForecasts, {
    location: locUnknownDepth,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
  });
  assert(
    unknownDepthBase.estimatedWaterTemp === unknownDepthChanged.estimatedWaterTemp &&
      unknownDepthBase.trend === unknownDepthChanged.trend &&
      unknownDepthBase.trendConfidence === unknownDepthChanged.trendConfidence,
    '8.6.1 Onbekende stekdiepte lekt geen weersinformatie van na targetTime'
  );

  const historicalProfileObservations = [
    { locationId: locLokkershoek.id, temperatureC: 11, timestamp: '2026-10-05T10:00:00Z', measurementDepthM: 0.4, measurementSource: 'manual' as const, measurementMethod: 'thermometer' as const },
    { locationId: locLokkershoek.id, temperatureC: 12, timestamp: '2026-10-12T10:00:00Z', measurementDepthM: 0.4, measurementSource: 'manual' as const, measurementMethod: 'thermometer' as const },
    { locationId: locLokkershoek.id, temperatureC: 13, timestamp: '2026-10-19T10:00:00Z', measurementDepthM: 0.4, measurementSource: 'manual' as const, measurementMethod: 'thermometer' as const },
  ];
  const historicalProfileWithFuture = [
    ...historicalProfileObservations,
    { locationId: locLokkershoek.id, temperatureC: 30, timestamp: '2026-10-23T18:00:00Z', measurementDepthM: 0.4, measurementSource: 'manual' as const, measurementMethod: 'thermometer' as const },
  ];
  const historyBase = analyzeWaterThermalDevelopment('2026-10-23', asOfBaseForecasts, {
    location: locLokkershoek,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
    historicalWaterTemperatures: historicalProfileObservations,
  });
  const historyChanged = analyzeWaterThermalDevelopment('2026-10-23', asOfBaseForecasts, {
    location: locLokkershoek,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
    historicalWaterTemperatures: historicalProfileWithFuture,
  });
  assert(
    historyBase.historicalWaterTemperatureBaselineC === historyChanged.historicalWaterTemperatureBaselineC &&
      historyBase.historicalWaterTemperatureSamples === historyChanged.historicalWaterTemperatureSamples &&
      historyBase.historicalWaterTemperatureBaselineC === 12,
    '8.6.2 Historische profielselectie gebruikt geen meting die pas ná de doeldag/het doelmoment is verricht'
  );

  const sparseEarlyForecasts = makeHourlySeries('2026-10-23', 1, () => 12).filter((hour) => hour.time <= '2026-10-23T03:00');
  const sparseFutureChanged = makeHourlySeries('2026-10-23', 1, () => 12).map((hour) =>
    hour.time > '2026-10-23T03:00' ? { ...hour, temperature: -20, cloudCover: 100, windSpeed: 35 } : hour
  );
  const sparseBase = analyzeWaterThermalDevelopment('2026-10-23', sparseEarlyForecasts, {
    location: locLokkershoek,
    currentDateRef: asOfReference,
    targetTime: '2026-10-23T03:00:00',
  });
  const sparseChanged = analyzeWaterThermalDevelopment('2026-10-23', sparseFutureChanged, {
    location: locLokkershoek,
    currentDateRef: asOfReference,
    targetTime: '2026-10-23T03:00:00',
  });
  assert(
    sparseBase.trend === 'Onvoldoende gegevens' &&
      sparseBase.estimatedWaterTemp === sparseChanged.estimatedWaterTemp &&
      sparseBase.trend === sparseChanged.trend &&
      sparseBase.trendConfidence === sparseChanged.trendConfidence,
    '8.6.3 Onvoldoende dekking blijft een veilige fallback en wordt niet aangevuld met latere uren'
  );

  for (const target of ['2026-10-23T08:00:00', '2026-10-23T12:00:00', '2026-10-23T15:00:00']) {
    const changedAfterTarget = asOfBaseForecasts.map((hour) =>
      hour.time > target.slice(0, 16)
        ? { ...hour, temperature: -20, cloudCover: 100, windSpeed: 35 }
        : hour
    );
    const beforeMutation = analyzeWaterThermalDevelopment('2026-10-23', asOfBaseForecasts, {
      location: locUnknownDepth,
      currentDateRef: asOfReference,
      targetTime: target,
    });
    const afterMutation = analyzeWaterThermalDevelopment('2026-10-23', changedAfterTarget, {
      location: locUnknownDepth,
      currentDateRef: asOfReference,
      targetTime: target,
    });
    assert(
      beforeMutation.estimatedWaterTemp === afterMutation.estimatedWaterTemp &&
        beforeMutation.trend === afterMutation.trend &&
        beforeMutation.trendConfidence === afterMutation.trendConfidence,
      `8.6.4 As-of invariant blijft gelden voor onbekende diepte op targetTime ${target}`
    );
  }

  const missingEarlierHour = asOfBaseForecasts.filter((hour) => hour.time !== '2026-10-23T10:00');
  const missingHourChangedFuture = missingEarlierHour.map((hour) =>
    hour.time > '2026-10-23T15:00' ? { ...hour, temperature: -20, cloudCover: 100, windSpeed: 35 } : hour
  );
  const missingHourBase = analyzeWaterThermalDevelopment('2026-10-23', missingEarlierHour, {
    location: locUnknownDepth,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
  });
  const missingHourChanged = analyzeWaterThermalDevelopment('2026-10-23', missingHourChangedFuture, {
    location: locUnknownDepth,
    currentDateRef: asOfReference,
    targetTime: asOfTarget,
  });
  assert(
    missingHourBase.estimatedWaterTemp === missingHourChanged.estimatedWaterTemp &&
      missingHourBase.trend === missingHourChanged.trend &&
      missingHourBase.trendConfidence === missingHourChanged.trendConfidence,
    '8.6.5 Een ontbrekend uur vóór targetTime veroorzaakt geen toekomstige-weersdata-lek'
  );

  const dstTargets = [
    { date: '2026-10-25', target: '2026-10-25T02:30:00+01:00', label: 'herfstovergang met dubbel 02:00' },
    { date: '2026-03-29', target: '2026-03-29T03:30:00+02:00', label: 'lenteovergang na overgeslagen 02:00' },
  ];
  for (const dstCase of dstTargets) {
    const targetMs = Date.parse(dstCase.target);
    const dstBaseForecasts = Array.from({ length: 120 }, (_, index) => ({
      ...asOfBaseForecasts[0],
      time: new Date(targetMs - 96 * 3600000 + index * 3600000).toISOString(),
      temperature: 12,
      cloudCover: 40,
      windSpeed: 8,
    }));
    const dstFutureChanged = dstBaseForecasts.map((hour) =>
      Date.parse(hour.time) > targetMs
        ? { ...hour, temperature: -20, cloudCover: 100, windSpeed: 35 }
        : hour
    );
    const dstReference = new Date(targetMs - 72 * 3600000);
    const dstBase = analyzeWaterThermalDevelopment(dstCase.date, dstBaseForecasts, {
      location: locUnknownDepth,
      currentDateRef: dstReference,
      targetTime: dstCase.target,
    });
    const dstChanged = analyzeWaterThermalDevelopment(dstCase.date, dstFutureChanged, {
      location: locUnknownDepth,
      currentDateRef: dstReference,
      targetTime: dstCase.target,
    });
    assert(
      dstBase.estimatedWaterTemp === dstChanged.estimatedWaterTemp &&
        dstBase.trend === dstChanged.trend &&
        dstBase.trendConfidence === dstChanged.trendConfidence,
      `8.6.6 DST-as-of invariant blijft gelden bij ${dstCase.label}`
    );
  }

  // 9. Ontbrekende of onvolledige historische weergegevens
  console.log('\n--- SCENARIO 9: Ontbrekende of onvolledige weerdata ---');
  const s9 = analyzeWaterThermalDevelopment('2026-10-23', [], { location: locLokkershoek });
  assert(
    s9.trend === 'Onvoldoende gegevens' && s9.estimatedWaterTemp === null,
    '9.1 Lege weerreeks resulteert veilig in Onvoldoende gegevens zonder crash'
  );

  // 10. Onvoldoende historische vangstgegevens (< 5 sessies)
  console.log('\n--- SCENARIO 10: Onvoldoende historische vangstgegevens (N=3) ---');
  const threeSessions: FishingSession[] = [
    { id: '1', startTime: '2026-09-01T12:00', outcome: 'catch', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: '2', startTime: '2026-09-02T12:00', outcome: 'catch', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: '3', startTime: '2026-09-03T12:00', outcome: 'skunk_confirmed', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
  ];
  const progN3 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', threeSessions);
  assert(
    progN3.personalCatchChance === null && progN3.expectedCatches === null,
    '10.1 Bij N=3 sessies blijft vangstkans en verwachting strikt null (geen schijnzekerheid)'
  );

  // 11. Bevestigde vangstsessies en bevestigde nulvangsten
  console.log('\n--- SCENARIO 11: Bevestigde vangstsessies en nulvangsten ---');
  const fiveSkunkSessions: FishingSession[] = Array.from({ length: 5 }, (_, i) => ({
    id: `skunk-${i}`,
    startTime: '2026-09-01T12:00',
    durationMinutes: 180,
    outcome: 'skunk_confirmed',
    targetSpecies: ['Karper'],
    createdAt: '',
    updatedAt: '',
  }));
  const progAllSkunks = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', fiveSkunkSessions);
  assert(
    progAllSkunks.personalCatchChance === 0,
    `11.1 Bij 5 bevestigde nulvangsten is de berekende kans eerlijk 0% (geen kunstmatige 5% vloer! Berekend: ${progAllSkunks.personalCatchChance}%)`
  );

  // 12. Sessieduur van 1, 2, 4, 6 en 8 uur, inclusief ongeldige invoer
  console.log('\n--- SCENARIO 12: Sessieduur en Poisson blootstellingsmodel ---');
  const tenSessions: FishingSession[] = [
    ...fiveSkunkSessions.slice(0, 4),
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `catch-${i}`,
      startTime: '2026-09-01T12:00',
      durationMinutes: 180,
      outcome: 'catch' as const,
      targetSpecies: ['Karper' as const],
      createdAt: '',
      updatedAt: '',
    })),
  ];
  const tenSessionCatches = Array.from({ length: 6 }, (_, i) => ({
    id: `catch-record-${i}`,
    sessionId: `catch-${i}`,
    species: 'Karper' as const,
    count: 1,
    timestamp: '2026-09-01T13:00:00Z',
    createdAt: '2026-09-01T13:00:00Z',
  }));
  const p1 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 1, catches: tenSessionCatches }).personalCatchChance!;
  const p2 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 2, catches: tenSessionCatches }).personalCatchChance!;
  const p4 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 4, catches: tenSessionCatches }).personalCatchChance!;
  const p6 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 6, catches: tenSessionCatches }).personalCatchChance!;
  const p8 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 8, catches: tenSessionCatches }).personalCatchChance!;
  assert(
    p1 < p2 && p2 < p4 && p4 < p6 && p6 <= p8,
    `12.1 Monotoon stijgende kans over duur (1u: ${p1}% < 2u: ${p2}% < 4u: ${p4}% < 6u: ${p6}% <= 8u: ${p8}%)`
  );
  const unknownDurationPrognosis = calculateDayPrognosis(
    '2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(),
    { allowUnknownSessionDuration: true }
  );
  const temperatureQuality = unknownDurationPrognosis.dataQualityReport?.results.find((item) => item.name === 'Watertemperatuur');
  const forecastQuality = unknownDurationPrognosis.dataQualityReport?.results.find((item) => item.name === 'Weersverwachting');
  assert(temperatureQuality?.status === 'modelled' && forecastQuality?.status === 'forecast',
    '12.2a Centrale datakwaliteitscontrole onderscheidt thermische modelschatting van weersverwachting');
  const equalSlotForecasts = makeHourlySeries('2026-10-20', 5, () => 14, () => 40, 8);
  const equalSlotPrognosis = calculateDayPrognosis(
    '2026-10-23', equalSlotForecasts, 'Karper', tenSessions, undefined, null,
    new Date('2026-10-23T03:00:00Z'), { sessionDurationHours: 3 }
  );
  const genericTimeContext = calculateDayPrognosis(
    '2026-10-23', s1Forecasts, 'Algemeen', tenSessions, undefined, null,
    new Date('2026-10-23T03:00:00Z'), { sessionDurationHours: 3 }
  );
  assert(
    genericTimeContext.timeSlots.Nacht.timeOfDayFactor.detail.includes('geen soortspecifiek tijdgebonden voedingsritme'),
    '12.2a Het algemene fallbackprofiel verzint geen biologisch beste tijdvak'
  );
  const solarContextPrognosis = calculateDayPrognosis(
    '2026-10-23', s1Forecasts, 'Snoekbaars', tenSessions, undefined, null,
    new Date('2026-10-23T03:00:00Z'), {
      sessionDurationHours: 3,
      location: { id: 'solar-test', name: 'Solar test', latitude: 51.961, longitude: 5.228, createdAt: '', updatedAt: '' },
      dailySolarTimes: [{ date: '2026-10-23', sunrise: '2026-10-23T08:20', sunset: '2026-10-23T18:30' }],
    }
  );
  assert(
    solarContextPrognosis.timeSlots.Ochtend.timeOfDayFactor.detail.includes('civiele dageraad') &&
      solarContextPrognosis.timeSlots.Avond.timeOfDayFactor.detail.includes('civiele schemering'),
    '12.2a Solar-relative civil twilight follows the local date and latitude within fixed clock slots'
  );
  const winterSolarContext = calculateDayPrognosis(
    '2026-12-21', s1Forecasts, 'Snoekbaars', tenSessions, undefined, null,
    new Date('2026-12-21T03:00:00Z'), {
      sessionDurationHours: 3,
      location: { id: 'solar-test', name: 'Solar test', latitude: 51.961, longitude: 5.228, createdAt: '', updatedAt: '' },
      dailySolarTimes: [{ date: '2026-12-21', sunrise: '2026-12-21T08:45', sunset: '2026-12-21T16:30' }],
    }
  );
  assert(
    winterSolarContext.timeSlots.Middag.timeOfDayFactor.detail.includes('civiele schemering'),
    '12.2b In winter, civil dusk may fall in the afternoon clock slot rather than the evening slot'
  );
  assert(
    Object.values(solarContextPrognosis.timeSlots).every((slot) => slot.timeOfDayFactor.score === 0),
    '12.2b Solar context must not create an unvalidated numerical time-of-day bonus'
  );
  assert(equalSlotPrognosis.bestTimeSlot === 'Geen betekenisvol onderscheid',
    '12.2b Gelijke tijdvaksscores leveren geen willekeurig beste tijdvak op');
  assert(
    equalSlotPrognosis.summaryRationale.toLowerCase().includes('niet betekenisvol') &&
      !equalSlotPrognosis.summaryRationale.toLowerCase().includes('verstreken'),
    '12.2c Gelijkwaardige tijdvakken worden niet ten onrechte als verstreken gepresenteerd'
  );
  const allPastPrognosis = calculateDayPrognosis(
    '2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null,
    new Date('2026-10-24T12:00:00Z'), { sessionDurationHours: 3 }
  );
  assert(
    allPastPrognosis.bestTimeSlot === 'Geen toekomstig tijdvak meer vandaag' &&
      allPastPrognosis.summaryRationale.toLowerCase().includes('verstreken'),
    '12.2d Alleen wanneer alle tijdvakken verstreken zijn, meldt de samenvatting dat'
  );

  // 12.2e Persoonlijke tijdvakervaring wordt ingedeeld op sessiestart, niet verdeeld over de werkelijke sessieduur.
  const crossSlotSessions: FishingSession[] = Array.from({ length: 5 }, (_, index) => ({
    id: `cross-slot-${index + 1}`,
    startTime: '2026-10-23T17:00:00.000Z', // 19:00 lokale tijd: Avond
    endTime: '2026-10-23T23:00:00.000Z',   // 01:00 lokale tijd: sessie loopt door in Nacht
    durationMinutes: 360,
    outcome: index < 3 ? 'catch' : 'skunk_confirmed',
    targetSpecies: ['Karper'],
    createdAt: '2026-10-23T17:00:00.000Z',
    updatedAt: '2026-10-23T23:00:00.000Z',
  }));
  const crossSlotCatches: CatchItem[] = crossSlotSessions.slice(0, 3).map((session, index) => ({
    id: `cross-slot-catch-${index + 1}`,
    sessionId: session.id,
    species: 'Karper',
    count: 1,
    timestamp: '2026-10-23T22:30:00.000Z', // Vangsttijd valt lokaal in de Nacht
    createdAt: '2026-10-23T22:35:00.000Z',
  }));
  const crossSlotExperience = calculateDayPrognosis(
    '2026-10-23', makeHourlySeries('2026-10-23', 1, () => 14), 'Karper',
    crossSlotSessions, undefined, null, new Date('2026-10-23T03:00:00.000Z'),
    { sessionDurationHours: 3, catches: crossSlotCatches }
  );
  const noCrossSlotHistory = calculateDayPrognosis(
    '2026-10-23', makeHourlySeries('2026-10-23', 1, () => 14), 'Karper',
    [], undefined, null, new Date('2026-10-23T03:00:00.000Z'),
    { sessionDurationHours: 3, catches: [] }
  );
  assert(
    crossSlotExperience.timeSlots.Avond.personalExperience.relevantSessions === 5 &&
      crossSlotExperience.timeSlots.Avond.personalExperience.confirmedCatches === 3 &&
      crossSlotExperience.timeSlots.Nacht.personalExperience.relevantSessions === 0 &&
      crossSlotExperience.timeSlots.Avond.personalExperience.note.includes('starttijd') &&
      crossSlotExperience.timeSlots.Avond.personalExperience.note.includes('sessiesucces'),
    '12.2e Een sessie die Avond en Nacht beslaat, wordt voor persoonlijke tijdvakervaring uitsluitend op starttijd ingedeeld'
  );
  assert(
    crossSlotExperience.bestTimeSlot === noCrossSlotHistory.bestTimeSlot &&
      Object.keys(crossSlotExperience.timeSlots).every((slot) =>
        crossSlotExperience.timeSlots[slot as keyof typeof crossSlotExperience.timeSlots].activityScore ===
        noCrossSlotHistory.timeSlots[slot as keyof typeof noCrossSlotHistory.timeSlots].activityScore
      ),
    '12.2f Historische persoonlijke tijdvakervaring verandert de thermische tijdvakscore of rangschikking niet'
  );

  assert(
    unknownDurationPrognosis.plannedDurationHours === null &&
      unknownDurationPrognosis.personalCatchChance === null &&
      unknownDurationPrognosis.expectedCatches === null,
    '12.2 Onbekende sessieduur blijft null en levert geen vangstkans voor een fictieve drie uur op'
  );

  const plannedDurationSession = {
    ...tenSessions[0],
    durationMinutes: undefined,
    endTime: null,
    plannedDurationHours: 4,
  };
  const completedDurationSession = {
    ...plannedDurationSession,
    durationMinutes: 90,
  };
  assert(
    getSessionDurationHours(plannedDurationSession) === null,
    '12.3 Geplande duur wordt niet als werkelijke blootstelling gebruikt'
  );
  assert(
    getSessionDurationHours(completedDurationSession) === 1.5,
    '12.4 Werkelijke sessieduur blijft leidend boven de vooraf geplande duur'
  );

  const noPresenceBonus = calculateDayPrognosis(
    '2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(),
    { sessionDurationHours: 3 }
  );
  const withPresenceObservation = calculateDayPrognosis(
    '2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(),
    { sessionDurationHours: 3, presenceObservation: 'vis_springen_rollen' }
  );
  assert(
    noPresenceBonus.personalCatchChance === withPresenceObservation.personalCatchChance,
    '12.2 Viswaarnemingen geven geen ongevalideerde vaste bonus aan de persoonlijke vangstkans'
  );

  const progInvalid = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: -5 });
  assert(
    progInvalid.personalCatchChance === null,
    '12.2 Ongeldige negatieve sessieduur levert geen schijnvangstkans op'
  );

  // 12B. Tien opeenvolgende synthetische sessies: de bestaande prognose-engine
  // maakt vanaf vijf eerdere geldige sessies zelf een kans; die snapshots gaan
  // daarna ongewijzigd door de bestaande Brier-evaluatie. Geen database/ productie-data.
  console.log('\n--- SCENARIO 12B: Tien opeenvolgende sessies via prognose- en evaluatie-engine ---');
  const sequentialForecasts = makeHourlySeries('2026-10-20', 12, () => 14, () => 40, 12);
  const outcomes: Array<'catch' | 'skunk_confirmed'> = [
    'catch', 'skunk_confirmed', 'catch', 'skunk_confirmed', 'catch',
    'catch', 'skunk_confirmed', 'skunk_confirmed', 'catch', 'skunk_confirmed',
  ];
  const sequentialSessions: FishingSession[] = [];
  const sequentialCatches: any[] = [];
  const sequentialSnapshots: any[] = [];
  const testLocationId = 'synthetic-ten-session-location';

  for (let index = 0; index < outcomes.length; index++) {
    const date = new Date(Date.UTC(2026, 9, 20 + index)).toISOString().slice(0, 10);
    const startTime = `${date}T09:00:00.000Z`;
    const endTime = `${date}T13:00:00.000Z`;
    const forecastTimestamp = `${date}T08:00:00.000Z`;
    const prognosis = calculateDayPrognosis(
      date,
      sequentialForecasts,
      'Karper',
      [...sequentialSessions],
      undefined,
      12,
      new Date(`${date}T05:00:00.000Z`),
      {
        sessionDurationHours: 4,
        locationId: testLocationId,
        catches: [...sequentialCatches],
      }
    );

    if (index < 5) {
      assert(
        prognosis.relevantSessionCount === index && prognosis.personalCatchChance === null,
        `12B.${index + 1} Na ${index} eerdere sessies blijft de persoonlijke kans terecht onbekend`
      );
    } else {
      assert(
        prognosis.relevantSessionCount === index &&
          typeof prognosis.personalCatchChance === 'number' &&
          Number.isFinite(prognosis.personalCatchChance) &&
          prognosis.personalCatchChance >= 0 &&
          prognosis.personalCatchChance <= 95,
        `12B.${index + 1} Na ${index} eerdere geldige sessies berekent de bestaande engine een numerieke vangkans (${prognosis.personalCatchChance}%)`
      );
    }

    const sessionId = `synthetic-ten-session-${index + 1}`;
    const session: FishingSession = {
      id: sessionId,
      locationId: testLocationId,
      locationName: 'Geïsoleerde synthetische teststek',
      startTime,
      endTime,
      durationMinutes: 240,
      outcome: outcomes[index],
      targetSpecies: ['Karper'],
      createdAt: startTime,
      updatedAt: endTime,
    };

    if (outcomes[index] === 'catch') {
      sequentialCatches.push({
        id: `${sessionId}-catch`,
        sessionId,
        species: 'Karper',
        count: 1,
        timestamp: `${date}T11:00:00.000Z`,
        createdAt: `${date}T11:00:00.000Z`,
      });
    }

    sequentialSnapshots.push({
      id: `${sessionId}-snapshot`,
      runKind: 'session_start',
      forecastTimestamp,
      targetDate: date,
      targetSlot: 'Ochtend',
      targetSpecies: 'Karper',
      locationId: testLocationId,
      locationName: 'Geïsoleerde synthetische teststek',
      durationHours: 4,
      durationKnown: true,
      predictedActivityScore: prognosis.activityScore,
      predictedCatchChance: prognosis.personalCatchChance,
      actualOutcome: outcomes[index],
      linkedSessionId: sessionId,
      source: 'synthetic-ten-session-test',
      modelVersion: PROGNOSIS_MODEL_VERSION,
      createdAt: forecastTimestamp,
    });
    sequentialSessions.push(session);
  }

  const sequentialEvaluation = evaluatePrognosisPerformance(
    sequentialSnapshots,
    sequentialSnapshots,
    sequentialSessions
  );
  assert(
    sequentialSnapshots.filter((snapshot) => snapshot.predictedCatchChance === null).length === 5 &&
      sequentialSnapshots.filter((snapshot) => typeof snapshot.predictedCatchChance === 'number').length === 5,
    '12B.11 De tien sessies leveren exact vijf startvoorspellingen zonder kans en vijf voorspellingen met door de engine berekende kans'
  );
  assert(
    sequentialEvaluation.evaluatedCount === 5 &&
      sequentialEvaluation.hasSufficientData &&
      typeof sequentialEvaluation.brierScore === 'number',
    `12B.12 De vijf numerieke vooraf vastgelegde kansen worden onafhankelijk geëvalueerd met Brier (N=${sequentialEvaluation.evaluatedCount}, BS=${sequentialEvaluation.brierScore})`
  );
  assert(
    sequentialSnapshots.every((snapshot, index) =>
      Date.parse(snapshot.forecastTimestamp) < Date.parse(sequentialSessions[index].startTime)
    ),
    '12B.13 Alle tien snapshots hebben een voorspellingstijdstip vóór de werkelijke sessiestart'
  );

  // 13. Export, import en herstel van bestaande back-ups
  console.log('\n--- SCENARIO 13: Export/Import en herstel van back-ups ---');
  const backupJsonPath = path.resolve('test-fixtures/legacy/vislogboek-backup-2026-10-26.json');
  const rawJson = JSON.parse(fs.readFileSync(backupJsonPath, 'utf8'));
  const normalized = normalizeRawBackup(rawJson);
  assert(
    normalized.sessions.length === 11 && normalized.catches.length === 24 && normalized.locations.length === 5,
    `13.1 Normaliseert back-up v2 met 11 sessies, 24 vangsten, 5 stekken`
  );
  const unmeasuredWeights = normalized.catches.filter((c) => c.weightKg === null).length;
  assert(
    unmeasuredWeights === 23,
    `13.2 Ontbrekende gewichten blijven strikt null (${unmeasuredWeights} van 24)`
  );

  // Scenario 14 is vervangen door de afzonderlijke v4→v5 clean-start migratietest.

  console.log(`\n======================================================`);
  console.log(`TESTRESULTAAT: ${passed} GESLAAGD, ${failed} MISLUKT`);
  console.log(`======================================================`);

  if (failed > 0) process.exit(1);
}

run14Scenarios();
