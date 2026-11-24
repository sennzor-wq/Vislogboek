import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { calculateDayPrognosis, savePrognosisSnapshot } from './src/services/prognosisEngine';
import type { FishingLocation } from './src/types';
import type { WaterColumnForcingSample } from './src/services/waterColumnModel';

const location: FishingLocation = {
  id: 'shadow-spot',
  name: 'Shadow test spot',
  latitude: 52,
  longitude: 5,
  waterDepth: 0.9,
  waterType: 'Polder',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};
const currentDateRef = new Date('2026-01-01T04:00:00Z');
const asOf = '2026-01-01T04:00:00Z';
const forcing: WaterColumnForcingSample[] = [
  '00', '01', '02', '03',
].map((hour) => ({
  time: `2026-01-01T${hour}:00:00Z`,
  availableAt: asOf,
  airTemperatureC: 7,
  windSpeedKmh: 2,
  shortwaveRadiationWm2: 0,
  cloudCoverPercent: 80,
  dewPointC: 5,
}));
const commonOptions = {
  sessionDurationHours: 3,
  locationId: location.id,
  location,
  userWaterTempMeasuredAt: '2026-01-01T02:00:00Z',
  measurementDepthM: 0.45,
  allowUnknownSessionDuration: true,
};
const baseline = calculateDayPrognosis(
  '2026-01-01', [], 'Karper', [], asOf, 10, currentDateRef, commonOptions
);
const shadow = calculateDayPrognosis(
  '2026-01-01', [], 'Karper', [], asOf, 10, currentDateRef,
  { ...commonOptions, waterColumnForcing: forcing, waterColumnAsOf: asOf }
);

if (baseline.thermalAnalysis?.estimatedWaterTemp !== 10 ||
    shadow.thermalAnalysis?.estimatedWaterTemp !== baseline.thermalAnalysis?.estimatedWaterTemp) {
  throw new Error('Shadow water-column output must not replace the existing scalar temperature.');
}
if (baseline.activityScore !== shadow.activityScore ||
    baseline.personalCatchChance !== shadow.personalCatchChance) {
  throw new Error('Shadow water-column output must not change the existing score or catch chance.');
}
const prediction = shadow.thermalAnalysis?.waterColumnPrediction;
if (baseline.thermalAnalysis?.waterColumnPrediction ||
    !prediction ||
    prediction.measurementAnchorsUsed !== 1 ||
    prediction.totalDepthM !== 0.9) {
  throw new Error('The physical prediction must run alongside the legacy model and use spot depth plus the depth-specific measurement.');
}
async function verifySnapshotPersistence() {
  await db.delete();
  await db.open();
  try {
    const snapshot = await savePrognosisSnapshot(shadow, 3, location.id, location.name);
    const stored = await db.prognosisSnapshots.get(snapshot.id);
    if (!stored?.prognosisData?.thermalAnalysis?.waterColumnPrediction) {
      throw new Error('The existing immutable prognosisData snapshot must retain the shadow prediction without a schema migration.');
    }
  } finally {
    await db.delete();
  }
}
verifySnapshotPersistence().then(() => {
  console.log('Water-column shadow integration tests passed; legacy score/scalar unchanged and snapshot retained.');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
