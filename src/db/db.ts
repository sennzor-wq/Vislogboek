import Dexie, { Table } from 'dexie';
import {
  FishingLocation,
  FishingSession,
  CatchItem,
  WeatherCacheEntry,
  AppSettings,
  PresenceObservation,
  PresenceObservationType,
  SessionRod,
  PlannedFishingSession,
  CoachAdviceRecord,
  WaterTemperatureMeasurement,
} from '../types';
export const LOKKERSHOEK_PIER_ID = 'spot-mvp1g19d-dfemr2';

export class VislogboekDatabase extends Dexie {
  locations!: Table<FishingLocation, string>;
  sessions!: Table<FishingSession, string>;
  catches!: Table<CatchItem, string>;
  weatherCache!: Table<WeatherCacheEntry, string>;
  settings!: Table<AppSettings, string>;
  prognosisSnapshots!: Table<import('../types').PrognosisSnapshot, string>;
  presenceObservations!: Table<import('../types').PresenceObservation, string>;
  sessionRods!: Table<SessionRod, string>;
  plannedSessions!: Table<PlannedFishingSession, string>;
  coachAdviceRecords!: Table<CoachAdviceRecord, string>;
  waterTemperatureMeasurements!: Table<WaterTemperatureMeasurement, string>;

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

    this.version(3).stores({
      locations: 'id, name, isBenchmark, createdAt',
      sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
      catches: 'id, sessionId, locationId, species, timestamp, createdAt',
      weatherCache: 'id, latitude, longitude, fetchedAt',
      settings: 'id',
      prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt',
      presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt',
      sessionRods: 'id, sessionId, rodNumber, createdAt, updatedAt',
    });

    // v4: geplande sessies en afzonderlijke, onveranderlijke VisCoach-advieshistorie.
    this.version(4).stores({
      locations: 'id, name, isBenchmark, createdAt',
      sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
      catches: 'id, sessionId, locationId, species, timestamp, createdAt',
      weatherCache: 'id, latitude, longitude, fetchedAt',
      settings: 'id',
      prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt',
      presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt',
      sessionRods: 'id, sessionId, rodNumber, createdAt, updatedAt',
      plannedSessions: 'id, locationId, plannedStartTime, status, startedSessionId, planSnapshotId, createdAt',
      coachAdviceRecords: 'id, sessionId, prognosisSnapshotId, previousAdviceId, createdAt, trigger',
    });

    // v5: eenmalige schone start van de historische sessie- en vangstdataset.
    // De migratie raakt alleen records die vóór deze database-upgrade bestaan.
    this.version(5).stores({
      locations: 'id, name, isBenchmark, createdAt',
      sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
      catches: 'id, sessionId, locationId, species, timestamp, createdAt',
      weatherCache: 'id, latitude, longitude, fetchedAt',
      settings: 'id',
      prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt',
      presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt',
      sessionRods: 'id, sessionId, rodNumber, createdAt, updatedAt',
      plannedSessions: 'id, locationId, plannedStartTime, status, startedSessionId, planSnapshotId, createdAt',
      coachAdviceRecords: 'id, sessionId, prognosisSnapshotId, previousAdviceId, createdAt, trigger',
    }).upgrade(async (tx) => {
      const sessions = await tx.table('sessions').toArray();
      const deletedSessionIds = new Set(sessions.map((session: FishingSession) => session.id));
      const deletedSnapshotIds = new Set(sessions
        .map((session: FishingSession) => session.snapshotId)
        .filter((snapshotId): snapshotId is string => typeof snapshotId === 'string'));

      await tx.table('catches').clear();
      await tx.table('sessions').clear();
      await tx.table('sessionRods').clear();
      await tx.table('coachAdviceRecords').clear();

      const observations = await tx.table('presenceObservations').toArray();
      const sessionObservationIds = observations
        .filter((observation: PresenceObservation) => Boolean(observation.sessionId && deletedSessionIds.has(observation.sessionId)))
        .map((observation: PresenceObservation) => observation.id);
      if (sessionObservationIds.length > 0) {
        await tx.table('presenceObservations').bulkDelete(sessionObservationIds);
      }

      const snapshots = await tx.table('prognosisSnapshots').toArray();
      for (const snapshot of snapshots) {
        if ((snapshot.linkedSessionId && deletedSessionIds.has(snapshot.linkedSessionId)) || deletedSnapshotIds.has(snapshot.id)) {
          await tx.table('prognosisSnapshots').put({
            ...snapshot,
            linkedSessionId: undefined,
            actualOutcome: undefined,
            actualTargetCatchesCount: undefined,
            evaluationNotes: undefined,
          });
        }
      }

      const plannedSessions = await tx.table('plannedSessions').toArray();
      const resetAt = new Date().toISOString();
      for (const planned of plannedSessions) {
        if (planned.startedSessionId && deletedSessionIds.has(planned.startedSessionId)) {
          await tx.table('plannedSessions').put({
            ...planned,
            startedSessionId: undefined,
            startedSessionDeletedAt: resetAt,
            updatedAt: resetAt,
          });
        }
      }

      // Alleen de oude technische benchmarklocatie opruimen wanneer geen plan ernaar verwijst.
      const benchmarkLocation = await tx.table('locations').get('benchmark-location-lokkershoek');
      if (benchmarkLocation) {
        const locationPlans = await tx.table('plannedSessions').where('locationId')
          .equals('benchmark-location-lokkershoek').count();
        if (locationPlans === 0) {
          await tx.table('locations').delete('benchmark-location-lokkershoek');
        }
      }
    });

    // v6: afzonderlijke fysieke watertemperatuurmeetmomenten per vissessie.
    // Bestaande sessie-/snapshotmetingen worden éénmalig overgezet; bronrecords blijven behouden.
    this.version(6).stores({
      locations: 'id, name, isBenchmark, createdAt',
      sessions: 'id, locationId, startTime, outcome, isBenchmark, createdAt',
      catches: 'id, sessionId, locationId, species, timestamp, createdAt',
      weatherCache: 'id, latitude, longitude, fetchedAt',
      settings: 'id',
      prognosisSnapshots: 'id, forecastTimestamp, targetSpecies, linkedSessionId, modelVersion, createdAt',
      presenceObservations: 'id, locationId, sessionId, observationType, timestamp, createdAt',
      sessionRods: 'id, sessionId, rodNumber, createdAt, updatedAt',
      plannedSessions: 'id, locationId, plannedStartTime, status, startedSessionId, planSnapshotId, createdAt',
      coachAdviceRecords: 'id, sessionId, prognosisSnapshotId, previousAdviceId, createdAt, trigger',
      waterTemperatureMeasurements: 'id, locationId, sessionId, measuredAt, recordedAt',
    }).upgrade(async (tx) => {
      const sessions = await tx.table('sessions').toArray() as FishingSession[];
      const snapshots = await tx.table('prognosisSnapshots').toArray() as import('../types').PrognosisSnapshot[];
      const seen = new Set<string>();
      const addLegacyMeasurement = async (record: {
        id: string; locationId?: string; sessionId?: string; temperature?: number | null;
        measuredAt?: string; recordedAt?: string; source?: 'manual' | 'imported' | 'unknown';
        method?: 'thermometer' | 'probe' | 'other' | 'unknown'; depth?: number;
      }) => {
        if (!record.locationId || typeof record.temperature !== 'number' ||
            !Number.isFinite(record.temperature) || record.temperature < 0 || record.temperature > 35 ||
            !record.measuredAt || !Number.isFinite(Date.parse(record.measuredAt))) return;
        const depth = typeof record.depth === 'number' && Number.isFinite(record.depth) && record.depth >= 0
          ? Math.round(record.depth * 100) / 100 : null;
        const key = [record.locationId, Date.parse(record.measuredAt), record.temperature, depth ?? 'unknown'].join('|');
        if (seen.has(key)) return;
        seen.add(key);
        const measurement: WaterTemperatureMeasurement = {
          id: `legacy-water-temp-${record.id}`,
          ...(record.sessionId ? { sessionId: record.sessionId } : {}),
          locationId: record.locationId,
          temperatureC: record.temperature,
          measuredAt: new Date(record.measuredAt).toISOString(),
          recordedAt: record.recordedAt && Number.isFinite(Date.parse(record.recordedAt))
            ? new Date(record.recordedAt).toISOString() : new Date(record.measuredAt).toISOString(),
          measurementSource: record.source || 'unknown',
          measurementMethod: record.method || 'unknown',
          ...(depth !== null ? { measurementDepthM: depth } : {}),
        };
        await tx.table('waterTemperatureMeasurements').put(measurement);
      };
      // Session rows first: if a linked snapshot repeats the same physical reading, keep one event.
      for (const session of sessions) {
        await addLegacyMeasurement({
          id: `session-${session.id}`, locationId: session.locationId, sessionId: session.id,
          temperature: session.waterTemperature, measuredAt: session.waterTemperatureMeasuredAt,
          recordedAt: session.updatedAt || session.createdAt,
          source: session.waterTemperatureMeasurementSource, method: session.waterTemperatureMeasurementMethod,
          depth: session.waterTemperatureMeasurementDepthM,
        });
      }
      for (const snapshot of snapshots) {
        await addLegacyMeasurement({
          id: `snapshot-${snapshot.id}`, locationId: snapshot.locationId,
          sessionId: snapshot.linkedSessionId, temperature: snapshot.actualWaterTemperature,
          measuredAt: snapshot.actualWaterTemperatureTimestamp, recordedAt: snapshot.createdAt,
          source: snapshot.actualWaterTemperatureMeasurementSource, method: snapshot.actualWaterTemperatureMeasurementMethod,
          depth: snapshot.actualWaterTemperatureMeasurementDepthM,
        });
      }
    });
  }
}

export const db = new VislogboekDatabase();

/**
 * Synchroniseert de sessiesamenvatting van viswaarnemingen naar de bestaande
 * afzonderlijke waarnemingstabel. Bestaande tijdstempels blijven behouden;
 * nieuwe waarnemingen krijgen het sessie-updatetijdstip als registratiemoment.
 * Deze helper voert zelf geen transactie uit: de aanroeper beheert de transactie.
 */
export async function syncSessionPresenceObservations(session: FishingSession): Promise<void> {
  const existing = await db.presenceObservations.where('sessionId').equals(session.id).toArray();
  const selectedTypes = Array.from(new Set(session.presenceObservations ?? []));
  const selected = new Set<PresenceObservationType>(selectedTypes);
  const existingTypes = new Set(existing.map((observation) => observation.observationType));

  for (const observation of existing) {
    if (!selected.has(observation.observationType)) {
      await db.presenceObservations.delete(observation.id);
    }
  }

  const locationId = session.locationId || existing[0]?.locationId;
  if (!locationId) return;

  const recordedAt = session.updatedAt || new Date().toISOString();
  for (const observationType of selectedTypes) {
    if (existingTypes.has(observationType)) continue;
    const observation: PresenceObservation = {
      id: `session-presence-${session.id}-${observationType}`,
      locationId,
      sessionId: session.id,
      observationType,
      timestamp: recordedAt,
      notes: 'Vastgelegd via de sessieregistratie.',
      createdAt: recordedAt,
    };
    await db.presenceObservations.put(observation);
  }
}

/**
 * Zorgt ervoor dat de lokale database en standaardinstellingen eenmalig per app-runtime zijn ingericht.
 */
let databaseInitializationPromise: Promise<void> | null = null;

/**
 * Database-initialisatie is eenmalig per app-runtime.
 * Gewone data-refreshes hoeven deze controles/migratiestappen niet opnieuw uit te voeren.
 */
export function initializeDatabase(): Promise<void> {
  if (!databaseInitializationPromise) {
    databaseInitializationPromise = initializeDatabaseOnce();
  }
  return databaseInitializationPromise;
}

async function initializeDatabaseOnce(): Promise<void> {
  try {
    // Alleen apparaatinstellingen initialiseren; historische records/locaties worden nooit automatisch gezaaid.
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

  await db.transaction('rw', [db.sessions, db.catches, db.prognosisSnapshots, db.sessionRods, db.plannedSessions, db.coachAdviceRecords, db.waterTemperatureMeasurements], async () => {
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

    // 4. Verwijder coachadviezen alleen als expliciet onderdeel van het verwijderen van deze sessie.
    await db.coachAdviceRecords.where('sessionId').equals(sessionId).delete();

    // Een geplande afspraak blijft als historie bestaan; alleen de verwijzing naar de verwijderde sessie vervalt.
    const linkedPlans = await db.plannedSessions.where('startedSessionId').equals(sessionId).toArray();
    const deletedAt = new Date().toISOString();
    for (const plan of linkedPlans) {
      await db.plannedSessions.update(plan.id, {
        startedSessionId: undefined,
        startedSessionDeletedAt: deletedAt,
        updatedAt: deletedAt,
      });
    }

    // 5. Verwijder optionele hengeldetails van deze sessie.
    await db.sessionRods.where('sessionId').equals(sessionId).delete();

    // 6. Verwijder alle afzonderlijke watertemperatuurmeetmomenten van deze sessie.
    await db.waterTemperatureMeasurements.where('sessionId').equals(sessionId).delete();

    // 7. Verwijder sessie zelf
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

  await db.transaction('rw', db.sessions, db.prognosisSnapshots, db.plannedSessions, db.coachAdviceRecords, async () => {
    const planReferences = await db.plannedSessions.where('planSnapshotId').equals(snapshotId).count();
    const adviceReferences = await db.coachAdviceRecords.where('prognosisSnapshotId').equals(snapshotId).count();
    if (planReferences > 0 || adviceReferences > 0) {
      throw new Error('Deze prognosesnapshot is nog gekoppeld aan een VisCoach-plan of coachadvies. Verwijder eerst de bijbehorende registratie om de historie niet onbedoeld te verbreken.');
    }

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
