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
const physical = calculateDayPrognosis(
  '2026-01-01', [], 'Karper', [], asOf, 10, currentDateRef,
  { ...commonOptions, waterColumnForcing: forcing, waterColumnAsOf: asOf }
);

const prediction = physical.thermalAnalysis?.waterColumnPrediction;
if (baseline.thermalAnalysis?.estimatedWaterTemp !== 10 ||
    !prediction ||
    physical.thermalAnalysis?.estimatedWaterTemp !== prediction.bottomTemperatureC ||
    physical.thermalAnalysis?.estimatedRange?.[0] !== prediction.estimatedRangeC[0]) {
  throw new Error('The registered spot-bottom temperature and physical scenario range must feed the existing thermal scalar.');
}
if (!Number.isFinite(physical.activityScore)) {
  throw new Error('The existing prognosis score must remain available after replacing only its temperature input.');
}
if (baseline.thermalAnalysis?.waterColumnPrediction ||
    prediction?.measurementAnchorsUsed !== 1 ||
    prediction?.totalDepthM !== 0.9 ||
    prediction?.targetDepthM !== 0.9) {
  throw new Error('The physical prediction must use the registered full spot depth as both water-column depth and carp target depth.');
}
const predictedBottomTemperatureC = prediction!.bottomTemperatureC;
async function verifySnapshotPersistence() {
  await db.delete();
  await db.open();
  try {
    const snapshot = await savePrognosisSnapshot(physical, 3, location.id, location.name);
    const stored = await db.prognosisSnapshots.get(snapshot.id);
    if (!stored?.prognosisData?.thermalAnalysis?.waterColumnPrediction ||
        stored.predictedWaterColumnProfile?.bottomTemperatureC !== predictedBottomTemperatureC ||
        stored.predictedWaterTemperature !== predictedBottomTemperatureC) {
      throw new Error('The immutable snapshot must retain the full physical profile and its bottom-temperature validation scalar.');
    }
  } finally {
    await db.delete();
  }
}
verifySnapshotPersistence().then(() => {
  console.log('Water-column bottom-temperature integration tests passed; bottom scalar and full immutable profile retained.');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
