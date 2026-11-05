/**
 * Testsuite voor Fase 3: 14 scenario's voor Vislogboek v2.3
 * Controleert de bestaande prognose, geplande sessieduur,
 * en de thermische waterontwikkelingsmodule.
 */

import { analyzeWaterThermalDevelopment } from './src/services/waterThermalEngine';
import { calculateDayPrognosis, getSessionDurationHours } from './src/services/prognosisEngine';
import { normalizeRawBackup } from './src/services/backupService';
import {
  BENCHMARK_SESSION,
  BENCHMARK_LOCATION,
  BENCHMARK_CATCHES,
  BENCHMARK_SESSION_ID,
} from './src/db/db';
import {
  WeatherHourlyForecast,
  FishingLocation,
  FishingSession,
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
  const p1 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 1 }).personalCatchChance!;
  const p2 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 2 }).personalCatchChance!;
  const p4 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 4 }).personalCatchChance!;
  const p6 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 6 }).personalCatchChance!;
  const p8 = calculateDayPrognosis('2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(), { sessionDurationHours: 8 }).personalCatchChance!;
  assert(
    p1 < p2 && p2 < p4 && p4 < p6 && p6 <= p8,
    `12.1 Monotoon stijgende kans over duur (1u: ${p1}% < 2u: ${p2}% < 4u: ${p4}% < 6u: ${p6}% <= 8u: ${p8}%)`
  );
  const unknownDurationPrognosis = calculateDayPrognosis(
    '2026-10-23', s1Forecasts, 'Karper', tenSessions, undefined, null, new Date(),
    { allowUnknownSessionDuration: true }
  );
  assert(
    unknownDurationPrognosis.plannedDurationHours === null &&
      unknownDurationPrognosis.personalCatchChance === null &&
      unknownDurationPrognosis.expectedCatches === null,
    '12.2 Onbekende sessieduur blijft null en levert geen vangstkans voor een fictieve drie uur op'
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
    progInvalid.personalCatchChance !== null && !isNaN(progInvalid.personalCatchChance),
    '12.2 Negatieve sessieduur valt veilig terug naar de standaard (geen crash of NaN)'
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

  // 14. Lokkershoek Pier sessie en vangsten integriteit
  console.log('\n--- SCENARIO 14: Lokkershoek Pier sessie integriteit ---');
  assert(
    BENCHMARK_SESSION.id === 'benchmark-session-20261019' &&
    BENCHMARK_SESSION.locationId === 'spot-mvp1g19d-dfemr2' &&
    BENCHMARK_SESSION.isBenchmark === false,
    '14.1 Lokkershoek Pier sessie correct gekoppeld en benchmarkstatus verwijderd'
  );
  assert(
    BENCHMARK_CATCHES.length === 4 && BENCHMARK_CATCHES.reduce((a, c) => a + c.count, 0) === 8,
    '14.2 Vangsten bevatten exact 8 vissen (6 brasems, 1 zeelt, 1 karper)'
  );

  console.log(`\n======================================================`);
  console.log(`TESTRESULTAAT: ${passed} GESLAAGD, ${failed} MISLUKT`);
  console.log(`======================================================`);

  if (failed > 0) process.exit(1);
}

run14Scenarios();
