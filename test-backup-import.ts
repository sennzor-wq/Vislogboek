import fs from 'fs';
import path from 'path';
import { normalizeRawBackup } from './src/services/backupService';
import { FishingLocation, FishingSession, CatchItem, SessionOutcome } from './src/types';

const jsonPath = path.resolve('test-fixtures/legacy/vislogboek-backup-2026-10-26.json');
console.log('Testing file:', jsonPath);
const fileContent = fs.readFileSync(jsonPath, 'utf-8');
const raw = JSON.parse(fileContent);

console.log('--- 1. Raw Structure Check ---');
console.log('Format:', raw.format);
console.log('Version:', raw.version);
console.log('Exported at:', raw.exported_at);
console.log('Raw Sessions count:', raw.sessions?.length);
console.log('Raw Spots count:', raw.spots?.length);

let totalRawCatches = 0;
for (const s of raw.sessions) {
  totalRawCatches += s.catches?.length || 0;
}
console.log('Raw Total Catches in sessions:', totalRawCatches);

console.log('\n--- 2. normalizeRawBackup Test ---');
const normalized = normalizeRawBackup(raw);
console.log('Normalized locations count:', normalized.locations.length);
console.log('Normalized sessions count:', normalized.sessions.length);
console.log('Normalized catches count:', normalized.catches.length);

console.log('\n--- 3. Session 26 Sept (No Spot ID) ---');
const sept26Session = normalized.sessions.find(s => s.startTime.startsWith('2026-09-26'));
console.log('Sept 26 Session ID:', sept26Session?.id);
console.log('Sept 26 locationId (must be undefined/null):', sept26Session?.locationId);
console.log('Sept 26 locationName:', sept26Session?.locationName);
console.log('Sept 26 notes:', sept26Session?.notes);
console.log('Sept 26 catches count:', normalized.catches.filter(c => c.sessionId === sept26Session?.id).length);

console.log('\n--- 4. Two Sessions on 15 Sept ---');
const sept15Sessions = normalized.sessions.filter(s => s.startTime.startsWith('2026-09-15'));
console.log('Sept 15 Sessions count:', sept15Sessions.length);
for (const s of sept15Sessions) {
  const sessionCatches = normalized.catches.filter(c => c.sessionId === s.id);
  console.log(`- ID: ${s.id}, SpotId: ${s.locationId}, Name: "${s.locationName}", Time: ${s.startTime.slice(11, 16)}-${(s.endTime || '').slice(11, 16)}, Catches: ${sessionCatches.length} (${sessionCatches.map(c => c.species).join(', ')})`);
}

console.log('\n--- 5. Unknown outcome mapping Check ---');
const zeroCatchSessions = normalized.sessions.filter(s => normalized.catches.filter(c => c.sessionId === s.id).length === 0);
console.log('Sessions without catch records:', zeroCatchSessions.length);
for (const session of zeroCatchSessions) {
  console.log(`- Session: ${session.id}, Date: ${session.startTime.slice(0, 10)}, Outcome: "${session.outcome}" (absence of a catch record is not explicit blank confirmation)`);
}
if (zeroCatchSessions.some((session) => session.outcome !== 'unknown')) {
  throw new Error('Legacy completed sessions without explicit blank confirmation must remain unknown');
}

console.log('\n--- 6. Null vs 0 kg Weights Check ---');
const catchesWithZeroWeight = normalized.catches.filter(c => c.weightKg === 0);
const catchesWithNullWeight = normalized.catches.filter(c => c.weightKg === null);
const catchesWithNumWeight = normalized.catches.filter(c => typeof c.weightKg === 'number' && c.weightKg > 0);
console.log('Catches with weight === 0 (must be 0):', catchesWithZeroWeight.length);
console.log('Catches with weight === null (must be 23):', catchesWithNullWeight.length);
console.log('Catches with weight > 0 (must be 1):', catchesWithNumWeight.length, catchesWithNumWeight.map(c => `${c.species} (${c.weightKg}kg)`));

console.log('\n--- 7. Merge Simulation & Exclusion of Benchmark ---');
let addedLocs = 0;
let skippedLocs = 0;
for (const loc of normalized.locations) {
  if (loc.isBenchmark) {
    skippedLocs++;
  } else {
    addedLocs++;
  }
}

let addedSess = 0;
let skippedSess = 0;
for (const sess of normalized.sessions) {
  if (sess.isBenchmark) {
    skippedSess++;
  } else {
    addedSess++;
  }
}

let addedCatch = 0;
let skippedCatch = 0;
for (const c of normalized.catches) {
  if (!normalized.sessions.some((session) => session.id === c.sessionId && !session.isBenchmark)) {
    skippedCatch++;
  } else {
    addedCatch++;
  }
}

console.log(`Locations: ${addedLocs} to add, ${skippedLocs} skipped.`);
console.log(`Sessions: ${addedSess} to add, ${skippedSess} skipped (benchmark reference).`);
console.log(`Catches: ${addedCatch} to add, ${skippedCatch} skipped (benchmark reference).`);
