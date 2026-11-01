import Dexie, { Table } from 'dexie';
import {
  FishingLocation,
  FishingSession,
  CatchItem,
  WeatherCacheEntry,
  AppSettings,
} from '../types';
import {
  HISTORICAL_LOCATIONS,
  HISTORICAL_SESSIONS,
  HISTORICAL_CATCHES,
} from '../data/historicalData';

export const BENCHMARK_LOCATION_ID = 'benchmark-location-lokkershoek';
export const BENCHMARK_SESSION_ID = 'benchmark-session-20261019';
export const LOKKERSHOEK_PIER_ID = 'spot-mvp1g19d-dfemr2';

export const BENCHMARK_LOCATION: FishingLocation = {
  id: BENCHMARK_LOCATION_ID,
  name: 'Lokkershoek Pier',
  description: 'Campingzijde bij het doodlopende gedeelte en de bomen',
  latitude: 51.944861,
  longitude: 5.19234,
  waterDepth: 2,
  waterType: 'Plas/Zandafgraving',
  notes: 'Campingzijde met zachte bodem en bomenpartij.',
  isBenchmark: false,
  createdAt: '2026-10-19T18:00:00+02:00',
  updatedAt: '2026-10-19T18:00:00+02:00',
};

export const BENCHMARK_SESSION: FishingSession = {
  id: BENCHMARK_SESSION_ID,
  locationId: LOKKERSHOEK_PIER_ID,
  locationName: 'Lokkershoek Pier',
  startTime: '2026-10-19T19:00:00+02:00',
  endTime: '2026-10-19T22:00:00+02:00',
  durationMinutes: 180,
  outcome: 'catch',
  targetSpecies: ['Brasem', 'Karper', 'Zeelt'],
  rodCount: 2,
  rodTypes: 'Feeder & Karperhengel',
  technique: 'Feeder / Statisch',
  baitAndFeed: 'Maden, mais & vismeelpellets',
  bitesCount: 11,
  missedCount: 3,
  waterDepth: 2,
  notes: '8 vissen totaal: 1e uur 3 brasems, 1 zeelt en 1 karper van circa 10 kg; later 3 brasems.',
  weatherSnapshot: {
    temperature: 11.5,
    pressure: 1018,
    pressureTrend: 'stabiel',
    windSpeed: 14,
    windDirection: 230,
    windDirectionText: 'ZW',
    cloudCover: 75,
    precipitation: 0.2,
    source: 'knmi-regionaal',
    capturedAt: '2026-10-19T19:00:00+02:00',
  },
  isBenchmark: false,
  createdAt: '2026-10-19T22:05:00+02:00',
  updatedAt: '2026-10-19T22:05:00+02:00',
};

export const BENCHMARK_CATCHES: CatchItem[] = [
  {
    id: 'benchmark-catch-brasem-1',
    sessionId: BENCHMARK_SESSION_ID,
    locationId: LOKKERSHOEK_PIER_ID,
    species: 'Brasem',
    count: 3,
    weightKg: 4.8,
    isGroupWeight: true,
    timestamp: '2026-10-19T19:25:00+02:00',
    bait: 'Maden & zoete mais',
    technique: 'Feeder',
    notes: 'Eerste uur: 3 brasems op de voerplek',
    createdAt: '2026-10-19T19:26:00+02:00',
  },
  {
    id: 'benchmark-catch-zeelt',
    sessionId: BENCHMARK_SESSION_ID,
    locationId: LOKKERSHOEK_PIER_ID,
    species: 'Zeelt',
    count: 1,
    weightKg: 2.1,
    isGroupWeight: false,
    timestamp: '2026-10-19T19:42:00+02:00',
    bait: 'Maden',
    technique: 'Feeder',
    notes: 'Eerste uur: Prachtig donkergroene zeelt bij de bomen',
    createdAt: '2026-10-19T19:43:00+02:00',
  },
  {
    id: 'benchmark-catch-karper',
    sessionId: BENCHMARK_SESSION_ID,
    locationId: LOKKERSHOEK_PIER_ID,
    species: 'Karper',
    count: 1,
    weightKg: 10.0,
    isGroupWeight: false,
    timestamp: '2026-10-19T19:55:00+02:00',
    bait: '15mm boilie',
    technique: 'Statisch',
    notes: 'Eerste uur: Karper van circa 10 kg, sterke dril onder de kant',
    createdAt: '2026-10-19T20:00:00+02:00',
  },
  {
    id: 'benchmark-catch-brasem-2',
    sessionId: BENCHMARK_SESSION_ID,
    locationId: LOKKERSHOEK_PIER_ID,
    species: 'Brasem',
    count: 3,
    weightKg: 5.2,
    isGroupWeight: true,
    timestamp: '2026-10-19T21:20:00+02:00',
    bait: 'Maden & pellets',
    technique: 'Feeder',
    notes: 'Later in de avond: 3 brasems bij rustiger wordende wind',
    createdAt: '2026-10-19T21:22:00+02:00',
  },
];

export class VislogboekDatabase extends Dexie {
  locations!: Table<FishingLocation, string>;
  sessions!: Table<FishingSession, string>;
  catches!: Table<CatchItem, string>;
  weatherCache!: Table<WeatherCacheEntry, string>;
  settings!: Table<AppSettings, string>;
  prognosisSnapshots!: Table<import('../types').PrognosisSnapshot, string>;
  presenceObservations!: Table<import('../types').PresenceObservation, string>;

  constructor() {
    super('VislogboekDB');

    this.version(1).stores({
      locations: 'id, name, isBenchmark, createdAt',
      sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
      catches: 'id, sessionId, locationId, species, timestamp, createdAt',
      weatherCache: 'id, latitude, longitude, fetchedAt',
      settings: 'id',
    });

    this.version(2).stores({
      locations: 'id, name, isBenchmark, createdAt',
      sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
      catches: 'id, sessionId, locationId, species, timestamp, createdAt',
      weatherCache: 'id, latitude, longitude, fetchedAt',
      settings: 'id',
      prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt',
      presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt',
    });
  }
}

export const db = new VislogboekDatabase();

/**
 * Zorgt ervoor dat de initiële database is ingericht en de beschermde benchmark altijd aanwezig is.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // 1. Zorg dat historische stekken aanwezig zijn (inclusief Lokkershoek Pier)
    for (const loc of HISTORICAL_LOCATIONS) {
      const existing = await db.locations.get(loc.id);
      if (!existing) {
        await db.locations.put(loc);
      }
    }

    // 2. Controleer en update de sessie van 19 okt 2026 naar Lokkershoek Pier (zonder benchmarkstatus)
    const existingSession = await db.sessions.get(BENCHMARK_SESSION_ID);
    if (!existingSession) {
      await db.sessions.put(BENCHMARK_SESSION);
    } else {
      await db.sessions.update(BENCHMARK_SESSION_ID, {
        locationId: LOKKERSHOEK_PIER_ID,
        locationName: 'Lokkershoek Pier',
        isBenchmark: false,
        notes: '8 vissen totaal: 1e uur 3 brasems, 1 zeelt en 1 karper van circa 10 kg; later 3 brasems.',
      });
    }

    // 3. Controleer vangsten van deze sessie: zorg dat exact de 4 canonieke registraties aanwezig zijn (totaal 8 vissen)
    // en verwijder eventuele overtollige/dubbele vangsten die het aantal op 9 brachten.
    const canonicalCatchIds = new Set(BENCHMARK_CATCHES.map((c) => c.id));
    for (const c of BENCHMARK_CATCHES) {
      await db.catches.put(c);
    }
    const currentSessionCatches = await db.catches.where('sessionId').equals(BENCHMARK_SESSION_ID).toArray();
    for (const sc of currentSessionCatches) {
      if (!canonicalCatchIds.has(sc.id)) {
        await db.catches.delete(sc.id);
      }
    }

    // 4. Verwijder de verouderde referentiestek 'benchmark-location-lokkershoek' zodat geen duplicaatstek ontstaat
    const oldBenchLoc = await db.locations.get(BENCHMARK_LOCATION_ID);
    if (oldBenchLoc) {
      const sessionsUsingOldLoc = await db.sessions.where('locationId').equals(BENCHMARK_LOCATION_ID).count();
      if (sessionsUsingOldLoc === 0) {
        await db.locations.delete(BENCHMARK_LOCATION_ID);
      }
    }

    // 5. Standaardinstellingen controleren
    const settings = await db.settings.get('user_settings');
    if (!settings) {
      await db.settings.put({
        id: 'user_settings',
        defaultLocationName: 'Lokkershoek Pier',
        defaultLatitude: 51.944861,
        defaultLongitude: 5.19234,
        defaultSpecies: 'Karper',
        defaultDurationHours: 3,
        theme: 'dark',
      });
    }

    // 6. Automatische eenmalige seeding van de overige historische data
    for (const sess of HISTORICAL_SESSIONS) {
      const existing = await db.sessions.get(sess.id);
      if (!existing) {
        await db.sessions.put(sess);
      }
    }

    for (const c of HISTORICAL_CATCHES) {
      const existing = await db.catches.get(c.id);
      if (!existing) {
        await db.catches.put(c);
      }
    }
  } catch (error) {
    console.error('Fout bij initialiseren database:', error);
  }
}

/**
 * Veilige verwijdering van een sessie met benchmarkbeveiliging.
 * Verwijdert ook de gekoppelde vangsten en, indien aanwezig, uitsluitend de momentopname
 * die via session.snapshotId aan deze sessie gekoppeld is.
 */
export async function deleteSessionSafely(sessionId: string): Promise<boolean> {
  const session = await db.sessions.get(sessionId);
  if (!session) return false;
  if (session.isBenchmark) {
    throw new Error('De referentiesessie Lokkershoek is een beschermde benchmark en kan niet worden verwijderd.');
  }

  await db.transaction('rw', db.sessions, db.catches, db.prognosisSnapshots, async () => {
    // 1. Verwijder gekoppelde vangsten
    await db.catches.where('sessionId').equals(sessionId).delete();

    // 2. Als de sessie via session.snapshotId gekoppeld is aan een momentopname:
    // Verwijder alleen die specifieke momentopname (behalve als het een beschermde benchmark is)
    if (session.snapshotId) {
      const snap = await db.prognosisSnapshots.get(session.snapshotId);
      if (snap) {
        if ((snap as any).isBenchmark) {
          // Beschermde benchmark snapshot niet verwijderen, maar ontkoppelen
          await db.prognosisSnapshots.update(session.snapshotId, {
            linkedSessionId: undefined,
            actualOutcome: undefined,
            actualTargetCatchesCount: undefined,
            evaluationNotes: undefined,
          });
        } else {
          await db.prognosisSnapshots.delete(session.snapshotId);
        }
      }
    }

    // 3. Voorkom verweesde koppelingen: maak eventuele andere snapshots die naar deze sessie verwezen veilig leeg
    const otherSnapshots = await db.prognosisSnapshots
      .where('linkedSessionId')
      .equals(sessionId)
      .toArray();
    for (const otherSnap of otherSnapshots) {
      await db.prognosisSnapshots.update(otherSnap.id, {
        linkedSessionId: undefined,
        actualOutcome: undefined,
        actualTargetCatchesCount: undefined,
        evaluationNotes: undefined,
      });
    }

    // 4. Verwijder sessie zelf
    await db.sessions.delete(sessionId);
  });
  return true;
}

/**
 * Veilige afzonderlijke verwijdering van een prognosemomentopname.
 * - Beschermde benchmarks worden geweigerd.
 * - Als een vissessie naar deze snapshot verwijst via session.snapshotId,
 *   wordt de verwijzing vanuit die sessie veilig leeggemaakt (undefined). De sessie zelf blijft behouden.
 * - De momentopname wordt definitief verwijderd uit de database.
 */
export async function deletePrognosisSnapshotSafely(snapshotId: string): Promise<boolean> {
  const snapshot = await db.prognosisSnapshots.get(snapshotId);
  if (!snapshot) return false;
  if ((snapshot as any).isBenchmark) {
    throw new Error('Deze prognosemomentopname is een beschermde benchmark en kan niet worden verwijderd.');
  }

  await db.transaction('rw', db.sessions, db.prognosisSnapshots, async () => {
    // 1. Zoek alle sessies die via snapshotId naar deze momentopname verwijzen
    const referringSessions = await db.sessions.filter((s) => s.snapshotId === snapshotId).toArray();
    for (const sess of referringSessions) {
      await db.sessions.update(sess.id, {
        snapshotId: undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Ook als de snapshot een linkedSessionId had die naar een bestaande sessie wijst
    if (snapshot.linkedSessionId) {
      const linkedSess = await db.sessions.get(snapshot.linkedSessionId);
      if (linkedSess && linkedSess.snapshotId === snapshotId) {
        await db.sessions.update(linkedSess.id, {
          snapshotId: undefined,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Verwijder de momentopname
    await db.prognosisSnapshots.delete(snapshotId);
  });

  return true;
}

/**
 * Veilige verwijdering van een locatie met benchmarkbeveiliging.
 */
export async function deleteLocationSafely(locationId: string): Promise<boolean> {
  const loc = await db.locations.get(locationId);
  if (!loc) return false;
  if (loc.isBenchmark) {
    throw new Error('De referentiestek Lokkershoek is een beschermde benchmark en kan niet worden verwijderd.');
  }

  await db.locations.delete(locationId);
  return true;
}

/**
 * Voeg vangst toe aan een sessie en werk automatisch de uitkomst bij indien nodig.
 */
export async function addCatchToSession(catchData: CatchItem): Promise<void> {
  await db.transaction('rw', db.sessions, db.catches, async () => {
    await db.catches.put(catchData);

    const session = await db.sessions.get(catchData.sessionId);
    if (session) {
      // Als sessie als nulvangst of onbekend was gemarkeerd, wijzig naar 'catch'
      if (session.outcome === 'skunk_confirmed' || session.outcome === 'unknown') {
        await db.sessions.update(catchData.sessionId, {
          outcome: 'catch',
          updatedAt: new Date().toISOString(),
        });
      }
    }
  });
}
