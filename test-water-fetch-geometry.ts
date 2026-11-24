import 'fake-indexeddb/auto';
import { db } from './src/db/db';
import { getAutomaticWaterFetch, getDirectionalFetchM } from './src/services/waterFetchGeometry';

async function run() {
  const sectors = Array.from({ length: 16 }, (_, index) => index * 100);
  if (getDirectionalFetchM(sectors, 0) !== 0 ||
      getDirectionalFetchM(sectors, 11.25) !== 50 ||
      getDirectionalFetchM(sectors, 348.75) !== 750 ||
      getDirectionalFetchM(sectors, 360) !== 0 ||
      getDirectionalFetchM(sectors, undefined) !== undefined) {
    throw new Error('Directional fetch interpolation must wrap and interpolate circularly.');
  }

  await db.delete();
  await db.open();
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response(JSON.stringify({
      elements: [{
        type: 'way',
        tags: { natural: 'water' },
        geometry: [
          { lat: 51.999, lon: 4.999 },
          { lat: 52.001, lon: 4.999 },
          { lat: 52.001, lon: 5.001 },
          { lat: 51.999, lon: 5.001 },
          { lat: 51.999, lon: 4.999 },
        ],
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  try {
    const result = await getAutomaticWaterFetch(52, 5);
    if (!result || result.source !== 'openstreetmap' || result.sectorFetchM.length !== 16 ||
        result.sectorFetchM.some((distance) => !Number.isFinite(distance) || distance <= 0)) {
      throw new Error('A containing OSM water polygon should produce 16 positive directional fetch distances.');
    }
    const north = result.sectorFetchM[0];
    const east = result.sectorFetchM[4];
    if (north < 100 || east < 60 || Math.abs(north - east) < 20) {
      throw new Error('Directional fetch must reflect the polygon geometry rather than one scalar distance.');
    }
    const cached = await getAutomaticWaterFetch(52, 5);
    if (!cached || calls !== 1) throw new Error('Fresh directional fetch must be reused from IndexedDB cache.');
    console.log('Water fetch geometry tests passed.');
  } finally {
    globalThis.fetch = originalFetch;
    await db.delete();
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
