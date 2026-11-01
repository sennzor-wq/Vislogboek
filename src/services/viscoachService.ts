import { db } from '../db/db';
import {
  FishingLocation,
  HomeLocation,
  ViscoachTargetSpecies,
  ViscoachSessionContext,
} from '../types';

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
