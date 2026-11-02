import assert from 'node:assert/strict';
import {
  validateBackupPayloadLimits,
  type BackupData,
} from './src/services/backupService';

const validBackup = (): BackupData => ({
  version: 4,
  appName: 'Vislogboek',
  exportedAt: new Date().toISOString(),
  locations: [{ id: 'location-1', name: 'Teststek' } as any],
  sessions: [{ id: 'session-1', notes: 'Normale notitie' } as any],
  catches: [{ id: 'catch-1', sessionId: 'session-1' } as any],
  weatherCache: [],
  prognosisSnapshots: [],
  presenceObservations: [],
  sessionRods: [],
});

assert.equal(validateBackupPayloadLimits(validBackup()), null, 'Geldige back-up moet worden geaccepteerd');

const tooManyLocations = validBackup();
tooManyLocations.locations = Array.from({ length: 5_001 }, (_, i) => ({ id: `loc-${i}`, name: 'Test' } as any));
assert.match(validateBackupPayloadLimits(tooManyLocations) || '', /te veel records in locations/);

const oversizedText = validBackup();
(oversizedText.sessions[0] as any).notes = 'x'.repeat(100_001);
assert.match(validateBackupPayloadLimits(oversizedText) || '', /tekst- of fotoveld is te groot/);

const excessiveDepth = validBackup();
let nested: any = {};
let cursor = nested;
for (let i = 0; i < 20; i++) {
  cursor.child = {};
  cursor = cursor.child;
}
(excessiveDepth.sessions[0] as any).extra = nested;
assert.match(validateBackupPayloadLimits(excessiveDepth) || '', /te diep genest/);

const dangerousKey = validBackup();
(dangerousKey.sessions[0] as any).constructor = { polluted: true };
assert.match(validateBackupPayloadLimits(dangerousKey) || '', /niet-toegestaan veld/);

const nonFiniteNumber = validBackup();
(nonFiniteNumber.locations[0] as any).latitude = Number.POSITIVE_INFINITY;
assert.match(validateBackupPayloadLimits(nonFiniteNumber) || '', /ongeldig getal/);

console.log('Security backup validation tests passed.');
