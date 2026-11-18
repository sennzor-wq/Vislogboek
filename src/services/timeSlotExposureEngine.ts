import { SessionRod, TimeSlot, TimeSlotExposureSummary } from '../types';
import { getAmsterdamHour } from '../utils/dateTime';

const SLOT_ORDER: TimeSlot[] = ['Nacht', 'Ochtend', 'Middag', 'Avond'];
const SLOT_DURATION_PROBE_MS = 15 * 60 * 1000;

function getSlotAt(timestampMs: number): TimeSlot | null {
  const hour = getAmsterdamHour(new Date(timestampMs));
  if (hour === null) return null;
  if (hour < 6) return 'Nacht';
  if (hour < 12) return 'Ochtend';
  if (hour < 18) return 'Middag';
  return 'Avond';
}

/** Finds the next Amsterdam-local six-hour boundary, including DST transitions. */
function findNextSlotBoundary(startMs: number, endMs: number, slot: TimeSlot): number {
  let low = startMs;
  let high = Math.min(endMs, startMs + SLOT_DURATION_PROBE_MS);
  while (high < endMs && getSlotAt(high) === slot) {
    low = high;
    high = Math.min(endMs, high + SLOT_DURATION_PROBE_MS);
  }
  if (getSlotAt(high) === slot) return endMs;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (getSlotAt(mid) === slot) low = mid;
    else high = mid;
  }
  return high;
}

function createEmptySlots(): TimeSlotExposureSummary['slots'] {
  return {
    Nacht: { rodHours: 0, activeRodCount: 0, intervalCount: 0 },
    Ochtend: { rodHours: 0, activeRodCount: 0, intervalCount: 0 },
    Middag: { rodHours: 0, activeRodCount: 0, intervalCount: 0 },
    Avond: { rodHours: 0, activeRodCount: 0, intervalCount: 0 },
  };
}

/**
 * Split explicitly recorded rod intervals across Amsterdam-local slots.
 * Missing intervals remain unknown; exposure is never inferred from session
 * duration or rod count. This is descriptive data, not a prediction input.
 */
export function calculateTimeSlotRodExposure(
  rods: SessionRod[],
  sessionStartTime: string,
  sessionEndTime?: string | null,
  asOf: Date = new Date()
): TimeSlotExposureSummary {
  const slots = createEmptySlots();
  const recordedIntervalCount = rods.reduce((sum, rod) => sum + (rod.activeIntervals?.length ?? 0), 0);
  const rodsWithoutIntervalsCount = rods.filter((rod) => (rod.activeIntervals?.length ?? 0) === 0).length;
  let incompleteIntervalCount = 0;
  let outOfSessionIntervalCount = 0;
  const hasExplicitEnd = sessionEndTime !== undefined && sessionEndTime !== null;
  const sessionStart = Date.parse(sessionStartTime);
  const sessionEnd = hasExplicitEnd ? Date.parse(sessionEndTime) : asOf.getTime();

  const result = (): TimeSlotExposureSummary => ({
    slots,
    hasRecordedIntervals: recordedIntervalCount > 0,
    recordedIntervalCount,
    rodsWithoutIntervalsCount,
    incompleteIntervalCount,
    outOfSessionIntervalCount,
    totalRodHours: 0,
  });

  if (!Number.isFinite(sessionStart) || !Number.isFinite(sessionEnd) || sessionEnd <= sessionStart) {
    incompleteIntervalCount = recordedIntervalCount;
    return result();
  }

  const segments = new Map<TimeSlot, Map<string, Array<[number, number]>>>();
  const intervalCounts = new Map<TimeSlot, number>();

  for (const rod of rods) {
    for (const interval of rod.activeIntervals ?? []) {
      const start = Date.parse(interval.startTime);
      const hasIntervalEnd = interval.endTime !== undefined && interval.endTime !== null;
      const end = hasIntervalEnd
        ? Date.parse(interval.endTime as string)
        : hasExplicitEnd ? Number.NaN : asOf.getTime();

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        incompleteIntervalCount++;
        continue;
      }
      if (start < sessionStart || end > sessionEnd) outOfSessionIntervalCount++;

      const clippedStart = Math.max(sessionStart, start);
      const clippedEnd = Math.min(sessionEnd, end);
      if (clippedEnd <= clippedStart) {
        incompleteIntervalCount++;
        continue;
      }

      let cursor = clippedStart;
      while (cursor < clippedEnd) {
        const slot = getSlotAt(cursor);
        if (!slot) {
          incompleteIntervalCount++;
          break;
        }
        const next = findNextSlotBoundary(cursor, clippedEnd, slot);
        if (next <= cursor) {
          incompleteIntervalCount++;
          break;
        }
        let byRod = segments.get(slot);
        if (!byRod) {
          byRod = new Map<string, Array<[number, number]>>();
          segments.set(slot, byRod);
        }
        const rodSegments = byRod.get(rod.id) ?? [];
        rodSegments.push([cursor, next]);
        byRod.set(rod.id, rodSegments);
        intervalCounts.set(slot, (intervalCounts.get(slot) ?? 0) + 1);
        cursor = next;
      }
    }
  }

  for (const slot of SLOT_ORDER) {
    const byRod = segments.get(slot);
    if (!byRod) continue;
    let totalMilliseconds = 0;
    let activeRodCount = 0;
    for (const rodSegments of byRod.values()) {
      rodSegments.sort((a, b) => a[0] - b[0]);
      let mergedStart: number | null = null;
      let mergedEnd: number | null = null;
      let rodMilliseconds = 0;
      for (const [start, end] of rodSegments) {
        if (mergedStart === null || mergedEnd === null) {
          mergedStart = start;
          mergedEnd = end;
        } else if (start <= mergedEnd) {
          mergedEnd = Math.max(mergedEnd, end);
        } else {
          rodMilliseconds += mergedEnd - mergedStart;
          mergedStart = start;
          mergedEnd = end;
        }
      }
      if (mergedStart !== null && mergedEnd !== null) rodMilliseconds += mergedEnd - mergedStart;
      if (rodMilliseconds > 0) activeRodCount++;
      totalMilliseconds += rodMilliseconds;
    }
    slots[slot] = {
      rodHours: Number((totalMilliseconds / 3_600_000).toFixed(4)),
      activeRodCount,
      intervalCount: intervalCounts.get(slot) ?? 0,
    };
  }

  return {
    slots,
    hasRecordedIntervals: recordedIntervalCount > 0,
    recordedIntervalCount,
    rodsWithoutIntervalsCount,
    incompleteIntervalCount,
    outOfSessionIntervalCount,
    totalRodHours: Number(SLOT_ORDER.reduce((sum, slot) => sum + slots[slot].rodHours, 0).toFixed(4)),
  };
}
