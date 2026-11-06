import { FishingSession, CatchItem, SessionOutcome, FishSpecies } from '../types';
import { getAmsterdamHour } from './dateTime';

export interface StatsFilter {
  dateFrom?: string;
  dateTo?: string;
  locationId?: string;
  species?: FishSpecies | 'Alle';
  outcome?: SessionOutcome | 'Alle';
  technique?: string;
}

export interface OverallStats {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  catchSessions: number;
  confirmedSkunks: number;
  unknownOutcomes: number;
  totalFishCaught: number;
  totalDurationMinutes: number;
  averageDurationMinutes: number;
  catchesPerHour: number; // CPUE
  averageFishPerSession: number;
  successRatePercent: number | null; // % (alleen als confirmed >= 1)
}

export interface SpeciesStatItem {
  species: FishSpecies;
  count: number;
  totalWeightKg: number;
  knownWeightsCount: number;
  maxWeightKg: number | null;
  sessionCount: number;
}

export interface LocationStatItem {
  locationId: string;
  locationName: string;
  sessionCount: number;
  catchCount: number;
  fishCount: number;
  totalDurationMinutes: number;
  catchesPerHour: number;
}

export interface TimeSlotStatItem {
  slot: string;
  sessionCount: number;
  fishCount: number;
  catchesPerHour: number;
}

export interface WeatherCorrelationItem {
  bucket: string;
  sessionCount: number;
  fishCount: number;
  successRate: number;
}

export function calculateStats(
  sessions: FishingSession[],
  catches: CatchItem[],
  filter: StatsFilter = {}
) {
  // 1. Filter sessies
  const filteredSessions = sessions.filter((s) => {
    if (filter.locationId && s.locationId !== filter.locationId) return false;
    if (filter.outcome && filter.outcome !== 'Alle' && s.outcome !== filter.outcome) return false;
    if (filter.technique && s.technique && !s.technique.toLowerCase().includes(filter.technique.toLowerCase())) return false;
    if (filter.dateFrom && s.startTime < filter.dateFrom) return false;
    if (filter.dateTo && s.startTime > filter.dateTo) return false;
    return true;
  });

  const sessionIds = new Set(filteredSessions.map((s) => s.id));

  // 2. Filter vangsten
  const filteredCatches = catches.filter((c) => {
    if (!sessionIds.has(c.sessionId)) return false;
    if (filter.species && filter.species !== 'Alle' && c.species !== filter.species) return false;
    return true;
  });

  // Alleen voltooide sessies voor gemiddelden en CPUE
  const completedSessions = filteredSessions.filter((s) => s.outcome !== 'active');
  const activeSessions = filteredSessions.filter((s) => s.outcome === 'active');
  const catchSessions = completedSessions.filter((s) => s.outcome === 'catch');
  const confirmedSkunks = completedSessions.filter((s) => s.outcome === 'skunk_confirmed');
  const unknownOutcomes = completedSessions.filter((s) => s.outcome === 'unknown');

  const totalFishCaught = filteredCatches.reduce((sum, c) => sum + (c.count || 1), 0);

  // Totale visduur berekenen (inclusief correcte middernacht overschrijding)
  let totalDurationMinutes = 0;
  for (const s of completedSessions) {
    if (s.durationMinutes && s.durationMinutes > 0) {
      totalDurationMinutes += s.durationMinutes;
    } else if (s.startTime && s.endTime) {
      const diff = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
      if (diff > 0 && diff < 10080) { // max 7 dagen limiet tegen corrupte invoer
        totalDurationMinutes += diff;
      }
    }
  }

  const averageDurationMinutes =
    completedSessions.length > 0 ? Math.round(totalDurationMinutes / completedSessions.length) : 0;

  const totalHours = totalDurationMinutes / 60;
  const catchesPerHour = totalHours > 0 ? Math.round((totalFishCaught / totalHours) * 100) / 100 : 0;
  const averageFishPerSession =
    completedSessions.length > 0 ? Math.round((totalFishCaught / completedSessions.length) * 10) / 10 : 0;

  const confirmedOutcomesCount = catchSessions.length + confirmedSkunks.length;
  const successRatePercent =
    confirmedOutcomesCount > 0 ? Math.round((catchSessions.length / confirmedOutcomesCount) * 100) : null;

  const overall: OverallStats = {
    totalSessions: filteredSessions.length,
    completedSessions: completedSessions.length,
    activeSessions: activeSessions.length,
    catchSessions: catchSessions.length,
    confirmedSkunks: confirmedSkunks.length,
    unknownOutcomes: unknownOutcomes.length,
    totalFishCaught,
    totalDurationMinutes,
    averageDurationMinutes,
    catchesPerHour,
    averageFishPerSession,
    successRatePercent,
  };

  // 3. Species statistieken
  const speciesMap = new Map<FishSpecies, SpeciesStatItem>();
  for (const c of filteredCatches) {
    const sp = c.species;
    const existing = speciesMap.get(sp) || {
      species: sp,
      count: 0,
      totalWeightKg: 0,
      knownWeightsCount: 0,
      maxWeightKg: null,
      sessionCount: 0,
    };

    existing.count += c.count || 1;
    if (typeof c.weightKg === 'number' && c.weightKg > 0) {
      existing.totalWeightKg += c.weightKg;
      existing.knownWeightsCount += 1;
      if (existing.maxWeightKg === null || c.weightKg > existing.maxWeightKg) {
        existing.maxWeightKg = c.weightKg;
      }
    }
    speciesMap.set(sp, existing);
  }

  const speciesStats = Array.from(speciesMap.values()).sort((a, b) => b.count - a.count);

  // 4. Locatie statistieken
  const locationMap = new Map<string, LocationStatItem>();
  for (const s of completedSessions) {
    const locId = s.locationId || 'onbekend';
    const locName = s.locationName || 'Geen vaste locatie';
    const existing = locationMap.get(locId) || {
      locationId: locId,
      locationName: locName,
      sessionCount: 0,
      catchCount: 0,
      fishCount: 0,
      totalDurationMinutes: 0,
      catchesPerHour: 0,
    };

    existing.sessionCount += 1;
    if (s.outcome === 'catch') existing.catchCount += 1;
    existing.totalDurationMinutes += s.durationMinutes || 0;

    // Koppel vangsten aan deze sessie
    const sessionFish = filteredCatches
      .filter((c) => c.sessionId === s.id)
      .reduce((sum, c) => sum + (c.count || 1), 0);
    existing.fishCount += sessionFish;

    const locHours = existing.totalDurationMinutes / 60;
    existing.catchesPerHour = locHours > 0 ? Math.round((existing.fishCount / locHours) * 100) / 100 : 0;

    locationMap.set(locId, existing);
  }

  const locationStats = Array.from(locationMap.values()).sort((a, b) => b.sessionCount - a.sessionCount);

  // 5. Tijdvak verdeling
  const slotMap: Record<string, { sessionCount: number; fishCount: number; durationMin: number }> = {
    Nacht: { sessionCount: 0, fishCount: 0, durationMin: 0 },
    Ochtend: { sessionCount: 0, fishCount: 0, durationMin: 0 },
    Middag: { sessionCount: 0, fishCount: 0, durationMin: 0 },
    Avond: { sessionCount: 0, fishCount: 0, durationMin: 0 },
  };

  for (const s of completedSessions) {
    const hour = getAmsterdamHour(s.startTime) ?? -1;
    let slot = 'Middag';
    if (hour >= 0 && hour < 6) slot = 'Nacht';
    else if (hour >= 6 && hour < 12) slot = 'Ochtend';
    else if (hour >= 18 && hour < 24) slot = 'Avond';

    slotMap[slot].sessionCount += 1;
    slotMap[slot].durationMin += s.durationMinutes || 0;
    const sessionFish = filteredCatches
      .filter((c) => c.sessionId === s.id)
      .reduce((sum, c) => sum + (c.count || 1), 0);
    slotMap[slot].fishCount += sessionFish;
  }

  const timeSlotStats: TimeSlotStatItem[] = Object.entries(slotMap).map(([slot, data]) => {
    const hours = data.durationMin / 60;
    return {
      slot,
      sessionCount: data.sessionCount,
      fishCount: data.fishCount,
      catchesPerHour: hours > 0 ? Math.round((data.fishCount / hours) * 100) / 100 : 0,
    };
  });

  return {
    overall,
    speciesStats,
    locationStats,
    timeSlotStats,
  };
}
