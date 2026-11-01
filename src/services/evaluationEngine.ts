/**
 * Evaluatie & Validatie Engine voor Vislogboek v2.2
 * Berekent Brier Score (BS), Naieve Baseline, Brier Skill Score (BSS) en Kalibratie-bins
 * op basis van opgeslagen, onveranderlijke prognose-momentopnames (PrognosisSnapshots).
 */

import { PrognosisSnapshot, FishingSession } from '../types';
import { BENCHMARK_SESSION_ID, db } from '../db/db';

export interface CalibrationBin {
  rangeLabel: string;        // bijv. "0% – 20%"
  minProb: number;           // 0.0
  maxProb: number;           // 0.20
  snapshotCount: number;
  averageForecastProb: number | null; // % (bijv. 14.5%)
  observedCatchFraction: number | null; // % (bijv. 12.0%)
  calibrationDelta: number | null;     // % verschil
}

export interface EvaluationResult {
  totalSnapshots: number;
  evaluatedCount: number;    // Aantal met bekende uitkomst ('catch' of 'skunk_confirmed')
  pendingCount: number;      // Aantal nog zonder sessie of actieve sessie
  hasSufficientData: boolean;// True als evaluatedCount >= 5
  statusMessage: string;
  brierScore: number | null; // [0, 1] - lager is beter (0 = perfecte deterministische precisie)
  naiveBrierScore: number | null; // Baseline op basis van gemiddelde steekproeffrequentie
  brierSkillScore: number | null; // BSS: 1 - (BS / BS_naive). Positief betekent superieur aan naieve gok
  averageForecastProbability: number | null; // %
  observedCatchRate: number | null; // %
  calibrationBins: CalibrationBin[];
  disclaimers: string[];
}

/**
 * Berekent de Brier Score en kalibratietabel voor een set voorspellingsmomentopnames.
 * Sluit de benchmark uit van onafhankelijke modelvalidatie.
 */
export function evaluatePrognosisPerformance(
  snapshots: PrognosisSnapshot[]
): EvaluationResult {
  const totalSnapshots = snapshots.length;

  // Filter alleen snapshots met een gerealiseerde, definitieve uitkomst ('catch' of 'skunk_confirmed')
  // Sluit benchmarks en voorspellingen zonder numerieke vangstkans (bijv. N < 5) strikt uit
  const validEvaluated = snapshots.filter((s) => {
    if (s.predictedCatchChance === null || typeof s.predictedCatchChance !== 'number') return false;
    if ((s as any).isBenchmark === true) return false;
    return s.actualOutcome === 'catch' || s.actualOutcome === 'skunk_confirmed';
  });

  const evaluatedCount = validEvaluated.length;
  const pendingCount = totalSnapshots - evaluatedCount;

  const disclaimers: string[] = [
    'Momentopnames worden vóór aanvang van een sessie vastgelegd en zijn onveranderlijk (immutable).',
    'Voorwaartse validatie: voorspellingen zijn geregistreerd vóór sessie-aanvang, waardoor trainingsdata en testdata strikt gescheiden blijven.',
  ];

  if (evaluatedCount < 5) {
    disclaimers.push(
      `Er zijn momenteel slechts ${evaluatedCount} geëvalueerde momentopnames. Minimaal 5 gerealiseerde sessies zijn vereist om een statistisch verantwoorde Brier-score en kalibratie te berekenen.`
    );

    return {
      totalSnapshots,
      evaluatedCount,
      pendingCount,
      hasSufficientData: false,
      statusMessage: `Nog niet gevalideerd (onvoldoende onafhankelijke voorspellingen: ${evaluatedCount} van 5 minimaal benodigd).`,
      brierScore: null,
      naiveBrierScore: null,
      brierSkillScore: null,
      averageForecastProbability: null,
      observedCatchRate: null,
      calibrationBins: initializeEmptyBins(),
      disclaimers,
    };
  }

  // 1. Bereken paren (f_i, o_i)
  // f_i = voorspelde kans [0, 1]
  // o_i = werkelijke uitkomst (1 als catch, 0 als skunk_confirmed)
  let sumSquaredError = 0;
  let sumForecasts = 0;
  let sumObserved = 0;

  const pairs = validEvaluated.map((s) => {
    const f = Math.max(0, Math.min(1, (s.predictedCatchChance as number) / 100));
    const o = s.actualOutcome === 'catch' ? 1.0 : 0.0;
    sumSquaredError += Math.pow(f - o, 2);
    sumForecasts += f;
    sumObserved += o;
    return { f, o, snapshot: s };
  });

  const brierScore = sumSquaredError / evaluatedCount;
  const baseRate = sumObserved / evaluatedCount;

  // 2. Naieve Brier Score (voorspelt altijd de gemiddelde basiskans)
  let sumNaiveSquaredError = 0;
  for (const pair of pairs) {
    sumNaiveSquaredError += Math.pow(baseRate - pair.o, 2);
  }
  const naiveBrierScore = sumNaiveSquaredError / evaluatedCount;

  // 3. Brier Skill Score (BSS)
  // BSS = 1 - (BS / BS_naive)
  let brierSkillScore: number | null = null;
  if (naiveBrierScore > 0.0001) {
    brierSkillScore = Math.round((1 - brierScore / naiveBrierScore) * 1000) / 1000;
  } else {
    // Geen variantie in uitkomsten (bijv. alle 5 sessies waren vangsten of alle 5 waren nulsessies)
    brierSkillScore = 0.0;
    disclaimers.push(
      'Alle historische evaluatiesessies hadden dezelfde uitkomst; de naieve variantie is nul waardoor de BSS niet onderscheidend is.'
    );
  }

  // 4. Kalibratie-bins (5 kwartielen/segmenten)
  const bins = initializeEmptyBins();
  for (const pair of pairs) {
    const fPercent = pair.f * 100;
    const targetBin = bins.find((b) => fPercent >= b.minProb * 100 && (fPercent < b.maxProb * 100 || (b.maxProb === 1.0 && fPercent <= 100)));
    if (targetBin) {
      targetBin.snapshotCount++;
      if (targetBin.averageForecastProb === null) {
        targetBin.averageForecastProb = pair.f * 100;
        targetBin.observedCatchFraction = pair.o * 100;
      } else {
        targetBin.averageForecastProb += pair.f * 100;
        targetBin.observedCatchFraction = (targetBin.observedCatchFraction || 0) + pair.o * 100;
      }
    }
  }

  // Afronden van de bins
  for (const bin of bins) {
    if (bin.snapshotCount > 0 && bin.averageForecastProb !== null && bin.observedCatchFraction !== null) {
      bin.averageForecastProb = Math.round((bin.averageForecastProb / bin.snapshotCount) * 10) / 10;
      bin.observedCatchFraction = Math.round((bin.observedCatchFraction / bin.snapshotCount) * 10) / 10;
      bin.calibrationDelta = Math.round((bin.averageForecastProb - bin.observedCatchFraction) * 10) / 10;
    }
  }

  let statusMsg = '';
  if (brierScore < 0.15) {
    statusMsg = `Uitstekende calibratie (Brier-score: ${brierScore.toFixed(3)}). De voorspellingen volgen de werkelijkheid nauwkeurig.`;
  } else if (brierScore < 0.25) {
    statusMsg = `Redelijke modelprestatie (Brier-score: ${brierScore.toFixed(3)}). ${
      brierSkillScore !== null && brierSkillScore > 0
        ? `Model presteert beter dan een naieve gok (+${(brierSkillScore * 100).toFixed(1)}% BSS).`
        : 'Modelprestatie ligt dicht bij de algemene basisfrequentie.'
    }`;
  } else {
    statusMsg = `Matige kalibratie (Brier-score: ${brierScore.toFixed(3)}). Vangstkansen vertonen een afwijking ten opzichte van gerealiseerde sessies.`;
  }

  return {
    totalSnapshots,
    evaluatedCount,
    pendingCount,
    hasSufficientData: true,
    statusMessage: statusMsg,
    brierScore: Math.round(brierScore * 1000) / 1000,
    naiveBrierScore: Math.round(naiveBrierScore * 1000) / 1000,
    brierSkillScore,
    averageForecastProbability: Math.round((sumForecasts / evaluatedCount) * 1000) / 10,
    observedCatchRate: Math.round((sumObserved / evaluatedCount) * 1000) / 10,
    calibrationBins: bins,
    disclaimers,
  };
}

export interface WaterTemperatureEvaluationResult {
  totalSnapshots: number;
  evaluatedCount: number;
  pendingCount: number;
  hasSufficientData: boolean;
  meanAbsoluteErrorC: number | null;
  rootMeanSquaredErrorC: number | null;
  meanBiasC: number | null; // positief = model voorspelt gemiddeld te warm
}

export interface WaterTemperatureCalibration {
  appliedCorrectionC: number; // wordt van de voorspelling afgetrokken
  sampleCount: number;
  season: 'winter' | 'lente' | 'zomer' | 'herfst';
}

function getSeasonForDate(date: string): WaterTemperatureCalibration['season'] {
  const month = new Date(`${date}T12:00:00`).getMonth() + 1;
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'lente';
  if (month <= 8) return 'zomer';
  return 'herfst';
}

function getAmsterdamDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// PrognoseView berekent meerdere doeldagen met dezelfde snapshot-array. Valide
// temperatuurparen zijn voor die hele berekeningsronde identiek en worden hergebruikt.
const validTemperaturePairsCache = new WeakMap<PrognosisSnapshot[], PrognosisSnapshot[]>();

function validTemperaturePairs(snapshots: PrognosisSnapshot[]): PrognosisSnapshot[] {
  const cached = validTemperaturePairsCache.get(snapshots);
  if (cached) return cached;

  const valid = snapshots.filter((snapshot) => {
    const predicted = snapshot.predictedWaterTemperature;
    const actual = snapshot.actualWaterTemperature;
    if (typeof predicted !== 'number' || !Number.isFinite(predicted) || predicted < 0 || predicted > 35) return false;
    if (typeof actual !== 'number' || !Number.isFinite(actual) || actual < 0 || actual > 35) return false;
    if (!snapshot.locationId || !snapshot.linkedSessionId || !snapshot.actualWaterTemperatureTimestamp) return false;
    const forecastMs = new Date(snapshot.forecastTimestamp).getTime();
    const measuredMs = new Date(snapshot.actualWaterTemperatureTimestamp).getTime();
    if (!Number.isFinite(forecastMs) || !Number.isFinite(measuredMs) || forecastMs >= measuredMs || measuredMs > Date.now()) return false;
    // Alleen vergelijken wanneer de voorspelling voor dezelfde lokale sessiedag gold.
    if (snapshot.targetDate !== getAmsterdamDate(snapshot.actualWaterTemperatureTimestamp)) return false;
    return true;
  });
  validTemperaturePairsCache.set(snapshots, valid);
  return valid;
}

/** Temperatuurvoorspellingen worden soortneutraal getoetst; MAE/RMSE/Bias zijn geen Brier-score. */
export function evaluateWaterTemperaturePerformance(
  snapshots: PrognosisSnapshot[]
): WaterTemperatureEvaluationResult {
  const valid = validTemperaturePairs(snapshots);
  const errors = valid.map((snapshot) => (snapshot.predictedWaterTemperature as number) - (snapshot.actualWaterTemperature as number));
  const count = errors.length;
  if (!count) {
    return { totalSnapshots: snapshots.length, evaluatedCount: 0, pendingCount: snapshots.length, hasSufficientData: false, meanAbsoluteErrorC: null, rootMeanSquaredErrorC: null, meanBiasC: null };
  }
  const mae = errors.reduce((sum, error) => sum + Math.abs(error), 0) / count;
  const rmse = Math.sqrt(errors.reduce((sum, error) => sum + error * error, 0) / count);
  const bias = errors.reduce((sum, error) => sum + error, 0) / count;
  return {
    totalSnapshots: snapshots.length,
    evaluatedCount: count,
    pendingCount: snapshots.length - count,
    hasSufficientData: count >= 5,
    meanAbsoluteErrorC: Math.round(mae * 100) / 100,
    rootMeanSquaredErrorC: Math.round(rmse * 100) / 100,
    meanBiasC: Math.round(bias * 100) / 100,
  };
}

/**
 * Conservatieve lokale biascorrectie. Vereist minimaal 8 onafhankelijke metingen
 * op dezelfde stek én in hetzelfde seizoen. Geen soortfilter: waterthermiek is omgevingsdata.
 * Shrinkage voorkomt dat kleine steekproeven het model hard verschuiven.
 */
export function getWaterTemperatureCalibration(
  snapshots: PrognosisSnapshot[],
  locationId: string | undefined,
  targetDate: string
): WaterTemperatureCalibration | undefined {
  if (!locationId) return undefined;
  const season = getSeasonForDate(targetDate);
  const valid = validTemperaturePairs(snapshots).filter((snapshot) =>
    snapshot.locationId === locationId && getSeasonForDate(snapshot.targetDate) === season
  );
  if (valid.length < 8) return undefined;

  const meanBias = valid.reduce(
    (sum, snapshot) => sum + (snapshot.predictedWaterTemperature as number) - (snapshot.actualWaterTemperature as number),
    0
  ) / valid.length;
  const shrinkage = valid.length / (valid.length + 8);
  const appliedCorrectionC = Math.max(-1.5, Math.min(1.5, meanBias * shrinkage));
  if (Math.abs(appliedCorrectionC) < 0.05) return undefined;
  return { appliedCorrectionC: Math.round(appliedCorrectionC * 100) / 100, sampleCount: valid.length, season };
}

function initializeEmptyBins(): CalibrationBin[] {
  return [
    { rangeLabel: '0% – 20%', minProb: 0.0, maxProb: 0.2, snapshotCount: 0, averageForecastProb: null, observedCatchFraction: null, calibrationDelta: null },
    { rangeLabel: '20% – 40%', minProb: 0.2, maxProb: 0.4, snapshotCount: 0, averageForecastProb: null, observedCatchFraction: null, calibrationDelta: null },
    { rangeLabel: '40% – 60%', minProb: 0.4, maxProb: 0.6, snapshotCount: 0, averageForecastProb: null, observedCatchFraction: null, calibrationDelta: null },
    { rangeLabel: '60% – 80%', minProb: 0.6, maxProb: 0.8, snapshotCount: 0, averageForecastProb: null, observedCatchFraction: null, calibrationDelta: null },
    { rangeLabel: '80% – 100%', minProb: 0.8, maxProb: 1.0, snapshotCount: 0, averageForecastProb: null, observedCatchFraction: null, calibrationDelta: null },
  ];
}

/**
 * Koppelt een gerealiseerde sessie aan een eerdere voorspellingsmomentopname en slaat de uitkomst op.
 */
export async function linkSessionOutcomeToSnapshot(
  snapshotId: string,
  session: FishingSession,
  targetCatchesCount: number
): Promise<void> {
  const snapshot = await db.prognosisSnapshots.get(snapshotId);
  if (!snapshot) return;

  await db.prognosisSnapshots.update(snapshotId, {
    linkedSessionId: session.id,
    actualOutcome: session.outcome,
    actualTargetCatchesCount: targetCatchesCount,
    evaluationNotes: `Gekoppeld aan sessie ${session.id} (${session.outcome === 'catch' ? `${targetCatchesCount} doelvis(sen) gevangen` : 'bevestigde nulvangst'}).`,
  });
}

/**
 * Synchroniseert automatisch de definitieve uitkomst van een voltooide vissessie naar haar gekoppelde momentopname.
 * Wordt uitsluitend uitgevoerd wanneer session.snapshotId expliciet aanwezig is.
 * Sluit actieve, onbekende en benchmark sessies uit van evaluatie.
 * Voorkomt dubbele evaluaties bij meervoudig opslaan of wijzigen.
 */
export async function autoSyncSessionOutcomeToSnapshot(
  session: FishingSession
): Promise<boolean> {
  if (!session.snapshotId) {
    return false;
  }

  // Sluit benchmarks uit van onafhankelijke modelvalidatie
  if (session.isBenchmark) {
    return false;
  }

  const snapshot = await db.prognosisSnapshots.get(session.snapshotId);
  if (!snapshot) return false;

  // Temperatuurvalidatie staat los van de vangstuitkomst. Een afgeronde sessie met
  // een geldige meting kan dus thermische feedback leveren, ook als de vangststatus onbekend is.
  let temperatureLinked = false;
  const measuredTemp = session.waterTemperature;
  if (
    session.endTime &&
    typeof measuredTemp === 'number' &&
    Number.isFinite(measuredTemp) &&
    measuredTemp >= 0 &&
    measuredTemp <= 35 &&
    typeof snapshot.predictedWaterTemperature === 'number' &&
    snapshot.targetDate === getAmsterdamDate(session.startTime) &&
    new Date(snapshot.forecastTimestamp).getTime() < new Date(session.startTime).getTime()
  ) {
    await db.prognosisSnapshots.update(session.snapshotId, {
      linkedSessionId: session.id,
      actualWaterTemperature: measuredTemp,
      // Het sessiemodel heeft nog geen afzonderlijk meettijdstip; starttijd is de expliciete benadering.
      actualWaterTemperatureTimestamp: session.startTime,
    });
    temperatureLinked = true;
  }

  // Alleen definitief bekende vangstuitkomsten komen in aanmerking voor Brier-evaluatie.
  if (session.outcome !== 'catch' && session.outcome !== 'skunk_confirmed') {
    return temperatureLinked;
  }

  let targetCatchesCount = 0;
  if (session.outcome === 'catch') {
    const sessionCatches = await db.catches.where('sessionId').equals(session.id).toArray();
    const relevantCatches = sessionCatches.filter(
      (c) => snapshot.targetSpecies === 'Algemeen' || c.species === snapshot.targetSpecies
    );
    const counted = relevantCatches.reduce((sum, c) => sum + (c.count || 1), 0);
    // Indien sessie 'catch' is maar er zijn geen specifieke vangsten geregistreerd, reken minimaal 1
    targetCatchesCount = counted > 0 ? counted : 1;
  }

  await db.prognosisSnapshots.update(session.snapshotId, {
    linkedSessionId: session.id,
    actualOutcome: session.outcome,
    actualTargetCatchesCount: targetCatchesCount,
    evaluationNotes: `Automatisch gekoppeld aan sessie ${session.id} (${
      session.outcome === 'catch'
        ? `${targetCatchesCount} doelvis(sen) geregistreerd`
        : 'bevestigde nulvangst'
    }). Bijgewerkt op ${new Date().toISOString()}.`,
  });

  return true;
}
