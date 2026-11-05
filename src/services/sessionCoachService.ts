import { db } from '../db/db';
import {
  CoachAdviceRecord,
  CoachAdviceTrigger,
  DayPrognosis,
  FishingLocation,
  FishingSession,
  PrognosisSnapshot,
} from '../types';
import { calculateDayPrognosis, getSessionDurationHours, savePrognosisSnapshot } from './prognosisEngine';
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

function fingerprint(value: unknown): string {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

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
    engineVersions: { prognosis: snapshot.modelVersion },
  };
}

function isMaterialAdviceChange(
  previous: CoachAdviceRecord | undefined,
  prognosis: DayPrognosis
): boolean {
  if (!previous) return true;
  const next = buildAdviceText(prognosis);
  return previous.recommendation !== next.recommendation;
}

/**
 * Herbeoordeelt actieve sessies met de bestaande weerbron en prognose-engine.
 * Deze service berekent zelf geen biologische score of tactische regels.
 */
export async function reassessActiveSessions(
  trigger: CoachAdviceTrigger = 'weather_update'
): Promise<SessionCoachReassessmentResult[]> {
  const [sessions, locations, catches, snapshots, observations] = await Promise.all([
    db.sessions.toArray(),
    db.locations.toArray(),
    db.catches.toArray(),
    db.prognosisSnapshots.toArray(),
    db.presenceObservations.toArray(),
  ]);

  const activeSessions = sessions.filter((session) => session.outcome === 'active');
  if (activeSessions.length === 0) return [];

  const locationById = new Map(locations.map((location) => [location.id, location]));
  const historicalWaterTemperatures = collectHistoricalWaterTemperatureObservations(sessions, snapshots, locations);
  const results: SessionCoachReassessmentResult[] = [];

  for (const session of activeSessions) {
    const location = session.locationId ? locationById.get(session.locationId) : undefined;
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      results.push({ sessionId: session.id, status: 'skipped', reason: 'Stek heeft geen bruikbare GPS-coördinaten.' });
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
      const sessionCatches = catches.filter((item) => item.sessionId === session.id);
      const sessionObservations = observations.filter((item) => item.sessionId === session.id);
      const latestObservation = sessionObservations
        .slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

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
          waterTemperatureCalibration: getWaterTemperatureCalibration(snapshots, location.id, date),
        }
      );

      const inputFingerprint = fingerprint({
        date,
        species,
        locationId: location.id,
        durationHours,
        technique: session.technique ?? null,
        waterTemperature: session.waterTemperature ?? null,
        weather: weather.hourly,
        catches: sessionCatches.map((item) => [item.id, item.timestamp, item.species, item.count]),
        observations: sessionObservations.map((item) => [item.id, item.timestamp, item.observationType]),
      });

      if (lastEvaluatedFingerprint.get(session.id) === inputFingerprint) {
        results.push({ sessionId: session.id, status: 'unchanged', reason: 'Dezelfde invoer is al beoordeeld.' });
        continue;
      }
      lastEvaluatedFingerprint.set(session.id, inputFingerprint);

      const linkedSnapshots = snapshots
        .filter((snapshot) => snapshot.linkedSessionId === session.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const previousSnapshot = linkedSnapshots[0] ??
        snapshots.find((snapshot) => snapshot.id === session.snapshotId);
      if (!previousSnapshot) {
        results.push({ sessionId: session.id, status: 'skipped', reason: 'Geen oorspronkelijke sessieprognose om mee te vergelijken.' });
        continue;
      }

      if (!previousSnapshot.prognosisData) {
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
        results.push({ sessionId: session.id, status: 'unchanged', reason: 'Geen betekenisvolle verandering in prognose of praktische analyse.' });
        continue;
      }

      const snapshot = await db.transaction('rw', db.prognosisSnapshots, db.coachAdviceRecords, async () => {
        const saved = await savePrognosisSnapshot(
          prognosis,
          durationHours ?? 0,
          location.id,
          location.name,
          session.technique,
          prognosis.bestTimeSlot === 'Geen toekomstig tijdvak meer vandaag' ? undefined : prognosis.bestTimeSlot,
          session.weatherSnapshot,
          {
            runKind: 'session_update',
            weatherInput: weather.hourly,
            inputFingerprint,
            supersedesSnapshotId: previousSnapshot.id,
          }
        );
        await db.prognosisSnapshots.update(saved.id, { linkedSessionId: session.id });
        return saved;
      });

      const previousAdvice = (await db.coachAdviceRecords.where('sessionId').equals(session.id).toArray())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      let adviceId: string | undefined;
      if (isMaterialAdviceChange(previousAdvice, prognosis)) {
        const advice = createAdviceRecord(session, snapshot, prognosis, previousAdvice, trigger, changedFactors);
        await db.coachAdviceRecords.put(advice);
        adviceId = advice.id;
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
    }
  }

  return results;
}
