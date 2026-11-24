import {
  freshwaterDensityKgM3, mixConvectivelyUnstableLayers, simulateWaterColumn, WATER_COLUMN_LAYER_COUNT,
} from './src/services/waterColumnModel';
import type { WaterColumnForcingSample } from './src/services/waterColumnModel';
let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string, detail?: string) {
  if (condition) { passed++; console.log('[PASS] ' + label); }
  else { failed++; console.error('[FAIL] ' + label + (detail ? ' — ' + detail : '')); }
}
assert(WATER_COLUMN_LAYER_COUNT === 5, 'MVP gebruikt vijf vaste lagen');
const rho4 = freshwaterDensityKgM3(4);
assert(rho4 > freshwaterDensityKgM3(0) && rho4 > freshwaterDensityKgM3(8),
  'Zoetwater heeft een dichtheidsmaximum rond 4 °C');
assert(freshwaterDensityKgM3(3.986) >= freshwaterDensityKgM3(3.5), 'Dichtheidsmaximum ligt nabij 3,986 °C');
const stableSummer = [22, 18, 13, 9, 6];
const stableWinter = [0.5, 1, 2, 3, 4];
assert(mixConvectivelyUnstableLayers(stableSummer).every((v, i) => Math.abs(v - stableSummer[i]) < 1e-9),
  'Zomerstratificatie blijft stabiel');
assert(mixConvectivelyUnstableLayers(stableWinter).every((v, i) => Math.abs(v - stableWinter[i]) < 1e-9),
  'Winterse inverse stratificatie blijft stabiel');
const unstable = [3, 5, 8, 10, 12];
const beforeMean = unstable.reduce((a, b) => a + b, 0) / unstable.length;
const afterMix = mixConvectivelyUnstableLayers(unstable);
const afterMean = afterMix.reduce((a, b) => a + b, 0) / afterMix.length;
assert(Math.abs(beforeMean - afterMean) < 1e-9, 'Convectieve menging behoudt de gemiddelde warmte');
assert(afterMix.every((v) => v >= 0), 'Convectieve menging produceert geen negatieve vloeibare temperatuur');
assert(afterMix.slice(0, -1).every((value, index) =>
  freshwaterDensityKgM3(value) <= freshwaterDensityKgM3(afterMix[index + 1]) + 1e-7),
  'Convectieve menging herstelt een stabiele dichtheidsvolgorde over de hele kolom');
const noForcing = simulateWaterColumn({ totalDepthM: 2, initialLayerTemperaturesC: stableSummer, forcing: [] });
const expectedMean = stableSummer.reduce((sum, value) => sum + value, 0) / stableSummer.length;
assert(noForcing.layers.length === 5 && noForcing.layers[0].topDepthM === 0 && noForcing.layers[4].bottomDepthM === 2,
  'Bekende totale stekdiepte bepaalt vijf gelijke dieptelagen');
assert(Math.abs(noForcing.volumeMeanTemperatureC - expectedMean) < 0.01, 'Uitvoer geeft het volumegewogen kolomgemiddelde terug');
const forcing: WaterColumnForcingSample[] = [
  { time: '2026-06-01T10:00:00Z', availableAt: '2026-06-01T09:00:00Z', airTemperatureC: 24, windSpeedKmh: 4, shortwaveRadiationWm2: 650, cloudCoverPercent: 10, dewPointC: 14 },
  { time: '2026-06-01T11:00:00Z', availableAt: '2026-06-01T10:00:00Z', airTemperatureC: 25, windSpeedKmh: 5, shortwaveRadiationWm2: 700, cloudCoverPercent: 5, dewPointC: 14 },
  { time: '2026-06-01T12:00:00Z', availableAt: '2026-06-01T13:00:00Z', airTemperatureC: 26, windSpeedKmh: 5, shortwaveRadiationWm2: 720, cloudCoverPercent: 0, dewPointC: 15 },
  { time: '2026-06-01T09:00:00Z', airTemperatureC: 23 },
];
const simulated = simulateWaterColumn({
  totalDepthM: 1.5, initialLayerTemperaturesC: [12, 12, 12, 12, 12], forcing,
  targetTime: '2026-06-01T12:00:00Z', asOf: '2026-06-01T12:00:00Z',
});
assert(simulated.forcingHoursUsed === 2 && simulated.forcingHoursRejected === 2,
  'Forcing na doeltijd, ontbrekende beschikbaarheid en na as-of wordt uitgesloten');
assert(simulated.layers.every((layer) => Number.isFinite(layer.temperatureC) && layer.temperatureC >= 0),
  'Simulatie houdt vloeibaar water op of boven 0 °C');
assert(simulated.surfaceTemperatureC >= simulated.bottomTemperatureC,
  'Zonnestraling warmt in dit ondiepe testscenario de bovenlaag sterker op');
assert(simulated.surfaceEnergyInputJm2 > 0, 'Oppervlakte- en zonnestralingsenergie worden gerapporteerd');
const frozen = simulateWaterColumn({
  totalDepthM: 0.8, initialLayerTemperaturesC: [0, 0, 0, 0, 0],
  forcing: [{ time: '2026-01-01T00:00:00Z', airTemperatureC: -12, windSpeedKmh: 15, cloudCoverPercent: 0, shortwaveRadiationWm2: 0, dewPointC: -15 }],
});
assert(frozen.layers.every((layer) => layer.temperatureC >= 0) && frozen.iceThicknessM > 0,
  'Onderkoeling wordt als ijsfase verwerkt, niet als negatieve vloeibare temperatuur');


// Scientific invariant sweep: test the complete freshwater density curve and
// multiple seasonal/mixed profiles, not only one hand-picked overturn case.
let maximumDensity = Number.NEGATIVE_INFINITY;
let maximumDensityTemperature = 0;
for (let step = 0; step <= 1000; step++) {
  const temperature = step / 100;
  const density = freshwaterDensityKgM3(temperature);
  if (density > maximumDensity) {
    maximumDensity = density;
    maximumDensityTemperature = temperature;
  }
}
assert(Math.abs(maximumDensityTemperature - 3.98) <= 0.02,
  'Dichtheidsfunctie heeft haar maximum rond 3,98 °C over het volledige bereik 0–10 °C',
  `maximum bij ${maximumDensityTemperature.toFixed(2)} °C`);

const profileCases = [
  [0, 8, 2, 12, 4],
  [25, 18, 22, 9, 6],
  [1, 3, 2, 4, 0.5],
  [18, 4, 16, 7, 12],
  [4, 4, 4, 4, 4],
  [30, 25, 20, 15, 10],
];
for (const profile of profileCases) {
  const mixed = mixConvectivelyUnstableLayers(profile);
  const originalHeatProxy = profile.reduce((sum, value) => sum + value, 0);
  const mixedHeatProxy = mixed.reduce((sum, value) => sum + value, 0);
  const stableDensityOrder = mixed.slice(0, -1).every((value, index) =>
    freshwaterDensityKgM3(value) <= freshwaterDensityKgM3(mixed[index + 1]) + 1e-7);
  assert(mixed.length === profile.length && stableDensityOrder &&
    Math.abs(originalHeatProxy - mixedHeatProxy) < 1e-8,
    'Convectieve overturning behoudt warmte en eindigt stabiel voor profiel ' + profile.join('/'));
}

console.log(`Water-column MVP tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
