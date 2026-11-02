import { db, BENCHMARK_LOCATION, BENCHMARK_SESSION, BENCHMARK_CATCHES } from '../db/db';
import { FishingLocation, FishingSession, CatchItem, AppSettings, WeatherCacheEntry, PrognosisSnapshot, PresenceObservation } from '../types';

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
  error?: string;
}

/** Bouwt een volledige, download-onafhankelijke momentopname van alle persistente tabellen. */
export async function collectBackupData(): Promise<BackupData> {
  const [locations, sessions, catches, settings, weatherCache, prognosisSnapshots, presenceObservations] =
    await db.transaction('r', [db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
      db.prognosisSnapshots, db.presenceObservations], () => Promise.all([
        db.locations.toArray(), db.sessions.toArray(), db.catches.toArray(),
        db.settings.get('user_settings'), db.weatherCache.toArray(),
        db.prognosisSnapshots.toArray(), db.presenceObservations.toArray(),
      ]));

  return {
    version: 3,
    appName: 'Vislogboek',
    exportedAt: new Date().toISOString(),
    locations, sessions, catches,
    settings: settings || undefined,
    weatherCache, prognosisSnapshots, presenceObservations,
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
  if (!raw || typeof raw !== 'object') {
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
    } as BackupData;
  }

  // Geval 2: vislogboek-backup formaat met 'spots' en geneste 'catches'
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

    // Verwerk vangsten van deze sessie
    for (const c of rawCatches) {
      const catchItem: CatchItem = {
        id: c.id,
        sessionId: s.id,
        species: c.species || 'Karper',
        count: typeof c.count === 'number' ? c.count : 1,
        weightKg: typeof c.weight_kg === 'number' ? c.weight_kg : (typeof c.weightKg === 'number' ? c.weightKg : null),
        lengthCm: typeof c.length_cm === 'number' ? c.length_cm : (typeof c.lengthCm === 'number' ? c.lengthCm : null),
        timestamp: c.time ? `${s.date}T${c.time}:00` : (c.timestamp || `${s.date}T12:00:00`),
        bait: c.bait || undefined,
        technique: c.technique || s.technique || undefined,
        rod: c.rod || undefined,
        notes: c.notes || undefined,
        photoUrl: Array.isArray(c.photos) && c.photos[0] ? c.photos[0] : (c.photoUrl || undefined),
        createdAt: s.created_at || s.createdAt || new Date().toISOString(),
      };
      catches.push(catchItem);
      sessionCatches.push(catchItem);
    }

    // Bepaal sessieduur
    let durationMinutes = 180;
    if (s.start_time && s.end_time) {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
        if (durationMinutes < 0) durationMinutes += 24 * 60; // over middernacht
      }
    } else if (typeof s.durationMinutes === 'number') {
      durationMinutes = s.durationMinutes;
    }

    // Bepaal uitkomst (vangst, bevestigde nulvangst, actief)
    let outcome: 'catch' | 'skunk_confirmed' | 'unknown' | 'active' = 'unknown';
    if (sessionCatches.length > 0) {
      outcome = 'catch';
    } else if (s.status === 'completed' || s.outcome === 'skunk_confirmed') {
      outcome = 'skunk_confirmed';
    } else if (s.status === 'active' || s.outcome === 'active') {
      outcome = 'active';
    }

    // Doelvissoorten
    const targetSpeciesSet = new Set<string>();
    sessionCatches.forEach((c) => targetSpeciesSet.add(c.species));
    if (targetSpeciesSet.size === 0) {
      if (typeof s.technique === 'string' && s.technique.toLowerCase().includes('karper')) {
        targetSpeciesSet.add('Karper');
      } else {
        targetSpeciesSet.add('Karper');
      }
    }

    // Weermoment indien aanwezig
    let weatherSnapshot = s.weatherSnapshot;
    if (!weatherSnapshot && Array.isArray(s.weather_moments) && s.weather_moments.length > 0) {
      const wm = s.weather_moments[0]?.data;
      if (wm) {
        weatherSnapshot = {
          temperature: wm.temperature_avg_c ?? 11.5,
          pressure: Math.round(wm.pressure_hpa ?? 1026),
          pressureTrend: 'stabiel',
          windSpeed: Math.round(wm.wind_speed_kmh ?? 14),
          windDirection: 90,
          windDirectionText: wm.wind_direction ?? 'O',
          cloudCover: Math.round(wm.cloud_cover ?? 100),
          precipitation: wm.precipitation_mm ?? 0.5,
          source: s.weather_moments[0]?.source?.includes('Regionale') ? 'knmi-regionaal' : 'open-meteo-historisch',
          capturedAt: s.created_at || new Date().toISOString(),
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
      startTime: s.start_time ? `${s.date}T${s.start_time}:00` : (s.startTime || `${s.date}T12:00:00`),
      endTime: s.end_time ? `${s.end_date || s.date}T${s.end_time}:00` : (s.endTime || `${s.date}T17:00:00`),
      durationMinutes,
      outcome,
      targetSpecies: Array.from(targetSpeciesSet) as any,
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
      createdAt: s.created_at || s.createdAt || new Date().toISOString(),
      updatedAt: s.updated_at || s.updatedAt || new Date().toISOString(),
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
  };
}

/**
 * Analyseert een JSON importbestand voordat actie wordt ondernomen.
 */
export async function inspectImportFile(fileContent: string): Promise<{ preview: ImportPreview; data?: BackupData }> {
  try {
    const raw = JSON.parse(fileContent);
    const data = normalizeRawBackup(raw);

    if (!Array.isArray(data.sessions) || !Array.isArray(data.locations) || !Array.isArray(data.catches) ||
        !Array.isArray(data.weatherCache) || !Array.isArray(data.prognosisSnapshots) ||
        !Array.isArray(data.presenceObservations)) {
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

    if (data.version > 3) throw new Error(`Back-upversie ${data.version} is nieuwer dan deze app ondersteunt.`);
    const collections: Array<[string, any[]]> = [
      ['locaties', data.locations], ['sessies', data.sessions], ['vangsten', data.catches],
      ['weercache', data.weatherCache || []], ['prognoses', data.prognosisSnapshots || []],
      ['waarnemingen', data.presenceObservations || []],
    ];
    for (const [label, records] of collections) {
      if (records.some((record) => !record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id.trim())) {
        throw new Error(`De back-up bevat een ongeldig record in ${label} (ontbrekende ID).`);
      }
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
  addedWeatherCache: number; addedPrognosisSnapshots: number; addedPresenceObservations: number;
  settingsImported: boolean;
}> {
  let addedLocations = 0, addedSessions = 0, addedCatches = 0;
  let addedWeatherCache = 0, addedPrognosisSnapshots = 0, addedPresenceObservations = 0;
  let settingsImported = false;

  await db.transaction('rw', [db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
    db.prognosisSnapshots, db.presenceObservations], async () => {
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
    // The user explicitly selected import: backup settings are authoritative for this merge.
    if (data.settings) {
      const existingSettings = await db.settings.get(data.settings.id);
      await db.settings.put({ ...(existingSettings || {}), ...data.settings });
      settingsImported = true;
    }
  });

  return { addedSessions, addedCatches, addedLocations, addedWeatherCache,
    addedPrognosisSnapshots, addedPresenceObservations, settingsImported };
}

/** Herstelt een gevalideerde backup atomair. Veiligheidsbackup/download wordt door de UI-flow geregeld. */
export async function restoreBackupData(data: BackupData): Promise<void> {
  // Oudere back-ups zonder instellingen mogen de standaardinstellingen van het doelapparaat niet wissen.
  const fallbackSettings = data.settings ? undefined : await db.settings.get('user_settings');
  await db.transaction('rw', [db.locations, db.sessions, db.catches, db.settings, db.weatherCache,
    db.prognosisSnapshots, db.presenceObservations], async () => {
      await db.locations.clear();
      await db.sessions.clear();
      await db.catches.clear();
      await db.settings.clear();
      await db.weatherCache.clear();
      await db.prognosisSnapshots.clear();
      await db.presenceObservations.clear();

      await db.locations.bulkPut(data.locations);
      await db.sessions.bulkPut(data.sessions);
      await db.catches.bulkPut(data.catches);
      if (data.settings) await db.settings.put(data.settings);
      else if (fallbackSettings) await db.settings.put(fallbackSettings);
      if (data.weatherCache?.length) await db.weatherCache.bulkPut(data.weatherCache);
      if (data.prognosisSnapshots?.length) await db.prognosisSnapshots.bulkPut(data.prognosisSnapshots);
      if (data.presenceObservations?.length) await db.presenceObservations.bulkPut(data.presenceObservations);

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
