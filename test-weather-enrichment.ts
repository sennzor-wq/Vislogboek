import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { fetchHistoricalWeatherContextsForMeasurements, getCurrentWeatherSnapshot, getForecast } from './src/services/weatherService';

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
    const measurementContexts = await fetchHistoricalWeatherContextsForMeasurements(52, 5, [
      { id: 'near-measurement', measuredAt: '2026-11-02T12:20:00+01:00' },
      { id: 'far-measurement', measuredAt: '2026-11-02T14:00:00+01:00' },
    ]);
    const nearContext = measurementContexts['near-measurement'];
    if (nearContext?.airTemperatureC !== 10 || nearContext.windSpeedKmh !== 9 ||
        nearContext.timeDifferenceMinutes !== 20 || nearContext.source !== 'open-meteo-archive') {
      throw new Error('Measurement weather context must preserve nearest hourly archive values and the actual time offset.');
    }
    if (measurementContexts['far-measurement'] !== null) {
      throw new Error('Weather context more than 90 minutes from the physical measurement must remain unknown.');
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
