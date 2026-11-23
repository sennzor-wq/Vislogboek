import { DayPrognosis, TimeSlot, WeatherHourlyForecast } from '../types';
import { PrognosisIntervalSegmentation, segmentPrognosisInterval } from './prognosisIntervalEngine';

export type IntervalValue<T> =
  | { status: 'available'; value: T }
  | { status: 'unknown'; value: null; reason: 'missing_forecast' | 'invalid_value' };

export interface PrognosisIntervalSegmentOutput {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  targetDate: string;
  timeSlot: TimeSlot;
  weatherRecordStatus: 'available' | 'missing';
  weatherSampleTime: string | null;
  /** Raw, individually validated forecast context; these values are not factor scores. */
  weatherContext: {
    airTemperatureC: IntervalValue<number>;
    pressureHpa: IntervalValue<number>;
    wind: IntervalValue<{ speedKmh: number; directionDegrees: number; directionLabel: string }>;
    precipitationMm: IntervalValue<number>;
    cloudCoverPercent: IntervalValue<number>;
  };
  /** Explicitly prevents descriptive samples from being mistaken for validated factor outputs. */
  factorResolution: {
    thermalActivity: 'not_calculated_per_segment';
    absolutePressure: 'existing_time_slot_only';
    pressureTrend: 'requires_timepoint_lookback';
    wind: 'descriptive_only';
    precipitation: 'descriptive_only';
    cloudCover: 'descriptive_only';
  };
}

export interface PrognosisIntervalOutput {
  status: PrognosisIntervalSegmentation['status'];
  intervalStart: string | null;
  intervalEnd: string | null;
  totalDurationMinutes: number | null;
  coveredDurationMinutes: number | null;
  uncoveredDurationMinutes: number | null;
  temporalCoverageRatio: number | null;
  dayContext: {
    activityScore: number | null;
    activityScoreAvailable: boolean;
    advice: DayPrognosis['advice'];
    bestTimeSlot: DayPrognosis['bestTimeSlot'];
  };
  startContext: { selectedTimeSlot: TimeSlot | null };
  sessionContext: {
    plannedDurationHours: number | null;
    personalCatchChance: number | null;
    personalCatchConfidence: DayPrognosis['personalCatchConfidence'];
  };
  segments: PrognosisIntervalSegmentOutput[];
}

function numericValue(value: unknown, min: number, max: number, hasForecast: boolean): IntervalValue<number> {
  if (!hasForecast) return { status: 'unknown', value: null, reason: 'missing_forecast' };
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    return { status: 'unknown', value: null, reason: 'invalid_value' };
  }
  return { status: 'available', value };
}

function mapSegment(segment: PrognosisIntervalSegmentation['segments'][number]): PrognosisIntervalSegmentOutput {
  const sample = segment.weatherSample;
  const hasForecast = sample !== null;
  const windValid = Boolean(sample) &&
    typeof sample!.windSpeed === 'number' && Number.isFinite(sample!.windSpeed) && sample!.windSpeed >= 0 && sample!.windSpeed <= 200 &&
    typeof sample!.windDirection === 'number' && Number.isFinite(sample!.windDirection) && sample!.windDirection >= 0 && sample!.windDirection <= 360 &&
    typeof sample!.windDirectionText === 'string' && sample!.windDirectionText.trim().length > 0;

  return {
    startTime: segment.startTime,
    endTime: segment.endTime,
    durationMinutes: segment.durationMinutes,
    targetDate: segment.targetDate,
    timeSlot: segment.timeSlot,
    weatherRecordStatus: hasForecast ? 'available' : 'missing',
    weatherSampleTime: segment.weatherSampleTime,
    weatherContext: {
      airTemperatureC: numericValue(sample?.temperature, -30, 55, hasForecast),
      pressureHpa: numericValue(sample?.pressure, 850, 1100, hasForecast),
      wind: !hasForecast
        ? { status: 'unknown', value: null, reason: 'missing_forecast' }
        : windValid
          ? { status: 'available', value: { speedKmh: sample!.windSpeed, directionDegrees: sample!.windDirection, directionLabel: sample!.windDirectionText.trim() } }
          : { status: 'unknown', value: null, reason: 'invalid_value' },
      precipitationMm: numericValue(sample?.precipitation, 0, 300, hasForecast),
      cloudCoverPercent: numericValue(sample?.cloudCover, 0, 100, hasForecast),
    },
    factorResolution: {
      thermalActivity: 'not_calculated_per_segment',
      absolutePressure: 'existing_time_slot_only',
      pressureTrend: 'requires_timepoint_lookback',
      wind: 'descriptive_only',
      precipitation: 'descriptive_only',
      cloudCover: 'descriptive_only',
    },
  };
}

/**
 * Backward-compatible presentation adapter. It reuses the existing day prognosis
 * and pure interval segmentation; it does not run a second forecast engine.
 */
export function buildPrognosisIntervalOutput(
  segmentation: PrognosisIntervalSegmentation,
  dayPrognosis: DayPrognosis,
  selectedStartTimeSlot: TimeSlot | null
): PrognosisIntervalOutput {
  const plannedDurationHours = dayPrognosis.plannedDurationHours ?? null;
  return {
    status: segmentation.status,
    intervalStart: segmentation.intervalStart,
    intervalEnd: segmentation.intervalEnd,
    totalDurationMinutes: segmentation.totalDurationMinutes,
    coveredDurationMinutes: segmentation.coveredDurationMinutes,
    uncoveredDurationMinutes: segmentation.uncoveredDurationMinutes,
    temporalCoverageRatio: segmentation.coverageRatio,
    dayContext: {
      activityScore: dayPrognosis.activityScoreAvailable === false ? null : dayPrognosis.activityScore,
      activityScoreAvailable: dayPrognosis.activityScoreAvailable !== false,
      advice: dayPrognosis.advice,
      bestTimeSlot: dayPrognosis.bestTimeSlot,
    },
    startContext: { selectedTimeSlot: selectedStartTimeSlot },
    sessionContext: {
      plannedDurationHours,
      personalCatchChance: plannedDurationHours === null ? null : dayPrognosis.personalCatchChance,
      personalCatchConfidence: dayPrognosis.personalCatchConfidence,
    },
    segments: segmentation.segments.map(mapSegment),
  };
}

/** Convenience entry point used by the Prognose/VisCoach boundary. */
export function createPrognosisIntervalOutput(
  targetWindowStart: string,
  targetWindowEnd: string | null | undefined,
  forecasts: WeatherHourlyForecast[],
  dayPrognosis: DayPrognosis,
  selectedStartTimeSlot: TimeSlot | null
): PrognosisIntervalOutput {
  return buildPrognosisIntervalOutput(
    segmentPrognosisInterval(targetWindowStart, targetWindowEnd, forecasts),
    dayPrognosis,
    selectedStartTimeSlot
  );
}
