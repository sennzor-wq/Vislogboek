import { FishingLocation, FishingSession } from '../types';

export interface HistoricalWaterTemperatureProfile {
  medianC: number;
  minimumC: number;
  maximumC: number;
  sampleCount: number;
  locationCount: number;
  source: 'same_location' | 'nearby_same_water_type';
}

/**
 * Bouwt een seizoensprior uit uitsluitend echte, eerder geregistreerde
 * watertemperatuurmetingen. Synthetische benchmarkdata en toekomstige
 * waarnemingen worden uitgesloten.
 *
 * Een profiel wordt pas vrijgegeven bij >=5 metingen op >=3 verschillende
 * dagen binnen een venster van 45 kalenderdagen rond de doeldatum.
 */
export function buildHistoricalWaterTemperatureProfile(
  targetDate: string,
  location: FishingLocation | undefined,
  sessions: FishingSession[],
  asOf?: Date
): HistoricalWaterTemperatureProfile | null {
  if (!location) return null;

  const target = new Date(`${targetDate}T12:00:00Z`);
  if (!Number.isFinite(target.getTime())) return null;
  const cutoff = asOf && Number.isFinite(asOf.getTime())
    ? asOf.getTime()
    : new Date(`${targetDate}T00:00:00Z`).getTime();

  const dayOfYear = (date: Date) => {
    const start = Date.UTC(date.getUTCFullYear(), 0, 1);
    return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000) + 1;
  };
  const targetDay = dayOfYear(target);
  const seasonalDistance = (date: Date) => {
    const raw = Math.abs(dayOfYear(date) - targetDay);
    return Math.min(raw, 366 - raw);
  };
  const distanceKm = (a: FishingLocation, b: FishingLocation): number | null => {
    if (![a.latitude, a.longitude, b.latitude, b.longitude].every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
    const rad = (v: number) => v * Math.PI / 180;
    const dLat = rad(b.latitude! - a.latitude!);
    const dLon = rad(b.longitude! - a.longitude!);
    const lat1 = rad(a.latitude!);
    const lat2 = rad(b.latitude!);
    const haversine = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  };

  const candidates = sessions.flatMap((session) => {
    if (session.isBenchmark === true || typeof session.waterTemperature !== 'number' ||
        !Number.isFinite(session.waterTemperature) || session.waterTemperature < 0 || session.waterTemperature > 35) return [];
    const measuredAt = new Date(session.startTime);
    if (!Number.isFinite(measuredAt.getTime()) || measuredAt.getTime() >= cutoff) return [];
    if (seasonalDistance(measuredAt) > 45) return [];

    if (session.locationId === location.id) {
      return [{ temperature: session.waterTemperature, date: measuredAt.toISOString().slice(0, 10), locationId: location.id, source: 'same_location' as const }];
    }
    // Cross-water transfer is only allowed for the same explicit water type
    // and a known distance <=50 km. Unknown type/coordinates never imply similarity.
    if (!location.waterType || session.locationId === undefined) return [];
    const otherLocation = (session as FishingSession & { __location?: FishingLocation }).__location;
    if (!otherLocation || otherLocation.waterType !== location.waterType) return [];
    const distance = distanceKm(location, otherLocation);
    if (distance === null || distance > 50) return [];
    return [{ temperature: session.waterTemperature, date: measuredAt.toISOString().slice(0, 10), locationId: otherLocation.id, source: 'nearby_same_water_type' as const }];
  });

  // FishingSession records do not embed location metadata. Therefore this
  // implementation deliberately uses same-location history only until the
  // caller supplies a separately resolved location catalogue.
  const sameLocation = candidates.filter((item) => item.source === 'same_location');
  const uniqueDays = new Set(sameLocation.map((item) => item.date));
  if (sameLocation.length < 5 || uniqueDays.size < 3) return null;

  const values = sameLocation.map((item) => item.temperature).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const medianC = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  return {
    medianC: Math.round(medianC * 10) / 10,
    minimumC: Math.round(values[0] * 10) / 10,
    maximumC: Math.round(values[values.length - 1] * 10) / 10,
    sampleCount: values.length,
    locationCount: 1,
    source: 'same_location',
  };
}
