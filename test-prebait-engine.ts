import { calculatePrebaitPlan, supportsPrebaitPlanning } from './src/services/prebaitEngine';
import { FishingLocation, WaterThermalAnalysis } from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`[PASS] ${label}`);
    passed += 1;
  } else {
    console.error(`[FAIL] ${label}`);
    failed += 1;
  }
}

function makeThermal(temp: number | null, measured: boolean): WaterThermalAnalysis {
  return {
    hasMeasuredWaterTemp: measured,
    measuredWaterTemp: measured ? temp : null,
    estimatedWaterTemp: measured ? null : temp,
  } as unknown as WaterThermalAnalysis;
}

const completeLocation: FishingLocation = {
  id: 'prebait-test-location',
  name: 'Testwater',
  waterType: 'Plas/Zandafgraving',
  waterDepth: 2,
  createdAt: '2026-11-18T12:00:00.000Z',
  updatedAt: '2026-11-18T12:00:00.000Z',
};

function plan(
  temp: number | null,
  measured: boolean,
  options: { availableDaysBefore?: number; planningDate?: string; sessionDurationHours?: number; technique?: string } = {},
  location: FishingLocation = completeLocation
) {
  return calculatePrebaitPlan(
    '2026-11-21',
    'Karper',
    makeThermal(temp, measured),
    { availableDaysBefore: 2, planningDate: '2026-11-19', sessionDurationHours: 3, ...options },
    [],
    location
  );
}

function run(): void {
  assert(
    supportsPrebaitPlanning('Karper') &&
    supportsPrebaitPlanning('Zeelt') &&
    supportsPrebaitPlanning('Brasem') &&
    !supportsPrebaitPlanning('Snoek') &&
    !supportsPrebaitPlanning('Algemeen'),
    'Alleen Karper, Zeelt en Brasem krijgen een specifiek voorvoerplan'
  );

  const measured = plan(18, true);
  assert(
    measured?.confidenceLevel === 'Redelijk' &&
    measured.recommendedDaysBefore === 2 &&
    measured.moments.filter((moment) => moment.dayOffset < 0).map((moment) => moment.amountGrams).join(',') === '350,450' &&
    measured.sessionDayGuidance.recommendedAmountGrams === 150 &&
    measured.totalAmountGrams === 950,
    'Gemeten 18 °C met compleet stekprofiel behoudt twee campagnebeurten, sessiehoeveelheid en totaalsom'
  );

  const estimated = plan(18, false);
  assert(
    estimated?.confidenceLevel === 'Matig' &&
    estimated.shouldPrebait &&
    estimated.moments.filter((moment) => moment.dayOffset < 0).map((moment) => moment.amountGrams).join(',') === '350,450' &&
    estimated.totalAmountGrams === 950,
    'Een modelschatting behoudt de interne planneruitvoer maar krijgt geen Redelijk-confidence'
  );

  const missingWaterType: FishingLocation = { ...completeLocation, waterType: undefined };
  const incomplete = plan(18, true, {}, missingWaterType);
  assert(
    incomplete?.confidenceLevel === 'Laag' &&
    !incomplete.shouldPrebait &&
    incomplete.recommendedDaysBefore === 0 &&
    incomplete.sessionDayGuidance.recommendedAmountGrams === 0,
    'Ontbrekend watertype blokkeert voerhoeveelheden en timing zonder de gekozen stek te vervangen'
  );

  const missingDepth: FishingLocation = { ...completeLocation, waterDepth: undefined };
  const noDepth = plan(18, true, {}, missingDepth);
  assert(
    noDepth?.confidenceLevel === 'Matig' &&
    noDepth.shouldPrebait &&
    noDepth.sessionDayGuidance.recommendedAmountGrams === 150,
    'Ontbrekende diepte verlaagt confidence maar wist bruikbare interne planneruitvoer niet'
  );

  const unknownTemperature = plan(null, false);
  assert(
    unknownTemperature?.confidenceLevel === 'Laag' &&
    !unknownTemperature.shouldPrebait &&
    unknownTemperature.recommendedDaysBefore === 0 &&
    unknownTemperature.sessionDayGuidance.recommendedAmountGrams === 0,
    'Onbekende watertemperatuur leidt niet tot een verzonnen voerplan'
  );

  const sixHourSession = plan(18, true, { sessionDurationHours: 6 });
  assert(
    sixHourSession?.sessionDayGuidance.recommendedAmountGrams === 300 &&
    sixHourSession.totalAmountGrams === 1100,
    'Sessieduur schaalt alleen de sessiehoeveelheid en wordt meegenomen in de totaalsom'
  );

  const methodFeeder = plan(18, true, { technique: 'Method feeder' });
  const sessionMoment = methodFeeder?.moments.find((moment) => moment.dayOffset === 0);
  assert(
    methodFeeder?.sessionDayGuidance.recommendedAmountGrams === 120 &&
    sessionMoment?.feedType.includes('Instant method-feederkorf') === true &&
    sessionMoment.purpose.includes('geen vooraf aangelegde voerplek') &&
    methodFeeder.totalAmountGrams === 920,
    'Method feeder blijft instant sessiepresentatie en wordt niet als extra voorafgaande voerbeurt aangemerkt'
  );

  const cold = plan(5.9, true);
  const lowerBoundary = plan(6, true);
  const tenDegrees = plan(10, true);
  const sixteenDegrees = plan(16, true);
  const twentyTwoDegrees = plan(22, true);
  const warm = plan(22.1, true);
  assert(
    cold?.recommendedDaysBefore === 0 &&
    lowerBoundary?.recommendedDaysBefore === 1 &&
    tenDegrees?.recommendedDaysBefore === 2 &&
    sixteenDegrees?.recommendedDaysBefore === 2 &&
    twentyTwoDegrees?.recommendedDaysBefore === 2 &&
    warm?.recommendedDaysBefore === 1,
    'Bestaande temperatuurbandgrenzen en maximale voorbereidingstermijnen blijven intact'
  );

  console.log(`Prebait engine tests: ${passed} geslaagd, ${failed} gefaald`);
  if (failed > 0) process.exit(1);
}

run();
