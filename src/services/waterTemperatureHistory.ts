import { FishingLocation, FishingSession, PrognosisSnapshot, WaterTemperatureWeatherContext } from '../types';
import { getAmsterdamMonth, parseAppTimestamp } from '../utils/dateTime';

/**
 * Alleen echte, achteraf geregistreerde watertemperatuurmetingen mogen een
 * historisch profiel vormen. Voorspellingen en synthetische waarden zijn uitgesloten.
 */
export interface HistoricalWaterTemperatureObservation {
  locationId: string;
  temperatureC: number;
  timestamp: string;
  waterType?: FishingLocation['waterType'];
  waterDepth?: number;
  latitude?: number;
  longitude?: number;
  isBenchmark?: boolean;
  /** Herkomst en methode van de fysieke meting; apart van het meetmoment. */
  measurementSource?: 'manual' | 'imported' | 'unknown';
  measurementMethod?: 'thermometer' | 'probe' | 'other' | 'unknown';
  measurementDepthM?: number;
  /** Wanneer het record is opgeslagen, los van het daadwerkelijke meetmoment. */
  recordedAt?: string;
  recordId?: string;
  recordType?: 'session' | 'snapshot';
  measurementId?: string;
  weatherContext?: WaterTemperatureWeatherContext;
}

/**
 * Bouwt één gedeelde lijst met echte historische metingen voor alle prognose-ingangen.
 * Zowel de Prognosepagina als VisCoach gebruiken hiermee dezelfde meetselectie.
 */
export function collectHistoricalWaterTemperatureObservations(
  sessions: FishingSession[],
  snapshots: PrognosisSnapshot[],
  locations: FishingLocation[]
): HistoricalWaterTemperatureObservation[] {
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const benchmarkSessionIds = new Set(sessions.filter((session) => session.isBenchmark === true).map((session) => session.id));
  const observations: HistoricalWaterTemperatureObservation[] = [];

  for (const snapshot of snapshots) {
    if (snapshot.linkedSessionId && benchmarkSessionIds.has(snapshot.linkedSessionId)) continue;
    if (!snapshot.locationId || typeof snapshot.actualWaterTemperature !== 'number' ||
        !snapshot.actualWaterTemperatureTimestamp || !parseAppTimestamp(snapshot.actualWaterTemperatureTimestamp) ||
        !snapshot.actualWaterTemperatureMeasurementSource || snapshot.actualWaterTemperatureMeasurementSource === 'unknown' ||
        !snapshot.actualWaterTemperatureMeasurementMethod || snapshot.actualWaterTemperatureMeasurementMethod === 'unknown') continue;
    const location = locationById.get(snapshot.locationId);
    observations.push({
      locationId: snapshot.locationId,
      temperatureC: snapshot.actualWaterTemperature,
      timestamp: snapshot.actualWaterTemperatureTimestamp,
      measurementSource: snapshot.actualWaterTemperatureMeasurementSource,
      measurementMethod: snapshot.actualWaterTemperatureMeasurementMethod,
      measurementDepthM: snapshot.actualWaterTemperatureMeasurementDepthM,
      recordedAt: snapshot.createdAt,
      recordId: snapshot.id,
      recordType: 'snapshot',
      waterType: location?.waterType,
      waterDepth: location?.waterDepth,
      latitude: location?.latitude,
      longitude: location?.longitude,
      isBenchmark: false,
    });
  }

  for (const session of sessions) {
    if (session.isBenchmark === true || !session.locationId) continue;
    const location = locationById.get(session.locationId);
    const events = session.waterTemperatureMeasurements ?? [];
    if (events.length > 0) {
      for (const measurement of events) {
        const measurementLocationId = measurement.locationId || session.locationId;
        if (typeof measurement.temperatureC !== 'number' || !Number.isFinite(measurement.temperatureC) ||
            measurement.temperatureC < 0 || measurement.temperatureC > 35 ||
            !measurement.measuredAt || !parseAppTimestamp(measurement.measuredAt) ||
            !measurement.measurementSource || measurement.measurementSource === 'unknown' ||
            !measurement.measurementMethod || measurement.measurementMethod === 'unknown') continue;
        const measurementLocation = locationById.get(measurementLocationId);
        observations.push({
          locationId: measurementLocationId,
          temperatureC: measurement.temperatureC,
          timestamp: measurement.measuredAt,
          measurementSource: measurement.measurementSource,
          measurementMethod: measurement.measurementMethod,
          measurementDepthM: measurement.measurementDepthM,
          recordedAt: measurement.recordedAt,
          recordId: session.id,
          measurementId: measurement.id,
          recordType: 'session',
          waterType: measurementLocation?.waterType,
          waterDepth: measurementLocation?.waterDepth ?? session.waterDepth,
          latitude: measurementLocation?.latitude,
          longitude: measurementLocation?.longitude,
          weatherContext: measurement.weatherContext ?? undefined,
          isBenchmark: false,
        });
      }
      continue;
    }
    // Backward compatibility: pre-event sessions still expose their one scalar measurement.
    if (typeof session.waterTemperature !== 'number' ||
        !session.waterTemperatureMeasuredAt || !parseAppTimestamp(session.waterTemperatureMeasuredAt) ||
        !session.waterTemperatureMeasurementSource || session.waterTemperatureMeasurementSource === 'unknown' ||
        !session.waterTemperatureMeasurementMethod || session.waterTemperatureMeasurementMethod === 'unknown') continue;
    observations.push({
      locationId: session.locationId,
      temperatureC: session.waterTemperature,
      timestamp: session.waterTemperatureMeasuredAt,
      measurementSource: session.waterTemperatureMeasurementSource,
      measurementMethod: session.waterTemperatureMeasurementMethod,
      measurementDepthM: session.waterTemperatureMeasurementDepthM,
      recordedAt: session.updatedAt || session.createdAt,
      recordId: session.id,
      recordType: 'session',
      waterType: location?.waterType,
      waterDepth: session.waterDepth ?? location?.waterDepth,
      latitude: location?.latitude,
      longitude: location?.longitude,
      isBenchmark: false,
    });
  }

  const unique = new Map<string, HistoricalWaterTemperatureObservation>();
  for (const observation of observations) {
    const measuredAt = parseAppTimestamp(observation.timestamp)?.getTime();
    if (measuredAt === undefined) continue;
    const depth = typeof observation.measurementDepthM === 'number' ? Math.round(observation.measurementDepthM * 100) / 100 : 'unknown';
    const key = `${observation.locationId}|${measuredAt}|${observation.temperatureC}|${depth}`;
    const existing = unique.get(key);
    if (!existing || (observation.measurementId && !existing.measurementId)) unique.set(key, observation);
  }
  return [...unique.values()];
}

export interface HistoricalWaterTemperatureProfile {
  baselineC: number;
  lowerC: number;
  upperC: number;
  uncertaintyC: number;
  sampleCount: number;
  locationCount: number;
  source: 'same_location' | 'nearby_same_type';
  measurementDepthM: number | null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function normalizeMeasurementDepth(depth: number | undefined): number | null {
  return typeof depth === 'number' && Number.isFinite(depth) && depth >= 0
    ? Math.round(depth * 100) / 100
    : null;
}

function monthDistance(a: number, b: number): number {
  const direct = Math.abs(a - b);
  return Math.min(direct, 12 - direct);
}

function distanceKm(a: { latitude?: number; longitude?: number }, b: { latitude?: number; longitude?: number }): number | null {
  if (![a.latitude, a.longitude, b.latitude, b.longitude].every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRad((b.latitude as number) - (a.latitude as number));
  const dLon = toRad((b.longitude as number) - (a.longitude as number));
  const lat1 = toRad(a.latitude as number);
  const lat2 = toRad(b.latitude as number);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Maakt een seizoensprofiel uit echte historische metingen.
 * Voorkeur: dezelfde stek (minimaal 3 metingen). Terugval: hetzelfde watertype
 * binnen 50 km, vergelijkbare totale waterdiepte, minimaal 5 metingen van 2 stekken.
 * Verschillende of onbekende verticale meetlagen worden nooit met bekende dieptes gemengd.
 * Alleen metingen vóór de doeldag en uit dezelfde/naastliggende Amsterdamse kalendermaand tellen mee.
 */
export function deriveHistoricalWaterTemperatureProfile(
  observations: HistoricalWaterTemperatureObservation[],
  location: FishingLocation | undefined,
  targetDate: string,
  targetMeasurementDepthM?: number | null
): HistoricalWaterTemperatureProfile | null {
  if (!location?.id) return null;
  const targetTime = parseAppTimestamp(`${targetDate}T00:00:00`)?.getTime() ?? Number.NaN;
  const targetMonth = /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? Number(targetDate.slice(5, 7)) : Number.NaN;
  if (!Number.isFinite(targetTime) || !Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) return null;

  const seen = new Set<string>();
  const valid = observations.filter((observation) => {
    if (observation.isBenchmark === true) return false;
    const measuredAt = parseAppTimestamp(observation.timestamp)?.getTime() ?? Number.NaN;
    if (!Number.isFinite(measuredAt) || measuredAt >= targetTime) return false;
    if (typeof observation.temperatureC !== 'number' || !Number.isFinite(observation.temperatureC) ||
        observation.temperatureC < 0 || observation.temperatureC > 35) return false;
    // Normaliseer tijdzones zodat dezelfde fysieke meting uit sessie en snapshot
    // niet dubbel telt door bijvoorbeeld Z versus +02:00.
    const depthKey = normalizeMeasurementDepth(observation.measurementDepthM);
    const key = `${observation.locationId}|${measuredAt}|${observation.temperatureC}|${depthKey ?? 'unknown'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const measuredMonth = getAmsterdamMonth(observation.timestamp);
    return measuredMonth !== null && monthDistance(targetMonth, measuredMonth) <= 1;
  });

  const sameLocation = valid.filter((observation) => observation.locationId === location.id);
  const explicitDepth = normalizeMeasurementDepth(
    typeof targetMeasurementDepthM === 'number' ? targetMeasurementDepthM : undefined
  );
  const selectOneDepthLayer = (candidates: HistoricalWaterTemperatureObservation[], requestedDepth: number | null) => {
    if (requestedDepth !== null) {
      return {
        observations: candidates.filter((item) => normalizeMeasurementDepth(item.measurementDepthM) === requestedDepth),
        depth: requestedDepth,
        ambiguous: false,
      };
    }
    const knownDepths = [...new Set(candidates
      .map((item) => normalizeMeasurementDepth(item.measurementDepthM))
      .filter((depth): depth is number => depth !== null))].sort((a, b) => a - b);
    if (knownDepths.length > 1) return { observations: [], depth: null, ambiguous: true };
    const depth = knownDepths[0] ?? null;
    return {
      observations: candidates.filter((item) => normalizeMeasurementDepth(item.measurementDepthM) === depth),
      depth,
      ambiguous: false,
    };
  };

  const localLayer = selectOneDepthLayer(sameLocation, explicitDepth);
  if (localLayer.ambiguous) return null;
  let selected = localLayer.observations;
  let selectedMeasurementDepthM = localLayer.depth;
  let source: HistoricalWaterTemperatureProfile['source'] = 'same_location';

  if (selected.length < 3) {
    if (!location.waterType || location.waterType === 'Onbekend') return null;
    const nearbyCandidates = valid.filter((observation) => {
      if (observation.locationId === location.id || observation.waterType !== location.waterType) return false;
      const distance = distanceKm(location, observation);
      if (distance === null || distance > 50) return false;
      if (typeof location.waterDepth === 'number' && typeof observation.waterDepth === 'number') {
        const tolerance = Math.max(1.5, location.waterDepth * 0.5);
        if (Math.abs(location.waterDepth - observation.waterDepth) > tolerance) return false;
      }
      return true;
    });
    const nearbyLayer = sameLocation.length > 0
      ? {
          observations: nearbyCandidates.filter((item) =>
            normalizeMeasurementDepth(item.measurementDepthM) === selectedMeasurementDepthM
          ),
          depth: selectedMeasurementDepthM,
          ambiguous: false,
        }
      : selectOneDepthLayer(nearbyCandidates, explicitDepth);
    if (nearbyLayer.ambiguous) return null;
    selected = nearbyLayer.observations;
    selectedMeasurementDepthM = nearbyLayer.depth;
    const distinctLocations = new Set(selected.map((item) => item.locationId));
    if (selected.length < 5 || distinctLocations.size < 2) return null;
    source = 'nearby_same_type';
  }

  const values = selected.map((item) => item.temperatureC);
  const baselineC = median(values);
  const lowerC = percentile(values, 0.2);
  const upperC = percentile(values, 0.8);
  return {
    baselineC: Math.round(baselineC * 10) / 10,
    lowerC: Math.round(lowerC * 10) / 10,
    upperC: Math.round(upperC * 10) / 10,
    uncertaintyC: Math.round(Math.max(0.5, (upperC - lowerC) / 2) * 10) / 10,
    sampleCount: selected.length,
    locationCount: new Set(selected.map((item) => item.locationId)).size,
    source,
    measurementDepthM: selectedMeasurementDepthM,
  };
}
