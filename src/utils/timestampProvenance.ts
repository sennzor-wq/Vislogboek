import type { TimestampEntryMode } from '../types';

/** Resolve provenance without adding a user-facing step. Older records stay unclassified. */
export function resolveTimestampEntryMode(
  currentTimestamp: string,
  initialTimestamp: string,
  isNewRecord: boolean,
  existingMode?: TimestampEntryMode
): TimestampEntryMode | undefined {
  if (currentTimestamp !== initialTimestamp) return 'user_adjusted';
  return isNewRecord ? 'automatic' : existingMode;
}
