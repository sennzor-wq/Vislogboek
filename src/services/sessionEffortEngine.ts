import { RodEffortSummary, SessionRod } from '../types';

/**
 * Berekent uitsluitend hengelinzet die expliciet in intervallen is vastgelegd.
 * Een hengel zonder intervalrecord heeft onbekende inzet, niet nul uur.
 * Overlap wordt alleen binnen dezelfde hengel samengevoegd.
 */
export function calculateSessionRodEffort(
  rods: SessionRod[],
  sessionStartTime: string,
  sessionEndTime?: string | null,
  asOf: Date = new Date()
): RodEffortSummary {
  const perRodHours: Record<string, number> = {};
  const recordedIntervalCount = rods.reduce((sum, rod) => sum + (rod.activeIntervals?.length ?? 0), 0);
  const rodsWithoutIntervalsCount = rods.filter((rod) => (rod.activeIntervals?.length ?? 0) === 0).length;
  let incompleteIntervalCount = 0;
  let outOfSessionIntervalCount = 0;

  const hasExplicitEnd = sessionEndTime !== undefined && sessionEndTime !== null;
  const sessionStart = Date.parse(sessionStartTime);
  const sessionEnd = hasExplicitEnd ? Date.parse(sessionEndTime) : asOf.getTime();

  if (!Number.isFinite(sessionStart) || !Number.isFinite(sessionEnd) || sessionEnd <= sessionStart) {
    incompleteIntervalCount = recordedIntervalCount;
    return {
      hasDetailData: rods.length > 0,
      hasRecordedIntervals: recordedIntervalCount > 0,
      recordedIntervalCount,
      rodsWithoutIntervalsCount,
      outOfSessionIntervalCount,
      totalRodHours: 0,
      activeRodCount: 0,
      incompleteIntervalCount,
      perRodHours,
    };
  }

  for (const rod of rods) {
    const rodIntervals = rod.activeIntervals ?? [];
    if (rodIntervals.length === 0) continue;

    const intervals: Array<[number, number]> = [];
    for (const interval of rodIntervals) {
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
      intervals.push([clippedStart, clippedEnd]);
    }

    intervals.sort((a, b) => a[0] - b[0]);
    let mergedMilliseconds = 0;
    let current: [number, number] | null = null;
    for (const interval of intervals) {
      if (!current) {
        current = [...interval];
      } else if (interval[0] <= current[1]) {
        current[1] = Math.max(current[1], interval[1]);
      } else {
        mergedMilliseconds += current[1] - current[0];
        current = [...interval];
      }
    }
    if (current) mergedMilliseconds += current[1] - current[0];

    perRodHours[rod.id] = Number((mergedMilliseconds / 3_600_000).toFixed(4));
  }

  const values = Object.values(perRodHours);
  return {
    hasDetailData: rods.length > 0,
    hasRecordedIntervals: recordedIntervalCount > 0,
    recordedIntervalCount,
    rodsWithoutIntervalsCount,
    outOfSessionIntervalCount,
    totalRodHours: Number(values.reduce((sum, value) => sum + value, 0).toFixed(4)),
    activeRodCount: values.filter((hours) => hours > 0).length,
    incompleteIntervalCount,
    perRodHours,
  };
}

/** Sluit alleen expliciet gestarte open intervallen bij het afronden van de sessie. */
export function closeOpenRodIntervals(rods: SessionRod[], sessionEndTime: string): SessionRod[] {
  const end = Date.parse(sessionEndTime);
  if (!Number.isFinite(end)) return rods;
  return rods.map((rod) => ({
    ...rod,
    activeIntervals: (rod.activeIntervals || []).map((interval) => {
      const start = Date.parse(interval.startTime);
      return !interval.endTime && Number.isFinite(start) && start <= end
        ? { ...interval, endTime: sessionEndTime }
        : interval;
    }),
    updatedAt: sessionEndTime,
  }));
}
