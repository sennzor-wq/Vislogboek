import { evaluateWaterColumnEmpiricalValidation } from './src/services/waterColumnEmpiricalValidation';
import type { FishingLocation, FishingSession, PrognosisSnapshot } from './src/types';

const location = {
  id: 'spot-1', name: 'Testplas', waterType: 'Polder', waterDepth: 1,
} as FishingLocation;
const session = {
  id: 'session-1', locationId: 'spot-1', startTime: '2026-06-01T12:00:00Z',
  endTime: '2026-06-01T13:00:00Z', outcome: 'unknown', createdAt: '2026-06-01T13:00:00Z',
  updatedAt: '2026-06-01T13:00:00Z',
  waterTemperatureMeasurements: [{
    id: 'measurement-1', locationId: 'spot-1', temperatureC: 10,
    measuredAt: '2026-06-01T12:00:00Z', recordedAt: '2026-06-01T13:00:00Z',
    measurementSource: 'manual', measurementMethod: 'thermometer', measurementDepthM: 0.1,
  }],
} as unknown as FishingSession;
const basePrediction = {
  targetTime: '2026-06-01T12:00:00.000Z',
  asOf: '2026-05-31T12:00:00.000Z',
  forcingStartTime: '2025-06-01T12:00:00.000Z',
  forcingEndTime: '2026-06-01T12:00:00.000Z',
  status: 'scenario_converged',
  scenarioConverged: true,
  estimatedTemperatureC: 14,
  estimatedRangeC: [13, 15] as [number, number],
  surfaceTemperatureC: 10,
  bottomTemperatureC: 18,
  volumeMeanTemperatureC: 14,
  layerTemperaturesC: [10, 12, 14, 16, 18],
  totalDepthM: 1,
  depthPriorUsed: false,
  targetDepthM: null,
  spinupDays: 365,
  forcingCoverageRatio: 1,
  scenarioSpreadC: 2,
  measurementAnchorsUsed: 0,
  measurementAnchorsRejected: 0,
};
function snapshot(id: string, prediction: typeof basePrediction, createdAt = '2026-05-31T12:01:00Z') {
  return {
    id, locationId: 'spot-1', forecastTimestamp: '2026-05-31T12:00:00Z',
    targetDate: '2026-06-01', targetSpecies: 'Karper', durationHours: 4,
    predictedActivityScore: 5, predictedCatchChance: 50,
    prognosisData: { thermalAnalysis: { waterColumnPrediction: prediction } },
    modelVersion: 'test', source: 'test', createdAt,
  } as unknown as PrognosisSnapshot;
}
const report = evaluateWaterColumnEmpiricalValidation(
  [session], [snapshot('valid', basePrediction)], [location]
);
if (report.evaluatedSampleCount !== 1 || report.samples[0].predictedTemperatureC !== 10 ||
    report.overall?.maeC !== 0 || report.overall?.rmseC !== 0 || report.overall?.biasC !== 0 ||
    report.bySeason.summer?.sampleCount !== 1 ||
    report.byWaterType.Polder?.sampleCount !== 1 ||
    report.byMeasurementDepth['0–0.5 m']?.sampleCount !== 1) {
  throw new Error('Valid same-time, same-depth physical measurement must produce zero-error empirical metrics.');
}
const leaked = {
  ...basePrediction,
  asOf: '2026-06-01T12:30:00Z',
};
const leakageReport = evaluateWaterColumnEmpiricalValidation(
  [session], [snapshot('leaked', leaked)], [location]
);
if (leakageReport.evaluatedSampleCount !== 0 || leakageReport.exclusions.hindsightLeakage !== 1) {
  throw new Error('A prediction made after the measurement target must never enter empirical validation.');
}
const unknownDepthSession = {
  ...session,
  waterTemperatureMeasurements: [{
    ...session.waterTemperatureMeasurements![0],
    measurementDepthM: undefined,
  }],
} as unknown as FishingSession;
const unknownDepthReport = evaluateWaterColumnEmpiricalValidation(
  [unknownDepthSession], [snapshot('valid', basePrediction)], [location]
);
if (unknownDepthReport.evaluatedSampleCount !== 0 ||
    unknownDepthReport.exclusions.unknownMeasurementDepth !== 1) {
  throw new Error('A point measurement without a known depth must not be compared to a depth-resolved profile.');
}
const snapshotCreatedAfterMeasurement = evaluateWaterColumnEmpiricalValidation(
  [session], [snapshot('late-snapshot', basePrediction, '2026-06-01T12:30:00Z')], [location]
);
if (snapshotCreatedAfterMeasurement.evaluatedSampleCount !== 0 ||
    snapshotCreatedAfterMeasurement.exclusions.hindsightLeakage !== 1) {
  throw new Error('A snapshot created after the target measurement must be excluded even if its forecast timestamp is backdated.');
}

const forcingRetrievedAfterForecast = {
  ...basePrediction,
  asOf: '2026-05-31T12:02:00Z',
};
const lateForcingReport = evaluateWaterColumnEmpiricalValidation(
  [session], [snapshot('late-forcing', forcingRetrievedAfterForecast)], [location]
);
if (lateForcingReport.evaluatedSampleCount !== 0 ||
    lateForcingReport.exclusions.hindsightLeakage !== 1) {
  throw new Error('Forcing retrieved after forecast/snapshot creation must be excluded, even when it predates the physical measurement.');
}

console.log('Water-column empirical validation tests passed.');
