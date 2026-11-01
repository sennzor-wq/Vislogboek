/**
 * Soortneutrale validatie en voorzichtige seizoenskalibratie van watertemperatuur.
 * Deze evaluatie staat bewust los van de Brier-score voor vangstkansen.
 */
import {
  evaluateWaterTemperaturePerformance,
  getWaterTemperatureCalibration,
} from './src/services/evaluationEngine';
import { PrognosisSnapshot } from './src/types';

let passed = 0;
let failed = 0;
function assert(condition: boolean, name: string) {
  if (condition) { console.log(`[PASS] ${name}`); passed++; }
  else { console.error(`[FAIL] ${name}`); failed++; }
}

function makeSnapshot(index: number, overrides: Partial<PrognosisSnapshot> = {}): PrognosisSnapshot {
  const date = `2026-10-${String(index + 1).padStart(2, '0')}`;
  return {
    id: `thermal-${index}`,
    forecastTimestamp: `${date}T07:00:00+02:00`,
    targetDate: date,
    targetSpecies: index % 2 === 0 ? 'Karper' : 'Brasem',
    locationId: 'spot-a',
    durationHours: 3,
    predictedActivityScore: 6,
    predictedCatchChance: null,
    predictedWaterTemperature: 12,
    actualWaterTemperature: 11,
    actualWaterTemperatureTimestamp: `${date}T09:00:00+02:00`,
    linkedSessionId: `session-${index}`,
    source: 'test',
    modelVersion: 'test',
    createdAt: `${date}T07:00:00+01:00`,
    ...overrides,
  };
}

const eight = Array.from({ length: 8 }, (_, index) => makeSnapshot(index));
const metrics = evaluateWaterTemperaturePerformance(eight);
assert(metrics.evaluatedCount === 8, 'Alleen vooraf voorspelde en later gemeten temperaturen worden gekoppeld');
assert(metrics.meanAbsoluteErrorC === 1, 'MAE berekent gemiddelde absolute temperatuurafwijking');
assert(metrics.rootMeanSquaredErrorC === 1, 'RMSE berekent kwadratische temperatuurafwijking');
assert(metrics.meanBiasC === 1, 'Bias herkent structureel 1 °C te warme voorspelling');
assert(metrics.hasSufficientData, 'Vijf of meer onafhankelijke paren geven een voorlopige evaluatiestatus');

const calibration = getWaterTemperatureCalibration(eight, 'spot-a', '2026-10-10');
assert(calibration !== undefined, 'Kalibratie wordt pas na minimaal acht lokale seizoensmetingen beschikbaar');
assert(calibration?.sampleCount === 8, 'Kalibratie gebruikt lokale metingen ongeacht doelvissoort');
assert(calibration?.season === 'herfst', 'Kalibratie wordt per seizoen gescheiden');
assert(calibration !== undefined && calibration.appliedCorrectionC > 0 && calibration.appliedCorrectionC < 1,
  'Biascorrectie wordt door shrinkage bewust afgezwakt');

assert(getWaterTemperatureCalibration(eight.slice(0, 7), 'spot-a', '2026-10-10') === undefined,
  'Zeven metingen leiden niet tot automatische modelaanpassing');
assert(getWaterTemperatureCalibration(eight, 'spot-b', '2026-10-10') === undefined,
  'Metingen van een andere stek worden niet gebruikt');
const invalid = [
  ...eight,
  makeSnapshot(8, { id: 'future-forecast', forecastTimestamp: '2026-10-10T12:00:00+02:00', targetDate: '2026-10-10', actualWaterTemperatureTimestamp: '2026-10-10T09:00:00+02:00' }),
  makeSnapshot(9, { id: 'wrong-day', targetDate: '2026-10-10', actualWaterTemperatureTimestamp: '2026-10-11T09:00:00+02:00' }),
];
assert(evaluateWaterTemperaturePerformance(invalid).evaluatedCount === 8,
  'Toekomstige voorspellingen en metingen van een andere dag worden uitgesloten');

console.log(`Watertemperatuur learning tests: ${passed} geslaagd, ${failed} gefaald`);
if (failed > 0) process.exit(1);
