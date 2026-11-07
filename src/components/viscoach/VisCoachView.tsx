import React, { useState } from 'react';
import {
  CatchItem,
  FishingLocation,
  FishingSession,
  FishSpecies,
  ALL_SPECIES,
  PlannedFishingSession,
} from '../../types';
import { PendingPrognosisSnapshot } from '../../services/prognosisEngine';
import { buildVisCoachPlan, VisCoachPlan } from '../../services/viscoachService';
import { buildVisCoachAdviceText } from '../../services/sessionCoachService';
import {
  CalendarClock,
  Clock,
  Fish,
  MapPin,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Wind,
  XCircle,
} from 'lucide-react';

interface VisCoachViewProps {
  locations: FishingLocation[];
  sessions: FishingSession[];
  catches: CatchItem[];
  plannedSessions: PlannedFishingSession[];
  onStartSession: (species?: FishSpecies, locationId?: string, pendingSnapshot?: PendingPrognosisSnapshot, durationHours?: number, endTime?: string | null) => void;
  onStartPlannedSession: (plan: PlannedFishingSession) => Promise<void>;
  onSavePlan: (plan: VisCoachPlan, location: FishingLocation, species: FishSpecies) => Promise<void>;
  onCancelPlan: (planId: string) => Promise<void>;
}

function toLocalDateTimeInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const VisCoachView: React.FC<VisCoachViewProps> = ({
  locations,
  sessions,
  catches,
  plannedSessions,
  onStartSession,
  onStartPlannedSession,
  onSavePlan,
  onCancelPlan,
}) => {
  const [locationId, setLocationId] = useState<string>(locations[0]?.id || '');
  const [species, setSpecies] = useState<FishSpecies>('Karper');
  const [startTime, setStartTime] = useState<string>(() => toLocalDateTimeInput(new Date()));
  const [endTime, setEndTime] = useState<string>('');
  const [plan, setPlan] = useState<VisCoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [startingPlanId, setStartingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const selectedLocation = locations.find((location) => location.id === locationId) || null;
  const startIsFuture = startTime ? new Date(startTime).getTime() > Date.now() : false;
  const activePlans = plannedSessions
    .filter((item) => item.status === 'planned' || item.status === 'overdue')
    .sort((a, b) => new Date(a.plannedStartTime).getTime() - new Date(b.plannedStartTime).getTime());

  const invalidatePlan = () => {
    setPlan(null);
    setSavedMessage(null);
    setError(null);
  };

  const handleBuildPlan = async () => {
    if (!selectedLocation) {
      setError('Kies eerst een stek.');
      return;
    }
    if (!startTime) {
      setError('Kies wanneer je wilt beginnen met vissen.');
      return;
    }
    setLoading(true);
    setError(null);
    setSavedMessage(null);
    try {
      const result = await buildVisCoachPlan({
        location: selectedLocation,
        targetSpecies: species,
        desiredStartTime: startTime,
        desiredEndTime: endTime || null,
        sessions,
        catches,
      });
      setPlan(result);
    } catch (err) {
      setPlan(null);
      setError(err instanceof Error ? err.message : 'Het visplan kon niet worden berekend.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlanned = async (planned: PlannedFishingSession) => {
    setStartingPlanId(planned.id);
    setError(null);
    try {
      await onStartPlannedSession(planned);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'De geplande sessie kon niet worden gestart.');
    } finally {
      setStartingPlanId(null);
    }
  };

  const handleSavePlan = async () => {
    if (!plan || !selectedLocation) return;
    setSavingPlan(true);
    setError(null);
    try {
      await onSavePlan(plan, selectedLocation, species);
      setSavedMessage('Je vissessie is ingepland. Er is nog geen actieve vissessie gestart.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'De planning kon niet worden opgeslagen.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleStartNow = () => {
    if (!plan || !selectedLocation || startIsFuture) return;
    const now = Date.now();
    const endTimestamp = plan.desiredEndTime ? new Date(plan.desiredEndTime).getTime() : NaN;
    const remainingDuration = Number.isFinite(endTimestamp) && endTimestamp > now
      ? (endTimestamp - now) / 3600000
      : undefined;
    // SessionModal berekent bij opslaan een verse startsnapshot met de definitieve sessie-invoer.
    onStartSession(species, selectedLocation.id, undefined,
      remainingDuration && remainingDuration <= 24 ? remainingDuration : undefined,
      plan.desiredEndTime);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <section className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950/50 p-5 sm:p-7 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/30 p-3 text-emerald-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-emerald-300">Vislogboek</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white">VisCoach</h1>
          </div>
        </div>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Vertel waar en wanneer je wilt vissen. VisCoach gebruikt de bestaande prognose en stekgegevens om een praktisch plan te maken.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-800/80 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Jouw vissessie</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Doelvis</span>
            <select
              value={species}
              onChange={(event) => { setSpecies(event.target.value as FishSpecies); invalidatePlan(); }}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {ALL_SPECIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Stek</span>
            <select
              value={locationId}
              onChange={(event) => { setLocationId(event.target.value); invalidatePlan(); }}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Kies een stek</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Gewenste starttijd</span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => { setStartTime(event.target.value); invalidatePlan(); }}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Gewenste eindtijd <span className="normal-case font-normal">(optioneel)</span></span>
            <input
              type="datetime-local"
              value={endTime}
              min={startTime || undefined}
              onChange={(event) => { setEndTime(event.target.value); invalidatePlan(); }}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
            <span className="block text-[11px] text-slate-500">Weet je nog niet hoe lang je vist? Laat dit leeg. VisCoach verzint geen sessieduur.</span>
          </label>
        </div>

        {locations.length === 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-200">
            Voeg eerst een stek toe via Stekken voordat je een visplan maakt.
          </div>
        )}
        {error && <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}
        {savedMessage && <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-sm text-emerald-200">{savedMessage}</div>}

        <button
          onClick={handleBuildPlan}
          disabled={loading || !selectedLocation || !startTime}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-sm font-bold text-white transition"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Visplan berekenen…' : 'Maak mijn visplan'}
        </button>
      </section>

      {plan && selectedLocation && (
        <section className="rounded-3xl border border-emerald-500/30 bg-slate-800/90 p-4 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300 font-bold">Jouw visplan</p>
              <h2 className="text-xl font-black text-white">{species} bij {selectedLocation.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {formatDateTime(plan.desiredStartTime)}
                {plan.desiredEndTime ? ` – ${formatDateTime(plan.desiredEndTime)}` : ' – eindtijd nog onbekend'}
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-slate-200">{plan.prognosis.advice}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <Clock className="w-5 h-5 text-sky-300 mb-2" />
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Tijdvak van je plan</p>
              <p className="text-base font-bold text-white">{plan.selectedTimeSlot ?? (plan.desiredEndTime ? 'Meerdere tijdvakken' : 'Starttijd vastgelegd')}</p>
              <p className="text-[10px] text-slate-500 mt-1">Dagprognose: {plan.prognosis.bestTimeSlot}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <Fish className="w-5 h-5 text-emerald-300 mb-2" />
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Visactiviteit</p>
              <p className="text-base font-bold text-white">
                {plan.prognosis.activityScoreAvailable === false ? 'Onvoldoende gegevens' : `${plan.prognosis.activityScore.toFixed(1)} / 10`}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4">
              <Target className="w-5 h-5 text-amber-300 mb-2" />
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Persoonlijke vangkans</p>
              <p className="text-base font-bold text-white">
                {plan.durationHours === null ? 'Nog onbekend' : plan.prognosis.personalCatchChance === null ? 'Onvoldoende gegevens' : `${plan.prognosis.personalCatchChance}%`}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-bold">Zo zou ik deze sessie aanpakken</h3>
            </div>
            <p className="text-sm leading-relaxed text-white">
              {buildVisCoachAdviceText(plan.prognosis, plan.pendingSnapshot.conditions, plan.pendingSnapshot.inputContext.technique).summary}
            </p>
            <p className="text-sm leading-relaxed text-slate-200">
              {buildVisCoachAdviceText(plan.prognosis).recommendation}
            </p>
            {buildVisCoachAdviceText(plan.prognosis).rationale && (
              <p className="text-xs leading-relaxed text-slate-400">
                Waarom dit advies? {buildVisCoachAdviceText(plan.prognosis).rationale}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleStartNow}
              disabled={startIsFuture || loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 text-sm font-bold text-white"
            >
              <Play className="w-4 h-4" /> Start vissen
            </button>
            <button
              onClick={handleSavePlan}
              disabled={savingPlan || !!savedMessage}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 px-4 py-3 text-sm font-bold text-white"
            >
              <CalendarClock className="w-4 h-4" /> {savingPlan ? 'Opslaan…' : 'Sessie plannen'}
            </button>
          </div>
          {startIsFuture && <p className="text-xs text-slate-500">Dit tijdstip ligt nog in de toekomst. Je kunt de sessie alvast plannen; starten kan zodra je daadwerkelijk gaat vissen.</p>}
        </section>
      )}

      <section className="rounded-3xl border border-slate-700 bg-slate-800/70 p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white">Geplande vissessies</h2>
          <span className="text-xs text-slate-500">{activePlans.length} gepland</span>
        </div>
        {activePlans.length === 0 ? (
          <p className="text-sm text-slate-500">Je hebt nog geen vissessies ingepland.</p>
        ) : activePlans.map((item) => {
          const location = locations.find((entry) => entry.id === item.locationId);
          return (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-900/80 p-4">
              <div>
                <p className="text-sm font-bold text-white">{item.targetSpecies} · {location?.name || 'Onbekende stek'}</p>
                <p className="text-xs text-slate-400">{formatDateTime(item.plannedStartTime)}{item.plannedEndTime ? ` – ${formatDateTime(item.plannedEndTime)}` : ' · eindtijd onbekend'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void handleStartPlanned(item)} disabled={startingPlanId !== null} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                  {startingPlanId === item.id ? 'Voorbereiden…' : 'Start vissen'}
                </button>
                <button onClick={() => void onCancelPlan(item.id)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800" aria-label="Planning annuleren">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
