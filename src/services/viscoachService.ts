import { db } from '../db/db';
import {
  FishingLocation,
  HomeLocation,
  ViscoachTargetSpecies,
  ViscoachSessionContext,
  FishSpecies,
  PlannedFishingSession,
  CatchItem,
  WeatherSnapshot,
  PrognosisInputContext,
} from '../types';
import { calculateDayPrognosis, createPrognosisInputFingerprint, PendingPrognosisSnapshot, savePrognosisSnapshot } from './prognosisEngine';
import { getForecast } from './weatherService';
import { getWaterTemperatureCalibration } from './evaluationEngine';
import { collectHistoricalWaterTemperatureObservations } from './waterTemperatureHistory';

/**
 * Berekent de afstand in kilometers tussen twee GPS-coördinaten via de Haversine-formule.
 * Geeft strikt `null` terug indien een van de coördinaten ontbreekt of ongeldig is.
 */
export function calculateHaversineDistanceKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return null;
  }

  // Aardstraal in kilometers
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Haalt de opgeslagen thuislocatie op uit de lokale instellingen.
 */
export async function getHomeLocation(): Promise<HomeLocation | null> {
  try {
    const settings = await db.settings.get('user_settings');
    return settings?.homeLocation || null;
  } catch (err) {
    console.error('Fout bij ophalen thuislocatie:', err);
    return null;
  }
}

/**
 * Slaat de thuislocatie lokaal op in de database.
 */
export async function saveHomeLocation(homeLocation: HomeLocation): Promise<void> {
  const currentSettings = await db.settings.get('user_settings');
  const payload = {
    ...homeLocation,
    updatedAt: new Date().toISOString(),
  };

  if (currentSettings) {
    await db.settings.update('user_settings', { homeLocation: payload });
  } else {
    await db.settings.put({
      id: 'user_settings',
      defaultLocationName: 'Lokkershoek Pier',
      defaultLatitude: 51.944861,
      defaultLongitude: 5.19234,
      defaultSpecies: 'Karper',
      defaultDurationHours: 3,
      theme: 'dark',
      homeLocation: payload,
    });
  }
}

/**
 * Controleert of een vissteknaam al voorkomt om dubbele visstekken te voorkomen.
 */
export function isDuplicateSpotName(
  candidateName: string,
  locations: FishingLocation[],
  excludeId?: string
): boolean {
  const clean = candidateName.trim().toLowerCase();
  if (!clean) return false;
  return locations.some(
    (loc) => loc.id !== excludeId && loc.name.trim().toLowerCase() === clean
  );
}

/**
 * Construeert de herbruikbare gegevensstructuur voor Viscoach.
 * Verzamelt stek, thuislocatie, afstand, doelvis en sessieduur.
 */
export function buildViscoachSessionContext(options: {
  selectedLocation: FishingLocation | null;
  homeLocation: HomeLocation | null;
  targetSpecies: ViscoachTargetSpecies;
  sessionDurationHours: number | null;
  isCustomDuration?: boolean;
}): ViscoachSessionContext {
  const {
    selectedLocation,
    homeLocation,
    targetSpecies,
    sessionDurationHours,
    isCustomDuration = false,
  } = options;

  const distanceKm = calculateHaversineDistanceKm(
    homeLocation?.latitude,
    homeLocation?.longitude,
    selectedLocation?.latitude,
    selectedLocation?.longitude
  );

  const isWithin5Km = distanceKm !== null ? distanceKm <= 5.0 : null;

  const missingFields: string[] = [];
  if (!selectedLocation) {
    missingFields.push('Geen visstek geselecteerd');
  }
  if (sessionDurationHours === null || sessionDurationHours <= 0 || isNaN(sessionDurationHours)) {
    missingFields.push('Geen sessieduur gekozen');
  }

  const isComplete = missingFields.length === 0;

  return {
    selectedLocationId: selectedLocation?.id || null,
    selectedLocation,
    homeLocation,
    distanceKm,
    isWithin5Km,
    targetSpecies,
    sessionDurationHours,
    isCustomDuration,
    isComplete,
    missingFields,
    createdAt: new Date().toISOString(),
  };
}


export interface VisCoachPlanInput {
  location: FishingLocation;
  targetSpecies: FishSpecies | 'Algemeen';
  desiredStartTime: string;
  desiredEndTime?: string | null;
  sessions: import('../types').FishingSession[];
  catches: CatchItem[];
}

export interface VisCoachPlan {
  prognosis: import('../types').DayPrognosis;
  pendingSnapshot: PendingPrognosisSnapshot;
  desiredStartTime: string;
  desiredEndTime: string | null;
  durationHours: number | null;
}


/**
 * Bouwt een VisCoach-plan door de bestaande prognose-engine te gebruiken.
 * Deze functie bevat geen eigen biologische of tactische berekening.
 */
export async function buildVisCoachPlan(input: VisCoachPlanInput): Promise<VisCoachPlan> {
  const start = new Date(input.desiredStartTime);
  if (!Number.isFinite(start.getTime())) throw new Error('Kies een geldige gewenste starttijd.');
  const end = input.desiredEndTime ? new Date(input.desiredEndTime) : null;
  if (end && (!Number.isFinite(end.getTime()) || end.getTime() <= start.getTime())) {
    throw new Error('De gewenste eindtijd moet na de starttijd liggen.');
  }
  if (typeof input.location.latitude !== 'number' || typeof input.location.longitude !== 'number') {
    throw new Error('Deze stek heeft nog geen GPS-coördinaten. Voeg de locatiegegevens toe voordat een weersafhankelijk plan wordt berekend.');
  }

  const durationHours = end ? (end.getTime() - start.getTime()) / 3600000 : null;
  if (durationHours !== null && (durationHours <= 0 || durationHours > 24)) {
    throw new Error('De geplande sessieduur moet langer dan nul en maximaal 24 uur zijn.');
  }
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(start);
  const [weather, snapshots, locations, observations] = await Promise.all([
    getForecast(input.location.latitude, input.location.longitude, false),
    db.prognosisSnapshots.toArray(),
    db.locations.toArray(),
    db.presenceObservations.toArray(),
  ]);
  if (!weather.hourly?.length) throw new Error('Er is geen weersverwachting beschikbaar voor deze stek.');

  const historicalWaterTemperatures = collectHistoricalWaterTemperatureObservations(
    input.sessions,
    snapshots,
    locations
  );
  const now = new Date();
  const prognosis = calculateDayPrognosis(
    date,
    weather.hourly,
    input.targetSpecies,
    input.sessions,
    weather.fetchedAt,
    null,
    now,
    {
      sessionDurationHours: durationHours ?? undefined,
      allowUnknownSessionDuration: true,
      locationId: input.location.id,
      location: input.location,
      catches: input.catches,
      historicalWaterTemperatures,
      waterTemperatureCalibration: getWaterTemperatureCalibration(snapshots, input.location.id, date),
      prebaitOptions: {
        sessionDurationHours: durationHours ?? undefined,
        planningDate: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(now),
      },
    }
  );

  const startHour = weather.hourly.reduce((closest, item) =>
    Math.abs(new Date(item.time).getTime() - start.getTime()) <
    Math.abs(new Date(closest.time).getTime() - start.getTime()) ? item : closest
  );
  if (Math.abs(new Date(startHour.time).getTime() - start.getTime()) > 90 * 60 * 1000) {
    throw new Error('Voor dit tijdstip is geen voldoende nabije weersverwachting beschikbaar.');
  }
  const conditions: WeatherSnapshot = {
    temperature: startHour.temperature,
    pressure: startHour.pressure,
    windSpeed: startHour.windSpeed,
    windDirection: startHour.windDirection,
    windDirectionText: startHour.windDirectionText,
    cloudCover: startHour.cloudCover,
    precipitation: startHour.precipitation,
    precipitationProbability: startHour.precipitationProbability,
    weatherCode: startHour.weatherCode,
    source: 'open-meteo',
    capturedAt: weather.fetchedAt,
    waterTemperature: null,
  };

  const inputContext: PrognosisInputContext = {
    calculatedAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
    targetDate: date,
    targetSpecies: input.targetSpecies,
    sessionDurationHours: durationHours,
    location: {
      id: input.location.id,
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      waterType: input.location.waterType,
      waterDepth: input.location.waterDepth,
      waterFacingDirection: input.location.waterFacingDirection,
      habitatFeatures: input.location.habitatFeatures,
    },
    historicalSessionIds: input.sessions.filter((item) => item.isBenchmark !== true).map((item) => item.id),
    catchRecordIds: input.catches.map((item) => item.id),
    observationIds: observations.map((item) => item.id),
    historicalWaterTemperatureSamples: historicalWaterTemperatures,
    historySummary: {
      sessionCount: input.sessions.filter((item) => item.isBenchmark !== true).length,
      catchRecordCount: input.catches.length,
      observationCount: observations.length,
      historicalWaterTemperatureSampleCount: historicalWaterTemperatures.length,
    },
    weatherFetchedAt: weather.fetchedAt,
  };

  const inputFingerprint = createPrognosisInputFingerprint({
    date,
    desiredStartTime: start.toISOString(),
    desiredEndTime: end?.toISOString() ?? null,
    species: input.targetSpecies,
    locationId: input.location.id,
    weather: weather.hourly,
    sessions: input.sessions.map((session) => [session.id, session.updatedAt, session.outcome]),
    catches: input.catches.map((item) => [item.id, item.timestamp, item.species, item.count]),
  });

  const pendingSnapshot: PendingPrognosisSnapshot = {
    prognosis,
    durationHours: durationHours ?? 0,
    durationKnown: durationHours !== null,
    locationName: input.location.name,
    chosenSlot: prognosis.bestTimeSlot === 'Geen toekomstig tijdvak meer vandaag'
      ? undefined
      : prognosis.bestTimeSlot,
    conditions,
    weatherInput: weather.hourly,
    inputContext,
    runKind: 'session_start',
    inputFingerprint,
  };

  return {
    prognosis,
    pendingSnapshot,
    desiredStartTime: start.toISOString(),
    desiredEndTime: end?.toISOString() ?? null,
    durationHours,
  };
}

/** Slaat een vooruit geplande afspraak en de getoonde planprognose atomair op. */
export async function saveVisCoachPlan(
  plan: VisCoachPlan,
  location: FishingLocation,
  targetSpecies: FishSpecies | 'Algemeen'
): Promise<PlannedFishingSession> {
  const now = new Date().toISOString();
  const id = `planned-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return db.transaction('rw', db.plannedSessions, db.prognosisSnapshots, async () => {
    const snapshot = await savePrognosisSnapshot(
      plan.prognosis,
      plan.durationHours ?? 0,
      location.id,
      location.name,
      undefined,
      plan.pendingSnapshot.chosenSlot,
      plan.pendingSnapshot.conditions,
      {
        runKind: 'plan',
        weatherInput: plan.pendingSnapshot.weatherInput,
        inputContext: plan.pendingSnapshot.inputContext,
        inputFingerprint: plan.pendingSnapshot.inputFingerprint,
      }
    );
    const planned: PlannedFishingSession = {
      id,
      locationId: location.id,
      targetSpecies,
      plannedStartTime: plan.desiredStartTime,
      plannedEndTime: plan.desiredEndTime,
      status: 'planned',
      planSnapshotId: snapshot.id,
      createdAt: now,
      updatedAt: now,
    };
    await db.plannedSessions.put(planned);
    return planned;
  });
}

export async function cancelVisCoachPlan(planId: string): Promise<void> {
  await db.plannedSessions.update(planId, {
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });
}
