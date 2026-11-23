import { FishSpecies, WeatherHourlyForecast } from '../types';
import { PrognosisIntervalSegmentation } from './prognosisIntervalEngine';
import { analyzeWaterThermalDevelopment, ThermalAnalysisOptions } from './waterThermalEngine';
import { calculateThermalEfficiency, SPECIES_PROFILES } from './fishProfiles';

export interface ThermalIntervalCandidateOptions extends ThermalAnalysisOptions {
  /** The same validated local seasonal correction used by the day/time-slot prognosis. */
  waterTemperatureCalibration?: {
    appliedCorrectionC: number;
    sampleCount: number;
    season: 'winter' | 'lente' | 'zomer' | 'herfst';
  } | null;
}

export interface ThermalIntervalSegmentCandidate {
  targetTime: string;
  targetDate: string;
  durationMinutes: number;
  status: 'available' | 'unknown';
  unknownReason: 'missing_temperature' | null;
  thermalSource: 'measured' | 'estimated_from_measurement' | 'estimated_from_history' | 'estimated_from_weather' | null;
  waterTemperatureC: number | null;
  waterTemperatureRangeC: [number, number] | null;
  uncertaintyC: number | null;
  thermalCalibration: ThermalIntervalCandidateOptions['waterTemperatureCalibration'];
  thermalEfficiency: number | null;
  /** Candidate on the existing 1–10 thermic scale; not a measured activity or catch chance. */
  candidateActivityScore: number | null;
}

export interface ThermalIntervalCandidateOutput {
  status: PrognosisIntervalSegmentation['status'];
  segments: ThermalIntervalSegmentCandidate[];
}

/**
 * Calculates a read-only thermic candidate for each known interval segment.
 * Every segment is evaluated independently at its exact absolute start instant,
 * while reusing the existing chronological water-thermal engine and species prior.
 * No weather factor other than its existing role in water-temperature estimation
 * is added to the biological candidate score.
 */
export function calculateThermalIntervalCandidates(
  segmentation: PrognosisIntervalSegmentation,
  forecasts: WeatherHourlyForecast[],
  species: FishSpecies,
  options: ThermalIntervalCandidateOptions = {}
): ThermalIntervalCandidateOutput {
  const { waterTemperatureCalibration, ...thermalOptions } = options;
  const profile = SPECIES_PROFILES[species];
  const segments = segmentation.segments.map((segment): ThermalIntervalSegmentCandidate => {
    const thermal = analyzeWaterThermalDevelopment(segment.targetDate, forecasts, {
      ...thermalOptions,
      targetTime: segment.startTime,
    });

    // Match the existing day/time-slot prognosis: apply only a validated local
    // correction to a modelled temperature, never to a direct measurement or
    // an unavailable thermal result.
    if (
      waterTemperatureCalibration &&
      !thermal.hasMeasuredWaterTemp &&
      thermal.trendConfidence !== 'Onvoldoende gegevens' &&
      typeof thermal.estimatedWaterTemp === 'number'
    ) {
      const correction = waterTemperatureCalibration.appliedCorrectionC;
      thermal.estimatedWaterTemp = Math.round((thermal.estimatedWaterTemp - correction) * 10) / 10;
      if (thermal.estimatedRange) {
        thermal.estimatedRange = [
          Math.round((thermal.estimatedRange[0] - correction) * 10) / 10,
          Math.round((thermal.estimatedRange[1] - correction) * 10) / 10,
        ];
      }
      thermal.calibration = waterTemperatureCalibration;
    }
    const temperature = thermal.hasMeasuredWaterTemp
      ? thermal.measuredWaterTemp
      : thermal.estimatedWaterTemp;
    const source = thermal.waterTemperatureStatus ?? 'unknown';

    if (temperature === null || !Number.isFinite(temperature) || source === 'unknown') {
      return {
        targetTime: segment.startTime,
        targetDate: segment.targetDate,
        durationMinutes: segment.durationMinutes,
        status: 'unknown',
        unknownReason: 'missing_temperature',
        thermalSource: null,
        waterTemperatureC: null,
        waterTemperatureRangeC: null,
        uncertaintyC: null,
        thermalCalibration: null,
        thermalEfficiency: null,
        candidateActivityScore: null,
      };
    }

    const efficiency = calculateThermalEfficiency(temperature, profile).efficiency;
    return {
      targetTime: segment.startTime,
      targetDate: segment.targetDate,
      durationMinutes: segment.durationMinutes,
      status: 'available',
      unknownReason: null,
      thermalSource: source,
      waterTemperatureC: temperature,
      waterTemperatureRangeC: thermal.estimatedRange ?? null,
      uncertaintyC: thermal.uncertaintyC ?? null,
      thermalCalibration: thermal.calibration ?? null,
      thermalEfficiency: efficiency,
      candidateActivityScore: Math.round((1 + 9 * Math.pow(efficiency, 0.85)) * 10) / 10,
    };
  });

  return { status: segmentation.status, segments };
}
