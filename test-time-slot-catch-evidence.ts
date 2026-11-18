import { CatchItem, FishingSession, SessionRod } from './src/types';
import { auditTimeSlotCatchEvidence } from './src/services/timeSlotCatchEvidenceAudit';

process.env.TZ = 'Europe/Amsterdam';
let passed = 0;
let failed = 0;
function assert(value: boolean, label: string) {
  if (value) { passed++; console.log('[PASS] ' + label); }
  else { failed++; console.error('[FAIL] ' + label); }
}
const start = '2026-11-02T08:00:00.000Z';
const end = '2026-11-02T12:00:00.000Z';
function session(overrides: Partial<FishingSession> = {}): FishingSession {
  return { id: 's1', startTime: start, endTime: end, outcome: 'catch',
    targetSpecies: ['Karper'], rodCount: 1, createdAt: start, updatedAt: end, ...overrides };
}
function rod(intervals: SessionRod['activeIntervals']): SessionRod {
  return { id: 'r1', sessionId: 's1', rodNumber: 1, activeIntervals: intervals,
    createdAt: start, updatedAt: end };
}
function catchItem(overrides: Partial<CatchItem> = {}): CatchItem {
  return { id: 'c1', sessionId: 's1', species: 'Karper', count: 1,
    timestamp: '2026-11-02T10:30:00.000Z', timestampEntryMode: 'user_adjusted',
    createdAt: '2026-11-02T10:31:00.000Z', ...overrides };
}
const active = [ { id: 'i1', startTime: start, endTime: end } ];

const blank = auditTimeSlotCatchEvidence(
  session({ outcome: 'skunk_confirmed' }), [], [rod(active)]);
assert(blank.eligibleForDescriptiveAudit &&
  blank.slots.Ochtend.status === 'confirmed_zero_for_recorded_exposure' &&
  blank.slots.Middag.status === 'confirmed_zero_for_recorded_exposure',
  'Expliciet bevestigde nulvangst levert nul-labels op uitsluitend waar geregistreerde blootstelling bestaat');

const positive = auditTimeSlotCatchEvidence(
  session(), [catchItem()], [rod(active)]);
assert(positive.slots.Ochtend.status === 'user_reported_positive' &&
  positive.slots.Middag.status === 'unknown',
  'Aangepaste vangsttijd geeft positief gebruikerssignaal in dat tijdvak; andere tijdvakken blijven onbekend');

const automatic = auditTimeSlotCatchEvidence(
  session(), [catchItem({ timestampEntryMode: 'automatic' })], [rod(active)]);
assert(automatic.timestampQuality.automaticRegistrationTimestampCount === 1 &&
  automatic.slots.Ochtend.status === 'unknown' && automatic.slots.Middag.status === 'unknown',
  'Automatische formulier-open-tijd wordt niet als werkelijk vangstmoment gebruikt');

const legacy = auditTimeSlotCatchEvidence(
  session(), [catchItem({ timestampEntryMode: undefined })], [rod(active)]);
assert(legacy.timestampQuality.unclassifiedTimestampCount === 1 &&
  legacy.slots.Ochtend.status === 'unknown',
  'Oude vangsttijd zonder herkomst blijft ongeclassificeerd en levert geen tijdvaklabel');

const bycatch = auditTimeSlotCatchEvidence(
  session(), [catchItem({ species: 'Brasem' })], [rod(active)]);
assert(bycatch.timestampQuality.nonTargetCatchRecordCount === 1 &&
  bycatch.slots.Ochtend.status === 'unknown',
  'Bijvangst van een andere soort wordt niet als doelsoortvangst aangemerkt en niet als nul gezien');

const multiTarget = auditTimeSlotCatchEvidence(
  session({ targetSpecies: ['Karper', 'Brasem'] }), [catchItem()], [rod(active)]);
assert(!multiTarget.eligibleForDescriptiveAudit &&
  multiTarget.exclusionReason === 'multiple_target_species' &&
  multiTarget.slots.Ochtend.status === 'not_species_attributable',
  'Meersoortige sessies worden uitgesloten van soortspecifieke tijdvaklabels');

const outside = auditTimeSlotCatchEvidence(
  session(), [catchItem({ timestamp: '2026-11-02T12:00:00.000Z' })], [rod(active)]);
assert(outside.timestampQuality.userAdjustedTimestampOutsideSessionCount === 1 &&
  outside.slots.Ochtend.status === 'unknown',
  'Aangepaste vangsttijd exact op sessie-einde valt buiten het sessievenster en wordt niet ingedeeld');

const group = auditTimeSlotCatchEvidence(
  session(), [catchItem({ count: 3 })], [rod(active)]);
assert(group.slots.Ochtend.userReportedCatchRecordCount === 1 &&
  group.slots.Ochtend.userReportedFishCount === 3 &&
  group.slots.Ochtend.groupedCatchRecordCount === 1,
  'Groepsvangst blijft één gebruikersgerapporteerd tijdstip met apart herkenbaar groepsaantal');

const conflict = auditTimeSlotCatchEvidence(
  session({ outcome: 'skunk_confirmed' }), [catchItem()], [rod(active)]);
assert(!conflict.eligibleForDescriptiveAudit && conflict.exclusionReason === 'outcome_conflict' &&
  conflict.slots.Ochtend.status === 'outcome_conflict',
  'Bevestigde nulvangst met gekoppelde vangstregistratie wordt als tegenstrijdig uitgesloten');

const unknown = auditTimeSlotCatchEvidence(
  session({ outcome: 'unknown' }), [], [rod(active)]);
assert(!unknown.eligibleForDescriptiveAudit && unknown.exclusionReason === 'session_not_completed',
  'Onbevestigde sessie-uitkomst levert geen tijdvaklabels op');

console.log(`Time-slot catch evidence audit tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
