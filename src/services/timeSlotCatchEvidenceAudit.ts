import { CatchItem, FishSpecies, FishingSession, SessionRod, TimeSlot, TimeSlotExposureSummary } from '../types';
import { getAmsterdamHour } from '../utils/dateTime';
import { calculateTimeSlotRodExposure } from './timeSlotExposureEngine';

export type TimeSlotCatchEvidenceStatus =
  | 'not_evaluable'
  | 'not_species_attributable'
  | 'outcome_conflict'
  | 'no_recorded_exposure'
  | 'confirmed_zero_for_recorded_exposure'
  | 'user_reported_positive'
  | 'user_reported_positive_without_recorded_exposure'
  | 'unknown';

export interface TimeSlotCatchEvidenceSlice {
  recordedRodHours: number;
  activeRodCount: number;
  userReportedCatchRecordCount: number;
  userReportedFishCount: number;
  groupedCatchRecordCount: number;
  status: TimeSlotCatchEvidenceStatus;
}

export interface TimeSlotCatchEvidenceAudit {
  eligibleForDescriptiveAudit: boolean;
  exclusionReason:
    | 'benchmark_session'
    | 'session_not_completed'
    | 'invalid_session_window'
    | 'missing_target_species'
    | 'multiple_target_species'
    | 'outcome_conflict'
    | null;
  targetSpecies: FishSpecies | null;
  slots: Record<TimeSlot, TimeSlotCatchEvidenceSlice>;
  exposure: TimeSlotExposureSummary;
  expectedRodCount: number | null;
  rodDetailRecordCount: number;
  rodsWithoutDetailRecordsCount: number | null;
  timestampQuality: {
    targetCatchRecordCount: number;
    nonTargetCatchRecordCount: number;
    unknownSpeciesCatchRecordCount: number;
    automaticRegistrationTimestampCount: number;
    userAdjustedTimestampCount: number;
    userAdjustedTimestampOutsideSessionCount: number;
    unclassifiedTimestampCount: number;
    legacyUnknownTimestampCount: number;
    invalidTimestampCount: number;
    groupedTargetCatchRecordCount: number;
  };
}

const SLOT_ORDER: TimeSlot[] = ['Nacht', 'Ochtend', 'Middag', 'Avond'];

function slotAtTimestamp(value: string): TimeSlot | null {
  const hour = getAmsterdamHour(value);
  if (hour === null) return null;
  if (hour < 6) return 'Nacht';
  if (hour < 12) return 'Ochtend';
  if (hour < 18) return 'Middag';
  return 'Avond';
}

function createSlots(exposure: TimeSlotExposureSummary): Record<TimeSlot, TimeSlotCatchEvidenceSlice> {
  return Object.fromEntries(SLOT_ORDER.map((slot) => [slot, {
    recordedRodHours: exposure.slots[slot].rodHours,
    activeRodCount: exposure.slots[slot].activeRodCount,
    userReportedCatchRecordCount: 0,
    userReportedFishCount: 0,
    groupedCatchRecordCount: 0,
    status: 'not_evaluable' as TimeSlotCatchEvidenceStatus,
  }])) as Record<TimeSlot, TimeSlotCatchEvidenceSlice>;
}

/**
 * Classifies only descriptive time-slot evidence for one completed, single-target
 * session. Automatic form-open times and legacy/unclassified timestamps are
 * never treated as catch times. No missing slot is converted to a zero outcome.
 */
export function auditTimeSlotCatchEvidence(
  session: FishingSession,
  catches: CatchItem[],
  rods: SessionRod[],
  asOf: Date = new Date()
): TimeSlotCatchEvidenceAudit {
  const exposure = calculateTimeSlotRodExposure(rods, session.startTime, session.endTime, asOf);
  const slots = createSlots(exposure);
  const linkedCatches = catches.filter((item) => item.sessionId === session.id);
  const targetSpeciesList = [...new Set(session.targetSpecies ?? [])];
  const targetSpecies = targetSpeciesList.length === 1 ? targetSpeciesList[0] : null;
  const expectedRodCount = Number.isInteger(session.rodCount) && (session.rodCount ?? 0) > 0
    ? session.rodCount as number
    : null;
  const timestampQuality: TimeSlotCatchEvidenceAudit['timestampQuality'] = {
    targetCatchRecordCount: 0,
    nonTargetCatchRecordCount: 0,
    unknownSpeciesCatchRecordCount: 0,
    automaticRegistrationTimestampCount: 0,
    userAdjustedTimestampCount: 0,
    userAdjustedTimestampOutsideSessionCount: 0,
    unclassifiedTimestampCount: 0,
    legacyUnknownTimestampCount: 0,
    invalidTimestampCount: 0,
    groupedTargetCatchRecordCount: 0,
  };

  const result = (
    exclusionReason: TimeSlotCatchEvidenceAudit['exclusionReason'],
    eligible: boolean
  ): TimeSlotCatchEvidenceAudit => ({
    eligibleForDescriptiveAudit: eligible,
    exclusionReason,
    targetSpecies,
    slots,
    exposure,
    expectedRodCount,
    rodDetailRecordCount: rods.length,
    rodsWithoutDetailRecordsCount: expectedRodCount === null ? null : Math.max(0, expectedRodCount - rods.length),
    timestampQuality,
  });

  if (session.isBenchmark) {
    for (const slot of SLOT_ORDER) slots[slot].status = 'not_evaluable';
    return result('benchmark_session', false);
  }
  if (session.outcome !== 'catch' && session.outcome !== 'skunk_confirmed') {
    return result('session_not_completed', false);
  }
  const start = Date.parse(session.startTime);
  const end = session.endTime ? Date.parse(session.endTime) : Number.NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start ||
      session.legacyImportQuality?.startTimeKnown === false ||
      session.legacyImportQuality?.endTimeKnown === false) {
    return result('invalid_session_window', false);
  }
  if (targetSpeciesList.length === 0) {
    for (const slot of SLOT_ORDER) slots[slot].status = 'not_species_attributable';
    return result('missing_target_species', false);
  }
  if (targetSpeciesList.length !== 1) {
    for (const slot of SLOT_ORDER) slots[slot].status = 'not_species_attributable';
    return result('multiple_target_species', false);
  }

  // A confirmed blank cannot coexist with linked catch records.
  if (session.outcome === 'skunk_confirmed' && linkedCatches.length > 0) {
    for (const slot of SLOT_ORDER) slots[slot].status = 'outcome_conflict';
    return result('outcome_conflict', false);
  }

  if (session.outcome === 'skunk_confirmed') {
    for (const slot of SLOT_ORDER) {
      slots[slot].status = slots[slot].recordedRodHours > 0
        ? 'confirmed_zero_for_recorded_exposure'
        : 'no_recorded_exposure';
    }
    return result(null, true);
  }

  const targetCatches: CatchItem[] = [];
  for (const item of linkedCatches) {
    if (item.legacyImportQuality?.speciesKnown === false) {
      timestampQuality.unknownSpeciesCatchRecordCount++;
    } else if (item.species === targetSpecies) {
      targetCatches.push(item);
    } else {
      timestampQuality.nonTargetCatchRecordCount++;
    }
  }
  timestampQuality.targetCatchRecordCount = targetCatches.length;
  timestampQuality.groupedTargetCatchRecordCount = targetCatches.filter((item) => item.count > 1).length;

  for (const item of targetCatches) {
    if (item.legacyImportQuality?.timestampKnown === false) {
      timestampQuality.legacyUnknownTimestampCount++;
      continue;
    }
    const timestampMs = Date.parse(item.timestamp);
    if (!Number.isFinite(timestampMs)) {
      timestampQuality.invalidTimestampCount++;
      continue;
    }
    if (item.timestampEntryMode === 'automatic') {
      timestampQuality.automaticRegistrationTimestampCount++;
      continue;
    }
    if (item.timestampEntryMode !== 'user_adjusted') {
      timestampQuality.unclassifiedTimestampCount++;
      continue;
    }
    if (timestampMs < start || timestampMs >= end) {
      timestampQuality.userAdjustedTimestampOutsideSessionCount++;
      continue;
    }
    const slot = slotAtTimestamp(item.timestamp);
    if (!slot) {
      timestampQuality.invalidTimestampCount++;
      continue;
    }
    timestampQuality.userAdjustedTimestampCount++;
    slots[slot].userReportedCatchRecordCount++;
    slots[slot].userReportedFishCount += Number.isFinite(item.count) && item.count > 0 ? item.count : 0;
    if (item.count > 1) slots[slot].groupedCatchRecordCount++;
  }

  for (const slot of SLOT_ORDER) {
    const slice = slots[slot];
    if (slice.userReportedCatchRecordCount > 0) {
      slice.status = slice.recordedRodHours > 0
        ? 'user_reported_positive'
        : 'user_reported_positive_without_recorded_exposure';
    } else {
      // Absence of a time-stamped catch in a catch session is not a zero label.
      slice.status = slice.recordedRodHours > 0 ? 'unknown' : 'no_recorded_exposure';
    }
  }

  return result(null, true);
}
