import type { FishingLocation, FishingSession, PrognosisSnapshot } from '../types';
import type { WaterColumnPrediction } from './waterColumnModel';

const TARGET_TIME_TOLERANCE_MS = 90 * 60 * 1000;

interface ActualWaterMeasurement {
  key: string;
  sessionId: string;
  locationId: string;
  temperatureC: number;
  measuredAt: string;
  recordedAt: string;
  measurementDepthM: number | null;
  measurementSource: string;
  measurementMethod: string;
}

export interface WaterColumnValidationSample {
  measurementKey: string;
  sessionId: string;
  locationId: string;
  waterType: string;
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  measurementDepthM: number;
  totalDepthM: number;
  targetTime: string;
  asOf: string;
  forecastLeadHours: number;
  predictedTemperatureC: number;
  observedTemperatureC: number;
  errorC: number;
  absoluteErrorC: number;
  scenarioSpreadC: number;
  scenarioSpreadBasis: 'volume_mean' | 'target_depth';
  forcingCoverageRatio: number;
  spinupDays: number;
  scenarioConverged: boolean;
}

export interface WaterColumnValidationMetrics {
  sampleCount: number;
  uniqueSessionCount: number;
  maeC: number;
  rmseC: number;
  biasC: number;
  meanScenarioSpreadC: number;
  meanForcingCoverageRatio: number;
  meanSpinupDays: number;
  convergedSampleCount: number;
}

export interface WaterColumnEmpiricalValidationReport {
  status: 'no_comparable_measurements' | 'descriptive_only';
  generatedAt: string;
  matchingRule: string;
  candidateMeasurementCount: number;
  shadowPredictionCount: number;
  evaluatedSampleCount: number;
  exclusions: {
    invalidMeasurements: number;
    missingRecordedAt: number;
    noShadowPredictionForLocation: number;
    targetTimeMismatch: number;
    hindsightLeakage: number;
    unknownMeasurementDepth: number;
    invalidDepthOrProfile: number;
    depthPriorUsed: number;
  };
  overall: WaterColumnValidationMetrics | null;
  bySeason: Record<string, WaterColumnValidationMetrics>;
  byWaterType: Record<string, WaterColumnValidationMetrics>;
  byMeasurementDepth: Record<string, WaterColumnValidationMetrics>;
  samples: WaterColumnValidationSample[];
  limitations: string[];
}

function parseTime(value: string | undefined | null): number | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSeason(timestamp: string): WaterColumnValidationSample['season'] {
  const month = Number(new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Amsterdam',
    month: 'numeric',
  }).format(new Date(timestamp)));
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

function getDepthBand(depthM: number): string {
  if (depthM <= 0.5) return '0–0.5 m';
  if (depthM <= 1.5) return '>0.5–1.5 m';
  return '>1.5 m';
}

function collectMeasurements(sessions: FishingSession[]): {
  measurements: ActualWaterMeasurement[];
  invalidCount: number;
  missingRecordedAt: number;
} {
  const measurements: ActualWaterMeasurement[] = [];
  let invalidCount = 0;
  let missingRecordedAt = 0;
  for (const session of sessions) {
    if (!session.locationId || session.isBenchmark === true) continue;
    const events = session.waterTemperatureMeasurements ?? [];
    const candidates = events.length > 0 ? events : [{
      id: session.id,
      locationId: session.locationId,
      temperatureC: session.waterTemperature,
      measuredAt: session.waterTemperatureMeasuredAt ?? null,
      recordedAt: session.updatedAt || session.createdAt,
      measurementDepthM: session.waterTemperatureMeasurementDepthM,
      measurementSource: session.waterTemperatureMeasurementSource ?? 'unknown',
      measurementMethod: session.waterTemperatureMeasurementMethod ?? 'unknown',
    }];
    for (const measurement of candidates) {
      if (typeof measurement.temperatureC !== 'number' ||
          !Number.isFinite(measurement.temperatureC) ||
          measurement.temperatureC < 0 || measurement.temperatureC > 40 ||
          !measurement.measuredAt || parseTime(measurement.measuredAt) === null ||
          !measurement.measurementSource || measurement.measurementSource === 'unknown' ||
          !measurement.measurementMethod || measurement.measurementMethod === 'unknown') {
        invalidCount++;
        continue;
      }
      if (!measurement.recordedAt || parseTime(measurement.recordedAt) === null) {
        missingRecordedAt++;
        continue;
      }
      if ((parseTime(measurement.recordedAt) as number) < (parseTime(measurement.measuredAt) as number)) {
        invalidCount++;
        continue;
      }
      measurements.push({
        key: measurement.id ? `${session.id}|${measurement.id}` :
          `${session.id}|${measurement.measuredAt}|${measurement.temperatureC}`,
        sessionId: session.id,
        locationId: measurement.locationId || session.locationId,
        temperatureC: measurement.temperatureC,
        measuredAt: measurement.measuredAt,
        recordedAt: measurement.recordedAt,
        measurementDepthM: typeof measurement.measurementDepthM === 'number' &&
          Number.isFinite(measurement.measurementDepthM) ? measurement.measurementDepthM : null,
        measurementSource: measurement.measurementSource,
        measurementMethod: measurement.measurementMethod,
      });
    }
  }
  return { measurements, invalidCount, missingRecordedAt };
}

function getPrediction(snapshot: PrognosisSnapshot): WaterColumnPrediction | null {
  const prediction = snapshot.prognosisData?.thermalAnalysis?.waterColumnPrediction;
  return prediction && Array.isArray(prediction.layerTemperaturesC) ? prediction : null;
}

function temperatureAtDepth(prediction: WaterColumnPrediction, depthM: number): number | null {
  const layers = prediction.layerTemperaturesC;
  const depth = prediction.totalDepthM;
  if (layers.length !== 5 || !Number.isFinite(depth) || depth <= 0 ||
      !Number.isFinite(depthM) || depthM < 0 || depthM > depth ||
      layers.some((value) => !Number.isFinite(value) || value < 0 || value > 40)) return null;
  const thickness = depth / layers.length;
  const centers = layers.map((_, index) => (index + 0.5) * thickness);
  if (depthM <= centers[0]) return layers[0];
  if (depthM >= centers[centers.length - 1]) return layers[layers.length - 1];
  const upperIndex = centers.findIndex((center) => center >= depthM);
  const lowerIndex = upperIndex - 1;
  const fraction = (depthM - centers[lowerIndex]) / (centers[upperIndex] - centers[lowerIndex]);
  return layers[lowerIndex] + (layers[upperIndex] - layers[lowerIndex]) * fraction;
}

function summarize(samples: WaterColumnValidationSample[]): WaterColumnValidationMetrics | null {
  if (samples.length === 0) return null;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const errors = samples.map((sample) => sample.errorC);
  return {
    sampleCount: samples.length,
    uniqueSessionCount: new Set(samples.map((sample) => sample.sessionId)).size,
    maeC: mean(samples.map((sample) => sample.absoluteErrorC)),
    rmseC: Math.sqrt(mean(errors.map((error) => error * error))),
    biasC: mean(errors),
    meanScenarioSpreadC: mean(samples.map((sample) => sample.scenarioSpreadC)),
    meanForcingCoverageRatio: mean(samples.map((sample) => sample.forcingCoverageRatio)),
    meanSpinupDays: mean(samples.map((sample) => sample.spinupDays)),
    convergedSampleCount: samples.filter((sample) => sample.scenarioConverged).length,
  };
}

/**
 * Evaluates only saved, pre-measurement shadow forecasts against physical session
 * readings at the same location, near the exact target time, and at a known depth.
 * The scenario envelope is descriptive, not a calibrated confidence interval.
 */
export function evaluateWaterColumnEmpiricalValidation(
  sessions: FishingSession[],
  snapshots: PrognosisSnapshot[],
  locations: FishingLocation[]
): WaterColumnEmpiricalValidationReport {
  const { measurements, invalidCount, missingRecordedAt } = collectMeasurements(sessions);
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const predictions = snapshots.flatMap((snapshot) => {
    const prediction = getPrediction(snapshot);
    if (!prediction || !snapshot.locationId) return [];
    return [{ snapshot, prediction }];
  });
  const exclusions = {
    invalidMeasurements: invalidCount,
    missingRecordedAt,
    noShadowPredictionForLocation: 0,
    targetTimeMismatch: 0,
    hindsightLeakage: 0,
    unknownMeasurementDepth: 0,
    invalidDepthOrProfile: 0,
    depthPriorUsed: 0,
  };
  const samples: WaterColumnValidationSample[] = [];
  const usedMeasurementKeys = new Set<string>();

  for (const measurement of measurements) {
    if (usedMeasurementKeys.has(measurement.key)) continue;
    const location = locationById.get(measurement.locationId);
    const locationPredictions = predictions.filter(({ snapshot }) => snapshot.locationId === measurement.locationId);
    if (locationPredictions.length === 0) {
      exclusions.noShadowPredictionForLocation++;
      continue;
    }
    const measuredAtMs = parseTime(measurement.measuredAt) as number;
    const matchingTime = locationPredictions.filter(({ prediction }) => {
      const targetMs = parseTime(prediction.targetTime);
      return targetMs !== null && Math.abs(targetMs - measuredAtMs) <= TARGET_TIME_TOLERANCE_MS;
    });
    if (matchingTime.length === 0) {
      exclusions.targetTimeMismatch++;
      continue;
    }
    if (measurement.measurementDepthM === null) {
      exclusions.unknownMeasurementDepth++;
      continue;
    }
    const safe = matchingTime.filter(({ snapshot, prediction }) => {
      const asOfMs = parseTime(prediction.asOf);
      const forecastMs = parseTime(snapshot.forecastTimestamp);
      const snapshotCreatedMs = parseTime(snapshot.createdAt);
      const recordedMs = parseTime(measurement.recordedAt);
      if (asOfMs === null || forecastMs === null || snapshotCreatedMs === null ||
          recordedMs === null ||
          // The forcing must already have been available when the forecast was made
          // and no later than the immutable snapshot creation moment.
          asOfMs > forecastMs || asOfMs > snapshotCreatedMs || forecastMs > snapshotCreatedMs ||
          asOfMs > measuredAtMs || forecastMs > measuredAtMs || snapshotCreatedMs > measuredAtMs ||
          recordedMs < measuredAtMs ||
          recordedMs <= Math.max(asOfMs, forecastMs, snapshotCreatedMs)) return false;
      return true;
    });
    if (safe.length === 0) {
      exclusions.hindsightLeakage++;
      continue;
    }
    safe.sort((a, b) => {
      const aAsOf = parseTime(a.prediction.asOf) as number;
      const bAsOf = parseTime(b.prediction.asOf) as number;
      return aAsOf - bAsOf;
    });
    const { snapshot, prediction } = safe[0];
    if (prediction.depthPriorUsed) {
      exclusions.depthPriorUsed++;
      continue;
    }
    const totalDepth = location?.waterDepth;
    if (typeof totalDepth !== 'number' || !Number.isFinite(totalDepth) ||
        Math.abs(totalDepth - prediction.totalDepthM) > 0.05 ||
        measurement.measurementDepthM < 0 || measurement.measurementDepthM > prediction.totalDepthM) {
      exclusions.invalidDepthOrProfile++;
      continue;
    }
    const predicted = temperatureAtDepth(prediction, measurement.measurementDepthM);
    if (predicted === null) {
      exclusions.invalidDepthOrProfile++;
      continue;
    }
    const asOf = prediction.asOf as string;
    const targetTime = prediction.targetTime;
    const errorC = predicted - measurement.temperatureC;
      samples.push({
      measurementKey: measurement.key,
      sessionId: measurement.sessionId,
      locationId: measurement.locationId,
      waterType: location?.waterType ?? 'Onbekend',
      season: getSeason(measurement.measuredAt),
      measurementDepthM: measurement.measurementDepthM,
      totalDepthM: prediction.totalDepthM,
      targetTime,
      asOf,
      forecastLeadHours: (measuredAtMs - (parseTime(asOf) as number)) / 3600000,
      predictedTemperatureC: predicted,
      observedTemperatureC: measurement.temperatureC,
      errorC,
      absoluteErrorC: Math.abs(errorC),
      scenarioSpreadC: prediction.scenarioSpreadC,
      scenarioSpreadBasis: prediction.targetDepthM === null ? 'volume_mean' : 'target_depth',
      forcingCoverageRatio: prediction.forcingCoverageRatio,
      spinupDays: prediction.spinupDays,
      scenarioConverged: prediction.scenarioConverged,
    });
    usedMeasurementKeys.add(measurement.key);
  }

  const group = (keyOf: (sample: WaterColumnValidationSample) => string) => {
    const grouped: Record<string, WaterColumnValidationSample[]> = {};
    samples.forEach((sample) => {
      const key = keyOf(sample);
      (grouped[key] ??= []).push(sample);
    });
    return Object.fromEntries(Object.entries(grouped)
      .map(([key, items]) => [key, summarize(items)!]));
  };
  const overall = summarize(samples);
  return {
    status: samples.length > 0 ? 'descriptive_only' : 'no_comparable_measurements',
    generatedAt: new Date().toISOString(),
    matchingRule: 'Zelfde stek; meetmoment binnen 90 minuten van de opgeslagen voorspeltijd; bekende meetdiepte; voorspelling en snapshot vóór registratie van de meting; vroegste beschikbare as-of-voorspelling per fysieke meting.',
    candidateMeasurementCount: measurements.length,
    shadowPredictionCount: predictions.length,
    evaluatedSampleCount: samples.length,
    exclusions,
    overall,
    bySeason: group((sample) => sample.season),
    byWaterType: group((sample) => sample.waterType),
    byMeasurementDepth: group((sample) => getDepthBand(sample.measurementDepthM)),
    samples,
    limitations: [
      'Dit is een evaluatie van opgeslagen voorspellingen, geen retrospectieve herberekening met achteraf bekende weersdata.',
      'Een voorspelling wordt alleen vergeleken met een echte meting op dezelfde stek, binnen 90 minuten van het doelmoment en op een bekende meetdiepte.',
      'De scenario-spreiding hoort bij de door de prognose gevraagde scalar (in de huidige app het volumegewogen gemiddelde); zij is niet de dieptespecifieke spreiding bij de meetdiepte en is geen statistisch betrouwbaarheidsinterval.',
      'Metingen uit dezelfde sessie/kolom zijn gecorreleerd; sampleCount is daarom niet gelijk aan het aantal onafhankelijke waterlichamen.',
      'Uitkomsten zijn beschrijvend. Er wordt geen universele nauwkeurigheidsclaim of automatische score-activatie afgeleid.',
    ],
  };
}
