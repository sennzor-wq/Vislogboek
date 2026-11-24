import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { getWaterColumnForcing } from './src/services/waterColumnWeatherService';
import { getForecast } from './src/services/weatherService';

async function run() {
  await db.delete();
  await db.open();
  const originalFetch = globalThis.fetch;
  const now = Date.now();
  const oldTime = Math.floor((now - 10 * 86400000) / 1000);
  const recentTime = Math.floor((now - 86400000) / 1000);
  const futureTime = Math.floor((now + 86400000) / 1000);
  let fetchCalls = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    fetchCalls++;
    const url = String(input);
    const isArchive = url.includes('archive-api.open-meteo.com');
    const isRegularForecast = url.includes('past_days=3');
    if (isArchive && !url.includes('models=era5_seamless')) throw new Error('ERA5-Seamless must be selected explicitly');
    if (!isArchive && !isRegularForecast && !url.includes('past_days=7')) throw new Error('Recent bridge must cover seven past days');
    const startDate = new URL(url).searchParams.get('start_date');
    const archiveStartTime = Math.floor(Date.parse(`${startDate}T00:00:00Z`) / 1000);
    const regularForecastPayload = {
      hourly: {
        time: [Math.floor(now / 1000)],
        temperature_2m: [12], relative_humidity_2m: [70], dew_point_2m: [7],
        shortwave_radiation: [100], surface_pressure: [1015], wind_speed_10m: [8],
        wind_direction_10m: [180], precipitation: [0], precipitation_probability: [10],
        cloud_cover: [40], weather_code: [1],
      },
      daily: { time: [], sunrise: [], sunset: [], temperature_2m_max: [], temperature_2m_min: [] },
    };
    const payload = isRegularForecast ? regularForecastPayload : isArchive ? {
      hourly: {
        time: [archiveStartTime, oldTime],
        temperature_2m: [8, 9],
        relative_humidity_2m: [84, 82],
        dew_point_2m: [5, 6],
        shortwave_radiation: [50, 80],
        cloud_cover: [80, 75],
        wind_speed_10m: [10, 12],
      },
    } : {
      hourly: {
        time: [recentTime, futureTime],
        temperature_2m: [11, 13],
        relative_humidity_2m: [76, 70],
        dew_point_2m: [7, 8],
        shortwave_radiation: [120, 300],
        cloud_cover: [50, 20],
        wind_speed_10m: [8, 10],
      },
    };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const targetTime = new Date(futureTime * 1000).toISOString();
    const result = await getWaterColumnForcing(52, 5, targetTime);
    if (result.quality !== 'complete' || result.hourly.length !== 4 || result.fromCache) {
      throw new Error('Archive and recent forecast forcing should be merged into a complete chronological series.');
    }
    if (result.hourly[0].source !== 'era5-seamless' || result.hourly[1].source !== 'era5-seamless' ||
        result.hourly[2].source !== 'open-meteo-forecast' || result.hourly[3].source !== 'open-meteo-forecast') {
      throw new Error('Recent forecast must bridge/override the archive series.');
    }
    if (!result.hourly.every((sample) => sample.availableAt === result.asOf)) {
      throw new Error('Every forcing sample must retain its actual retrieval/availability time.');
    }
    if (result.hourly[1].shortwaveRadiationWm2 !== 80 || result.hourly[2].windSpeedKmh !== 8) {
      throw new Error('Solar radiation and wind units/values must be preserved without fabricated defaults.');
    }

    // The normal forecast refresh must preserve the separate historical forcing payload.
    await getForecast(52, 5, true);
    const cacheAfterForecastRefresh = await db.weatherCache.get('52.00_5.00');
    if (!cacheAfterForecastRefresh?.waterColumnHistory || cacheAfterForecastRefresh.hourly.length === 0) {
      throw new Error('Refreshing the normal forecast must preserve cached water-column history.');
    }

    const callsAfterFetch = fetchCalls;
    const cached = await getWaterColumnForcing(52, 5, targetTime);
    if (!cached.fromCache || fetchCalls !== callsAfterFetch || cached.hourly.length !== 4) {
      throw new Error('Fresh forcing should be reused from the existing IndexedDB weather cache.');
    }

    const beforeAvailability = new Date(Date.parse(result.asOf) - 1000).toISOString();
    const replay = await getWaterColumnForcing(52, 5, targetTime, { asOf: beforeAvailability });
    if (replay.hourly.length !== 0 || fetchCalls !== callsAfterFetch) {
      throw new Error('Historical as-of replay must not use later-retrieved weather data or make a hindsight network request.');
    }

    const cacheEntry = await db.weatherCache.get('52.00_5.00');
    if (!cacheEntry?.waterColumnHistory || cacheEntry.waterColumnHistory.hourly.length !== 4) {
      throw new Error('Historical forcing must persist in the existing cache without a database schema change.');
    }
    console.log('Water-column weather forcing tests passed.');
  } finally {
    globalThis.fetch = originalFetch;
    await db.delete();
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
