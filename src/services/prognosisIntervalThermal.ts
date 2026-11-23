import { FishSpecies, WeatherHourlyForecast } from '../types';
import { PrognosisIntervalSegmentation } from './prognosisIntervalEngine';
import { analyzeWaterThermalDevelopment, ThermalAnalysisOptions } from './waterThermalEngine';
import { calculateThermalEfficiency, SPECIES_PROFILES } from './fishProfiles';

export interface ThermalIntervalSegmentCandidate {
  targetTime: string;
  targetDate: string;
  durationMinutes: number;
  status: 'available' | 'unknown';
  unknownReason: 'missing_temperature' | null;
  thermalSource: 'measured' | 'estimated_from_measurement' | 'estimated_from_history' | 'estimated_from_weather' | null;
  estimatedWaterTempC: number | null;
  estimatedRangeC: [number, number] | null;
  uncertaintyC: number | null;
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
  options: ThermalAnalysisOptions = {}
): ThermalIntervalCandidateOutput {
  const profile = SPECIES_PROFILES[species];
  const segments = segmentation.segments.map((segment): ThermalIntervalSegmentCandidate => {
    const thermal = analyzeWaterThermalDevelopment(segment.targetDate, forecasts, {
      ...options,
      targetTime: segment.startTime,
    });
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
        estimatedWaterTempC: null,
        estimatedRangeC: null,
        uncertaintyC: null,
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
      estimatedWaterTempC: temperature,
      estimatedRangeC: thermal.estimatedRange ?? null,
      uncertaintyC: thermal.uncertaintyC ?? null,
      thermalEfficiency: efficiency,
      candidateActivityScore: Math.round((1 + 9 * Math.pow(efficiency, 0.85)) * 10) / 10,
    };
  });

  return { status: segmentation.status, segments };
}
