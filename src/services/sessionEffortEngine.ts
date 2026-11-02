import { RodEffortSummary, SessionRod } from '../types';

/**
 * Berekent hengeluren uit werkelijk vastgelegde intervallen.
 * Intervallen zonder geldige start/eindtijd worden niet geschat of vervangen door
 * sessieduur × aantal hengels. Overlap binnen dezelfde hengel telt slechts eenmaal.
 */
export function calculateSessionRodEffort(
  rods: SessionRod[],
  sessionStartTime: string,
  sessionEndTime?: string | null,
  asOf: Date = new Date()
): RodEffortSummary {
  const perRodHours: Record<string, number> = {};
  let incompleteIntervalCount = 0;
  const sessionStart = Date.parse(sessionStartTime);
  const sessionEnd = sessionEndTime ? Date.parse(sessionEndTime) : asOf.getTime();

  if (!Number.isFinite(sessionStart) || !Number.isFinite(sessionEnd) || sessionEnd <= sessionStart) {
    return { hasDetailData: rods.length > 0, totalRodHours: 0, activeRodCount: 0, incompleteIntervalCount: 0, perRodHours };
  }

  for (const rod of rods) {
    const intervals: Array<[number, number]> = [];
    for (const interval of rod.activeIntervals ?? []) {
      const start = Date.parse(interval.startTime);
      const end = interval.endTime ? Date.parse(interval.endTime) : (sessionEndTime ? Number.NaN : asOf.getTime());
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        incompleteIntervalCount++;
        continue;
      }
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

    const hours = mergedMilliseconds / 3_600_000;
    perRodHours[String(rod.rodNumber)] = Number(hours.toFixed(4));
  }

  const values = Object.values(perRodHours);
  return {
    hasDetailData: rods.length > 0,
    totalRodHours: Number(values.reduce((sum, value) => sum + value, 0).toFixed(4)),
    activeRodCount: values.filter((hours) => hours > 0).length,
    incompleteIntervalCount,
    perRodHours,
  };
}
