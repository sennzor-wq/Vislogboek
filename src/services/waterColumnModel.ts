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
}
export interface WaterColumnModelInput {
  totalDepthM: number;
  initialLayerTemperaturesC: number[];
  forcing: WaterColumnForcingSample[];
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
  const mixed = temperaturesC.map((value) => Math.max(0, value));
  for (let pass = 0; pass < mixed.length * 2; pass++) {
    let changed = false;
    for (let i = 0; i < mixed.length - 1; i++) {
      if (freshwaterDensityKgM3(mixed[i]) > freshwaterDensityKgM3(mixed[i + 1]) + 1e-7) {
        const average = (mixed[i] + mixed[i + 1]) / 2;
        mixed[i] = average;
        mixed[i + 1] = average;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return mixed;
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
  };
}
