import { db, BENCHMARK_LOCATION, BENCHMARK_SESSION, BENCHMARK_CATCHES } from '../db/db';
import { FishingLocation, FishingSession, CatchItem, AppSettings, WeatherCacheEntry, PrognosisSnapshot, PresenceObservation, SessionRod, PlannedFishingSession, CoachAdviceRecord } from '../types';

export interface BackupData {
  version: number;
  appName: string;
  exportedAt: string;
  locations: FishingLocation[];
  sessions: FishingSession[];
  catches: CatchItem[];
  settings?: AppSettings;
  /** Added in v3; optional for legacy v1/v2 imports. */
  weatherCache?: WeatherCacheEntry[];
  prognosisSnapshots?: PrognosisSnapshot[];
  presenceObservations?: PresenceObservation[];
  /** Added in v4; optional for legacy v1-v3 imports. */
  sessionRods?: SessionRod[];
  /** Added in v5; optional for legacy v1-v4 imports. */
  plannedSessions?: PlannedFishingSession[];
  coachAdviceRecords?: CoachAdviceRecord[];
}

export interface ImportPreview {
  valid: boolean;
  version?: number;
  exportedAt?: string;
  locationsCount: number;
  sessionsCount: number;
  catchesCount: number;
  hasBenchmark: boolean;
  duplicateSessionCount: number;
  duplicateLocationCount: number;
  duplicateCatchCount: number;
  weatherCacheCount?: number;
  prognosisSnapshotsCount?: number;
  presenceObservationsCount?: number;
  sessionRodsCount?: number;
  plannedSessionsCount?: number;
  coachAdviceRecordsCount?: number;
  error?: string;
}

/** Bouwt een volledige, download-onafhankelijke momentopname van alle persistente tabellen. */
export async function collectBackupData(): Promise<BackupData> {
  const [locations, sessions, catches, settings, weatherCache, prognosisSnapshots, presenceObservations, sessionRods, plannedSessions, coachAdviceRecords] =
    await db.transaction('r', [db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
      db.prognosisSnapshots, db.presenceObservations, db.sessionRods, db.plannedSessions, db.coachAdviceRecords], () => Promise.all([
        db.locations.toArray(), db.sessions.toArray(), db.catches.toArray(),
        db.settings.get('user_settings'), db.weatherCache.toArray(),
        db.prognosisSnapshots.toArray(), db.presenceObservations.toArray(), db.sessionRods.toArray(),
        db.plannedSessions.toArray(), db.coachAdviceRecords.toArray(),
      ]));

  return {
    version: 5,
    appName: 'Vislogboek',
    exportedAt: new Date().toISOString(),
    locations, sessions, catches,
    settings: settings || undefined,
    weatherCache, prognosisSnapshots, presenceObservations, sessionRods, plannedSessions, coachAdviceRecords,
  };
}

/** Exporteert alle persistente gegevens naar een JSON-download. */
export async function exportDatabaseToJson(): Promise<BackupData> {
  const backup = await collectBackupData();
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `vislogboek-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Update de datum pas na het maken van de export; de volgende export bevat deze datum.
  await db.settings.update('user_settings', { lastBackupDate: new Date().toISOString() });
  return backup;
}

/**
 * Normaliseert zowel het interne BackupData schema als het vislogboek-backup v2 export-schema
 * (met 'spots' en geneste 'catches' per sessie).
 */
export function normalizeRawBackup(raw: any): BackupData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Ongeldig JSON object.');
  }

  // Sommige oudere exports bewaren de records onder een geneste data-container.
  // Trek die eerst naar het canonieke niveau en behoud metadata uit de root.
  if (raw.data && typeof raw.data === 'object') {
    const envelope = raw;
    const rootHomeLocation = envelope.homeLocation;
    raw = {
      ...raw.data,
      homeLocation: raw.data.homeLocation ?? rootHomeLocation,
      version: envelope.version ?? raw.data.version,
      appName: envelope.appName ?? raw.data.appName ?? envelope.format,
      exportedAt: envelope.exportedAt ?? envelope.exportDate ?? raw.data.exportedAt,
      settings: raw.data.settings ?? envelope.settings,
    };
  }

  // Een thuislocatie kan in oudere exports naast de data-container staan.
  // Behoud een bestaande settingswaarde; gebruik de rootwaarde alleen als fallback.
  if (raw.homeLocation && typeof raw.homeLocation === 'object') {
    raw.settings = {
      ...(raw.settings || { id: 'user_settings' }),
      homeLocation: raw.settings?.homeLocation ?? raw.homeLocation,
    };
  }

  // Geval 1: reeds platte BackupData
  if (Array.isArray(raw.sessions) && Array.isArray(raw.locations) && Array.isArray(raw.catches)) {
    return {
      ...raw,
      version: Number(raw.version) || 2,
      appName: raw.appName || 'Vislogboek',
      exportedAt: raw.exportedAt || raw.exported_at || new Date().toISOString(),
      weatherCache: Array.isArray(raw.weatherCache) ? raw.weatherCache : [],
      prognosisSnapshots: Array.isArray(raw.prognosisSnapshots) ? raw.prognosisSnapshots : [],
      presenceObservations: Array.isArray(raw.presenceObservations) ? raw.presenceObservations : [],
      sessionRods: Array.isArray(raw.sessionRods) ? raw.sessionRods : [],
      plannedSessions: Array.isArray(raw.plannedSessions) ? raw.plannedSessions : [],
      coachAdviceRecords: Array.isArray(raw.coachAdviceRecords) ? raw.coachAdviceRecords : [],
    } as BackupData;
  }

  // Geval 2: vislogboek-backup formaat met 'spots' en geneste 'catches'
  const importedAt = new Date().toISOString();
  const locations: FishingLocation[] = [];
  const rawSpots = Array.isArray(raw.spots) ? raw.spots : (Array.isArray(raw.locations) ? raw.locations : []);
  for (const sp of rawSpots) {
    const depthNum = sp.notes_depth ? parseFloat(sp.notes_depth) : (typeof sp.waterDepth === 'number' ? sp.waterDepth : undefined);
    const notesParts = [
      sp.notes_bottom ? `Bodem: ${sp.notes_bottom}` : null,
      sp.notes_obstacles ? `Obstakels: ${sp.notes_obstacles}` : null,
      sp.favorite_technique ? `Voorkeurstechniek: ${sp.favorite_technique}` : null,
      sp.notes ? sp.notes : null,
    ].filter(Boolean);

    locations.push({
      id: sp.id,
      name: sp.name || sp.label || 'Onbekende stek',
      latitude: sp.lat ?? sp.latitude,
      longitude: sp.lon ?? sp.longitude,
      waterDepth: isNaN(depthNum as number) ? undefined : depthNum,
      notes: notesParts.length > 0 ? notesParts.join(' | ') : undefined,
      description: sp.description || undefined,
      isBenchmark: sp.is_reference || sp.isBenchmark || false,
      createdAt: sp.created_at || sp.createdAt || new Date().toISOString(),
      updatedAt: sp.updated_at || sp.updatedAt || new Date().toISOString(),
    });
  }

  const sessions: FishingSession[] = [];
  const catches: CatchItem[] = [];
  const rawSessions = Array.isArray(raw.sessions) ? raw.sessions : [];

  for (const s of rawSessions) {
    const rawCatches = Array.isArray(s.catches) ? s.catches : [];
    const sessionCatches: CatchItem[] = [];

    // Verwerk vangsten zonder ontbrekende soort, aantallen of tijdstippen te verzinnen.
    for (const c of rawCatches) {
      const speciesKnown = typeof c.species === 'string' && c.species.trim().length > 0;
      const countKnown = typeof c.count === 'number' && Number.isFinite(c.count) && c.count > 0;
      const timestamp = c.timestamp || (c.time && s.date ? `${s.date}T${c.time}:00` : null);
      const timestampKnown = typeof timestamp === 'string' && Number.isFinite(Date.parse(timestamp));
      const catchItem: CatchItem = {
        id: c.id,
        sessionId: s.id,
        species: speciesKnown ? c.species : 'Overig',
        count: countKnown ? c.count : 0,
        weightKg: typeof c.weight_kg === 'number' ? c.weight_kg : (typeof c.weightKg === 'number' ? c.weightKg : null),
        lengthCm: typeof c.length_cm === 'number' ? c.length_cm : (typeof c.lengthCm === 'number' ? c.lengthCm : null),
        timestamp: timestampKnown ? timestamp : (s.date ? `${s.date}T00:00:00` : importedAt),
        bait: c.bait || undefined,
        technique: c.technique || s.technique || undefined,
        rod: c.rod || undefined,
        notes: c.notes || undefined,
        photoUrl: Array.isArray(c.photos) && c.photos[0] ? c.photos[0] : (c.photoUrl || undefined),
        legacyImportQuality: { speciesKnown, countKnown, timestampKnown },
        createdAt: s.created_at || s.createdAt || importedAt,
      };
      catches.push(catchItem);
      sessionCatches.push(catchItem);
    }

    // Bepaal alleen de werkelijk bekende sessieduur.
    let durationMinutes: number | undefined;
    if (typeof s.durationMinutes === 'number' && Number.isFinite(s.durationMinutes) && s.durationMinutes > 0) {
      durationMinutes = s.durationMinutes;
    } else if (s.start_time && s.end_time) {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      if ([sh, sm, eh, em].every(Number.isFinite) && sh >= 0 && sh < 24 && eh >= 0 && eh < 24 && sm >= 0 && sm < 60 && em >= 0 && em < 60) {
        const calculated = (eh * 60 + em) - (sh * 60 + sm);
        const wrapped = calculated < 0 ? calculated + 24 * 60 : calculated;
        if (wrapped > 0 && wrapped <= 7 * 24 * 60) durationMinutes = wrapped;
      }
    }

    // Een oude status 'completed' bewijst niet dat expliciet nulvangst is geregistreerd.
    let outcome: 'catch' | 'skunk_confirmed' | 'unknown' | 'active' = 'unknown';
    if (sessionCatches.length > 0) {
      outcome = 'catch';
    } else if (s.outcome === 'skunk_confirmed') {
      outcome = 'skunk_confirmed';
    } else if (s.status === 'active' || s.outcome === 'active') {
      outcome = 'active';
    }

    // Doelsoort is niet hetzelfde als de gevangen soort. Alleen expliciete doelsoortinvoer behouden.
    const rawTargetSpecies = Array.isArray(s.targetSpecies) ? s.targetSpecies
      : Array.isArray(s.target_species) ? s.target_species : [];
    const targetSpecies = rawTargetSpecies.filter((species: unknown) => typeof species === 'string') as NonNullable<FishingSession['targetSpecies']>;

    // Legacyweer alleen overnemen wanneer alle vereiste waarden en het meettijdstip bekend zijn.
    let weatherSnapshot = s.weatherSnapshot;
    if (!weatherSnapshot && Array.isArray(s.weather_moments) && s.weather_moments.length > 0) {
      const moment = s.weather_moments[0];
      const wm = moment?.data;
      const direction = wm?.wind_direction_degrees ?? wm?.wind_direction_deg;
      const capturedAt = moment?.captured_at || moment?.capturedAt || moment?.timestamp || wm?.captured_at || wm?.timestamp;
      const values = [wm?.temperature_avg_c, wm?.pressure_hpa, wm?.wind_speed_kmh, direction, wm?.cloud_cover, wm?.precipitation_mm];
      if (values.every((value) => typeof value === 'number' && Number.isFinite(value)) &&
          typeof capturedAt === 'string' && Number.isFinite(Date.parse(capturedAt))) {
        weatherSnapshot = {
          temperature: wm.temperature_avg_c,
          pressure: wm.pressure_hpa,
          windSpeed: wm.wind_speed_kmh,
          windDirection: direction,
          windDirectionText: typeof wm.wind_direction === 'string' ? wm.wind_direction : undefined,
          cloudCover: wm.cloud_cover,
          precipitation: wm.precipitation_mm,
          source: moment?.source?.includes('Regionale') ? 'knmi-regionaal' : 'open-meteo-historisch',
          capturedAt,
        };
      }
    }

    const isBench = s.id === 'ref-2026-10-19-lokkershoek' || s.id === BENCHMARK_SESSION.id ? false : (s.isBenchmark === true);

    const baitAndFeedParts = [
      s.bait ? `Aas: ${s.bait.trim()}` : null,
      s.groundbait ? `Voer: ${s.groundbait.trim()}` : null,
    ].filter(Boolean);

    const notesParts = [
      s.notes ? s.notes.trim() : null,
      s.summary ? s.summary.trim() : null,
      !s.spot_id && s.location?.label ? `Steklocatie: ${s.location.label}` : null,
    ].filter(Boolean);

    const isLokkershoek19 = s.id === 'ref-2026-10-19-lokkershoek' || s.id === BENCHMARK_SESSION.id;

    sessions.push({
      id: s.id,
      locationId: isLokkershoek19 ? 'spot-mvp1g19d-dfemr2' : (s.spot_id || undefined), // Gekoppeld aan Lokkershoek Pier
      locationName: isLokkershoek19 ? 'Lokkershoek Pier' : (s.spot_name || s.location?.label || 'Onbekende stek'),
      startTime: s.start_time && s.date ? `${s.date}T${s.start_time}:00` : (s.startTime || (s.date ? `${s.date}T00:00:00` : importedAt)),
      endTime: s.end_time && (s.end_date || s.date) ? `${s.end_date || s.date}T${s.end_time}:00` : (s.endTime || null),
      durationMinutes,
      outcome,
      targetSpecies,
      legacyImportQuality: {
        startDateKnown: Boolean((typeof s.date === 'string' && Number.isFinite(Date.parse(s.date))) || (typeof s.startTime === 'string' && Number.isFinite(Date.parse(s.startTime)))),
        startTimeKnown: Boolean((s.start_time && s.date) || (typeof s.startTime === 'string' && Number.isFinite(Date.parse(s.startTime)) && /T\d{2}:\d{2}/.test(s.startTime))),
        endTimeKnown: Boolean((s.end_time && (s.end_date || s.date)) || (typeof s.endTime === 'string' && Number.isFinite(Date.parse(s.endTime)))),
        durationKnown: typeof durationMinutes === 'number',
        targetSpeciesKnown: targetSpecies.length > 0,
        weatherSnapshotKnown: Boolean(weatherSnapshot),
      },
      technique: s.technique || undefined,
      rodCount: s.rods ? parseInt(s.rods, 10) : (s.rodCount ?? undefined),
      baitAndFeed: baitAndFeedParts.length > 0 ? baitAndFeedParts.join(' | ') : undefined,
      notes: notesParts.length > 0 ? notesParts.join(' — ') : undefined,
      waterDepth: typeof s.waterDepth === 'number' ? s.waterDepth : (typeof s.water_depth === 'number' ? s.water_depth : undefined),
      waterTemperature:
        typeof s.waterTemperature === 'number'
          ? s.waterTemperature
          : typeof s.water_temp === 'number'
          ? s.water_temp
          : typeof s.water_temperature === 'number'
          ? s.water_temperature
          : null,
      baitDirection: s.baitDirection || s.bait_direction || undefined,
      weatherSnapshot,
      isBenchmark: isBench,
      createdAt: s.created_at || s.createdAt || importedAt,
      updatedAt: s.updated_at || s.updatedAt || importedAt,
    });
  }

  // Eventuele extra losse catches meenemen
  if (Array.isArray(raw.catches)) {
    for (const c of raw.catches) {
      if (!catches.some((existing) => existing.id === c.id)) {
        catches.push(c);
      }
    }
  }

  return {
    version: raw.version || 2,
    appName: raw.appName || raw.format || 'Vislogboek',
    exportedAt: raw.exported_at || raw.exportedAt || new Date().toISOString(),
    locations,
    sessions,
    catches,
    settings: raw.settings,
    weatherCache: Array.isArray(raw.weatherCache) ? raw.weatherCache : [],
    prognosisSnapshots: Array.isArray(raw.prognosisSnapshots) ? raw.prognosisSnapshots : [],
    presenceObservations: Array.isArray(raw.presenceObservations) ? raw.presenceObservations : [],
    sessionRods: Array.isArray(raw.sessionRods) ? raw.sessionRods : [],
  };
}

/**
 * Harde grenzen voor geïmporteerde back-ups. Dit beschermt de browser tegen
 * extreem grote of pathologisch geneste JSON-bestanden.
 */
export const MAX_BACKUP_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const BACKUP_COLLECTION_LIMITS: Record<string, number> = {
  locations: 5_000,
  sessions: 25_000,
  catches: 100_000,
  weatherCache: 10_000,
  prognosisSnapshots: 50_000,
  presenceObservations: 100_000,
  sessionRods: 100_000,
};

const MAX_BACKUP_TOTAL_RECORDS = 250_000;
const MAX_BACKUP_NESTING_DEPTH = 16;
const MAX_BACKUP_OBJECT_KEYS = 500;
const MAX_BACKUP_TEXT_LENGTH = 100_000;
const MAX_BACKUP_PHOTO_LENGTH = 25 * 1024 * 1024;

/** Valideert de omvang en JSON-vorm vóór records in IndexedDB kunnen belanden. */
export function validateBackupPayloadLimits(data: BackupData): string | null {
  const collections: Array<[string, unknown[]]> = [
    ['locations', data.locations],
    ['sessions', data.sessions],
    ['catches', data.catches],
    ['weatherCache', data.weatherCache || []],
    ['prognosisSnapshots', data.prognosisSnapshots || []],
    ['presenceObservations', data.presenceObservations || []],
    ['sessionRods', data.sessionRods || []],
  ];

  let totalRecords = 0;
  for (const [name, records] of collections) {
    if (!Array.isArray(records)) return `De collectie ${name} is geen geldige lijst.`;
    if (records.length > BACKUP_COLLECTION_LIMITS[name]) {
      return `De back-up bevat te veel records in ${name} (maximum ${BACKUP_COLLECTION_LIMITS[name]}).`;
    }
    totalRecords += records.length;
    for (const record of records) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        return `De back-up bevat een ongeldig record in ${name}.`;
      }
      const id = (record as { id?: unknown }).id;
      if (typeof id !== 'string' || !id.trim() || id.length > 256) {
        return `De back-up bevat een ongeldige record-ID in ${name}.`;
      }
    }
  }

  if (totalRecords > MAX_BACKUP_TOTAL_RECORDS) {
    return `De back-up bevat te veel gegevens (maximum ${MAX_BACKUP_TOTAL_RECORDS} records).`;
  }

  // Vangstfoto's zijn lokaal opgeslagen data-URL's. Blokkeer externe URL's
  // en SVG-data-URL's zodat een geïmporteerde back-up geen externe tracking
  // of actieve SVG-inhoud kan laten laden in de app-origin.
  const isSafeLocalPhoto = (value: unknown): boolean =>
    typeof value === 'string' &&
    /^data:image\/(?!svg\+xml)[a-z0-9.+-]+;base64,/i.test(value);

  for (const catchRecord of data.catches as Array<CatchItem & { photoUrl?: unknown }>) {
    if (catchRecord.photoUrl !== undefined && catchRecord.photoUrl !== null &&
        catchRecord.photoUrl !== '' && !isSafeLocalPhoto(catchRecord.photoUrl)) {
      return `De back-up bevat een niet-toegestane fotoverwijzing bij vangst ${catchRecord.id}.`;
    }
  }
  for (const sessionRecord of data.sessions as Array<FishingSession & { photoUrls?: unknown }>) {
    if (sessionRecord.photoUrls !== undefined) {
      if (!Array.isArray(sessionRecord.photoUrls) ||
          sessionRecord.photoUrls.some((photo) => !isSafeLocalPhoto(photo))) {
        return `De back-up bevat een niet-toegestane fotolijst bij sessie ${sessionRecord.id}.`;
      }
    }
  }

  const inspectValue = (value: unknown, path: string, depth: number): string | null => {
    if (depth > MAX_BACKUP_NESTING_DEPTH) {
      return `De back-up is te diep genest bij ${path}.`;
    }
    if (typeof value === 'string') {
      const isPhoto = /(?:photoUrl|photoUrls|photos)(?:\[|$)/i.test(path);
      const maxLength = isPhoto ? MAX_BACKUP_PHOTO_LENGTH : MAX_BACKUP_TEXT_LENGTH;
      return value.length > maxLength ? `Een tekst- of fotoveld is te groot bij ${path}.` : null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? null : `De back-up bevat een ongeldig getal bij ${path}.`;
    }
    if (value === null || typeof value === 'boolean' || typeof value === 'undefined') return null;
    if (Array.isArray(value)) {
      if (value.length > 100_000) return `Een lijst is te groot bij ${path}.`;
      for (let i = 0; i < value.length; i++) {
        const error = inspectValue(value[i], `${path}[${i}]`, depth + 1);
        if (error) return error;
      }
      return null;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length > MAX_BACKUP_OBJECT_KEYS) return `Een object bevat te veel velden bij ${path}.`;
      for (const [key, child] of entries) {
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
          return `De back-up bevat een niet-toegestaan veld bij ${path}.`;
        }
        const error = inspectValue(child, path ? `${path}.${key}` : key, depth + 1);
        if (error) return error;
      }
    }
    return null;
  };

  for (const [name, records] of collections) {
    for (let i = 0; i < records.length; i++) {
      const error = inspectValue(records[i], `${name}[${i}]`, 0);
      if (error) return error;
    }
  }
  if (data.settings) {
    const settingsError = inspectValue(data.settings, 'settings', 0);
    if (settingsError) return settingsError;
  }
  return null;
}

/**
 * Analyseert een JSON importbestand voordat actie wordt ondernomen.
 */
export async function inspectImportFile(fileContent: string): Promise<{ preview: ImportPreview; data?: BackupData }> {
  try {
    if (new Blob([fileContent]).size > MAX_BACKUP_FILE_SIZE_BYTES) {
      throw new Error(`Back-upbestand is groter dan de maximale grootte van ${Math.round(MAX_BACKUP_FILE_SIZE_BYTES / (1024 * 1024))} MB.`);
    }
    const raw = JSON.parse(fileContent);
    const data = normalizeRawBackup(raw);

    if (!Array.isArray(data.sessions) || !Array.isArray(data.locations) || !Array.isArray(data.catches) ||
        !Array.isArray(data.weatherCache) || !Array.isArray(data.prognosisSnapshots) ||
        !Array.isArray(data.presenceObservations) || !Array.isArray(data.sessionRods) ||
        !Array.isArray(data.plannedSessions) || !Array.isArray(data.coachAdviceRecords)) {
      return {
        preview: {
          valid: false,
          locationsCount: 0,
          sessionsCount: 0,
          catchesCount: 0,
          hasBenchmark: false,
          duplicateSessionCount: 0,
          duplicateLocationCount: 0,
          duplicateCatchCount: 0,
          error: 'Het bestand bevat geen geldige Vislogboek sessie- of stekkenstructuur.',
        },
      };
    }

    if (data.version > 5) throw new Error(`Back-upversie ${data.version} is nieuwer dan deze app ondersteunt.`);
    const collections: Array<[string, any[]]> = [
      ['locaties', data.locations], ['sessies', data.sessions], ['vangsten', data.catches],
      ['weercache', data.weatherCache || []], ['prognoses', data.prognosisSnapshots || []],
      ['waarnemingen', data.presenceObservations || []], ['hengeldetails', data.sessionRods || []],
      ['geplande sessies', data.plannedSessions || []], ['coachadviezen', data.coachAdviceRecords || []],
    ];
    for (const [label, records] of collections) {
      if (records.some((record) => !record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id.trim())) {
        throw new Error(`De back-up bevat een ongeldig record in ${label} (ontbrekende ID).`);
      }
    }
    const limitsError = validateBackupPayloadLimits(data);
    if (limitsError) throw new Error(limitsError);

    const backupSessionIds = new Set(data.sessions.map((session) => session.id));
    const backupLocationIds = new Set(data.locations.map((location) => location.id));
    const backupSnapshotIds = new Set((data.prognosisSnapshots || []).map((snapshot) => snapshot.id));
    for (const planned of data.plannedSessions || []) {
      if (!backupLocationIds.has(planned.locationId) || !Number.isFinite(new Date(planned.plannedStartTime).getTime()) ||
          !['planned', 'started', 'cancelled', 'overdue'].includes(planned.status)) {
        throw new Error(`Geplande sessie ${planned.id} bevat een ongeldige locatie, starttijd of status.`);
      }
      if (planned.planSnapshotId && !backupSnapshotIds.has(planned.planSnapshotId)) {
        throw new Error(`Geplande sessie ${planned.id} verwijst naar een prognosesnapshot die niet in de back-up aanwezig is.`);
      }
      if (planned.startedSessionId && !backupSessionIds.has(planned.startedSessionId)) {
        throw new Error(`Geplande sessie ${planned.id} verwijst naar een actieve sessie die niet in de back-up aanwezig is.`);
      }
    }
    for (const advice of data.coachAdviceRecords || []) {
      if (!backupSessionIds.has(advice.sessionId) || !backupSnapshotIds.has(advice.prognosisSnapshotId)) {
        throw new Error(`Coachadvies ${advice.id} verwijst naar een sessie of prognosesnapshot die niet in de back-up aanwezig is.`);
      }
      if (advice.previousAdviceId && !(data.coachAdviceRecords || []).some((item) => item.id === advice.previousAdviceId)) {
        throw new Error(`Coachadvies ${advice.id} verwijst naar een eerder advies dat niet in de back-up aanwezig is.`);
      }
    }
    const rodNumbersBySession = new Map<string, Set<number>>();
    for (const rod of data.sessionRods) {
      if (typeof rod.sessionId !== 'string' || !backupSessionIds.has(rod.sessionId)) {
        throw new Error(`Hengeldetail ${rod.id} verwijst naar een sessie die niet in de back-up aanwezig is.`);
      }
      if (!Number.isInteger(rod.rodNumber) || rod.rodNumber < 1 || !Array.isArray(rod.activeIntervals) ||
          (rod.events !== undefined && !Array.isArray(rod.events))) {
        throw new Error(`Hengeldetail ${rod.id} bevat ongeldige hengelgegevens.`);
      }
      const usedNumbers = rodNumbersBySession.get(rod.sessionId) || new Set<number>();
      if (usedNumbers.has(rod.rodNumber)) {
        throw new Error(`Sessie ${rod.sessionId} bevat dubbel hengelnummer ${rod.rodNumber}.`);
      }
      usedNumbers.add(rod.rodNumber);
      rodNumbersBySession.set(rod.sessionId, usedNumbers);
    }

    if (data.settings && (typeof data.settings !== 'object' || data.settings.id !== 'user_settings')) {
      throw new Error('De back-up bevat ongeldige instellingen.');
    }

    const existingSessionIds = new Set(await db.sessions.toCollection().primaryKeys());
    const existingLocationIds = new Set(await db.locations.toCollection().primaryKeys());
    const existingCatchIds = new Set(await db.catches.toCollection().primaryKeys());

    // Beschouw de benchmark-referentie ook als al aanwezig indien de benchmark al in de db staat
    const dupSessions = data.sessions.filter((s) => existingSessionIds.has(s.id) || (s.isBenchmark && existingSessionIds.has(BENCHMARK_SESSION.id))).length;
    const dupLocations = data.locations.filter((l) => existingLocationIds.has(l.id) || (l.isBenchmark && existingLocationIds.has(BENCHMARK_LOCATION.id))).length;
    const dupCatches = data.catches.filter((c) => existingCatchIds.has(c.id)).length;

    const hasBenchmark = data.sessions.some((s) => s.isBenchmark || s.id === BENCHMARK_SESSION.id || s.id === 'ref-2026-10-19-lokkershoek');

    return {
      preview: {
        valid: true,
        version: data.version,
        exportedAt: data.exportedAt,
        locationsCount: data.locations.length,
        sessionsCount: data.sessions.length,
        catchesCount: data.catches.length,
        hasBenchmark,
        duplicateSessionCount: dupSessions,
        duplicateLocationCount: dupLocations,
        duplicateCatchCount: dupCatches,
        weatherCacheCount: data.weatherCache?.length || 0,
        prognosisSnapshotsCount: data.prognosisSnapshots?.length || 0,
        presenceObservationsCount: data.presenceObservations?.length || 0,
        sessionRodsCount: data.sessionRods?.length || 0,
        plannedSessionsCount: data.plannedSessions?.length || 0,
        coachAdviceRecordsCount: data.coachAdviceRecords?.length || 0,
      },
      data,
    };
  } catch (err) {
    return {
      preview: {
        valid: false,
        locationsCount: 0,
        sessionsCount: 0,
        catchesCount: 0,
        hasBenchmark: false,
        duplicateSessionCount: 0,
        duplicateLocationCount: 0,
        duplicateCatchCount: 0,
        error: `Back-upvalidatie mislukt: ${(err as Error).message}`,
      },
    };
  }
}

/**
 * Voegt gegevens samen met behoud van bestaande records en beschermde benchmark.
 */
export async function mergeImportData(data: BackupData): Promise<{
  addedSessions: number; addedCatches: number; addedLocations: number;
  addedWeatherCache: number; addedPrognosisSnapshots: number; addedPresenceObservations: number; addedSessionRods: number;
  addedPlannedSessions: number; addedCoachAdviceRecords: number;
  settingsImported: boolean;
}> {
  let addedLocations = 0, addedSessions = 0, addedCatches = 0;
  let addedWeatherCache = 0, addedPrognosisSnapshots = 0, addedPresenceObservations = 0, addedSessionRods = 0;
  let addedPlannedSessions = 0, addedCoachAdviceRecords = 0;
  let settingsImported = false;

  await db.transaction('rw', [db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
    db.prognosisSnapshots, db.presenceObservations, db.sessionRods, db.plannedSessions, db.coachAdviceRecords], async () => {
    for (const loc of data.locations) {
      const existing = await db.locations.get(loc.id);
      if (!existing && !loc.isBenchmark) {
        await db.locations.put(loc);
        addedLocations++;
      }
    }

    for (const sess of data.sessions) {
      const existing = await db.sessions.get(sess.id);
      if (!existing && !sess.isBenchmark) {
        await db.sessions.put(sess);
        addedSessions++;
      }
    }

    for (const c of data.catches) {
      const existing = await db.catches.get(c.id);
      if (!existing) { await db.catches.put(c); addedCatches++; }
    }
    for (const item of data.weatherCache || []) {
      if (!(await db.weatherCache.get(item.id))) { await db.weatherCache.put(item); addedWeatherCache++; }
    }
    for (const item of data.prognosisSnapshots || []) {
      if (!(await db.prognosisSnapshots.get(item.id))) { await db.prognosisSnapshots.put(item); addedPrognosisSnapshots++; }
    }
    for (const item of data.presenceObservations || []) {
      if (!(await db.presenceObservations.get(item.id))) { await db.presenceObservations.put(item); addedPresenceObservations++; }
    }
    for (const item of data.sessionRods || []) {
      if (!(await db.sessionRods.get(item.id))) { await db.sessionRods.put(item); addedSessionRods++; }
    }
    for (const item of data.plannedSessions || []) {
      if (!(await db.plannedSessions.get(item.id))) { await db.plannedSessions.put(item); addedPlannedSessions++; }
    }
    for (const item of data.coachAdviceRecords || []) {
      if (!(await db.coachAdviceRecords.get(item.id))) { await db.coachAdviceRecords.put(item); addedCoachAdviceRecords++; }
    }
    // The user explicitly selected import: backup settings are authoritative for this merge.
    if (data.settings) {
      const existingSettings = await db.settings.get(data.settings.id);
      await db.settings.put({ ...(existingSettings || {}), ...data.settings });
      settingsImported = true;
    }
  });

  return { addedSessions, addedCatches, addedLocations, addedWeatherCache,
    addedPrognosisSnapshots, addedPresenceObservations, addedSessionRods, addedPlannedSessions, addedCoachAdviceRecords, settingsImported };
}

/** Herstelt een gevalideerde backup atomair. Veiligheidsbackup/download wordt door de UI-flow geregeld. */
export async function restoreBackupData(data: BackupData): Promise<void> {
  // Oudere back-ups zonder instellingen mogen de standaardinstellingen van het doelapparaat niet wissen.
  const fallbackSettings = data.settings ? undefined : await db.settings.get('user_settings');
  await db.transaction('rw', [db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
    db.prognosisSnapshots, db.presenceObservations, db.sessionRods, db.plannedSessions, db.coachAdviceRecords], async () => {
      await db.locations.clear();
      await db.sessions.clear();
      await db.catches.clear();
      await db.settings.clear();
      await db.weatherCache.clear();
      await db.prognosisSnapshots.clear();
      await db.presenceObservations.clear();
      await db.sessionRods.clear();
      await db.plannedSessions.clear();
      await db.coachAdviceRecords.clear();

      await db.locations.bulkPut(data.locations);
      await db.sessions.bulkPut(data.sessions);
      await db.catches.bulkPut(data.catches);
      if (data.settings) await db.settings.put(data.settings);
      else if (fallbackSettings) await db.settings.put(fallbackSettings);
      if (data.weatherCache?.length) await db.weatherCache.bulkPut(data.weatherCache);
      if (data.prognosisSnapshots?.length) await db.prognosisSnapshots.bulkPut(data.prognosisSnapshots);
      if (data.presenceObservations?.length) await db.presenceObservations.bulkPut(data.presenceObservations);
      if (data.sessionRods?.length) await db.sessionRods.bulkPut(data.sessionRods);
      if (data.plannedSessions?.length) await db.plannedSessions.bulkPut(data.plannedSessions);
      if (data.coachAdviceRecords?.length) await db.coachAdviceRecords.bulkPut(data.coachAdviceRecords);

      // De app houdt de ingebouwde referentieset beschikbaar, zoals vóór deze backupversie.
      if (!(await db.locations.get(BENCHMARK_LOCATION.id))) await db.locations.put(BENCHMARK_LOCATION);
      if (!(await db.sessions.get(BENCHMARK_SESSION.id))) await db.sessions.put(BENCHMARK_SESSION);
      for (const item of BENCHMARK_CATCHES) {
        if (!(await db.catches.get(item.id))) await db.catches.put(item);
      }
    });
}

/** Vervangt alle gegevens na het downloaden van een volledige veiligheidsbackup. */
export async function replaceWithImportData(data: BackupData): Promise<void> {
  await exportDatabaseToJson();
  await restoreBackupData(data);
}

/**
 * CSV-export voor tabulaire analyse in Excel / LibreOffice / Google Sheets.
 */
export async function exportCatchesToCsv(): Promise<void> {
  const catches = await db.catches.toArray();
  const sessions = await db.sessions.toArray();
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const headers = ['Datum_Tijd', 'Sessie_ID', 'Locatie', 'Vissoort', 'Aantal', 'Gewicht_kg', 'Lengte_cm', 'Aas', 'Techniek', 'Notities'];
  const rows = catches.map((c) => {
    const s = sessionMap.get(c.sessionId);
    return [
      c.timestamp,
      c.sessionId,
      `"${(s?.locationName || '').replace(/"/g, '""')}"`,
      c.species,
      c.count,
      c.weightKg ?? '',
      c.lengthCm ?? '',
      `"${(c.bait || '').replace(/"/g, '""')}"`,
      `"${(c.technique || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vislogboek-vangsten-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
