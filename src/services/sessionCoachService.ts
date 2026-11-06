import { db } from '../db/db';
import {
  CoachAdviceRecord,
  CoachAdviceTrigger,
  DayPrognosis,
  FishingLocation,
  FishingSession,
  PrognosisSnapshot,
  PrognosisInputContext,
} from '../types';
import { calculateDayPrognosis, createPrognosisInputFingerprint, getSessionDurationHours, savePrognosisSnapshot } from './prognosisEngine';
import { getForecast } from './weatherService';
import { getWaterTemperatureCalibration } from './evaluationEngine';
import { collectHistoricalWaterTemperatureObservations } from './waterTemperatureHistory';

export interface SessionCoachReassessmentResult {
  sessionId: string;
  status: 'skipped' | 'unchanged' | 'snapshot_created';
  snapshotId?: string;
  adviceId?: string;
  reason?: string;
}

const lastEvaluatedFingerprint = new Map<string, string>();
const sessionsBeingReassessed = new Set<string>();
const pendingWeatherChanges = new Map<string, { signature: string; confirmations: number }>();


function prognosisSignature(prognosis: DayPrognosis): Record<string, string | number | null> {
  return {
    advice: prognosis.advice,
    bestTimeSlot: prognosis.bestTimeSlot,
    recommendedZone: prognosis.positioningAdvice?.recommendedZone ?? null,
    bankWindRelation: prognosis.bankWindAnalysis?.relation ?? null,
    bankWindPosition: prognosis.bankWindAnalysis?.rodPlacementAdvice.primaryPosition ?? null,
    habitatZone: prognosis.habitatAnalysis?.primaryZone.name ?? null,
    prebaitSuitability: prognosis.prebaitPlan?.suitability ?? null,
  };
}

function changedSignatureFactors(
  previous: Record<string, string | number | null>,
  current: Record<string, string | number | null>
): string[] {
  return Object.keys(current).filter((key) => previous[key] !== current[key]);
}

function buildAdviceText(prognosis: DayPrognosis): { summary: string; recommendation: string; rationale: string } {
  const recommendation =
    prognosis.positioningAdvice?.recommendedZone ||
    prognosis.bankWindAnalysis?.rodPlacementAdvice.primaryPosition ||
    prognosis.habitatAnalysis?.primaryZone.name ||
    prognosis.prebaitPlan?.sessionDayGuidance.advice ||
    `Houd de huidige aanpak aan zolang de omstandigheden geen duidelijke reden geven om te wijzigen. ${prognosis.advice.toLowerCase()} omstandigheden.`;

  return {
    summary: prognosis.summaryRationale || 'De omstandigheden zijn opnieuw beoordeeld.',
    recommendation,
    rationale: [
      prognosis.summaryRationale,
      prognosis.positioningAdvice?.rationale,
      prognosis.bankWindAnalysis?.bankAssessment.explanation,
      prognosis.habitatAnalysis?.movementHypothesis.transitRoute,
    ].filter(Boolean).join(' '),
  };
}

function createAdviceRecord(
  session: FishingSession,
  snapshot: PrognosisSnapshot,
  prognosis: DayPrognosis,
  previousAdvice?: CoachAdviceRecord,
  trigger: CoachAdviceTrigger = 'weather_update',
  changedFactors: string[] = []
): CoachAdviceRecord {
  const text = buildAdviceText(prognosis);
  return {
    id: `coach-advice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionId: session.id,
    prognosisSnapshotId: snapshot.id,
    previousAdviceId: previousAdvice?.id,
    createdAt: new Date().toISOString(),
    trigger,
    summary: text.summary,
    recommendation: text.recommendation,
    rationale: text.rationale,
    changedFactors,
    confidence: prognosis.personalCatchConfidence,
    response: 'pending',
    coachVersion: 'viscoach-session-coordinator-v1',
    engineVersions: snapshot.engineVersions ? { ...snapshot.engineVersions } : { prognosis: snapshot.modelVersion },
  };
}

function isMaterialAdviceChange(
  previous: CoachAdviceRecord | undefined,
  prognosis: DayPrognosis
): boolean {
  if (!previous) return true;
  const next = buildAdviceText(prognosis);
  return previous.recommendation !== next.recommendation || previous.summary !== next.summary;
}

export const VISCOACH_UPDATED_EVENT = 'vislogboek:viscoach-updated';

function notifyVisCoachUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VISCOACH_UPDATED_EVENT));
  }
}

/** Bewaart het eerste coachadvies op basis van de volledige startsnapshot. */
export async function createInitialCoachAdviceRecord(
  session: FishingSession,
  snapshot: PrognosisSnapshot
): Promise<CoachAdviceRecord | null> {
  if (!snapshot.prognosisData || snapshot.linkedSessionId !== session.id) return null;
  const advice = await db.transaction('rw', db.coachAdviceRecords, async () => {
    const existing = await db.coachAdviceRecords.where('sessionId').equals(session.id).first();
    if (existing) return existing;
    const created = createAdviceRecord(session, snapshot, snapshot.prognosisData!, undefined, 'session_start', []);
    await db.coachAdviceRecords.put(created);
    return created;
  });
  notifyVisCoachUpdated();
  return advice;
}

/**
 * Herbeoordeelt actieve sessies met de bestaande weerbron en prognose-engine.
 * Deze service berekent zelf geen biologische score of tactische regels.
 */
export async function reassessActiveSessions(
  trigger: CoachAdviceTrigger = 'weather_update',
  sessionId?: string
): Promise<SessionCoachReassessmentResult[]> {
  const [sessions, locations, catches, snapshots, observations] = await Promise.all([
    db.sessions.toArray(),
    db.locations.toArray(),
    db.catches.toArray(),
    db.prognosisSnapshots.toArray(),
    db.presenceObservations.toArray(),
  ]);

  const activeSessions = sessions.filter((session) => session.outcome === 'active' && (!sessionId || session.id === sessionId));
  if (activeSessions.length === 0) return [];

  const locationById = new Map(locations.map((location) => [location.id, location]));
  const historicalWaterTemperatures = collectHistoricalWaterTemperatureObservations(sessions, snapshots, locations);
  const results: SessionCoachReassessmentResult[] = [];

  for (const session of activeSessions) {
    if (sessionsBeingReassessed.has(session.id)) {
      results.push({ sessionId: session.id, status: 'skipped', reason: 'Deze sessie wordt al herbeoordeeld.' });
      continue;
    }
    sessionsBeingReassessed.add(session.id);
    const location = session.locationId ? locationById.get(session.locationId) : undefined;
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      results.push({ sessionId: session.id, status: 'skipped', reason: 'Stek heeft geen bruikbare GPS-coördinaten.' });
      sessionsBeingReassessed.delete(session.id);
      continue;
    }

    try {
      const weather = await getForecast(location.latitude, location.longitude, false);
      if (!weather.hourly?.length) {
        results.push({ sessionId: session.id, status: 'skipped', reason: 'Geen actuele of gecachete weersverwachting beschikbaar.' });
        continue;
      }

      const now = new Date();
      const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(now);
      const species = session.targetSpecies?.[0] ?? 'Algemeen';
      const durationHours = getSessionDurationHours(session);
      const sessionObservations = observations.filter((item) => item.sessionId === session.id);
      const latestObservation = sessionObservations
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const waterTemperatureCalibration = getWaterTemperatureCalibration(snapshots, location.id, date);
      const prognosis = calculateDayPrognosis(
        date,
        weather.hourly,
        species,
        sessions,
        weather.fetchedAt,
        session.waterTemperature ?? null,
        now,
        {
          sessionDurationHours: durationHours ?? undefined,
          allowUnknownSessionDuration: true,
          locationId: location.id,
          location,
          catches,
          observations: sessionObservations,
          presenceObservation: latestObservation?.observationType ?? 'onbekend',
          historicalWaterTemperatures,
          waterTemperatureCalibration,
        }
      );

      const inputFingerprint = createPrognosisInputFingerprint({
        date,
        species,
        locationId: location.id,
        durationHours,
        startTime: session.startTime,
        technique: session.technique ?? null,
        waterTemperature: session.waterTemperature ?? null,
        locationContext: [location.waterType, location.waterDepth, location.waterFacingDirection, location.habitatFeatures],
        weather: weather.hourly,
        sessions: sessions.map((item) => [item.id, item.startTime, item.updatedAt, item.outcome, item.targetSpecies, item.durationMinutes, item.waterTemperature]),
        catches: catches.map((item) => [item.id, item.sessionId, item.timestamp, item.species, item.count]),
        observations: sessionObservations.map((item) => [item.id, item.timestamp, item.observationType]),
        historicalWaterTemperatures,
        waterTemperatureCalibration,
      });

      if (lastEvaluatedFingerprint.get(session.id) === inputFingerprint) {
        results.push({ sessionId: session.id, status: 'unchanged', reason: 'Dezelfde invoer is al beoordeeld.' });
        continue;
      }

      const linkedSnapshots = snapshots
        .filter((snapshot) => snapshot.linkedSessionId === session.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const previousSnapshot = linkedSnapshots[0] ??
        snapshots.find((snapshot) => snapshot.id === session.snapshotId);
      if (!previousSnapshot) {
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        results.push({ sessionId: session.id, status: 'skipped', reason: 'Geen oorspronkelijke sessieprognose om mee te vergelijken.' });
        continue;
      }

      if (!previousSnapshot.prognosisData) {
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        results.push({
          sessionId: session.id,
          status: 'skipped',
          reason: 'De oorspronkelijke snapshot bevat nog geen volledige prognose-uitvoer; een betrouwbare vergelijking is niet mogelijk.',
        });
        continue;
      }
      const previousSignature = prognosisSignature(previousSnapshot.prognosisData);
      const currentSignature = prognosisSignature(prognosis);
      const changedFactors = changedSignatureFactors(previousSignature, currentSignature);

      if (changedFactors.length === 0) {
        pendingWeatherChanges.delete(session.id);
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        results.push({ sessionId: session.id, status: 'unchanged', reason: 'Geen betekenisvolle verandering in prognose of praktische analyse.' });
        continue;
      }

      // Een weersupdate moet dezelfde praktische wijziging bij een volgende, afwijkende invoer bevestigen.
      // Gebruikerswaarnemingen, sessiewijzigingen, handmatige controles en app-hervatten worden direct verwerkt.
      if (trigger === 'weather_update') {
        const signatureKey = JSON.stringify(currentSignature);
        const candidate = pendingWeatherChanges.get(session.id);
        const confirmations = candidate?.signature === signatureKey ? candidate.confirmations + 1 : 1;
        pendingWeatherChanges.set(session.id, { signature: signatureKey, confirmations });
        lastEvaluatedFingerprint.set(session.id, inputFingerprint);
        if (confirmations < 2) {
          results.push({
            sessionId: session.id,
            status: 'unchanged',
            reason: 'Mogelijke wijziging wordt bij een volgende afwijkende weersupdate bevestigd om onnodig wisselend advies te voorkomen.',
          });
          continue;
        }
      }
      pendingWeatherChanges.delete(session.id);

      const inputContext: PrognosisInputContext = {
        calculatedAt: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
        targetDate: date,
        targetSpecies: species,
        sessionDurationHours: durationHours,
        technique: session.technique ?? null,
        location: {
          id: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          waterType: location.waterType,
          waterDepth: location.waterDepth,
          waterFacingDirection: location.waterFacingDirection,
          habitatFeatures: location.habitatFeatures,
        },
        historicalSessionIds: sessions.filter((item) => item.isBenchmark !== true).map((item) => item.id),
        catchRecordIds: catches.map((item) => item.id),
        observationIds: sessionObservations.map((item) => item.id),
        presenceObservation: latestObservation?.observationType ?? 'onbekend',
        historicalWaterTemperatureSamples: historicalWaterTemperatures,
        historyFingerprint: createPrognosisInputFingerprint({
          sessions: sessions.map((item) => [item.id, item.updatedAt, item.startTime, item.endTime, item.durationMinutes, item.plannedDurationHours, item.targetSpecies, item.outcome, item.waterTemperature, item.technique]),
          catches: catches.map((item) => [item.id, item.sessionId, item.timestamp, item.species, item.count, item.weightKg, item.lengthCm, item.bait, item.technique]),
          observations: sessionObservations.map((item) => [item.id, item.timestamp, item.observationType]),
          historicalWaterTemperatures,
        }),
        historySummary: {
          sessionCount: sessions.filter((item) => item.isBenchmark !== true).length,
          catchRecordCount: catches.length,
          observationCount: sessionObservations.length,
          historicalWaterTemperatureSampleCount: historicalWaterTemperatures.length,
        },
        weatherFetchedAt: weather.fetchedAt,
      };

      const snapshot = await db.transaction('rw', db.prognosisSnapshots, db.coachAdviceRecords, async () => {
        const saved = await savePrognosisSnapshot(
          prognosis,
          durationHours ?? 0,
          location.id,
          location.name,
          session.technique,
          prognosis.bestTimeSlot === 'Geen toekomstig tijdvak meer vandaag' || prognosis.bestTimeSlot === 'Geen betekenisvol onderscheid' ? undefined : prognosis.bestTimeSlot,
          session.weatherSnapshot,
          {
            runKind: 'session_update',
            weatherInput: weather.hourly,
            inputContext,
            inputFingerprint,
            supersedesSnapshotId: previousSnapshot.id,
          }
        );
        await db.prognosisSnapshots.update(saved.id, { linkedSessionId: session.id });
        return saved;
      });

      lastEvaluatedFingerprint.set(session.id, inputFingerprint);
      const previousAdvice = (await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      let adviceId: string | undefined;
      if (isMaterialAdviceChange(previousAdvice, prognosis)) {
        const advice = createAdviceRecord(session, snapshot, prognosis, previousAdvice, trigger, changedFactors);
        await db.coachAdviceRecords.put(advice);
        adviceId = advice.id;
        notifyVisCoachUpdated();
      }

      results.push({
        sessionId: session.id,
        status: 'snapshot_created',
        snapshotId: snapshot.id,
        adviceId,
        reason: adviceId ? 'Prognose en praktisch advies zijn betekenisvol gewijzigd.' : 'Prognose is betekenisvol gewijzigd; praktisch advies blijft gelijk.',
      });
    } catch (error) {
      results.push({
        sessionId: session.id,
        status: 'skipped',
        reason: error instanceof Error ? error.message : 'Onbekende fout bij herbeoordeling.',
      });
    } finally {
      sessionsBeingReassessed.delete(session.id);
    }
  }

  return results;
}
