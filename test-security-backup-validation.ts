import assert from 'node:assert/strict';
import {
  validateBackupPayloadLimits,
  normalizeRawBackup,
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
assert.throws(() => normalizeRawBackup([]), /Ongeldig JSON object/, 'Array-root mag geen back-up worden');
const photoBackup = validBackup();
(photoBackup.catches[0] as any).photoUrl = `data:image/jpeg;base64,${'a'.repeat(150_000)}`;
assert.equal(validateBackupPayloadLimits(photoBackup), null, 'Normale base64-foto moet worden toegestaan');
const remotePhotoBackup = validBackup();
(remotePhotoBackup.catches[0] as any).photoUrl = 'https://example.invalid/tracker.gif';
assert.match(validateBackupPayloadLimits(remotePhotoBackup) || '', /niet-toegestane fotoverwijzing/);
const svgPhotoBackup = validBackup();
(svgPhotoBackup.catches[0] as any).photoUrl = 'data:image/svg+xml;base64,PHN2Zy8+';
assert.match(validateBackupPayloadLimits(svgPhotoBackup) || '', /niet-toegestane fotoverwijzing/);

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
