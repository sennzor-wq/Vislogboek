import React, { useState, useEffect } from 'react';
import {
  FishingSession,
  CatchItem,
  FishingLocation,
  FishSpecies,
  ALL_SPECIES,
  SessionOutcome,
  PrognosisSnapshot,
} from '../../types';
import { calculateStats, StatsFilter } from '../../services/statsEngine';
import { evaluatePrognosisPerformance, evaluateWaterTemperaturePerformance, EvaluationResult, WaterTemperatureEvaluationResult } from '../../services/evaluationEngine';
import { db, deletePrognosisSnapshotSafely } from '../../db/db';
import {
  BarChart3,
  Fish,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  Sparkles,
  Info,
  ShieldCheck,
  Award,
  BookmarkPlus,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface StatsViewProps {
  sessions: FishingSession[];
  catches: CatchItem[];
  locations: FishingLocation[];
  onRefreshData?: () => Promise<void>;
}

export const StatsView: React.FC<StatsViewProps> = ({
  sessions,
  catches,
  locations,
  onRefreshData,
}) => {
  const [filter, setFilter] = useState<StatsFilter>({
    species: 'Alle',
    locationId: undefined,
    outcome: 'Alle',
  });

  const [snapshots, setSnapshots] = useState<PrognosisSnapshot[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [waterTemperatureEvaluation, setWaterTemperatureEvaluation] = useState<WaterTemperatureEvaluationResult | null>(null);
  const [snapshotToDelete, setSnapshotToDelete] = useState<PrognosisSnapshot | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const reloadSnapshots = async () => {
    try {
      const list = await db.prognosisSnapshots.toArray();
      setSnapshots(list);
      const evalRes = evaluatePrognosisPerformance(list);
      setEvaluation(evalRes);
      setWaterTemperatureEvaluation(evaluateWaterTemperaturePerformance(list));
    } catch (e) {
      console.error('Fout bij herladen prognose momentopnames:', e);
    }
  };

  useEffect(() => {
    reloadSnapshots();
  }, [sessions]);

  const handleRequestDeleteSnapshot = (snap: PrognosisSnapshot) => {
    if ((snap as any).isBenchmark) {
      setDeleteError('Deze momentopname is een beschermde benchmark en kan niet worden verwijderd.');
      return;
    }
    setSnapshotToDelete(snap);
    setDeleteError(null);
  };

  const handleConfirmDeleteSnapshot = async () => {
    if (!snapshotToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePrognosisSnapshotSafely(snapshotToDelete.id);
      setSnapshotToDelete(null);
      await reloadSnapshots();
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Kon momentopname niet verwijderen.');
    } finally {
      setIsDeleting(false);
    }
  };

  const { overall, speciesStats, locationStats, timeSlotStats } = calculateStats(
    sessions,
    catches,
    filter
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Statistieken & Vangstanalyses
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Objectieve analyse van jouw eigen vissessies, technieken en viswateren.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Statistieken Filteren</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Vissoort</label>
            <select
              value={filter.species || 'Alle'}
              onChange={(e) => setFilter({ ...filter, species: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="Alle">Alle vissoorten</option>
              {ALL_SPECIES.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Locatie</label>
            <select
              value={filter.locationId || ''}
              onChange={(e) =>
                setFilter({ ...filter, locationId: e.target.value ? e.target.value : undefined })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="">Alle locaties</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Uitkomst</label>
            <select
              value={filter.outcome || 'Alle'}
              onChange={(e) => setFilter({ ...filter, outcome: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="Alle">Alle uitkomsten</option>
              <option value="catch">Alleen met vangst</option>
              <option value="skunk_confirmed">Alleen bevestigde nulvangsten</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Kaarten Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Totaal Sessies
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white">{overall.totalSessions}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            ({overall.completedSessions} afgerond, {overall.activeSessions} actief)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Gevangen Vissen
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400">
            {overall.totalFishCaught}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {overall.catchesPerHour.toFixed(2)} vis per uur
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Vangstpercentage
          </span>
          <span className="text-2xl sm:text-3xl font-black text-cyan-300">
            {overall.successRatePercent !== null ? `${overall.successRatePercent}%` : 'N.v.t.'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {overall.catchSessions} van {overall.catchSessions + overall.confirmedSkunks} geldige sessies
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Totale Visduur
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white">
            {(overall.totalDurationMinutes / 60).toFixed(1)} u
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Gem. {overall.averageDurationMinutes} min per sessie
          </span>
        </div>
      </div>

      {/* Uitkomsten Vergelijking */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-800/70 border border-slate-700/70 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Sessie-uitkomsten Vergelijking
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">Sessies met Vangst</span>
            </div>
            <span className="text-base font-black text-white">{overall.catchSessions}</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300">
              <XCircle className="w-4 h-4 text-amber-400" />
              <span className="font-bold">Bevestigde Nulvangsten</span>
            </div>
            <span className="text-base font-black text-white">{overall.confirmedSkunks}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="font-bold">Onbekende Uitkomsten</span>
            </div>
            <span className="text-base font-black text-white">{overall.unknownOutcomes}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          * Actieve en onbekende sessies zijn expliciet uitgesloten van vangstpercentages om schijnnauwkeurigheid te voorkomen.
        </p>
      </div>

      {/* SOORTNEUTRALE WATERTEMPERATUURVALIDATIE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-700/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-emerald-400" />
              Watertemperatuur — modeltoetsing
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Soortneutrale vergelijking van vooraf voorspelde en later gemeten watertemperatuur.
            </p>
          </div>
          <span className="text-xs text-slate-400">{waterTemperatureEvaluation?.evaluatedCount ?? 0} meting(en)</span>
        </div>
        {waterTemperatureEvaluation && waterTemperatureEvaluation.evaluatedCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase font-bold">MAE</span>
              <div className="text-2xl font-black text-white">{waterTemperatureEvaluation.meanAbsoluteErrorC?.toFixed(2)} °C</div>
              <span className="text-[11px] text-slate-500">Gemiddelde absolute afwijking</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase font-bold">RMSE</span>
              <div className="text-2xl font-black text-white">{waterTemperatureEvaluation.rootMeanSquaredErrorC?.toFixed(2)} °C</div>
              <span className="text-[11px] text-slate-500">Straft grotere fouten zwaarder</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/50">
              <span className="text-[11px] text-slate-400 uppercase font-bold">Gemiddelde bias</span>
              <div className="text-2xl font-black text-white">{waterTemperatureEvaluation.meanBiasC! > 0 ? '+' : ''}{waterTemperatureEvaluation.meanBiasC?.toFixed(2)} °C</div>
              <span className="text-[11px] text-slate-500">Positief = model schat te warm</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300">
            Nog geen vergelijkbare voorspelling en echte meting gekoppeld. Start een sessie vanuit een vooraf opgeslagen prognose en registreer de watertemperatuur.
          </p>
        )}
        <p className="text-[11px] text-slate-500">
          Kalibratie wordt pas toegepast na minimaal 8 geldige metingen op dezelfde stek en in hetzelfde seizoen. Dit is geen Brier-score en geldt voor alle vissoorten.
        </p>
      </div>

      {/* MODELVALIDATIE & BRIER-SCORE EVALUATIE (SECTIE 7 V2.2) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-850 via-slate-900 to-slate-950 border border-slate-700/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Modelvalidatie & Empirische Brier-score (v2.2)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Toetst of voorspelde vangstkansen daadwerkelijk overeenkomen met gerealiseerde sessies.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 self-start sm:self-center">
            {snapshots.length} momentopname(s) geregistreerd
          </span>
        </div>

        {evaluation && (
          <div className="space-y-4">
            {/* Status & Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Brier Score */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Brier-score (BS)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {evaluation.brierScore !== null ? evaluation.brierScore.toFixed(3) : 'Geen data'}
                  </span>
                  <span className="text-xs text-slate-400">(0.000 = perfect)</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {evaluation.hasSufficientData
                    ? evaluation.brierScore! < 0.18
                      ? 'Goede kalibratie van vangstkansen'
                      : 'Gemiddelde afwijking ten opzichte van uitkomst'
                    : 'Vereist minimaal 5 gerealiseerde momentopnames'}
                </span>
              </div>

              {/* Naive Baseline */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Naïeve Baseline (BS_naive)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-300">
                  {evaluation.naiveBrierScore !== null
                    ? evaluation.naiveBrierScore.toFixed(3)
                    : 'Geen data'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Vergelijkt model met een vaste steekproef-basiskans ({evaluation.observedCatchRate ?? '—'}%)
                </span>
              </div>

              {/* Brier Skill Score */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Brier Skill Score (BSS)
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    evaluation.brierSkillScore !== null && evaluation.brierSkillScore > 0
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {evaluation.brierSkillScore !== null
                    ? `${(evaluation.brierSkillScore * 100).toFixed(1)}%`
                    : 'Geen data'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {evaluation.brierSkillScore !== null && evaluation.brierSkillScore > 0
                    ? 'Model voorspelt beter dan vaste basiskans'
                    : 'Geen statistische meerwaarde aangetoond t.o.v. baseline'}
                </span>
              </div>
            </div>

            {/* Kalibratietabel */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Kalibratie per Kanskwartiel (Voorspelde kans vs. Werkelijke uitkomst)
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Kanssegment</th>
                      <th className="p-3">Aantal Momentopnames</th>
                      <th className="p-3">Gem. Voorspelde Kans</th>
                      <th className="p-3">Gerealiseerde Vangstfractie</th>
                      <th className="p-3">Kalibratieverschil (Delta)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {evaluation.calibrationBins.map((bin) => (
                      <tr key={bin.rangeLabel} className="hover:bg-slate-800/40">
                        <td className="p-3 font-medium text-white">{bin.rangeLabel}</td>
                        <td className="p-3">{bin.snapshotCount}</td>
                        <td className="p-3">
                          {bin.averageForecastProb !== null ? `${bin.averageForecastProb}%` : '—'}
                        </td>
                        <td className="p-3">
                          {bin.observedCatchFraction !== null
                            ? `${bin.observedCatchFraction}%`
                            : '—'}
                        </td>
                        <td className="p-3">
                          {bin.calibrationDelta !== null ? (
                            <span
                              className={`font-semibold ${
                                Math.abs(bin.calibrationDelta) <= 15
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {bin.calibrationDelta > 0 ? `+${bin.calibrationDelta}%` : `${bin.calibrationDelta}%`}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimers & Eerlijke statusmelding */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-xs text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                Validatiestatus: {evaluation.statusMessage}
              </span>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                {evaluation.disclaimers.map((disc, idx) => (
                  <li key={idx}>{disc}</li>
                ))}
              </ul>
            </div>

            {/* Opgeslagen Prognosemomentopnames Lijst met Afzonderlijke Verwijderoptie */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookmarkPlus className="w-4 h-4 text-cyan-400" />
                  Opgeslagen Prognosemomentopnames ({snapshots.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Onveranderlijke snapshots voorafgaand aan sessiestart
                </span>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center justify-between">
                  <span>{deleteError}</span>
                  <button
                    onClick={() => setDeleteError(null)}
                    className="text-[10px] font-bold uppercase underline hover:text-white"
                  >
                    Sluiten
                  </button>
                </div>
              )}

              {snapshots.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 italic">
                  Er zijn nog geen prognosemomentopnames opgeslagen. Start een sessie via &quot;Start Sessie op dit moment&quot; in het prognosescherm om een onveranderlijke momentopname vast te leggen.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {snapshots.map((snap) => {
                    const isBench = (snap as any).isBenchmark;

                    return (
                      <div
                        key={snap.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">
                              {snap.targetSpecies}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-300 font-medium">
                              {snap.locationName || snap.locationId || 'Onbekende stek'}
                            </span>
                            {snap.targetSlot && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 text-[10px] font-semibold border border-slate-700">
                                {snap.targetSlot}
                              </span>
                            )}
                            {isBench && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 text-[10px] font-bold border border-amber-700/60 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-400" />
                                Benchmark
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span>Datum: {snap.targetDate}</span>
                            <span>•</span>
                            <span>Duur: {snap.durationHours}u</span>
                            <span>•</span>
                            <span className="text-slate-300">
                              Activiteit: <strong className="text-white">{snap.predictedActivityScore === null ? 'Niet beschikbaar' : `${snap.predictedActivityScore}/10`}</strong>
                            </span>
                            <span>•</span>
                            <span className="text-slate-300">
                              Voorspelde kans:{' '}
                              <strong className="text-white">
                                {snap.predictedCatchChance !== null ? `${snap.predictedCatchChance}%` : 'Geen (N<5)'}
                              </strong>
                            </span>
                          </div>

                          {/* Status uitkomst */}
                          <div className="text-[11px] pt-0.5 flex items-center gap-2 flex-wrap">
                            {snap.actualOutcome === 'catch' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Gerealiseerd: Vangst ({snap.actualTargetCatchesCount ?? 1} doelvis)
                              </span>
                            ) : snap.actualOutcome === 'skunk_confirmed' ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                                <XCircle className="w-3.5 h-3.5" />
                                Gerealiseerd: Bevestigde nulvangst
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 italic">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                In afwachting van sessie-afronding
                              </span>
                            )}

                            {snap.linkedSessionId && (
                              <span className="text-slate-500 font-mono text-[10px]">
                                (sessie: {snap.linkedSessionId.slice(0, 16)}...)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actieknop Afzonderlijk Verwijderen */}
                        <div className="self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRequestDeleteSnapshot(snap)}
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition cursor-pointer"
                            title={isBench ? 'Benchmark is beschermd' : 'Momentopname afzonderlijk verwijderen'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vangsten per Soort & Tijdvak Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soortstatistieken */}
        <div className="p-5 rounded-3xl bg-slate-800/70 border border-slate-700/70 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Fish className="w-5 h-5 text-emerald-400" />
            Vangsten per Vissoort
          </h3>

          {speciesStats.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nog geen vangsten geregistreerd.</p>
          ) : (
            <div className="space-y-2.5">
              {speciesStats.map((sp) => {
                const maxCount = Math.max(...speciesStats.map((s) => s.count), 1);
                const percent = Math.round((sp.count / maxCount) * 100);

                return (
                  <div key={sp.species} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-white">{sp.species}</span>
                      <span className="text-emerald-400 font-bold">
                        {sp.count} vis{sp.count === 1 ? '' : 'sen'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Max gewicht: {sp.maxWeightKg !== null ? `${sp.maxWeightKg} kg` : 'N.v.t.'}
                      </span>
                      <span>
                        Totaal gewogen:{' '}
                        {sp.knownWeightsCount > 0 ? `${sp.totalWeightKg.toFixed(1)} kg` : 'Ongewogen'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tijdvakverdeling */}
        <div className="p-5 rounded-3xl bg-slate-800/70 border border-slate-700/70 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Productiviteit per Tijdvak
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {timeSlotStats.map((ts) => (
              <div
                key={ts.slot}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center"
              >
                <span className="text-xs font-bold text-slate-300 block mb-1">{ts.slot}</span>
                <span className="text-xl font-black text-cyan-300 block">
                  {ts.catchesPerHour.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  vis/uur ({ts.fishCount} vissen / {ts.sessionCount} sessies)
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Wetenschappelijke nuance:</strong> Correlatie tussen tijdvak en vangsten kan ook beïnvloed worden door jouw eigen beschikbaarheid (wanneer je vist).
            </span>
          </div>
        </div>
      </div>

      {/* Modal Bevestiging Momentopname Verwijderen */}
      {snapshotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-slate-700">
              <div className="p-2.5 rounded-2xl bg-rose-950/80 border border-rose-800">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Prognosemomentopname Verwijderen</h3>
                <p className="text-xs text-slate-400">Afzonderlijke verwijdering uit modelvalidatie</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p>
                Weet je zeker dat je de prognosemomentopname voor <strong className="text-white">{snapshotToDelete.targetSpecies}</strong> op{' '}
                <strong className="text-white">{snapshotToDelete.locationName || snapshotToDelete.locationId || 'stek'}</strong> ({snapshotToDelete.targetDate}) wilt verwijderen?
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Voorspelde kans:</span>
                  <span className="font-bold text-white">
                    {snapshotToDelete.predictedCatchChance !== null ? `${snapshotToDelete.predictedCatchChance}%` : 'Geen kans (N < 5)'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Uitkomst:</span>
                  <span className="font-semibold text-slate-200">
                    {snapshotToDelete.actualOutcome === 'catch'
                      ? 'Vangst'
                      : snapshotToDelete.actualOutcome === 'skunk_confirmed'
                      ? 'Bevestigde nulvangst'
                      : 'Nog niet gerealiseerd'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-emerald-400">
                  <span className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Vissessie blijft te allen tijde behouden
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Indien er een vissessie aan deze momentopname is gekoppeld, wordt die sessie <strong>niet</strong> verwijderd. Alleen de koppeling wordt veilig leeggemaakt. De Brier-score en validatietabel worden direct herberekend.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setSnapshotToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteSnapshot}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Bezig met verwijderen...' : 'Momentopname Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
