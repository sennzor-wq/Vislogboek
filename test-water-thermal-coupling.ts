/**
 * Testsuite: Koppeling Watertemperatuurschatting & Biologische Karperprognose
 * Controleert de 5 vereisten uit de gebruikersopdracht:
 * 1. Gebruik van geschatte watertemperatuur voor biologische prognose bij ontbrekende meting.
 * 2. Gemeten temperatuur geldt voor actuele situatie; oude meting dicteert niet de toekomst.
 * 3. Waterdiepte per stek en thermische analyse worden correct doorgegeven.
 * 4. Verklarende teksten stellen niet dat lage luchttemperatuur automatisch leidt tot winterrust.
 * 5. Strikt onderscheid tussen gemeten en geschatte waarden en daadwerkelijke invloed op activiteitsscore.
 */

import { analyzeWaterThermalDevelopment } from './src/services/waterThermalEngine';
import { calculateDayPrognosis } from './src/services/prognosisEngine';
import { calculateThermalEfficiency, SPECIES_PROFILES } from './src/services/fishProfiles';
import {
  WeatherHourlyForecast,
  FishingLocation,
  FishingSession,
} from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
    failed++;
  }
}

function makeMultiDayForecasts(
  startDateStr: string,
  daysCount: number,
  tempFn: (dayIdx: number, hour: number) => number,
  cloudCover = 40,
  windSpeed = 12
): WeatherHourlyForecast[] {
  const result: WeatherHourlyForecast[] = [];
  const base = new Date(startDateStr);

  for (let d = 0; d < daysCount; d++) {
    const curDate = new Date(base.getTime() + d * 86400000);
    const dateStr = curDate.toISOString().slice(0, 10);

    for (let h = 0; h < 24; h++) {
      result.push({
        time: `${dateStr}T${String(h).padStart(2, '0')}:00`,
        temperature: tempFn(d, h),
        pressure: 1015,
        windSpeed,
        windDirection: 225,
        windDirectionText: 'ZW',
        precipitation: 0,
        precipitationProbability: 10,
        cloudCover,
        weatherCode: cloudCover > 70 ? 3 : 1,
      });
    }
  }
  return result;
}

async function runTestSuite() {
  console.log('=== TESTSUITE: KOPPELING WATERTEMPERATUUR & BIOLOGISCHE PROGNOSE ===\n');

  const locLokkershoek: FishingLocation = {
    id: 'spot-lokkershoek',
    name: 'Lokkershoek Plas',
    waterDepth: 2.5,
    waterType: 'Plas/Zandafgraving',
    createdAt: '',
    updatedAt: '',
  };

  const locOndiep: FishingLocation = {
    id: 'spot-polder-ondiep',
    name: 'Ondiepe Vaart',
    waterDepth: 1.0,
    waterType: 'Polder',
    createdAt: '',
    updatedAt: '',
  };

  const locDiep: FishingLocation = {
    id: 'spot-zandgat-diep',
    name: 'Diepe Zandafgraving',
    waterDepth: 5.5,
    waterType: 'Plas/Zandafgraving',
    createdAt: '',
    updatedAt: '',
  };

  // =========================================================================
  // DEEL 1: GESCHATTE WATERTEMPERATUUR BEÏNVLOEDT BIOLOGISCHE SCORE (GEEN METING)
  // =========================================================================
  console.log('--- TEST 1: Geschatte watertemperatuur beïnvloedt biologische activiteitsscore ---');

  // Scenario: 3 warme dagen van 18 °C gevolgd door dag 3 waar luchttemperatuur plots daalt naar 4 °C.
  // Zonder thermische koppeling zou karper direct naar 4 °C (winterrust / ~2.5 score) gaan.
  // Met thermische traagheid blijft watertemperatuur ~14 °C.
  const coldSnapForecasts = makeMultiDayForecasts('2026-10-20', 5, (d) => {
    return d < 3 ? 18 : 4; // d=0,1,2 = 18°C; d=3 (doeldag 2026-10-23) = 4°C lucht
  });

  const progColdSnap = calculateDayPrognosis(
    '2026-10-23',
    coldSnapForecasts,
    'Karper',
    [],
    undefined,
    null, // Geen meting
    new Date('2026-10-23T12:00:00'),
    { location: locLokkershoek }
  );

  assert(
    progColdSnap.thermalAnalysis?.estimatedWaterTemp !== null,
    '1.1 Modelschatting watertemperatuur is beschikbaar'
  );
  assert(
    (progColdSnap.thermalAnalysis?.estimatedWaterTemp ?? 0) > 10.0 &&
      (progColdSnap.thermalAnalysis?.estimatedWaterTemp ?? 0) < 16.0,
    `1.2 Geschatte watertemperatuur (${progColdSnap.thermalAnalysis?.estimatedWaterTemp} °C) dempt de koude lucht (4 °C) via thermische traagheid`
  );
  assert(
    progColdSnap.activityScore >= 4.0,
    `1.3 Karperactiviteit (${progColdSnap.activityScore}/10) weerspiegelt trage watermassa en raakt NIET in winterrust door koude lucht`
  );

  // Vergelijk met een hypothetische situatie waarin water echt 4 °C is (bijv. hartje winter)
  const winterForecasts = makeMultiDayForecasts('2026-01-10', 5, () => 4);
  const progRealWinter = calculateDayPrognosis(
    '2026-01-13',
    winterForecasts,
    'Karper',
    [],
    undefined,
    null,
    new Date('2026-01-13T12:00:00'),
    { location: locLokkershoek }
  );

  assert(
    progColdSnap.activityScore > progRealWinter.activityScore + 1.0,
    `1.4 Karper in warm water tijdens koudedip (${progColdSnap.activityScore}/10) is aanzienlijk actiever dan in daadwerkelijk afgekoeld winterwater (${progRealWinter.activityScore}/10)`
  );

  // =========================================================================
  // DEEL 2: GEMETEN VS GESCHATTE WATERTEMPERATUUR ONDERSCHEID
  // =========================================================================
  console.log('\n--- TEST 2: Onderscheid tussen gemeten en geschatte watertemperatuur ---');

  const progUnmeasured = calculateDayPrognosis(
    '2026-10-23',
    coldSnapForecasts,
    'Karper',
    [],
    undefined,
    null,
    new Date('2026-10-23T12:00:00'),
    { location: locLokkershoek }
  );

  const progMeasured = calculateDayPrognosis(
    '2026-10-23',
    coldSnapForecasts,
    'Karper',
    [],
    undefined,
    17.5, // Geverifieerde stekmeting
    new Date('2026-10-23T12:00:00'),
    { location: locLokkershoek }
  );

  assert(
    progUnmeasured.waterTemperatureInfo?.measured === false &&
      progUnmeasured.waterTemperatureInfo?.temp === null &&
      progUnmeasured.thermalAnalysis?.hasMeasuredWaterTemp === false,
    '2.1 Niet-gemeten situatie heeft measured=false, temp=null en hasMeasuredWaterTemp=false'
  );
  assert(
    progMeasured.waterTemperatureInfo?.measured === true &&
      progMeasured.waterTemperatureInfo?.temp === 17.5 &&
      progMeasured.thermalAnalysis?.hasMeasuredWaterTemp === true &&
      progMeasured.thermalAnalysis?.measuredWaterTemp === 17.5,
    '2.2 Gemeten situatie heeft measured=true, temp=17.5 en hasMeasuredWaterTemp=true'
  );
  assert(
    progMeasured.activityScore > progUnmeasured.activityScore,
    `2.3 Gemeten watertemperatuur (17.5 °C) leidt tot hogere activiteit (${progMeasured.activityScore}/10) dan de modelschatting (${progUnmeasured.activityScore}/10)`
  );

  // =========================================================================
  // DEEL 3: ACTUELE SITUATIE VS TOEKOMSTIGE PROGNOSE (OUDE METING REGEERT NIET DE TOEKOMST)
  // =========================================================================
  console.log('\n--- TEST 3: Oude meting regeert niet automatisch de toekomstige prognose ---');

  // Vandaag is 2026-10-20. Gebruiker voert een meting in van 19.0 °C.
  const todayRef = new Date('2026-10-20T12:00:00');

  // Prognose voor vandaag (actuele situatie)
  const progToday = calculateDayPrognosis(
    '2026-10-20',
    coldSnapForecasts,
    'Karper',
    [],
    undefined,
    19.0,
    todayRef,
    { location: locLokkershoek }
  );

  // Prognose voor 4 dagen vooruit (2026-10-24), waar koufront actief is
  const progDay4Ahead = calculateDayPrognosis(
    '2026-10-24',
    coldSnapForecasts,
    'Karper',
    [],
    undefined,
    19.0, // De actuele meting van vandaag
    todayRef, // Referentiedatum is vandaag
    { location: locLokkershoek }
  );

  assert(
    progToday.waterTemperatureInfo?.measured === true &&
      progToday.thermalAnalysis?.hasMeasuredWaterTemp === true,
    '3.1 Actuele situatie (vandaag) gebruikt de directe meting (measured=true)'
  );
  assert(
    progDay4Ahead.waterTemperatureInfo?.measured === false &&
      progDay4Ahead.waterTemperatureInfo?.temp === null &&
      progDay4Ahead.thermalAnalysis?.hasMeasuredWaterTemp === false,
    '3.2 Toekomstige dag (+4 dagen) gebruikt de oude meting NIET als vaste meting (measured=false, temp=null)'
  );
  assert(
    progDay4Ahead.thermalAnalysis?.estimatedWaterTemp !== null &&
      (progDay4Ahead.thermalAnalysis?.estimatedWaterTemp ?? 99) < 14.0,
    `3.3 Toekomstige dag gebruikt modelschatting (~${progDay4Ahead.thermalAnalysis?.estimatedWaterTemp} °C) op basis van het koufront i.p.v. de oude 19 °C`
  );
  assert(
    progDay4Ahead.activityScore < progToday.activityScore,
    `3.4 Toekomstige activiteitsscore (${progDay4Ahead.activityScore}/10) daalt door naderende afkoeling t.o.v. vandaag (${progToday.activityScore}/10)`
  );

  // =========================================================================
  // DEEL 4: WATERDIEPTE PER STEK WORDT CORRECT DOOR BEREKENING MEGENOMEN
  // =========================================================================
  console.log('\n--- TEST 4: Waterdiepte per stek beïnvloedt watertemperatuur en biologische score ---');

  // Vergelijk ondiep (1.0m, polder) met diep (5.5m, zandgat) tijdens de koudedip op 2026-10-23
  const progShallow = calculateDayPrognosis(
    '2026-10-23',
    coldSnapForecasts,
    'Karper',
    [],
    undefined,
    null,
    new Date('2026-10-23T12:00:00'),
    { location: locOndiep }
  );

  const progDeep = calculateDayPrognosis(
    '2026-10-23',
    coldSnapForecasts,
    'Karper',
    [],
    undefined,
    null,
    new Date('2026-10-23T12:00:00'),
    { location: locDiep }
  );

  assert(
    progShallow.thermalAnalysis?.dataPointsAvailable.waterDepthMeters === 1.0 &&
      progDeep.thermalAnalysis?.dataPointsAvailable.waterDepthMeters === 5.5,
    '4.1 Waterdiepte wordt per stek correct doorgegeven (1.0 m vs 5.5 m)'
  );
  assert(
    (progDeep.thermalAnalysis?.estimatedWaterTemp ?? 0) > (progShallow.thermalAnalysis?.estimatedWaterTemp ?? 0),
    `4.2 Diep water behoudt warmte beter (${progDeep.thermalAnalysis?.estimatedWaterTemp} °C) dan ondiep water (${progShallow.thermalAnalysis?.estimatedWaterTemp} °C)`
  );
  assert(
    progDeep.activityScore >= progShallow.activityScore,
    `4.3 Karperactiviteit in diep water (${progDeep.activityScore}/10) is hoger/gelijker dan in snel afgekoeld ondiep water (${progShallow.activityScore}/10)`
  );

  // =========================================================================
  // DEEL 5: VERKLARENDE TEKSTEN OMTRENT WINTERRUST & LUCHTTEMPERATUUR
  // =========================================================================
  console.log('\n--- TEST 5: Verklarende teksten verwerpen winterrust door enkel koude lucht ---');

  assert(
    (progColdSnap.uncertaintyNotes ?? []).some(
      (n) => n.includes('Watertemperatuur is niet gemeten') && n.includes('niet automatisch in winterrust door een tijdelijke daling van de luchttemperatuur')
    ),
    '5.1 Onzekerheidsnotitie vermeldt expliciet dat karper niet automatisch in winterrust raakt door koude lucht'
  );

  const slotMorning = progColdSnap.timeSlots['Ochtend'];
  assert(
    slotMorning.temperatureFactor.title === 'Temperatuur & Metabolisme' &&
      slotMorning.temperatureFactor.detail.includes('via thermische traagheid'),
    '5.2 Tijdvakfactoren vermelden geschatte watertemperatuur via thermische traagheid'
  );

  const carpAssumptions = SPECIES_PROFILES['Karper'].assumptions;
  assert(
    carpAssumptions.some((a) => a.includes('lage luchttemperatuur leidt niet automatisch tot winterrust zolang de watermassa warmer blijft')),
    '5.3 Karperprofiel-aannames stellen expliciet dat koude lucht niet gelijkstaat aan koude watermassa'
  );

  console.log(`\n==================================================`);
  console.log(`RESULTAAT TESTSUITE: ${passed} geslaagd, ${failed} gefaald`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
