import fs from 'fs';
import path from 'path';
import { normalizeRawBackup } from '../src/services/backupService';
import { BENCHMARK_SESSION, BENCHMARK_LOCATION, BENCHMARK_CATCHES } from '../src/db/db';

const jsonPath = path.resolve('public/assets/aistudio/vislogboek-backup-2026-10-26_50803f8b.json');
const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const normalized = normalizeRawBackup(raw);

// Exclude benchmark session and benchmark catches
const locations = normalized.locations.filter(
  (l) => l.id !== BENCHMARK_LOCATION.id && l.id !== 'ref-location-lokkershoek' && !l.isBenchmark
);
const sessions = normalized.sessions.filter(
  (s) => s.id !== BENCHMARK_SESSION.id && s.id !== 'ref-2026-10-19-lokkershoek' && !s.isBenchmark
);
const catches = normalized.catches.filter(
  (c) => !BENCHMARK_CATCHES.some((bc) => bc.id === c.id) && !c.id.startsWith('ref-c')
);

const outContent = `import { FishingLocation, FishingSession, CatchItem } from '../types';

/**
 * Historische data geïmporteerd uit vislogboek-backup-2026-10-26_50803f8b.json
 * - 5 stekken / locaties
 * - 10 sessies (normale gebruikerssessies, isBenchmark: false)
 * - 16 vangsten (alle gewichten behouden als null, nooit 0 kg)
 * - Bevat de 26 sept sessie zonder spot_id
 * - Bevat de twee afzonderlijke 15 sept sessies
 * - 3 nulvangstsessies correct gemarkeerd als 'skunk_confirmed'
 */

export const HISTORICAL_LOCATIONS: FishingLocation[] = ${JSON.stringify(locations, null, 2)};

export const HISTORICAL_SESSIONS: FishingSession[] = ${JSON.stringify(sessions, null, 2)};

export const HISTORICAL_CATCHES: CatchItem[] = ${JSON.stringify(catches, null, 2)};
`;

const outDir = path.resolve('src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(path.resolve('src/data/historicalData.ts'), outContent, 'utf-8');
console.log(`Generated src/data/historicalData.ts successfully:
- Locations: ${locations.length}
- Sessions: ${sessions.length}
- Catches: ${catches.length}`);
