import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { getCurrentWeatherSnapshot, getForecast, fetchWaterTemperatureWeatherContextAtTime } from './src/services/weatherService';

async function run() {
  await db.delete();
  await db.open();
  const originalFetch = globalThis.fetch;
  const apiPayload = {
    hourly: {
      time: [Date.parse('2026-11-02T11:00:00.000Z') / 1000],
      temperature_2m: [10],
      relative_humidity_2m: [76],
      dew_point_2m: [6],
      shortwave_radiation: [125],
      precipitation: [0],
      precipitation_probability: [5],
      weather_code: [2],
      surface_pressure: [1015],
      cloud_cover: [45],
      wind_speed_10m: [9],
      wind_direction_10m: [225],
    },
    daily: { time: [], sunrise: [], sunset: [], temperature_2m_max: [], temperature_2m_min: [] },
  };
  globalThis.fetch = (async () => new Response(JSON.stringify(apiPayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })) as typeof fetch;

  try {
    const forecast = await getForecast(52, 5, true);
    const hour = forecast.hourly[0];
    if (hour.relativeHumidity !== 76 || hour.dewPoint !== 6 || hour.shortwaveRadiation !== 125) {
      throw new Error('Open-Meteo forecast must preserve valid humidity, dew point and shortwave radiation.');
    }
    const snapshot = await getCurrentWeatherSnapshot(52, 5);
    if (snapshot.relativeHumidity !== 76 || snapshot.dewPoint !== 6 || snapshot.shortwaveRadiation !== 125) {
      throw new Error('Current weather snapshot must preserve optional heat-flux context.');
    }

    await db.weatherCache.clear();
    const recentSampleMs = Math.floor(Date.now() / 3600000) * 3600000;
    apiPayload.hourly.time = [recentSampleMs / 1000];
    const recentContext = await fetchWaterTemperatureWeatherContextAtTime(
      52, 5, new Date(recentSampleMs).toISOString()
    );
    if (!recentContext || recentContext.airTemperatureC !== 10 || recentContext.windSpeedKmh !== 9 ||
        recentContext.sampleTimestamp !== new Date(recentSampleMs).toISOString() ||
        recentContext.source !== 'open-meteo-recent-model') {
      throw new Error('A water measurement must preserve the closest recent hourly weather sample, retrieval source and timestamp.');
    }

    const archiveDay = new Date(Date.now() - 10 * 86400000);
    const archiveSampleMs = Date.UTC(archiveDay.getUTCFullYear(), archiveDay.getUTCMonth(), archiveDay.getUTCDate(), 12, 0, 0);
    apiPayload.hourly.time = [archiveSampleMs / 1000];
    const archiveContext = await fetchWaterTemperatureWeatherContextAtTime(
      52, 5, new Date(archiveSampleMs).toISOString()
    );
    if (!archiveContext || archiveContext.source !== 'open-meteo-reanalysis' ||
        archiveContext.sampleTimestamp !== new Date(archiveSampleMs).toISOString()) {
      throw new Error('An older water measurement must use timestamped archive reanalysis when available.');
    }

    console.log('Weather enrichment tests passed.');
  } finally {
    globalThis.fetch = originalFetch;
    await db.delete();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
