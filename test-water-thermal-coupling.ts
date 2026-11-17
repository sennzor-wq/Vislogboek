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
  assert(progMeasured.thermalAnalysis?.waterTemperatureStatus === 'measured',
    '2.4 Herkomstmetadata markeert een actuele stekmeting expliciet als measured');
  assert(progUnmeasured.thermalAnalysis?.waterTemperatureStatus === 'estimated_from_weather',
    '2.5 Een schatting zonder lokaal meetanker wordt expliciet als weather estimate gemarkeerd');
  assert(progUnmeasured.thermalAnalysis?.estimatedRange === null &&
    progUnmeasured.thermalAnalysis?.uncertaintyC === null &&
    progUnmeasured.thermalAnalysis?.prognosisImpactNote.includes('hoge, niet-gekwantificeerde onzekerheid'),
    '2.6 Weer-only schatting zonder lokale waterreferentie krijgt geen schijnnauwkeurige numerieke onzekerheidsmarge');

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
      (progDay4Ahead.thermalAnalysis?.estimatedWaterTemp ?? 99) < 19.0 &&
      (progDay4Ahead.thermalAnalysis?.estimatedWaterTemp ?? 0) > 14.0,
    `3.3 Toekomstige dag gebruikt een geleidelijk afgekoelde modelschatting (~${progDay4Ahead.thermalAnalysis?.estimatedWaterTemp} °C) vanaf de oude 19 °C-meting, niet de meting als vaste waarde`
  );
  assert(
    progDay4Ahead.activityScore < progToday.activityScore,
    `3.4 Toekomstige activiteitsscore (${progDay4Ahead.activityScore}/10) daalt door naderende afkoeling t.o.v. vandaag (${progToday.activityScore}/10)`
  );

  // =========================================================================
  // DEEL 4: EEN ECHTE STEKMETING VERANKERT DE TEMPERATUURSCHATTING VOOR LATERE DAGEN
  // =========================================================================
  console.log('\n--- TEST 4: Eerdere lokale meting als startpunt voor toekomstige schatting ---');

  const measuredAnchorSession: FishingSession = {
    id: 'thermal-anchor-session',
    locationId: locLokkershoek.id,
    startTime: '2026-10-20T12:00:00',
    outcome: 'unknown',
    waterTemperature: 16.5,
    waterTemperatureMeasuredAt: '2026-10-20T12:30:00',
    waterTemperatureMeasurementSource: 'manual',
    waterTemperatureMeasurementMethod: 'thermometer',
    createdAt: '2026-10-20T12:00:00',
    updatedAt: '2026-10-20T12:00:00',
  };
  const anchoredEstimate = analyzeWaterThermalDevelopment('2026-10-21', coldSnapForecasts, {
    location: locLokkershoek,
    historicalSessions: [measuredAnchorSession],
    currentDateRef: new Date('2026-10-20T12:00:00'),
  });

  assert(
    anchoredEstimate.hasMeasuredWaterTemp === false &&
      anchoredEstimate.measuredWaterTemp === null,
    '4.1 Een meting van de vorige dag wordt niet als actuele meting gepresenteerd'
  );
  assert(
    anchoredEstimate.estimatedWaterTemp !== null &&
      anchoredEstimate.estimatedWaterTemp >= 15.0 &&
      anchoredEstimate.estimatedWaterTemp <= 18.0,
    `4.2 Toekomstige schatting blijft verankerd aan de echte 16,5 °C-meting (${anchoredEstimate.estimatedWaterTemp} °C)`
  );
  const anchoredRange = anchoredEstimate.estimatedRange;
  const anchoredValue = anchoredEstimate.estimatedWaterTemp;
  assert(
    anchoredRange != null &&
      anchoredValue !== null &&
      anchoredRange[0] <= anchoredValue &&
      anchoredRange[1] >= anchoredValue,
    '4.3 Onzekerheidsmarge omvat de berekende watertemperatuur'
  );

  const anchorWithoutWeather = analyzeWaterThermalDevelopment('2026-10-21', [], {
    location: locLokkershoek,
    userMeasuredWaterTemp: 16.5,
    currentDateRef: new Date('2026-10-20T12:00:00'),
  });
  assert(
    anchorWithoutWeather.estimatedWaterTemp === 16.5 &&
      anchorWithoutWeather.hasMeasuredWaterTemp === false &&
      anchorWithoutWeather.estimatedRange !== null,
    '4.4 Bij ontbrekende weerdata wordt een recente meting alleen als kortetermijnschatting met ruime marge gebruikt'
  );

  // Een meting uit een eerdere sessie mag niet als actuele meting worden gelabeld
  // alleen omdat de prognose voor vandaag wordt berekend.
  const staleSameDaySession: FishingSession = {
    id: 'thermal-stale-same-day',
    locationId: locLokkershoek.id,
    startTime: '2026-10-21T12:00:00',
    outcome: 'unknown',
    waterTemperature: 15.0,
    waterTemperatureMeasuredAt: '2026-10-21T12:00:00',
    waterTemperatureMeasurementSource: 'manual',
    waterTemperatureMeasurementMethod: 'thermometer',
    createdAt: '2026-10-21T12:00:00',
    updatedAt: '2026-10-21T12:00:00',
  };
  const staleAnchorToday = analyzeWaterThermalDevelopment('2026-10-23', coldSnapForecasts, {
    location: locLokkershoek,
    historicalSessions: [staleSameDaySession],
    currentDateRef: new Date('2026-10-23T12:00:00'),
  });
  assert(staleAnchorToday.hasMeasuredWaterTemp === false && staleAnchorToday.measuredWaterTemp === null,
    '4.5 Een sessiemeting van 48 uur geleden wordt vandaag niet als actuele meting gepresenteerd');
  assert(staleAnchorToday.waterTemperatureStatus === 'estimated_from_measurement' &&
    staleAnchorToday.anchorAgeHours === 48,
    '4.6 De oude meting wordt correct als 48-uurs anker voor een modelschatting geregistreerd');
  assert(staleAnchorToday.anchorMeasurementTimestamp === new Date('2026-10-21T12:00:00').toISOString(),
    '4.7 De herkomsttijd van het lokale meetanker blijft controleerbaar');

  const staleAnchorWithoutCoverage = analyzeWaterThermalDevelopment('2026-10-23', [], {
    location: locLokkershoek,
    historicalSessions: [staleSameDaySession],
    currentDateRef: new Date('2026-10-23T12:00:00'),
  });
  assert(staleAnchorWithoutCoverage.waterTemperatureStatus === 'unknown' &&
    staleAnchorWithoutCoverage.estimatedWaterTemp === null,
    '4.7a Een oud meetanker zonder weersdekking levert geen actuele temperatuurschatting op');
  assert(staleAnchorWithoutCoverage.anchorAgeHours === 48 &&
    staleAnchorWithoutCoverage.anchorMeasurementTimestamp === new Date('2026-10-21T12:00:00').toISOString() &&
    staleAnchorWithoutCoverage.weatherCoverageRatio === 0,
    '4.7b Herkomst, ouderdom en ontbrekende weersdekking blijven zichtbaar wanneer extrapolatie niet verantwoord is');


  const sessionWithoutExactMeasurementTime = analyzeWaterThermalDevelopment('2026-10-23', coldSnapForecasts, {
    location: locLokkershoek,
    historicalSessions: [{
      ...staleSameDaySession,
      id: 'thermal-missing-measurement-time',
      waterTemperatureMeasuredAt: undefined,
    }],
    currentDateRef: new Date('2026-10-23T12:00:00'),
  });
  assert(sessionWithoutExactMeasurementTime.anchorMeasurementTimestamp === null &&
    sessionWithoutExactMeasurementTime.anchorAgeHours === null,
    'Een sessietemperatuur zonder expliciet meettijdstip wordt niet stilzwijgend op sessiestart gedateerd');

  const sessionWithUnknownMethod = analyzeWaterThermalDevelopment('2026-10-23', coldSnapForecasts, {
    location: locLokkershoek,
    historicalSessions: [{
      ...staleSameDaySession,
      id: 'thermal-unknown-measurement-method',
      waterTemperatureMeasurementMethod: 'unknown',
    }],
    currentDateRef: new Date('2026-10-23T12:00:00'),
  });
  assert(sessionWithUnknownMethod.anchorMeasurementTimestamp === null &&
    sessionWithUnknownMethod.anchorAgeHours === null,
    'Een sessiemeting met onbekende meetmethode wordt niet als thermisch anker gebruikt');

  const noThermalData = analyzeWaterThermalDevelopment('2026-10-23', [], {
    location: locLokkershoek,
    currentDateRef: new Date('2026-10-23T12:00:00'),
  });
  assert(noThermalData.waterTemperatureStatus === 'unknown' &&
    noThermalData.estimatedWaterTemp === null && noThermalData.uncertaintyC === null,
    '4.8 Zonder meetanker en onvoldoende weersgegevens blijft watertemperatuur onbekend');

  const oneDayOnly = analyzeWaterThermalDevelopment(
    '2026-10-23',
    coldSnapForecasts.filter((hour) => hour.time.startsWith('2026-10-23')),
    { location: locLokkershoek, currentDateRef: new Date('2026-10-23T12:00:00') }
  );
  assert(oneDayOnly.waterTemperatureStatus === 'unknown' &&
    oneDayOnly.estimatedWaterTemp === null && oneDayOnly.estimatedRange === null,
    '4.9 Zonder lokaal meetanker levert één losse weersdag geen watertemperatuurschatting op');

  // =========================================================================
  // DEEL 5: WATERDIEPTE PER STEK WORDT CORRECT DOOR BEREKENING MEGENOMEN
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
  // DEEL 6: VERKLARENDE TEKSTEN OMTRENT WINTERRUST & LUCHTTEMPERATUUR
  // =========================================================================
  console.log('\n--- TEST 5: Verklarende teksten verwerpen winterrust door enkel koude lucht ---');

  assert(
    (progColdSnap.uncertaintyNotes ?? []).some(
      (n) => n.includes('thermische component gebruikt een geschatte watertemperatuur') &&
        n.includes('geen directe meting of voorspelling van activiteit, foerageren of winterrust')
    ),
    '5.1 Onzekerheidsnotitie vermeldt expliciet dat karper niet automatisch in winterrust raakt door koude lucht'
  );

  // The UI label describes thermal activity potential, not metabolism alone.
  const slotMorning = progColdSnap.timeSlots['Ochtend'];
  assert(
    slotMorning.temperatureFactor.title === 'Thermische activiteitspotentie' &&
      slotMorning.temperatureFactor.detail.includes('via thermische traagheid'),
    '5.2 Tijdvakfactoren vermelden geschatte watertemperatuur via thermische traagheid'
  );

  const carpAssumptions = SPECIES_PROFILES['Karper'].assumptions;
  assert(
    carpAssumptions.some((a) => a.includes('lage luchttemperatuur leidt niet automatisch tot winterrust zolang de watermassa warmer blijft')),
    '5.3 Karperprofiel-aannames stellen expliciet dat koude lucht niet gelijkstaat aan koude watermassa'
  );

  const coldThermalResponse = calculateThermalEfficiency(2, SPECIES_PROFILES['Karper']);
  assert(coldThermalResponse.impact === 'neutraal', 'Temperature impact labels stay neutral while thermal thresholds remain unvalidated');
  assert(
    coldThermalResponse.description.includes('geen gevalideerde fysiologische tolerantiegrens') &&
      coldThermalResponse.description.includes('geen winterrust') &&
      !/dwingt|spaarstand|foerageerdrang is sterk geremd|winterrust wordt/i.test(coldThermalResponse.description),
    '5.4 Lage temperatuur wordt niet als bewezen winterrust of stop van voedselopname gepresenteerd'
  );

  const hotThermalResponse = calculateThermalEfficiency(30, SPECIES_PROFILES['Karper']);
  assert(
    hotThermalResponse.description.includes('opgeloste zuurstof wordt niet gemeten') &&
      !/zuurstofstress bewijst|zuurstofspanning verlagen/i.test(hotThermalResponse.description),
    '5.5 Hoge temperatuur wordt niet gelijkgesteld aan gemeten zuurstofstress'
  );

  const coldSlotConclusion = progRealWinter.timeSlots['Middag'].conclusion;
  assert(
    coldSlotConclusion.includes('Lage thermische activiteitspotentie') &&
      coldSlotConclusion.includes('Dit stelt geen winterrust of volledige inactiviteit vast') &&
      !/dwingt .* winterstand/i.test(coldSlotConclusion),
    '5.6 Lage thermische score wordt niet als bewezen winterrust of volledige inactiviteit gepresenteerd'
  );

  // =========================================================================
  // DEEL 7: WEERSVERLOOP BINNEN EEN TIJDVAK BLIJFT ZICHTBAAR
  // =========================================================================
  console.log('\n--- TEST 6: Winddraaiing binnen een tijdvak blijft behouden ---');

  const shiftingWindForecasts = makeMultiDayForecasts('2026-10-20', 5, () => 14);
  const morningWindDirections = [
    { degrees: 225, text: 'ZW' },
    { degrees: 225, text: 'ZW' },
    { degrees: 247, text: 'ZW' },
    { degrees: 270, text: 'W' },
    { degrees: 292, text: 'W' },
    { degrees: 315, text: 'NW' },
  ];
  shiftingWindForecasts.forEach((hour) => {
    if (hour.time.startsWith('2026-10-22T')) {
      const hourOfDay = Number(hour.time.slice(11, 13));
      if (hourOfDay >= 6 && hourOfDay < 12) {
        const direction = morningWindDirections[hourOfDay - 6];
        hour.windDirection = direction.degrees;
        hour.windDirectionText = direction.text;
      }
    }
  });

  const shiftingWindProg = calculateDayPrognosis(
    '2026-10-22',
    shiftingWindForecasts,
    'Karper',
    [],
    undefined,
    15.5,
    new Date('2026-10-22T05:00:00'),
    { location: locLokkershoek }
  );
  assert(
    shiftingWindProg.timeSlots.Ochtend.windFactor.detail.includes('wind draait binnen dit tijdvak') &&
      shiftingWindProg.timeSlots.Ochtend.windFactor.detail.includes('ZW → W → NW'),
    '6.1 Windrichting die binnen één tijdvak verandert wordt expliciet behouden in de analyse'
  );

  console.log(`\n==================================================`);
  console.log(`RESULTAAT TESTSUITE: ${passed} geslaagd, ${failed} gefaald`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
