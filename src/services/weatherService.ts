import { WeatherHourlyForecast, WeatherSnapshot, WeatherCacheEntry } from '../types';
import { db } from '../db/db';

export function getWindDirectionText(deg: number): string {
  const normalized = (deg % 360 + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NO';
  if (normalized >= 67.5 && normalized < 112.5) return 'O';
  if (normalized >= 112.5 && normalized < 157.5) return 'ZO';
  if (normalized >= 157.5 && normalized < 202.5) return 'Z';
  if (normalized >= 202.5 && normalized < 247.5) return 'ZW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  return 'NW';
}

export function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return 'Helder / Onbewolkt';
    case 1: return 'Overwegend helder';
    case 2: return 'Gedeeltelijk bewolkt';
    case 3: return 'Zwaarbewolkt';
    case 45: case 48: return 'Mist / Nevel';
    case 51: case 53: case 55: return 'Motregen';
    case 61: return 'Lichte regen';
    case 63: return 'Matige regen';
    case 65: return 'Zware regen';
    case 71: case 73: case 75: return 'Sneeuwval';
    case 80: case 81: case 82: return 'Regenbuien';
    case 95: case 96: case 99: return 'Onweer';
    default: return 'Wisselend';
  }
}


/** Datum als YYYY-MM-DD in de app-tijdzone, onafhankelijk van UTC-datumverschuiving. */
export function formatAmsterdamDate(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export interface ForecastResponse {
  hourly: WeatherHourlyForecast[];
  dailySummaries: {
    date: string;
    tempMax: number;
    tempMin: number;
    sunrise: string;
    sunset: string;
  }[];
  isFromCache: boolean;
  fetchedAt: string;
  source: 'open-meteo' | 'gecached' | 'fallback';
}

/** Event dat views opnieuw laat rekenen nadat de lokale weer-cache is bijgewerkt. */
export const WEATHER_UPDATED_EVENT = 'vislogboek:weather-updated';

/**
 * Start achtergrondverversing voor alle bekende stekken.
 * - Eerste run gebruikt de cache als die jonger is dan 30 minuten.
 * - Daarna iedere 30 minuten een geforceerde update.
 * - Bij terugkeer naar een zichtbare app wordt eveneens vernieuwd.
 * Geeft een cleanup-functie terug voor React useEffect.
 */
export function startWeatherAutoRefresh(
  locations: Array<{ latitude?: number; longitude?: number }>,
  intervalMs = 30 * 60 * 1000
): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined;

  const uniqueLocations = new Map<string, { latitude: number; longitude: number }>();
  for (const location of locations) {
    const lat = location.latitude;
    const lon = location.longitude;
    if (typeof lat !== 'number' || !Number.isFinite(lat) ||
        typeof lon !== 'number' || !Number.isFinite(lon)) continue;
    uniqueLocations.set(`${lat.toFixed(2)}_${lon.toFixed(2)}`, { latitude: lat, longitude: lon });
  }

  let stopped = false;
  let lastRefreshAt = 0;

  const refreshAll = async (forceRefresh: boolean) => {
    if (stopped || (typeof navigator !== 'undefined' && !navigator.onLine) || uniqueLocations.size === 0) return;
    const results = await Promise.allSettled(
      Array.from(uniqueLocations.values()).map(({ latitude, longitude }) =>
        getForecast(latitude, longitude, forceRefresh)
      )
    );
    if (stopped) return;
    const updated = results.some((result) => result.status === 'fulfilled');
    if (updated) {
      lastRefreshAt = Date.now();
      window.dispatchEvent(new CustomEvent(WEATHER_UPDATED_EVENT));
    }
    results.forEach((result) => {
      if (result.status === 'rejected') console.warn('Achtergrondverversing weerdata mislukt:', result.reason);
    });
  };

  void refreshAll(false);
  const timer = window.setInterval(() => void refreshAll(true), intervalMs);
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastRefreshAt >= 30 * 60 * 1000) {
      void refreshAll(true);
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

/**
 * Haalt weersverwachting op via Open-Meteo met automatische fallback naar IndexedDB cache.
 */
export async function getForecast(
  lat = 51.961,
  lon = 5.228,
  forceRefresh = false
): Promise<ForecastResponse> {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;

  // 1. Controleer lokale cache
  const cached = await db.weatherCache.get(cacheKey);
  const now = Date.now();
  const cacheAgeMinutes = cached ? (now - new Date(cached.fetchedAt).getTime()) / 60000 : Infinity;

  // Gebruik cache indien jonger dan 30 minuten en niet geforceerd vernieuwd
  if (cached && cacheAgeMinutes < 30 && !forceRefresh) {
    return {
      hourly: cached.hourly,
      dailySummaries: cached.dailySummary || [],
      isFromCache: true,
      fetchedAt: cached.fetchedAt,
      source: 'gecached',
    };
  }

  // 2. Probeer Open-Meteo op te halen
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,shortwave_radiation,precipitation,precipitation_probability,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=Europe%2FAmsterdam&past_days=3&forecast_days=8`;

    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) {
      throw new Error(`Open-Meteo status ${response.status}`);
    }

    const data = await response.json();
    const hourlyTimes: string[] = data.hourly?.time || [];
    const temps: number[] = data.hourly?.temperature_2m || [];
    const humidities: number[] = data.hourly?.relative_humidity_2m || [];
    const dewPoints: number[] = data.hourly?.dew_point_2m || [];
    const shortwaveRadiation: number[] = data.hourly?.shortwave_radiation || [];
    const pressures: number[] = data.hourly?.surface_pressure || [];
    const windSpeeds: number[] = data.hourly?.wind_speed_10m || [];
    const windDirs: number[] = data.hourly?.wind_direction_10m || [];
    const precips: number[] = data.hourly?.precipitation || [];
    const precipProbs: number[] = data.hourly?.precipitation_probability || [];
    const clouds: number[] = data.hourly?.cloud_cover || [];
    const codes: number[] = data.hourly?.weather_code || [];

    // Ontbrekende API-velden worden niet met verzonnen gemiddelden ingevuld.
    const hourlyForecasts: WeatherHourlyForecast[] = hourlyTimes.flatMap((time, idx) => {
      const values = [temps[idx], pressures[idx], windSpeeds[idx], windDirs[idx], precips[idx], precipProbs[idx], clouds[idx], codes[idx]];
      if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) return [];
      const windDirection = windDirs[idx];
      return [{
        time,
        temperature: temps[idx],
        ...(Number.isFinite(humidities[idx]) && humidities[idx] >= 0 && humidities[idx] <= 100 ? { relativeHumidity: humidities[idx] } : {}),
        ...(Number.isFinite(dewPoints[idx]) && dewPoints[idx] >= -50 && dewPoints[idx] <= 50 ? { dewPoint: dewPoints[idx] } : {}),
        ...(Number.isFinite(shortwaveRadiation[idx]) && shortwaveRadiation[idx] >= 0 && shortwaveRadiation[idx] <= 1600 ? { shortwaveRadiation: shortwaveRadiation[idx] } : {}),
        pressure: pressures[idx],
        windSpeed: windSpeeds[idx],
        windDirection,
        windDirectionText: getWindDirectionText(windDirection),
        precipitation: precips[idx],
        precipitationProbability: precipProbs[idx],
        cloudCover: clouds[idx],
        weatherCode: codes[idx],
      }];
    });

    if (hourlyForecasts.length === 0) {
      throw new Error('Open-Meteo leverde geen complete uurlijkse weergegevens.');
    }

    const dailySummaries = (data.daily?.time || []).flatMap((dateStr: string, idx: number) => {
      const tempMax = data.daily?.temperature_2m_max?.[idx];
      const tempMin = data.daily?.temperature_2m_min?.[idx];
      const sunrise = data.daily?.sunrise?.[idx];
      const sunset = data.daily?.sunset?.[idx];
      if (![tempMax, tempMin].every((value) => typeof value === 'number' && Number.isFinite(value)) || !sunrise || !sunset) return [];
      return [{ date: dateStr, tempMax, tempMin, sunrise, sunset }];
    });

    const cacheEntry: WeatherCacheEntry = {
      id: cacheKey,
      latitude: lat,
      longitude: lon,
      fetchedAt: new Date().toISOString(),
      hourly: hourlyForecasts,
      dailySummary: dailySummaries,
    };

    // Bewaar in IndexedDB
    await db.weatherCache.put(cacheEntry);

    return {
      hourly: hourlyForecasts,
      dailySummaries,
      isFromCache: false,
      fetchedAt: cacheEntry.fetchedAt,
      source: 'open-meteo',
    };
  } catch (err) {
    console.warn('Kon actuele weersverwachting niet ophalen:', err);

    // Als er oude cache is, gebruik die
    if (cached) {
      return {
        hourly: cached.hourly,
        dailySummaries: cached.dailySummary || [],
        isFromCache: true,
        fetchedAt: cached.fetchedAt,
        source: 'gecached',
      };
    }

    // Geen cache en geen verbinding: geef geen verzonnen weersomstandigheden terug.
    return {
      hourly: [],
      dailySummaries: [],
      isFromCache: false,
      fetchedAt: new Date().toISOString(),
      source: 'fallback',
    };
  }
}

/**
 * Maakt een actuele snapshot van het weer voor bij een vissessie
 */
export async function getCurrentWeatherSnapshot(
  lat = 51.961,
  lon = 5.228
): Promise<WeatherSnapshot> {
  try {
    const forecast = await getForecast(lat, lon, false);
    const nowIso = new Date().toISOString();

    // Vind dichtstbijzijnde uur
    let closest = forecast.hourly[0];
    let minDiff = Infinity;
    const nowTime = new Date().getTime();

    for (const h of forecast.hourly) {
      const diff = Math.abs(new Date(h.time).getTime() - nowTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = h;
      }
    }

    if (closest) {
      return {
        temperature: closest.temperature,
        ...(typeof closest.relativeHumidity === 'number' ? { relativeHumidity: closest.relativeHumidity } : {}),
        ...(typeof closest.dewPoint === 'number' ? { dewPoint: closest.dewPoint } : {}),
        ...(typeof closest.shortwaveRadiation === 'number' ? { shortwaveRadiation: closest.shortwaveRadiation } : {}),
        pressure: closest.pressure,
        pressureTrend: 'stabiel',
        windSpeed: closest.windSpeed,
        windDirection: closest.windDirection,
        windDirectionText: closest.windDirectionText,
        cloudCover: closest.cloudCover,
        precipitation: closest.precipitation,
        precipitationProbability: closest.precipitationProbability,
        weatherCode: closest.weatherCode,
        source: forecast.isFromCache ? 'gecached' : 'open-meteo',
        capturedAt: nowIso,
      };
    }
  } catch (e) {
    console.warn('Snapshot fallback gebruikt:', e);
  }

  throw new Error('Geen actuele of gecachete weergegevens beschikbaar voor deze locatie.');
}

/**
 * Haalt historische weersgegevens op via de Open-Meteo Historical Archive API
 * voor een vissessie in het verleden.
 *
 * Specificaties conform v2.2 Blueprint:
 * - Bron: 'open-meteo-historisch' (of 'onbekend' bij fout/offline)
 * - Tijdzone: Europe/Amsterdam
 * - Exacte sessiecoördinaten (lat/lon)
 * - Selecteert het representatieve uur binnen de sessie
 * - Watertemperatuur: null (wordt NOOIT verzonnen)
 * - Duidelijke foutafhandeling zonder sessieregistratie te blokkeren
 */
export async function fetchHistoricalWeatherSnapshot(
  lat: number,
  lon: number,
  sessionStartTimeIso: string,
  sessionEndTimeIso?: string | null
): Promise<{ snapshot: WeatherSnapshot | null; message: string; success: boolean }> {
  try {
    const startMs = new Date(sessionStartTimeIso).getTime();
    const endMsForDate = sessionEndTimeIso ? new Date(sessionEndTimeIso).getTime() : startMs;
    const startDate = Number.isFinite(startMs) ? formatAmsterdamDate(new Date(startMs)) : '';
    const endDate = Number.isFinite(endMsForDate) ? formatAmsterdamDate(new Date(endMsForDate)) : startDate;

    if (isNaN(startMs)) {
      return { snapshot: null, message: 'Ongeldige startdatum voor weersverrijking.', success: false };
    }

    if (startMs > Date.now()) {
      return { snapshot: null, message: 'Starttijd ligt in de toekomst. Gebruik actuele voorspelling.', success: false };
    }

    // 1. Probeer Open-Meteo Archive API
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,shortwave_radiation,precipitation,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=Europe%2FAmsterdam`;

    let data: any = null;
    try {
      const resp = await fetch(archiveUrl, { signal: AbortSignal.timeout(6000) });
      if (resp.ok) {
        data = await resp.json();
      }
    } catch {
      // Archive kon timeouten of recente dagen nog niet in reanalyse hebben
    }

    // 2. Fallback voor recente dagen (laatste 1-7 dagen) via past_days op forecast API
    if (!data?.hourly?.time || data.hourly.time.length === 0) {
      try {
        const recentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&past_days=7&forecast_days=1&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=Europe%2FAmsterdam`;
        const recentResp = await fetch(recentUrl, { signal: AbortSignal.timeout(6000) });
        if (recentResp.ok) {
          data = await recentResp.json();
        }
      } catch {
        // Negeer en ga door naar controle
      }
    }

    if (!data?.hourly?.time || data.hourly.time.length === 0) {
      return {
        snapshot: null,
        message: 'Geen historische weergegevens beschikbaar in het archief voor deze datum/locatie.',
        success: false,
      };
    }

    const hourlyTimes: string[] = data.hourly.time;
    const temps: number[] = data.hourly.temperature_2m || [];
    const humidities: number[] = data.hourly.relative_humidity_2m || [];
    const dewPoints: number[] = data.hourly.dew_point_2m || [];
    const shortwaveRadiation: number[] = data.hourly.shortwave_radiation || [];
    const pressures: number[] = data.hourly.surface_pressure || [];
    const windSpeeds: number[] = data.hourly.wind_speed_10m || [];
    const windDirs: number[] = data.hourly.wind_direction_10m || [];
    const precips: number[] = data.hourly.precipitation || [];
    const clouds: number[] = data.hourly.cloud_cover || [];
    const codes: number[] = data.hourly.weather_code || [];

    // Zoek het uur dichtst bij starttijd of halverwege sessie
    const endMs = sessionEndTimeIso ? new Date(sessionEndTimeIso).getTime() : startMs;
    const targetMs = (startMs + endMs) / 2;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < hourlyTimes.length; i++) {
      const tMs = new Date(hourlyTimes[i]).getTime();
      const diff = Math.abs(tMs - targetMs);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    const windDir = windDirs[closestIdx] ?? 230;

    // Drukverloop (3-uurs barometrische tendens): bereken indien eerdere uren in de reeks aanwezig zijn
    let pressureTrend: 'stijgend' | 'dalend' | 'stabiel' = 'stabiel';
    if (closestIdx >= 3 && pressures[closestIdx] != null && pressures[closestIdx - 3] != null) {
      const delta3h = pressures[closestIdx] - pressures[closestIdx - 3];
      if (delta3h > 1.5) pressureTrend = 'stijgend';
      else if (delta3h < -1.5) pressureTrend = 'dalend';
      else pressureTrend = 'stabiel';
    } else if (closestIdx >= 1 && pressures[closestIdx] != null && pressures[0] != null) {
      const deltaScaled = (pressures[closestIdx] - pressures[0]) * (3 / closestIdx);
      if (deltaScaled > 1.5) pressureTrend = 'stijgend';
      else if (deltaScaled < -1.5) pressureTrend = 'dalend';
      else pressureTrend = 'stabiel';
    }

    const snapshot: WeatherSnapshot = {
      temperature: Math.round((temps[closestIdx] ?? 12) * 10) / 10,
      ...(Number.isFinite(humidities[closestIdx]) && humidities[closestIdx] >= 0 && humidities[closestIdx] <= 100 ? { relativeHumidity: humidities[closestIdx] } : {}),
      ...(Number.isFinite(dewPoints[closestIdx]) && dewPoints[closestIdx] >= -50 && dewPoints[closestIdx] <= 50 ? { dewPoint: dewPoints[closestIdx] } : {}),
      ...(Number.isFinite(shortwaveRadiation[closestIdx]) && shortwaveRadiation[closestIdx] >= 0 && shortwaveRadiation[closestIdx] <= 1600 ? { shortwaveRadiation: shortwaveRadiation[closestIdx] } : {}),
      pressure: Math.round(pressures[closestIdx] ?? 1015),
      pressureTrend,
      windSpeed: Math.round(windSpeeds[closestIdx] ?? 12),
      windDirection: windDir,
      windDirectionText: getWindDirectionText(windDir),
      cloudCover: Math.round(clouds[closestIdx] ?? 50),
      precipitation: Math.round((precips[closestIdx] ?? 0) * 10) / 10,
      weatherCode: codes[closestIdx] ?? 0,
      waterTemperature: null, // Expliciet NOOIT verzonnen!
      source: 'open-meteo-historisch',
      capturedAt: new Date().toISOString(),
    };

    return {
      snapshot,
      message: `Historisch weer succesvol opgehaald via Open-Meteo Archief (Europe/Amsterdam): ${snapshot.temperature} °C, ${snapshot.pressure} hPa, ${snapshot.windDirectionText} ${snapshot.windSpeed} km/u.`,
      success: true,
    };
  } catch (err: any) {
    return {
      snapshot: null,
      message: `Kon historisch weer niet ophalen (${err?.message || 'netwerkfout'}).`,
      success: false,
    };
  }
}
