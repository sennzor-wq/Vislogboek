import {
  estimateWaterColumnTemperature,
  simulateWaterColumn,
} from './src/services/waterColumnModel';
import type { WaterColumnForcingSample, WaterColumnObservation } from './src/services/waterColumnModel';

const forcing: WaterColumnForcingSample[] = [
  { time: '2026-01-01T00:00:00Z', availableAt: '2026-01-01T00:00:00Z', airTemperatureC: 7, windSpeedKmh: 2, shortwaveRadiationWm2: 0, cloudCoverPercent: 80, dewPointC: 5 },
  { time: '2026-01-01T01:00:00Z', availableAt: '2026-01-01T01:00:00Z', airTemperatureC: 7, windSpeedKmh: 2, shortwaveRadiationWm2: 0, cloudCoverPercent: 80, dewPointC: 5 },
  { time: '2026-01-01T02:00:00Z', availableAt: '2026-01-01T02:00:00Z', airTemperatureC: 7, windSpeedKmh: 2, shortwaveRadiationWm2: 0, cloudCoverPercent: 80, dewPointC: 5 },
  { time: '2026-01-01T03:00:00Z', availableAt: '2026-01-01T03:00:00Z', airTemperatureC: 7, windSpeedKmh: 2, shortwaveRadiationWm2: 0, cloudCoverPercent: 80, dewPointC: 5 },
];
const targetTime = '2026-01-01T03:00:00Z';
const asOf = '2026-01-01T04:00:00Z';
const measurement: WaterColumnObservation = {
  time: '2026-01-01T03:00:00Z',
  availableAt: '2026-01-01T04:00:00Z',
  temperatureC: 7.5,
  depthM: 0.45,
};
const anchored = simulateWaterColumn({
  totalDepthM: 0.9,
  initialLayerTemperaturesC: [10, 10, 10, 10, 10],
  forcing,
  observations: [measurement],
  targetTime,
  asOf,
});
if (anchored.measurementAnchorsUsed !== 1 || anchored.layers[2].temperatureC !== 7.5) {
  throw new Error('Een meting moet alleen de juiste laag op de echte meetdiepte verankeren.');
}
const rejected = simulateWaterColumn({
  totalDepthM: 0.9,
  initialLayerTemperaturesC: [10, 10, 10, 10, 10],
  forcing,
  observations: [measurement],
  targetTime,
  asOf: '2026-01-01T03:30:00Z',
});
if (rejected.measurementAnchorsUsed !== 0 || rejected.measurementAnchorsRejected !== 1) {
  throw new Error('Een meting die op het as-of-moment nog niet geregistreerd was mag niet worden gebruikt.');
}
const prediction = estimateWaterColumnTemperature({
  totalDepthM: 0.9,
  targetDepthM: 0.45,
  forcing,
  observations: [measurement],
  targetTime,
  asOf,
});
if (!prediction || prediction.depthPriorUsed || !Number.isFinite(prediction.iceThicknessM) || prediction.iceThicknessM < 0 || prediction.layerTemperaturesC.length !== 5 ||
    prediction.measurementAnchorsUsed !== 1 || prediction.estimatedRangeC[0] > prediction.estimatedRangeC[1]) {
  throw new Error('De multi-profiel best-effort voorspelling moet een diepteprofiel, range en meetanker teruggeven.');
}
const depthPrior = estimateWaterColumnTemperature({
  forcing,
  targetTime,
  asOf,
});
if (!depthPrior || !depthPrior.depthPriorUsed || depthPrior.totalDepthM !== 1.5 ||
    depthPrior.status !== 'low_confidence' || depthPrior.estimatedRangeC[1] <= depthPrior.estimatedRangeC[0]) {
  throw new Error('Ontbrekende stekdiepte moet een expliciete noodprior met lage betrouwbaarheid opleveren.');
}
const noForcing = estimateWaterColumnTemperature({
  totalDepthM: 1,
  forcing: [],
  targetTime,
  asOf,
});
if (noForcing !== null) throw new Error('Zonder enige forcing mag geen schijnvoorspelling uit alleen de startprior ontstaan.');

const runawayStartMs = Date.parse('2026-01-01T00:00:00Z');
const runawayForcing: WaterColumnForcingSample[] = Array.from({ length: 24 * 45 + 1 }, (_, index) => ({
  time: new Date(runawayStartMs + index * 3600000).toISOString(),
  availableAt: new Date(runawayStartMs + index * 3600000).toISOString(),
  airTemperatureC: 40,
  windSpeedKmh: 0,
  shortwaveRadiationWm2: 1600,
  cloudCoverPercent: 0,
  dewPointC: 35,
}));
const runawayTarget = runawayForcing[runawayForcing.length - 1].time;
const runawayPrediction = estimateWaterColumnTemperature({
  totalDepthM: 0.9,
  forcing: runawayForcing,
  targetTime: runawayTarget,
  asOf: runawayTarget,
});
if (runawayPrediction !== null) {
  throw new Error('Een fysisch ontspoorde lange forcingreeks mag geen watertemperatuur boven het plausibele modelbereik publiceren.');
}

const physicalInputs = estimateWaterColumnTemperature({
  totalDepthM: 0.9,
  forcing,
  targetTime,
  asOf,
  windExposure: 'partly_exposed',
  effectiveFetchM: 180,
  secchiDepthM: 0.7,
  waterMovement: 'flowing',
});
if (!physicalInputs || physicalInputs.physicalInputCoveragePercent !== 100 ||
    physicalInputs.secchiPriorUsed || physicalInputs.windExposurePriorUsed ||
    physicalInputs.fetchPriorUsed || !physicalInputs.advectionNotModeled ||
    physicalInputs.status !== 'low_confidence' ||
    !physicalInputs.physicalInputWarnings.some((warning) => warning.includes('horizontale advectie'))) {
  throw new Error('Site physics must be reflected in the prediction and flowing water must be flagged as low-confidence.');
}
console.log('Water-column prediction/spin-up tests passed.');
