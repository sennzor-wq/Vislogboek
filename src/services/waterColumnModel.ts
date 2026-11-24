/**
 * Compacte, deterministische 1D-waterkolomkern (MVP).
 *
 * Dit is een fysische rekenkern, nog geen productievoorspelling: de aanroeper
 * moet een plausibel startprofiel en chronologisch begrensde forcing leveren.
 * De coëfficiënten voor optische extinctie en turbulente uitwisseling zijn
 * expliciete startpriors en moeten empirisch worden getoetst.
 */
export const WATER_COLUMN_LAYER_COUNT = 5;
const WATER_DENSITY_KG_M3 = 1000;
const WATER_HEAT_CAPACITY_J_KG_K = 4186;
const ICE_DENSITY_KG_M3 = 917;
const ICE_LATENT_HEAT_J_KG = 334_000;
const STEFAN_BOLTZMANN = 5.670374419e-8;
const WATER_EMISSIVITY = 0.97;
const AIR_DENSITY_KG_M3 = 1.2;
const AIR_HEAT_CAPACITY_J_KG_K = 1005;
const LATENT_HEAT_VAPORIZATION_J_KG = 2_450_000;
const BULK_TRANSFER_COEFFICIENT = 0.0013;
const SHORTWAVE_EXTINCTION_PER_M = 1.0;

export interface WaterColumnForcingSample {
  time: string;
  /** Required whenever an as-of cutoff is supplied. */
  availableAt?: string;
  airTemperatureC: number;
  windSpeedKmh?: number;
  shortwaveRadiationWm2?: number;
  cloudCoverPercent?: number;
  dewPointC?: number;
  relativeHumidityPercent?: number;
  source?: 'era5-seamless' | 'open-meteo-forecast';
}
export interface WaterColumnObservation {
  time: string;
  availableAt?: string;
  temperatureC: number;
  depthM: number;
}
export interface WaterColumnModelInput {
  totalDepthM: number;
  initialLayerTemperaturesC: number[];
  forcing: WaterColumnForcingSample[];
  observations?: WaterColumnObservation[];
  targetTime?: string;
  asOf?: string;
  initialIceThicknessM?: number;
}
export interface WaterColumnLayer {
  topDepthM: number;
  bottomDepthM: number;
  centerDepthM: number;
  temperatureC: number;
  densityKgM3: number;
}
export interface WaterColumnModelResult {
  layers: WaterColumnLayer[];
  surfaceTemperatureC: number;
  bottomTemperatureC: number;
  volumeMeanTemperatureC: number;
  iceThicknessM: number;
  forcingHoursUsed: number;
  forcingHoursRejected: number;
  surfaceEnergyInputJm2: number;
  measurementAnchorsUsed: number;
  measurementAnchorsRejected: number;
}

/** Freshwater density (kg/m³), polynomial fit; maximum is close to 3.986 °C. */
export function freshwaterDensityKgM3(temperatureC: number): number {
  const t = Math.max(0, Math.min(40, temperatureC));
  return 999.842594 + 0.06793952 * t - 0.00909529 * t ** 2 +
    0.0001001685 * t ** 3 - 0.000001120083 * t ** 4 +
    0.0000000006536332 * t ** 5;
}

/** Conservative overturning of adjacent unstable freshwater layers. */
export function mixConvectivelyUnstableLayers(temperaturesC: number[]): number[] {
  // Pool-adjacent-violators: merge complete unstable blocks, not just one pair
  // per pass. Each merge conserves the equal-thickness heat-content proxy.
  const blocks = temperaturesC.map((temperatureC) => ({
    temperatureC: Math.max(0, temperatureC),
    layerCount: 1,
  }));
  let index = 0;
  while (index < blocks.length - 1) {
    if (freshwaterDensityKgM3(blocks[index].temperatureC) >
        freshwaterDensityKgM3(blocks[index + 1].temperatureC) + 1e-7) {
      const upper = blocks[index];
      const lower = blocks[index + 1];
      const layerCount = upper.layerCount + lower.layerCount;
      blocks.splice(index, 2, {
        temperatureC: (upper.temperatureC * upper.layerCount +
          lower.temperatureC * lower.layerCount) / layerCount,
        layerCount,
      });
      index = Math.max(0, index - 1);
    } else {
      index++;
    }
  }
  return blocks.flatMap((block) => Array(block.layerCount).fill(block.temperatureC) as number[]);
}
function saturationVapourPressureHpa(temperatureC: number): number {
  return 6.112 * Math.exp((17.67 * temperatureC) / (temperatureC + 243.5));
}
function specificHumidity(temperatureC: number, pressureHpa = 1013.25): number {
  const vapourPressure = Math.min(0.98 * pressureHpa, saturationVapourPressureHpa(temperatureC));
  return 0.622 * vapourPressure / (pressureHpa - 0.378 * vapourPressure);
}
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
function validForcing(
  forcing: WaterColumnForcingSample[],
  targetTime?: string,
  asOf?: string
): { accepted: WaterColumnForcingSample[]; rejected: number } {
  const targetMs = targetTime ? Date.parse(targetTime) : Number.POSITIVE_INFINITY;
  const asOfMs = asOf ? Date.parse(asOf) : Number.POSITIVE_INFINITY;
  const accepted = forcing.flatMap((sample) => {
    const timeMs = Date.parse(sample.time);
    const availableMs = sample.availableAt ? Date.parse(sample.availableAt) : Number.NEGATIVE_INFINITY;
    if (!Number.isFinite(timeMs) || (targetTime !== undefined && !Number.isFinite(targetMs)) ||
        (asOf !== undefined && (!Number.isFinite(asOfMs) || !sample.availableAt || !Number.isFinite(availableMs))) ||
        timeMs > targetMs || availableMs > asOfMs ||
        !Number.isFinite(sample.airTemperatureC) || sample.airTemperatureC < -60 || sample.airTemperatureC > 60) return [];
    return [{ ...sample }];
  }).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  return { accepted, rejected: forcing.length - accepted.length };
}

/** Five-layer hourly freshwater model; excludes advection, salinity, sediment and snow. */
export function simulateWaterColumn(input: WaterColumnModelInput): WaterColumnModelResult {
  if (!Number.isFinite(input.totalDepthM) || input.totalDepthM <= 0 || input.totalDepthM > 1000) {
    throw new Error('totalDepthM must be a finite positive depth in metres');
  }
  if (input.initialLayerTemperaturesC.length !== WATER_COLUMN_LAYER_COUNT ||
      input.initialLayerTemperaturesC.some((t) => !Number.isFinite(t) || t < 0 || t > 40)) {
    throw new Error('initialLayerTemperaturesC must contain five liquid-water temperatures from 0 to 40 °C');
  }
  const layerThickness = input.totalDepthM / WATER_COLUMN_LAYER_COUNT;
  let temperatures = mixConvectivelyUnstableLayers(input.initialLayerTemperaturesC);
  let iceThicknessM = clamp(input.initialIceThicknessM ?? 0, 0, 2);
  const { accepted, rejected } = validForcing(input.forcing, input.targetTime, input.asOf);
  const observations = input.observations ?? [];
  const targetMs = input.targetTime ? Date.parse(input.targetTime) : Number.POSITIVE_INFINITY;
  const asOfMs = input.asOf ? Date.parse(input.asOf) : Number.POSITIVE_INFINITY;
  const validObservations = observations.filter((observation) => {
    const timeMs = Date.parse(observation.time);
    const availableMs = observation.availableAt ? Date.parse(observation.availableAt) : Number.NEGATIVE_INFINITY;
    return Number.isFinite(timeMs) && Number.isFinite(observation.temperatureC) &&
      observation.temperatureC >= 0 && observation.temperatureC <= 40 &&
      Number.isFinite(observation.depthM) && observation.depthM >= 0 && observation.depthM <= input.totalDepthM &&
      timeMs <= targetMs && (input.asOf === undefined ||
        (observation.availableAt !== undefined && Number.isFinite(availableMs) && availableMs <= asOfMs));
  });
  const usedObservationIndices = new Set<number>();
  let surfaceEnergyInputJm2 = 0;

  for (const sample of accepted) {
    const airC = sample.airTemperatureC;
    const windMs = clamp(sample.windSpeedKmh ?? 0, 0, 200) / 3.6;
    const cloud = clamp(sample.cloudCoverPercent ?? 50, 0, 100) / 100;
    const shortwave = clamp(sample.shortwaveRadiationWm2 ?? 0, 0, 1600);
    const dewPoint = Number.isFinite(sample.dewPointC)
      ? clamp(sample.dewPointC as number, -60, 40)
      : Number.isFinite(sample.relativeHumidityPercent)
        ? airC - (100 - clamp(sample.relativeHumidityPercent as number, 1, 100)) / 5
        : airC - 5;
    const topC = temperatures[0];
    const airK = airC + 273.15;
    const waterK = topC + 273.15;
    const skyEmissivity = clamp(0.72 + 0.005 * dewPoint + 0.08 * cloud, 0.45, 1);
    const incomingLongwave = skyEmissivity * STEFAN_BOLTZMANN * airK ** 4;
    const outgoingLongwave = WATER_EMISSIVITY * STEFAN_BOLTZMANN * waterK ** 4;
    const sensible = AIR_DENSITY_KG_M3 * AIR_HEAT_CAPACITY_J_KG_K *
      BULK_TRANSFER_COEFFICIENT * windMs * (airC - topC);
    const latent = AIR_DENSITY_KG_M3 * LATENT_HEAT_VAPORIZATION_J_KG *
      BULK_TRANSFER_COEFFICIENT * windMs *
      (specificHumidity(dewPoint) - specificHumidity(topC));
    const iceInsulation = 1 / (1 + 8 * iceThicknessM);
    const nonSolarSurfaceFlux = (incomingLongwave - outgoingLongwave + sensible + latent) * iceInsulation;
    const absorbedSolar = shortwave * (iceThicknessM > 0 ? 0.45 : 0.92);

    const solarEnergyByLayer = temperatures.map((_, index) => {
      const top = index * layerThickness;
      const bottom = (index + 1) * layerThickness;
      const fraction = Math.exp(-SHORTWAVE_EXTINCTION_PER_M * top) -
        Math.exp(-SHORTWAVE_EXTINCTION_PER_M * bottom);
      return absorbedSolar * fraction * 3600;
    });
    for (let i = 0; i < temperatures.length; i++) {
      const heatCapacityPerArea = WATER_DENSITY_KG_M3 * WATER_HEAT_CAPACITY_J_KG_K * layerThickness;
      let energy = solarEnergyByLayer[i];
      if (i === 0) energy += nonSolarSurfaceFlux * 3600;
      if (i === 0 && iceThicknessM > 0) {
        if (energy < 0) {
          iceThicknessM += -energy / (ICE_DENSITY_KG_M3 * ICE_LATENT_HEAT_J_KG);
          energy = 0;
        } else {
          const meltEnergy = Math.min(energy, iceThicknessM * ICE_DENSITY_KG_M3 * ICE_LATENT_HEAT_J_KG);
          iceThicknessM -= meltEnergy / (ICE_DENSITY_KG_M3 * ICE_LATENT_HEAT_J_KG);
          energy -= meltEnergy;
        }
      }
      const next = temperatures[i] + energy / heatCapacityPerArea;
      if (i === 0 && next < 0) {
        iceThicknessM += (-next * heatCapacityPerArea) / (ICE_DENSITY_KG_M3 * ICE_LATENT_HEAT_J_KG);
        temperatures[i] = 0;
      } else {
        temperatures[i] = Math.max(0, next);
      }
      if (i === 0) surfaceEnergyInputJm2 += nonSolarSurfaceFlux * 3600;
      surfaceEnergyInputJm2 += solarEnergyByLayer[i];
    }

    const mixedDepth = Math.min(input.totalDepthM, 0.25 + 0.12 * windMs ** 1.5);
    const exchangeFraction = clamp(0.004 + 0.018 * windMs, 0.004, 0.12);
    for (let i = 0; i < temperatures.length - 1; i++) {
      const interfaceDepth = (i + 1) * layerThickness;
      const densityDifference = Math.abs(freshwaterDensityKgM3(temperatures[i]) -
        freshwaterDensityKgM3(temperatures[i + 1]));
      const exchangeRate = interfaceDepth <= mixedDepth ? exchangeFraction : 0.004;
      const exchange = (temperatures[i] - temperatures[i + 1]) * exchangeRate /
        (1 + densityDifference * 20);
      temperatures[i] -= exchange;
      temperatures[i + 1] += exchange;
    }
    temperatures = mixConvectivelyUnstableLayers(temperatures);
    const sampleTimeMs = Date.parse(sample.time);
    validObservations.forEach((observation, index) => {
      if (usedObservationIndices.has(index) || Math.abs(Date.parse(observation.time) - sampleTimeMs) > 30 * 60 * 1000) return;
      let nearestLayer = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let layer = 0; layer < WATER_COLUMN_LAYER_COUNT; layer++) {
        const centerDepth = (layer + 0.5) * layerThickness;
        const distance = Math.abs(centerDepth - observation.depthM);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestLayer = layer;
        }
      }
      // A measurement anchors only its actual vertical layer, never the full column.
      temperatures[nearestLayer] = observation.temperatureC;
      usedObservationIndices.add(index);
    });
    iceThicknessM = clamp(iceThicknessM, 0, 2);
  }

  const layers = temperatures.map((temperatureC, index) => ({
    topDepthM: index * layerThickness,
    bottomDepthM: (index + 1) * layerThickness,
    centerDepthM: (index + 0.5) * layerThickness,
    temperatureC: Math.round(temperatureC * 100) / 100,
    densityKgM3: Math.round(freshwaterDensityKgM3(temperatureC) * 1000) / 1000,
  }));
  const volumeMeanTemperatureC = temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length;
  return {
    layers,
    surfaceTemperatureC: layers[0].temperatureC,
    bottomTemperatureC: layers[layers.length - 1].temperatureC,
    volumeMeanTemperatureC: Math.round(volumeMeanTemperatureC * 100) / 100,
    iceThicknessM: Math.round(iceThicknessM * 1000) / 1000,
    forcingHoursUsed: accepted.length,
    forcingHoursRejected: rejected,
    surfaceEnergyInputJm2: Math.round(surfaceEnergyInputJm2),
    measurementAnchorsUsed: usedObservationIndices.size,
    measurementAnchorsRejected: observations.length - usedObservationIndices.size,
  };
}


export interface WaterColumnPredictionInput {
  totalDepthM?: number | null;
  targetDepthM?: number | null;
  forcing: WaterColumnForcingSample[];
  observations?: WaterColumnObservation[];
  targetTime: string;
  asOf?: string;
}
export interface WaterColumnPrediction {
  status: 'low_confidence' | 'scenario_converged';
  scenarioConverged: boolean;
  estimatedTemperatureC: number;
  estimatedRangeC: [number, number];
  surfaceTemperatureC: number;
  bottomTemperatureC: number;
  volumeMeanTemperatureC: number;
  layerTemperaturesC: number[];
  totalDepthM: number;
  depthPriorUsed: boolean;
  targetDepthM: number | null;
  spinupDays: number;
  forcingCoverageRatio: number;
  scenarioSpreadC: number;
  measurementAnchorsUsed: number;
  measurementAnchorsRejected: number;
}

/**
 * Best-effort multi-initial-condition spin-up. The range is the spread between
 * physically plausible starting profiles, not a statistically calibrated interval.
 */
export function estimateWaterColumnTemperature(input: WaterColumnPredictionInput): WaterColumnPrediction | null {
  const targetMs = Date.parse(input.targetTime);
  if (!Number.isFinite(targetMs)) throw new Error('targetTime must be a valid timestamp');
  const depthPriorUsed = !(typeof input.totalDepthM === 'number' &&
    Number.isFinite(input.totalDepthM) && input.totalDepthM >= 0.2 && input.totalDepthM <= 100);
  const totalDepthM = depthPriorUsed ? 1.5 : input.totalDepthM as number;
  const targetDepthM = typeof input.targetDepthM === 'number' && Number.isFinite(input.targetDepthM) &&
    input.targetDepthM >= 0 && input.targetDepthM <= totalDepthM ? input.targetDepthM : null;
  const { accepted } = validForcing(input.forcing, input.targetTime, input.asOf);
  if (accepted.length === 0) return null;
  const firstTimeMs = Date.parse(accepted[0].time);
  const lastTimeMs = Date.parse(accepted[accepted.length - 1].time);
  const targetTimeCovered = targetMs - lastTimeMs <= 90 * 60 * 1000;
  if (!targetTimeCovered) return null;
  const spinupDays = Math.max(0, (targetMs - firstTimeMs) / 86400000);
  const expectedHours = Math.max(1, (targetMs - firstTimeMs) / 3600000 + 1);
  const forcingCoverageRatio = Math.min(1, accepted.length / expectedHours);
  const profiles = [
    [4, 4, 4, 4, 4],
    [12, 12, 12, 12, 12],
    [20, 20, 20, 20, 20],
    [20, 16, 12, 8, 5],
    [0.5, 1, 2, 3, 4],
  ];
  const simulations = profiles.map((initialLayerTemperaturesC) => simulateWaterColumn({
    totalDepthM,
    initialLayerTemperaturesC,
    forcing: accepted,
    observations: input.observations,
    targetTime: input.targetTime,
    asOf: input.asOf,
  }));
  const sampleAtDepth = (layers: WaterColumnLayer[]): number => {
    if (targetDepthM === null) return layers.reduce((sum, layer) => sum + layer.temperatureC, 0) / layers.length;
    if (targetDepthM <= layers[0].centerDepthM) return layers[0].temperatureC;
    if (targetDepthM >= layers[layers.length - 1].centerDepthM) return layers[layers.length - 1].temperatureC;
    const upperIndex = layers.findIndex((layer) => layer.centerDepthM >= targetDepthM);
    const lower = layers[upperIndex - 1];
    const upper = layers[upperIndex];
    const fraction = (targetDepthM - lower.centerDepthM) / (upper.centerDepthM - lower.centerDepthM);
    return lower.temperatureC + (upper.temperatureC - lower.temperatureC) * fraction;
  };
  const targetValues = simulations.map((simulation) => sampleAtDepth(simulation.layers));
  const minTemperature = Math.min(...targetValues);
  const maxTemperature = Math.max(...targetValues);
  const estimatedTemperatureC = targetValues.reduce((sum, value) => sum + value, 0) / targetValues.length;
  const layerTemperaturesC = simulations[0].layers.map((_, index) =>
    simulations.reduce((sum, simulation) => sum + simulation.layers[index].temperatureC, 0) / simulations.length);
  const scenarioSpreadC = maxTemperature - minTemperature;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const scenarioConverged = !depthPriorUsed && spinupDays >= 300 &&
    forcingCoverageRatio >= 0.9 && scenarioSpreadC <= 1;
  const measurementAnchorsUsed = Math.min(...simulations.map((simulation) => simulation.measurementAnchorsUsed));
  const measurementAnchorsRejected = Math.max(...simulations.map((simulation) => simulation.measurementAnchorsRejected));
  return {
    status: scenarioConverged ? 'scenario_converged' : 'low_confidence',
    scenarioConverged,
    estimatedTemperatureC: Math.round(estimatedTemperatureC * 100) / 100,
    estimatedRangeC: [Math.round(minTemperature * 100) / 100, Math.round(maxTemperature * 100) / 100],
    surfaceTemperatureC: Math.round(mean(simulations.map((simulation) => simulation.surfaceTemperatureC)) * 100) / 100,
    bottomTemperatureC: Math.round(mean(simulations.map((simulation) => simulation.bottomTemperatureC)) * 100) / 100,
    volumeMeanTemperatureC: Math.round(mean(simulations.map((simulation) => simulation.volumeMeanTemperatureC)) * 100) / 100,
    layerTemperaturesC: layerTemperaturesC.map((value) => Math.round(value * 100) / 100),
    totalDepthM,
    depthPriorUsed,
    targetDepthM,
    spinupDays: Math.round(spinupDays * 10) / 10,
    forcingCoverageRatio: Math.round(forcingCoverageRatio * 1000) / 1000,
    scenarioSpreadC: Math.round(scenarioSpreadC * 100) / 100,
    measurementAnchorsUsed,
    measurementAnchorsRejected,
  };
}
