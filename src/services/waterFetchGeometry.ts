import { db } from '../db/db';
import type { WeatherCacheEntry } from '../types';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SEARCH_RADIUS_M = 3000;
const SECTOR_COUNT = 16;
const SECTOR_WIDTH_DEG = 360 / SECTOR_COUNT;

export interface DirectionalWaterFetch {
  fetchedAt: string;
  source: 'openstreetmap';
  sectorFetchM: number[];
  polygonAreaM2: number;
}

type Coordinate = { lat: number; lon: number };

function localXY(point: Coordinate, origin: Coordinate): { x: number; y: number } {
  const meanLatRad = origin.lat * Math.PI / 180;
  return {
    x: (point.lon - origin.lon) * 111320 * Math.cos(meanLatRad),
    y: (point.lat - origin.lat) * 110540,
  };
}

function pointInRing(point: Coordinate, ring: Coordinate[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    const crosses = ((a.lat > point.lat) !== (b.lat > point.lat)) &&
      point.lon < (b.lon - a.lon) * (point.lat - a.lat) / (b.lat - a.lat) + a.lon;
    if (crosses) inside = !inside;
  }
  return inside;
}

function polygonAreaM2(ring: Coordinate[], origin: Coordinate): number {
  const xy = ring.map((point) => localXY(point, origin));
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const next = xy[(i + 1) % xy.length];
    area += xy[i].x * next.y - next.x * xy[i].y;
  }
  return Math.abs(area / 2);
}

function rayBoundaryDistanceM(origin: Coordinate, ring: Coordinate[], bearingDegrees: number): number | null {
  const points = ring.map((point) => localXY(point, origin));
  const angle = bearingDegrees * Math.PI / 180;
  const rayX = Math.sin(angle), rayY = Math.cos(angle);
  let nearest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const sx = b.x - a.x, sy = b.y - a.y;
    const denominator = rayX * sy - rayY * sx;
    if (Math.abs(denominator) < 1e-9) continue;
    const distance = (a.x * sy - a.y * sx) / denominator;
    const segmentPosition = (a.x * rayY - a.y * rayX) / denominator;
    if (distance >= 0 && segmentPosition >= 0 && segmentPosition <= 1) nearest = Math.min(nearest, distance);
  }
  return Number.isFinite(nearest) ? Math.max(0, nearest) : null;
}

/** Interpolates the 16 OSM-derived upwind fetch sectors for meteorological wind-from direction. */
export function getDirectionalFetchM(sectors: number[] | undefined, windFromDegrees: number | undefined): number | undefined {
  if (!sectors || sectors.length !== SECTOR_COUNT || !sectors.every((value) => Number.isFinite(value) && value >= 0)) return undefined;
  if (typeof windFromDegrees !== 'number' || !Number.isFinite(windFromDegrees)) return undefined;
  const normalized = ((windFromDegrees % 360) + 360) % 360;
  const position = normalized / SECTOR_WIDTH_DEG;
  const lower = Math.floor(position) % SECTOR_COUNT;
  const upper = (lower + 1) % SECTOR_COUNT;
  const fraction = position - Math.floor(position);
  return sectors[lower] * (1 - fraction) + sectors[upper] * fraction;
}

function isWaterPolygon(tags: Record<string, string> = {}): boolean {
  return tags.natural === 'water' || tags.landuse === 'reservoir' ||
    tags.waterway === 'riverbank' || ['lake', 'pond', 'reservoir', 'basin'].includes(tags.water ?? '');
}

/**
 * Looks up a closed OSM water polygon containing the stek and derives 16 directional
 * upwind fetch distances. Unsupported/ambiguous geometry returns null; never guesses.
 */
export async function getAutomaticWaterFetch(
  latitude: number,
  longitude: number,
  options: { forceRefresh?: boolean } = {}
): Promise<DirectionalWaterFetch | null> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

  const cacheId = `waterfetch_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  const cached = await db.weatherCache.get(cacheId);
  const cachedFetch = (cached as (WeatherCacheEntry & { directionalWaterFetch?: DirectionalWaterFetch }) | undefined)?.directionalWaterFetch;
  if (!options.forceRefresh && cachedFetch && Date.now() - Date.parse(cachedFetch.fetchedAt) < CACHE_MAX_AGE_MS &&
      cachedFetch.sectorFetchM?.length === SECTOR_COUNT) return cachedFetch;

  const query = `[out:json][timeout:8];(way(around:${SEARCH_RADIUS_M},${latitude},${longitude})[natural=water];way(around:${SEARCH_RADIUS_M},${latitude},${longitude})[landuse=reservoir];way(around:${SEARCH_RADIUS_M},${latitude},${longitude})[waterway=riverbank];way(around:${SEARCH_RADIUS_M},${latitude},${longitude})[water~"^(lake|pond|reservoir|basin)$"];);out tags geom;`;
  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ data: query }).toString(),
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { elements?: Array<{ type?: string; tags?: Record<string, string>; geometry?: Coordinate[] }> };
    const origin = { lat: latitude, lon: longitude };
    const candidates = (payload.elements ?? []).flatMap((element) => {
      const ring = element.type === 'way' && isWaterPolygon(element.tags) ? element.geometry : undefined;
      if (!ring || ring.length < 4 || ring[0].lat !== ring[ring.length - 1].lat ||
          !ring.every((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon)) ||
          !pointInRing(origin, ring)) return [];
      const area = polygonAreaM2(ring, origin);
      return area > 0 ? [{ ring, area }] : [];
    }).sort((a, b) => a.area - b.area);

    // If multiple nested water features contain the pin, use the smallest mapped water polygon.
    const selected = candidates[0];
    if (!selected) return null;
    const sectorFetchM = Array.from({ length: SECTOR_COUNT }, (_, index) =>
      rayBoundaryDistanceM(origin, selected.ring, index * SECTOR_WIDTH_DEG)
    );
    if (sectorFetchM.some((distance) => distance === null)) return null;
    const result: DirectionalWaterFetch = {
      fetchedAt: new Date().toISOString(),
      source: 'openstreetmap',
      sectorFetchM: sectorFetchM as number[],
      polygonAreaM2: selected.area,
    };
    const cacheEntry: WeatherCacheEntry & { directionalWaterFetch: DirectionalWaterFetch } = {
      id: cacheId, latitude, longitude, fetchedAt: result.fetchedAt,
      hourly: [], dailySummary: [], directionalWaterFetch: result,
    };
    await db.weatherCache.put(cacheEntry);
    return result;
  } catch {
    // Network/CORS/Overpass failures are an explicit absence of geometry, not zero fetch.
    return null;
  }
}
