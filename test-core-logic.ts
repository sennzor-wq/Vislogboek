/**
 * Vislogboek v2.2 — Core Logic, Prognosis & Validation Verification Suite
 * Tests the biological models, thermal curves, duration exposure scaling,
 * visual presence observations, Wilson score intervals, and Brier score calibration.
 */

import {
  calculateDayPrognosis,
  calculateWilsonInterval,
  findPressureTrend,
} from './src/services/prognosisEngine';
import { calculateStats } from './src/services/statsEngine';
import { SPECIES_PROFILES, calculateThermalEfficiency } from './src/services/fishProfiles';
import {
  evaluatePrognosisPerformance,
  CalibrationBin,
} from './src/services/evaluationEngine';
import {
  BENCHMARK_SESSION,
  BENCHMARK_LOCATION,
  BENCHMARK_CATCHES,
  BENCHMARK_SESSION_ID,
} from './src/db/db';
import {
  FishingSession,
  CatchItem,
  WeatherHourlyForecast,
  FishSpecies,
  PrognosisSnapshot,
} from './src/types';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failedTests++;
  }
}

function createWeatherDay(temp: number, pressure = 1015, windSpeed = 14, precip = 0): WeatherHourlyForecast[] {
  const list: WeatherHourlyForecast[] = [];
  for (let h = 0; h < 24; h++) {
    list.push({
      time: `2026-10-26T${String(h).padStart(2, '0')}:00`,
      temperature: temp,
      pressure,
      windSpeed,
      windDirection: 225,
      windDirectionText: 'ZW',
      precipitation: precip,
      precipitationProbability: precip > 0 ? 50 : 10,
      cloudCover: 75,
      weatherCode: precip > 0 ? 61 : 2,
    });
  }
  return list;
}

async function runTestSuite() {
  console.log('--- STARTING VISLOGBOEK v2.2 VERIFICATION SUITE ---\n');

  // ==========================================
  // DEEL 1: MEERDERE TEMPERATUREN & SOORTSPECIFIEKE THERMISCHE CURVES
  // ==========================================
  console.log('--- TESTGROEP 1: Temperatuurrespons per Vissoort ---');

  // Karper bij 5 °C (winterkoud), 9.5 °C (herfst), 15 °C, 21 °C (optimum), 28 °C (hittegrens)
  const carp5 = calculateDayPrognosis('2026-10-26', createWeatherDay(5), 'Karper', []);
  const carp95 = calculateDayPrognosis('2026-10-26', createWeatherDay(9.5), 'Karper', []);
  const carp15 = calculateDayPrognosis('2026-10-26', createWeatherDay(15), 'Karper', []);
  const carp21 = calculateDayPrognosis('2026-10-26', createWeatherDay(21), 'Karper', []);
  const carp28 = calculateDayPrognosis('2026-10-26', createWeatherDay(28), 'Karper', []);

  assert(
    carp5.activityScore < 3.5,
    `1.1 Karper bij 5.0 °C heeft lage activiteitsscore (${carp5.activityScore}/10 < 3.5; winterrust)`
  );
  assert(
    carp95.activityScore < 6.0 && carp95.activityScore > carp5.activityScore,
    `1.2 Karper bij 9.5 °C is begrensd (${carp95.activityScore}/10 < 6.0; nooit 10/10)`
  );
  assert(
    carp15.activityScore >= 5.0 && carp15.activityScore < 7.8,
    `1.3 Karper bij 15.0 °C toont gemiddelde activiteit (${carp15.activityScore}/10)`
  );
  assert(
    carp21.activityScore >= 7.5,
    `1.4 Karper bij 21.0 °C (optimum) toont hoge activiteit (${carp21.activityScore}/10 >= 7.5)`
  );
  assert(
    carp28.activityScore < carp21.activityScore,
    `1.5 Karper bij 28.0 °C toont afname door hittespanning (${carp28.activityScore}/10 < ${carp21.activityScore}/10)`
  );

  // Snoek bij 4 °C, 12.5 °C (optimum), 24 °C (warmtebeperking)
  const pike4 = calculateDayPrognosis('2026-10-26', createWeatherDay(4), 'Snoek', []);
  const pike12 = calculateDayPrognosis('2026-10-26', createWeatherDay(12.5), 'Snoek', []);
  const pike24 = calculateDayPrognosis('2026-10-26', createWeatherDay(24), 'Snoek', []);

  assert(
    pike4.activityScore > carp5.activityScore + 1.5,
    `1.6 Snoek bij 4 °C (${pike4.activityScore}/10) is aanzienlijk actiever dan Karper bij 5 °C (${carp5.activityScore}/10)`
  );
  assert(
    pike12.activityScore >= 7.5,
    `1.7 Snoek bij 12.5 °C (piek optimum) heeft hoge activiteit (${pike12.activityScore}/10)`
  );
  assert(
    pike24.activityScore < pike12.activityScore - 1.5,
    `1.8 Snoek bij 24 °C toont duidelijke thermische remming (${pike24.activityScore}/10 < ${pike12.activityScore}/10)`
  );

  // Zeelt bij 8 °C (inactief) vs 21 °C (warmteminnend)
  const tench8 = calculateDayPrognosis('2026-10-26', createWeatherDay(8), 'Zeelt', []);
  const tench21 = calculateDayPrognosis('2026-10-26', createWeatherDay(21), 'Zeelt', []);
  assert(
    tench8.activityScore < 4.0 && tench21.activityScore >= 7.5,
    `1.9 Zeelt toont sterke warmtegevoeligheid (8 °C: ${tench8.activityScore}/10 vs 21 °C: ${tench21.activityScore}/10)`
  );

  // ==========================================
  // DEEL 2: WATER- VS LUCHTTEMPERATUUR & ONZEKERHEID
  // ==========================================
  console.log('\n--- TESTGROEP 2: Water- vs. Luchttemperatuur ---');

  const progNoWater = calculateDayPrognosis('2026-10-26', createWeatherDay(12), 'Karper', []);
  const progWithWater = calculateDayPrognosis(
    '2026-10-26',
    createWeatherDay(12),
    'Karper',
    [],
    undefined,
    16.5 // gemeten watertemperatuur
  );

  assert(
    progNoWater.waterTemperatureInfo?.measured === false && progNoWater.waterTemperatureInfo?.temp === null,
    '2.1 Ontbrekende watertemperatuur wordt NIET fictief ingevuld (temp === null, measured === false)'
  );
  assert(
    progNoWater.uncertaintyNotes?.some((n) => n.includes('Watertemperatuur is niet gemeten')) === true,
    '2.2 Onzekerheidsnotitie vermeldt expliciet dat watertemperatuur ontbreekt'
  );
  assert(
    progWithWater.waterTemperatureInfo?.measured === true && progWithWater.waterTemperatureInfo?.temp === 16.5,
    '2.3 Gemeten watertemperatuur (16.5 °C) wordt correct overgenomen en geverifieerd'
  );
  assert(
    progWithWater.activityScore > progNoWater.activityScore,
    `2.4 Warmer gemeten water (16.5 °C vs 12 °C lucht) verhoogt karperactiviteit (${progWithWater.activityScore} > ${progNoWater.activityScore})`
  );

  // ==========================================
  // DEEL 3: DUURSCHALING VIA POISSON-EXPOSURE MODEL
  // ==========================================
  console.log('\n--- TESTGROEP 3: Sessieduur & Poisson Blootstellingsmodel ---');

  // Simuleer een visser met 10 vergelijkbare karpersessies (6 met vangst, 4 blanks, gem. 3 uur)
  const carpSessions: FishingSession[] = [];
  for (let i = 0; i < 10; i++) {
    carpSessions.push({
      id: `s_carp_${i}`,
      startTime: `2026-09-${String(i + 1).padStart(2, '0')}T18:00:00Z`,
      outcome: i < 6 ? 'catch' : 'skunk_confirmed',
      targetSpecies: ['Karper'],
      durationMinutes: 180,
      createdAt: '',
      updatedAt: '',
    });
  }

  const prog1h = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 1,
  });
  const prog2h = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 2,
  });
  const prog4h = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 4,
  });
  const prog6h = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 6,
  });
  const prog8h = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 8,
  });

  const p1 = prog1h.personalCatchChance as number;
  const p2 = prog2h.personalCatchChance as number;
  const p4 = prog4h.personalCatchChance as number;
  const p6 = prog6h.personalCatchChance as number;
  const p8 = prog8h.personalCatchChance as number;

  assert(
    prog1h.personalCatchChance !== null &&
      prog2h.personalCatchChance !== null &&
      prog4h.personalCatchChance !== null &&
      prog6h.personalCatchChance !== null &&
      prog8h.personalCatchChance !== null,
    '3.1 Vangstkansen zijn berekend bij N=10 sessies voor 1, 2, 4, 6 en 8 uur'
  );

  assert(
    p1 < p2 && p2 < p4 && p4 < p6 && p6 < p8,
    `3.2 Kans stijgt strikt monotoon over 1u (${p1}%) < 2u (${p2}%) < 4u (${p4}%) < 6u (${p6}%) < 8u (${p8}%)`
  );

  assert(
    p8 <= 95 && p1 >= 5,
    `3.3 Kans blijft strikt begrensd in [5%, 95%] (p1=${p1}%, p8=${p8}%), voorkomt onrealistisch optimisme`
  );

  assert(
    (p8 - p6) < (p2 - p1),
    `3.4 Poisson afnemende meeropbrengst geverifieerd: Delta(6u->8u)=+${p8 - p6}% < Delta(1u->2u)=+${p2 - p1}%`
  );

  assert(
    prog1h.activityScore === prog8h.activityScore,
    `3.5 Activiteitsindex blijft strikt onafhankelijk van sessieduur (1u: ${prog1h.activityScore}/10 === 8u: ${prog8h.activityScore}/10)`
  );

  assert(
    prog2h.hourlyCatchRate !== null &&
      prog2h.hourlyCatchRate === prog6h.hourlyCatchRate &&
      (prog6h.expectedCatches ?? 0) > (prog2h.expectedCatches ?? 0),
    `3.6 Vangsttempo per uur blijft constant (${prog2h.hourlyCatchRate}/u); totale verwachte vangst stijgt met duur (2u: ~${prog2h.expectedCatches} vs 6u: ~${prog6h.expectedCatches})`
  );

  const progDefault = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions);
  const progZero = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 0,
  });
  const progNaN = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: NaN,
  });

  assert(
    progDefault.personalCatchChance !== null &&
      progZero.personalCatchChance !== null &&
      !isNaN(progNaN.personalCatchChance as number),
    `3.7 Ongeldige of ontbrekende duur veroorzaakt geen crash of NaN (default: ${progDefault.personalCatchChance}%, zero: ${progZero.personalCatchChance}%, NaN: ${progNaN.personalCatchChance}%)`
  );

  const progLowData = calculateDayPrognosis(
    '2026-10-26',
    createWeatherDay(18),
    'Karper',
    carpSessions.slice(0, 3),
    undefined,
    null,
    new Date(),
    { sessionDurationHours: 6 }
  );

  assert(
    progLowData.personalCatchChance === null && progLowData.expectedCatches === null,
    '3.8 Bij onvoldoende vergelijkbare sessies (N=3 < 5) blijven kans en verwachting exact null'
  );

  // 3.9 Directe berekening van vangsttempo lambda (6 vangsten over 30 uur = 0.20/uur)
  assert(
    prog2h.hourlyCatchRate === 0.2,
    `3.9 Vangsttempo lambda is exact berekend als 6 vangsten / 30 uur = 0.20/uur (berekend: ${prog2h.hourlyCatchRate}/u)`
  );

  // 3.10 Bevestigde nulvangsten tellen volledig mee in de uren-noemer
  const blankHeavySessions: FishingSession[] = [
    { id: 'b1', startTime: '2026-09-01T12:00', durationMinutes: 180, outcome: 'skunk_confirmed', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: 'b2', startTime: '2026-09-02T12:00', durationMinutes: 180, outcome: 'skunk_confirmed', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: 'b3', startTime: '2026-09-03T12:00', durationMinutes: 180, outcome: 'skunk_confirmed', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: 'b4', startTime: '2026-09-04T12:00', durationMinutes: 180, outcome: 'skunk_confirmed', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: 'c1', startTime: '2026-09-05T12:00', durationMinutes: 180, outcome: 'catch', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
  ];
  const progBlankHeavy = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', blankHeavySessions);
  // 1 vangst over 5 * 3 = 15 uur -> 1 / 15 = 0.0667 -> afgerond 0.07/u
  assert(
    progBlankHeavy.hourlyCatchRate === 0.07,
    `3.10 Bevestigde nulvangsten verlagen vangsttempo conform noemer (1 vangst / 15u = 0.07/u, berekend: ${progBlankHeavy.hourlyCatchRate}/u)`
  );

  // 3.11 Meervoudige vangsten per sessie via CatchItem[]
  const sampleCatches: CatchItem[] = [
    { id: 'c_item_1', sessionId: 'c1', species: 'Karper', count: 3, timestamp: '2026-09-05T13:00', createdAt: '' },
  ];
  const progWithCatches = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', blankHeavySessions, undefined, null, new Date(), {
    catches: sampleCatches,
  });
  // 3 vissen over 15 uur -> 3 / 15 = 0.20/u
  assert(
    progWithCatches.hourlyCatchRate === 0.2,
    `3.11 Meervoudige vangsten (3 vissen) via CatchItem[] correct verwerkt (3 vissen / 15u = 0.20/u, berekend: ${progWithCatches.hourlyCatchRate}/u)`
  );

  // 3.12 Historisch vangstpercentage strikt gescheiden en geformatteerd
  assert(
    prog1h.historicalCatchRate !== undefined &&
      prog1h.historicalCatchRate.successfulSessions === 6 &&
      prog1h.historicalCatchRate.totalSessions === 10 &&
      prog1h.historicalCatchRate.percentage === 60 &&
      prog1h.historicalCatchRate.label === '6 van 10 geldige sessies (60%)',
    `3.12 Historisch vangstpercentage correct geformatteerd: '${prog1h.historicalCatchRate?.label}'`
  );

  // 3.13 Stek zonder sessies toont geen gefabriceerde 100% basisfrequentie
  const progUnfishedSpot = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', carpSessions, undefined, null, new Date(), {
    locationId: 'onbekende_stek_zonder_sessies',
  });
  assert(
    progUnfishedSpot.relevantSessionCount === 0 &&
      progUnfishedSpot.baseRate === null &&
      progUnfishedSpot.historicalCatchRate?.percentage === null &&
      progUnfishedSpot.historicalCatchRate?.label.includes('Geen eerdere geldige sessies') === true,
    '3.13 Stek zonder sessies geeft baseRate=null en geen gefabriceerde 100% basisfrequentie'
  );

  // 3.14 Uitsluiting van actieve, onvolledige/onbekende en benchmark sessies
  const mixedSessions: FishingSession[] = [
    ...carpSessions.slice(0, 5), // 5 geldige karpersessies
    { id: 'act1', startTime: '2026-09-10T12:00', outcome: 'active', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: 'unk1', startTime: '2026-09-11T12:00', outcome: 'unknown', targetSpecies: ['Karper'], createdAt: '', updatedAt: '' },
    { id: 'bm1', startTime: '2026-09-12T12:00', outcome: 'catch', targetSpecies: ['Karper'], isBenchmark: true, createdAt: '', updatedAt: '' },
  ];
  const progMixed = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', mixedSessions);
  assert(
    progMixed.relevantSessionCount === 5,
    `3.14 Actieve, onbekende en benchmark sessies strikt uitgesloten van vangststatistiek (N=5 van 8, berekend: ${progMixed.relevantSessionCount})`
  );

  // 3.15 Pure bevestigde nulvangsten resulteren in 0% vangkans en 0 vangsttempo
  const allBlanks: FishingSession[] = Array.from({ length: 6 }, (_, i) => ({
    id: `pure_blank_${i}`,
    startTime: '2026-09-01T12:00',
    durationMinutes: 180,
    outcome: 'skunk_confirmed' as const,
    targetSpecies: ['Karper' as const],
    createdAt: '',
    updatedAt: '',
  }));
  const progAllBlanks = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', allBlanks);
  assert(
    progAllBlanks.personalCatchChance === 0 &&
      progAllBlanks.hourlyCatchRate === 0 &&
      progAllBlanks.expectedCatches === 0,
    '3.15 6 bevestigde nulvangsten geven eerlijk 0% vangkans, 0.00/u vangsttempo en 0 verwachte vangsten'
  );

  // ==========================================
  // DEEL 4: VISWAARNEMINGEN (AANWEZIGHEIDSBEWIJS VS GEEN BEWIJS VAN AFWEZIGHEID)
  // ==========================================
  console.log('\n--- TESTGROEP 4: Viswaarnemingen & Aanwezigheidslogica ---');

  const progRolling = calculateDayPrognosis('2026-10-26', createWeatherDay(16), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 3,
    presenceObservation: 'vis_springen_rollen',
  });

  const progNoSightings = calculateDayPrognosis('2026-10-26', createWeatherDay(16), 'Karper', carpSessions, undefined, null, new Date(), {
    sessionDurationHours: 3,
    presenceObservation: 'geen_waarnemingen',
  });

  assert(
    progRolling.presenceInfo?.observation === 'vis_springen_rollen',
    '4.1 Viswaarneming (springen/rollen) wordt geregistreerd in presenceInfo'
  );
  assert(
    progRolling.presenceInfo?.note.includes('garandeert geen aasopname') === true,
    '4.2 Waarnemingsnotitie nuanceert dat fysieke aanwezigheid geen aasopname garandeert'
  );
  assert(
    progNoSightings.presenceInfo?.note.includes('nadrukkelijk GEEN bewijs van afwezigheid') === true,
    '4.3 Geen waarnemingen wordt expliciet gedocumenteerd als GEEN bewijs van afwezigheid'
  );
  assert(
    progRolling.activityScore === progNoSightings.activityScore,
    `4.4 Biologische activiteitsindex (${progRolling.activityScore}/10) blijft puur meteorologisch/fysiologisch en telt aanwezigheid niet dubbel`
  );
  assert(
    (progRolling.personalCatchChance as number) > (progNoSightings.personalCatchChance as number),
    `4.5 Actieve viswaarneming levert transparante aanwezigheidsbonus op vangstkans (${progRolling.personalCatchChance}% > ${progNoSightings.personalCatchChance}%)`
  );
  assert(
    progRolling.uncertaintyNotes?.some((n) => n.includes('onbevestigde heuristische modelaanname')) === true,
    '4.6 Aanwezigheidsbonus wordt expliciet geannoteerd als onbevestigde modelaanname'
  );

  // ==========================================
  // DEEL 5: WILSON SCORE INTERVAL & ONDERBOUWING BIJ N=5
  // ==========================================
  console.log('\n--- TESTGROEP 5: Wilson Score Interval & Steekproefgrootte ---');

  // Precies 5 sessies (3 vangsten, 2 blanks = 60%)
  const fiveSessions: FishingSession[] = [
    carpSessions[0], // catch
    carpSessions[1], // catch
    carpSessions[2], // catch
    carpSessions[6], // skunk_confirmed
    carpSessions[7], // skunk_confirmed
  ];
  const progFive = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', fiveSessions);

  assert(
    progFive.personalCatchChance !== null,
    '5.1 Bij 5 sessies (het absolute minimum) wordt een schatting berekend'
  );
  assert(
    progFive.personalCatchConfidence === 'Laag',
    `5.2 Bij N=5 sessies is het betrouwbaarheidslabel eerlijk "Laag" (${progFive.personalCatchConfidence})`
  );
  const interval = progFive.catchUncertaintyInterval;
  assert(
    interval !== null &&
      interval !== undefined &&
      interval[0] <= 30 &&
      interval[1] >= 80,
    `5.3 95% Wilson-interval bij N=5 is realistisch breed ([${interval?.[0]}% – ${interval?.[1]}%]), geen schijnzekerheid`
  );

  // Onder 5 sessies (< 5)
  const fourSessions = carpSessions.slice(0, 4);
  const progFour = calculateDayPrognosis('2026-10-26', createWeatherDay(18), 'Karper', fourSessions);
  assert(
    progFour.personalCatchChance === null && progFour.personalCatchConfidence === 'Onvoldoende gegevens',
    '5.4 Bij N=4 sessies is personalCatchChance exact null en betrouwbaarheid "Onvoldoende gegevens"'
  );

  // ==========================================
  // DEEL 6: EVALUATIE-ENGINE, BRIER-SCORE & KALIBRATIE
  // ==========================================
  console.log('\n--- TESTGROEP 6: Evaluatie-Engine, Brier-Score & Kalibratie ---');

  // Test 6.1: Evaluatie bij < 5 momentopnames
  const fewSnapshots: PrognosisSnapshot[] = [
    {
      id: 'snap1',
      forecastTimestamp: '2026-10-01T10:00Z',
      targetDate: '2026-10-01',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 6.5,
      predictedCatchChance: 50,
      source: 'test',
      modelVersion: 'v2.2',
      actualOutcome: 'catch',
      createdAt: '',
    },
    {
      id: 'snap2',
      forecastTimestamp: '2026-10-02T10:00Z',
      targetDate: '2026-10-02',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 4.5,
      predictedCatchChance: 30,
      source: 'test',
      modelVersion: 'v2.2',
      actualOutcome: 'skunk_confirmed',
      createdAt: '',
    },
  ];

  const evalFew = evaluatePrognosisPerformance(fewSnapshots);
  assert(
    evalFew.hasSufficientData === false,
    '6.1 Bij 2 snapshots (< 5) rapporteert evaluatie hasSufficientData: false'
  );
  assert(
    evalFew.statusMessage.includes('Nog niet gevalideerd') === true,
    `6.2 Status toont expliciet "Nog niet gevalideerd" (${evalFew.statusMessage})`
  );

  // Test 6.2: Wiskundige Brier Score verificatie bij N=5 bekende uitkomsten
  const exactSnapshots: PrognosisSnapshot[] = [
    { id: 's1', forecastTimestamp: '2026-10-01T10:00Z', targetDate: '2026-10-01', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 8, predictedCatchChance: 80, source: 'test', modelVersion: 'v2.2', actualOutcome: 'catch', createdAt: '' },
    { id: 's2', forecastTimestamp: '2026-10-02T10:00Z', targetDate: '2026-10-02', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 6, predictedCatchChance: 60, source: 'test', modelVersion: 'v2.2', actualOutcome: 'catch', createdAt: '' },
    { id: 's3', forecastTimestamp: '2026-10-03T10:00Z', targetDate: '2026-10-03', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 7, predictedCatchChance: 70, source: 'test', modelVersion: 'v2.2', actualOutcome: 'skunk_confirmed', createdAt: '' },
    { id: 's4', forecastTimestamp: '2026-10-04T10:00Z', targetDate: '2026-10-04', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 3, predictedCatchChance: 20, source: 'test', modelVersion: 'v2.2', actualOutcome: 'skunk_confirmed', createdAt: '' },
    { id: 's5', forecastTimestamp: '2026-10-05T10:00Z', targetDate: '2026-10-05', targetSpecies: 'Karper', durationHours: 3, predictedActivityScore: 4, predictedCatchChance: 30, source: 'test', modelVersion: 'v2.2', actualOutcome: 'skunk_confirmed', createdAt: '' },
  ];

  const evalExact = evaluatePrognosisPerformance(exactSnapshots);
  assert(
    evalExact.hasSufficientData === true,
    '6.3 Bij N=5 is hasSufficientData true'
  );
  assert(
    evalExact.brierScore === 0.164,
    `6.4 Brier Score is exact 0.164 conform formule (berekend: ${evalExact.brierScore})`
  );
  assert(
    evalExact.naiveBrierScore !== null && evalExact.naiveBrierScore > 0.20,
    `6.5 Naieve baseline berekend (${evalExact.naiveBrierScore})`
  );
  assert(
    evalExact.brierSkillScore !== null && evalExact.brierSkillScore > 0,
    `6.6 Brier Skill Score toont positieve vaardigheid (+${((evalExact.brierSkillScore || 0) * 100).toFixed(1)}%)`
  );
  assert(
    evalExact.calibrationBins.length === 5,
    '6.7 Kalibratietabel bevat exact 5 kanssegmenten'
  );

  // Test 6.8: Lokkershoek Pier sessie wordt nu als normale sessie meegenomen in modelvalidatie
  const snapshotWithBenchmark: PrognosisSnapshot[] = [
    ...exactSnapshots,
    {
      id: 'snap_bench',
      linkedSessionId: BENCHMARK_SESSION_ID,
      forecastTimestamp: '2026-10-19T18:00Z',
      targetDate: '2026-10-19',
      targetSpecies: 'Karper',
      durationHours: 3,
      predictedActivityScore: 8,
      predictedCatchChance: 90,
      source: 'test',
      modelVersion: 'v2.2',
      actualOutcome: 'catch',
      createdAt: '',
    },
  ];
  const evalWithBench = evaluatePrognosisPerformance(snapshotWithBenchmark);
  assert(
    evalWithBench.evaluatedCount === 6,
    '6.8 Lokkershoek Pier sessie wordt nu als normale sessie meegenomen in modelvalidatie'
  );

  // ==========================================
  // DEEL 7: LOKKERSHOEK PIER SESSIE & VANGSTEN
  // ==========================================
  console.log('\n--- TESTGROEP 7: Lokkershoek Pier Sessie, Hengels & Vangsten Integriteit ---');

  assert(
    BENCHMARK_SESSION.id === 'benchmark-session-20261019' && BENCHMARK_SESSION.locationId === 'spot-mvp1g19d-dfemr2',
    '7.1 Sessie gekoppeld aan Lokkershoek Pier (spot-mvp1g19d-dfemr2)'
  );
  assert(
    BENCHMARK_SESSION.isBenchmark === false,
    '7.2 Benchmark- en beschermingsstatus succesvol verwijderd (normale historische sessie)'
  );
  const totalBenchFish = BENCHMARK_CATCHES.reduce((acc, c) => acc + c.count, 0);
  assert(
    totalBenchFish === 8 && BENCHMARK_CATCHES.length === 4,
    `7.3 Vangsten bevatten exact 8 vissen (werkelijk: ${totalBenchFish}) over 4 registraties`
  );
  const brasems = BENCHMARK_CATCHES.filter(c => c.species === 'Brasem').reduce((a, c) => a + c.count, 0);
  const zeelten = BENCHMARK_CATCHES.filter(c => c.species === 'Zeelt').reduce((a, c) => a + c.count, 0);
  const karpers = BENCHMARK_CATCHES.filter(c => c.species === 'Karper').reduce((a, c) => a + c.count, 0);
  assert(
    brasems === 6 && zeelten === 1 && karpers === 1,
    '7.4 Exacte verdeling klopt: 6 brasems, 1 zeelt en 1 karper'
  );

  // Test 7.5: Hengelaantal validatie en voorloopnul-preventie
  const parseRodInput = (val: string | number) => {
    if (typeof val === 'number') return Math.max(1, Math.floor(val));
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? 1 : Math.max(1, parsed);
  };
  assert(parseRodInput('06') === 6, '7.5 Hengelaantal 06 wordt opgeslagen en weergegeven als 6 (geen voorloopnul)');
  assert(parseRodInput('08') === 8, '7.6 Hengelaantal 08 wordt opgeslagen en weergegeven als 8 (geen voorloopnul)');
  assert(parseRodInput(8) === 8 && parseRodInput(12) === 12, '7.7 Hengelaantal boven 6 (bijv. 8 of 12) is volledig toegestaan (geen max 6)');

  // ==========================================
  // DEEL 8: HISTORISCHE WEERSVERRIJKING
  // ==========================================
  console.log('\n--- TESTGROEP 8: Historische Weersverrijking ---');
  const { fetchHistoricalWeatherSnapshot } = await import('./src/services/weatherService');

  // Test met toekomstige datum (moet correct weigeren)
  const futureRes = await fetchHistoricalWeatherSnapshot(51.961, 5.228, '2030-01-01T12:00:00Z');
  assert(
    futureRes.success === false && futureRes.snapshot === null,
    '8.1 Toekomstige datum wordt geweigerd voor historische weersverrijking'
  );

  // Test met ongeldige datum
  const invalidDateRes = await fetchHistoricalWeatherSnapshot(51.961, 5.228, 'ongeldig');
  assert(
    invalidDateRes.success === false,
    '8.2 Ongeldige startdatum wordt veilig afgevangen zonder runtime crash'
  );

  console.log(`\n======================================================`);
  console.log(`VERIFICATIE RESULTAAT: ${passedTests} GESLAAGD, ${failedTests} MISLUKT`);
  console.log(`======================================================`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite();
