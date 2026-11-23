import { TimeSlot, WeatherHourlyForecast } from '../types';
import { getAmsterdamDateKey, getAmsterdamTimeSlot, parseAppTimestamp } from '../utils/dateTime';

const HOUR_MS = 60 * 60 * 1000;
const MAX_INTERVAL_MS = 24 * HOUR_MS;

export type PrognosisIntervalSegmentationStatus =
  | 'complete'
  | 'partial'
  | 'unknown_end'
  | 'invalid_interval';

export interface PrognosisIntervalSegment {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  targetDate: string;
  timeSlot: TimeSlot;
  weatherAvailable: boolean;
  /** Forecast sample whose absolute hour bucket contains this segment. */
  weatherSampleTime: string | null;
  weatherSample: WeatherHourlyForecast | null;
}

export interface PrognosisIntervalSegmentation {
  status: PrognosisIntervalSegmentationStatus;
  intervalStart: string | null;
  intervalEnd: string | null;
  totalDurationMinutes: number | null;
  coveredDurationMinutes: number | null;
  uncoveredDurationMinutes: number | null;
  coverageRatio: number | null;
  segments: PrognosisIntervalSegment[];
}

function emptyResult(
  status: 'unknown_end' | 'invalid_interval',
  intervalStart: string | null = null,
  intervalEnd: string | null = null
): PrognosisIntervalSegmentation {
  return {
    status,
    intervalStart,
    intervalEnd,
    totalDurationMinutes: null,
    coveredDurationMinutes: null,
    uncoveredDurationMinutes: null,
    coverageRatio: null,
    segments: [],
  };
}

/**
 * Splits a known planned fishing interval into absolute hourly forecast buckets.
 *
 * Forecast samples represent the absolute hour beginning at sample.time and are
 * never extended across a missing hour. Partial first/last hours retain their
 * real overlap duration. Amsterdam date/time-slot labels are derived from each
 * segment's absolute start instant; this also handles 23/25-hour DST days.
 *
 * This helper reports temporal/weather coverage only. It does not calculate a
 * biological score, interpolate missing weather, or invent a duration.
 */
export function segmentPrognosisInterval(
  targetWindowStart: string,
  targetWindowEnd: string | null | undefined,
  forecasts: WeatherHourlyForecast[]
): PrognosisIntervalSegmentation {
  const start = parseAppTimestamp(targetWindowStart);
  if (!start) return emptyResult('invalid_interval');
  const startMs = start.getTime();
  const normalizedStart = start.toISOString();

  if (targetWindowEnd === null || targetWindowEnd === undefined || targetWindowEnd === '') {
    return emptyResult('unknown_end', normalizedStart, null);
  }

  const end = parseAppTimestamp(targetWindowEnd);
  if (!end) return emptyResult('invalid_interval', normalizedStart, null);
  const endMs = end.getTime();
  const durationMs = endMs - startMs;
  if (durationMs <= 0 || durationMs > MAX_INTERVAL_MS) {
    return emptyResult('invalid_interval', normalizedStart, end.toISOString());
  }

  // Only exact absolute-hour samples are eligible. Duplicate timestamps are
  // ambiguous and therefore treated as missing instead of choosing arbitrarily.
  const forecastByHour = new Map<number, WeatherHourlyForecast | null>();
  for (const forecast of forecasts) {
    const timestampMs = parseAppTimestamp(forecast.time)?.getTime() ?? Number.NaN;
    if (!Number.isFinite(timestampMs) || timestampMs % HOUR_MS !== 0) continue;
    if (timestampMs < Math.floor(startMs / HOUR_MS) * HOUR_MS || timestampMs >= endMs) continue;
    if (forecastByHour.has(timestampMs)) {
      forecastByHour.set(timestampMs, null);
    } else {
      forecastByHour.set(timestampMs, forecast);
    }
  }

  const segments: PrognosisIntervalSegment[] = [];
  let coveredDurationMs = 0;
  let cursor = startMs;

  while (cursor < endMs) {
    const hourStartMs = Math.floor(cursor / HOUR_MS) * HOUR_MS;
    const segmentEndMs = Math.min(endMs, hourStartMs + HOUR_MS);
    if (segmentEndMs <= cursor) return emptyResult('invalid_interval', normalizedStart, end.toISOString());

    const targetDate = getAmsterdamDateKey(new Date(cursor));
    const timeSlot = getAmsterdamTimeSlot(new Date(cursor));
    if (!targetDate || !timeSlot) return emptyResult('invalid_interval', normalizedStart, end.toISOString());

    const sample = forecastByHour.get(hourStartMs) ?? null;
    const segmentDurationMs = segmentEndMs - cursor;
    if (sample) coveredDurationMs += segmentDurationMs;

    segments.push({
      startTime: new Date(cursor).toISOString(),
      endTime: new Date(segmentEndMs).toISOString(),
      durationMinutes: segmentDurationMs / 60000,
      targetDate,
      timeSlot,
      weatherAvailable: sample !== null,
      weatherSampleTime: sample ? new Date(hourStartMs).toISOString() : null,
      weatherSample: sample,
    });
    cursor = segmentEndMs;
  }

  const uncoveredDurationMs = durationMs - coveredDurationMs;
  const totalDurationMinutes = durationMs / 60000;
  const coveredDurationMinutes = coveredDurationMs / 60000;
  const uncoveredDurationMinutes = uncoveredDurationMs / 60000;
  return {
    status: uncoveredDurationMs === 0 ? 'complete' : 'partial',
    intervalStart: normalizedStart,
    intervalEnd: end.toISOString(),
    totalDurationMinutes,
    coveredDurationMinutes,
    uncoveredDurationMinutes,
    coverageRatio: coveredDurationMs / durationMs,
    segments,
  };
}
