import { db } from '../db/db';
import type { CachedWaterColumnWeatherHistory, CachedWaterColumnWeatherSample } from '../types';
import type { WaterColumnForcingSample } from './waterColumnModel';

const HISTORY_DAYS = 180;
const ARCHIVE_DELAY_DAYS = 5;
const RECENT_BRIDGE_DAYS = 7;
const CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export interface WaterColumnForcingResult {
  hourly: WaterColumnForcingSample[];
  asOf: string;
  source: 'era5-seamless+open-meteo-forecast' | 'partial' | 'cache' | 'unavailable';
  quality: 'complete' | 'partial' | 'unavailable';
  fromCache: boolean;
  stale: boolean;
  historyStartDate: string;
  archiveEndDate: string;
  message: string;
}

function amsterdamDate(timestampMs: number): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(timestampMs));
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return shifted.toISOString().slice(0, 10);
}

function parseHourlyBlock(
  data: any,
  source: CachedWaterColumnWeatherSample['source'],
  availableAt: string
): CachedWaterColumnWeatherSample[] {
  const hourly = data?.hourly;
  const times: unknown[] = Array.isArray(hourly?.time) ? hourly.time : [];
  return times.flatMap((rawTime, index) => {
    const seconds = Number(rawTime);
    const airTemperatureC = Number(hourly?.temperature_2m?.[index]);
    if (!Number.isFinite(seconds) || !Number.isFinite(airTemperatureC) ||
        airTemperatureC < -60 || airTemperatureC > 60) return [];
    const optional = (value: unknown, min: number, max: number): number | undefined =>
      typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : undefined;
    const sample: CachedWaterColumnWeatherSample = {
      time: new Date(seconds * 1000).toISOString(),
      availableAt,
      airTemperatureC,
      source,
    };
    const windSpeedKmh = optional(hourly?.wind_speed_10m?.[index], 0, 200);
    const shortwaveRadiationWm2 = optional(hourly?.shortwave_radiation?.[index], 0, 1600);
    const cloudCoverPercent = optional(hourly?.cloud_cover?.[index], 0, 100);
    const dewPointC = optional(hourly?.dew_point_2m?.[index], -60, 60);
    const relativeHumidityPercent = optional(hourly?.relative_humidity_2m?.[index], 0, 100);
    if (windSpeedKmh !== undefined) sample.windSpeedKmh = windSpeedKmh;
    if (shortwaveRadiationWm2 !== undefined) sample.shortwaveRadiationWm2 = shortwaveRadiationWm2;
    if (cloudCoverPercent !== undefined) sample.cloudCoverPercent = cloudCoverPercent;
    if (dewPointC !== undefined) sample.dewPointC = dewPointC;
    if (relativeHumidityPercent !== undefined) sample.relativeHumidityPercent = relativeHumidityPercent;
    return [sample];
  });
}

function historyCovers(
  history: CachedWaterColumnWeatherHistory,
  requestedStartDate: string,
  targetTimeMs: number
): boolean {
  if (history.startDate > requestedStartDate || history.hourly.length === 0) return false;
  const first = Date.parse(history.hourly[0].time);
  const last = Date.parse(history.hourly[history.hourly.length - 1].time);
  return Number.isFinite(first) && Number.isFinite(last) &&
    first <= Date.parse(`${requestedStartDate}T00:00:00Z`) &&
    last >= targetTimeMs;
}

function toResult(
  history: CachedWaterColumnWeatherHistory | undefined,
  asOf: string,
  fromCache: boolean,
  stale: boolean,
  message?: string,
  qualityOverride?: 'complete' | 'partial' | 'unavailable'
): WaterColumnForcingResult {
  if (!history) {
    return {
      hourly: [], asOf, source: 'unavailable', quality: 'unavailable', fromCache, stale,
      historyStartDate: '', archiveEndDate: '',
      message: message ?? 'Geen historische of recente uurlijkse weersforcing beschikbaar.',
    };
  }
  const sources = new Set(history.hourly.map((sample) => sample.source));
  const complete = sources.has('era5-seamless') && sources.has('open-meteo-forecast');
  const quality = qualityOverride ?? (complete ? 'complete' : 'partial');
  return {
    hourly: history.hourly.map((sample) => ({ ...sample })),
    asOf,
    source: fromCache ? 'cache' : quality === 'complete' ? 'era5-seamless+open-meteo-forecast' : 'partial',
    quality,
    fromCache,
    stale,
    historyStartDate: history.startDate,
    archiveEndDate: history.archiveEndDate,
    message: message ?? (complete
      ? 'Historische ERA5-Seamless forcing en recente Open-Meteo forecastdata zijn samengevoegd.'
      : 'Slechts een deel van de historische/recentere weersforcing is beschikbaar; de temperatuurprognose moet bredere onzekerheid tonen.'),
  };
}

/**
 * Builds the 180-day spin-up forcing and forecast bridge for the water column.
 * An explicit asOf is replay-only: no network request is made, preventing hindsight leakage.
 */
export async function getWaterColumnForcing(
  latitude: number,
  longitude: number,
  targetTime: string,
  options: { asOf?: string; forceRefresh?: boolean } = {}
): Promise<WaterColumnForcingResult> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Geldige stekcoördinaten zijn vereist voor historische waterforcing.');
  }
  const targetTimeMs = Date.parse(targetTime);
  if (!Number.isFinite(targetTimeMs)) throw new Error('Ongeldig doelmoment voor waterforcing.');

  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  const now = Date.now();
  const requestedAsOfMs = options.asOf ? Date.parse(options.asOf) : now;
  if (!Number.isFinite(requestedAsOfMs)) throw new Error('Ongeldig as-of-moment voor waterforcing.');
  const requestedAsOf = options.asOf ?? new Date(now).toISOString();
  const asOfDate = amsterdamDate(requestedAsOfMs);
  const historyStartDate = shiftDate(asOfDate, -HISTORY_DAYS);
  const archiveEndDate = shiftDate(asOfDate, -ARCHIVE_DELAY_DAYS);
  const cachedEntry = await db.weatherCache.get(cacheKey);
  const cachedHistory = cachedEntry?.waterColumnHistory;
  const cacheRetrievedAtMs = cachedHistory ? Date.parse(cachedHistory.retrievedAt) : Number.NaN;
  const cacheAvailableAtAsOf = Boolean(cachedHistory && Number.isFinite(cacheRetrievedAtMs) &&
    cacheRetrievedAtMs <= requestedAsOfMs && cachedHistory.hourly.every((sample) =>
      Date.parse(sample.availableAt) <= requestedAsOfMs));
  const covers = cachedHistory && historyCovers(cachedHistory, historyStartDate, targetTimeMs);
  const cacheAgeMs = Number.isFinite(cacheRetrievedAtMs) ? now - cacheRetrievedAtMs : Infinity;
  const historicalReplay = options.asOf !== undefined;

  if (cacheAvailableAtAsOf && covers && (historicalReplay || (!options.forceRefresh && cacheAgeMs <= CACHE_MAX_AGE_MS))) {
    return toResult(cachedHistory, requestedAsOf, true, cacheAgeMs > CACHE_MAX_AGE_MS,
      historicalReplay ? 'Historische forcing uit de lokale cache; alle waarden waren beschikbaar op het opgegeven as-of-moment.' : undefined);
  }
  if (historicalReplay) {
    return toResult(undefined, requestedAsOf, false, false,
      'Geen lokaal gecachte forcing die aantoonbaar beschikbaar was op dit historische as-of-moment; netwerkdata wordt niet achteraf als toen beschikbaar behandeld.');
  }

  const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${historyStartDate}&end_date=${archiveEndDate}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,shortwave_radiation,cloud_cover,wind_speed_10m&models=era5_seamless&temperature_unit=celsius&wind_speed_unit=kmh&timezone=Europe%2FAmsterdam&timeformat=unixtime`;
  const recentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&past_days=${RECENT_BRIDGE_DAYS}&forecast_days=8&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,shortwave_radiation,cloud_cover,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=Europe%2FAmsterdam&timeformat=unixtime`;

  const responses = await Promise.allSettled([
    fetch(archiveUrl, { signal: AbortSignal.timeout(15000) }),
    fetch(recentUrl, { signal: AbortSignal.timeout(10000) }),
  ]);
  const parseResponse = async (responseResult: PromiseSettledResult<Response>): Promise<any | null> => {
    if (responseResult.status !== 'fulfilled' || !responseResult.value.ok) return null;
    try {
      return await responseResult.value.json();
    } catch {
      return null;
    }
  };
  const [archiveData, recentData] = await Promise.all([
    parseResponse(responses[0]),
    parseResponse(responses[1]),
  ]);
  const retrievedAt = new Date().toISOString();
  const archiveSamples = archiveData ? parseHourlyBlock(archiveData, 'era5-seamless', retrievedAt) : [];
  const recentSamples = recentData ? parseHourlyBlock(recentData, 'open-meteo-forecast', retrievedAt) : [];
  const merged = new Map<string, CachedWaterColumnWeatherSample>();
  // Preserve usable older samples if one upstream source is temporarily unavailable.
  cachedHistory?.hourly.forEach((sample) => { merged.set(sample.time, sample); });
  archiveSamples.forEach((sample) => { merged.set(sample.time, sample); });
  // Recent forecast history and future forecast replace overlapping archive hours.
  recentSamples.forEach((sample) => { merged.set(sample.time, sample); });
  const hourly = [...merged.values()].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const history: CachedWaterColumnWeatherHistory | undefined = hourly.length > 0 ? {
    startDate: historyStartDate,
    archiveEndDate,
    retrievedAt,
    hourly,
  } : undefined;

  if (history) {
    const updated = await db.weatherCache.update(cacheKey, { waterColumnHistory: history });
    if (updated === 0) {
      await db.weatherCache.put({
        id: cacheKey, latitude, longitude, fetchedAt: retrievedAt,
        hourly: [], dailySummary: [], waterColumnHistory: history,
      });
    }
  }

  const complete = Boolean(history && history.hourly.some((sample) => sample.source === 'era5-seamless') &&
    history.hourly.some((sample) => sample.source === 'open-meteo-forecast'));
  const bothSourcesRefreshed = archiveSamples.length > 0 && recentSamples.length > 0;
  if (!history && cacheAvailableAtAsOf && cachedHistory && covers) {
    return toResult(cachedHistory, requestedAsOf, true, true,
      'Netwerkverversing mislukt; de laatst beschikbare lokale forcing wordt met lagere betrouwbaarheid hergebruikt.', 'partial');
  }
  return toResult(history, retrievedAt, false, false, history
    ? complete
      ? bothSourcesRefreshed
        ? 'ERA5-Seamless historische forcing (tot vijf dagen vertraging) is met zeven dagen recente historie en de forecast overbrugd.'
        : 'De actuele forcing is aangevuld met eerder gecachte uren; één upstream bron kon niet worden ververst.'
      : 'Historische forcing is gedeeltelijk beschikbaar; ontbrekende bronnen of variabelen blijven onbekend.'
    : 'Open-Meteo leverde geen bruikbare forcing. Een best-effort schatting moet terugvallen op beschikbare metingen/weerdata met lage betrouwbaarheid.',
    bothSourcesRefreshed ? 'complete' : 'partial');
}
