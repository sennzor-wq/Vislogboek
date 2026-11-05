import React, { useState, useEffect } from 'react';
import {
  FishingSession,
  FishingLocation,
  CatchItem,
  SessionOutcome,
  FishSpecies,
  SessionRod,
  CoachAdviceRecord,
} from '../../types';
import { SessionModal } from './SessionModal';
import { EndSessionModal } from './EndSessionModal';
import { CatchModal } from '../catches/CatchModal';
import { deleteSessionSafely, deletePrognosisSnapshotSafely } from '../../db/db';
import { calculateSessionRodEffort, closeOpenRodIntervals } from '../../services/sessionEffortEngine';
import {
  Plus,
  Play,
  Square,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  Filter,
  Thermometer,
  Wind,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SessionsViewProps {
  sessions: FishingSession[];
  catches: CatchItem[];
  locations: FishingLocation[];
  onRefreshData: () => Promise<void>;
  onStartNewSession: () => void;
  onSaveSession: (sessionData: Partial<FishingSession>, pendingSnapshot?: undefined, rods?: SessionRod[]) => Promise<void>;
  sessionRods: SessionRod[];
  onSaveCatch: (catchData: CatchItem) => Promise<void>;
  coachAdviceRecords: CoachAdviceRecord[];
  onManualReassessment: (sessionId: string) => Promise<void>;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  catches,
  locations,
  onRefreshData,
  onStartNewSession,
  onSaveSession,
  sessionRods,
  onSaveCatch,
  coachAdviceRecords,
  onManualReassessment,
}) => {
  const [filterOutcome, setFilterOutcome] = useState<string>('Alle');
  const [filterLocationId, setFilterLocationId] = useState<string>('Alle');
  const [editingSession, setEditingSession] = useState<FishingSession | null>(null);
  const [endingSession, setEndingSession] = useState<FishingSession | null>(null);
  const [addingCatchForSessionId, setAddingCatchForSessionId] = useState<string | null>(null);
  const [editingCatch, setEditingCatch] = useState<CatchItem | null>(null);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [expandedYearIds, setExpandedYearIds] = useState<Set<string>>(new Set());
  const [expandedMonthIds, setExpandedMonthIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<FishingSession | null>(null);
  const [snapshotToDeleteId, setSnapshotToDeleteId] = useState<string | null>(null);

  // Live timer tick voor actieve sessies
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const activeSessions = sessions.filter((s) => s.outcome === 'active');
  const completedSessions = sessions.filter((s) => s.outcome !== 'active');

  const filteredCompletedSessions = completedSessions.filter((s) => {
    if (filterOutcome !== 'Alle' && s.outcome !== filterOutcome) return false;
    if (filterLocationId !== 'Alle' && s.locationId !== filterLocationId) return false;
    return true;
  });

  // Groepeer historische sessies op de lokale sessiedatum (jaar en maand).
  // De bestaande sessie- en vangstgegevens blijven ongewijzigd.
  const sessionsByYear = filteredCompletedSessions.reduce<
    Record<string, { year: number; totalFish: number; months: Record<string, { month: number; sessions: FishingSession[]; totalFish: number }> }>
  >((groups, session) => {
    const sessionDate = new Date(session.startTime);
    if (Number.isNaN(sessionDate.getTime())) return groups;

    const year = sessionDate.getFullYear();
    const month = sessionDate.getMonth();
    const yearKey = String(year);
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const sessionCatches = catches.filter((c) => c.sessionId === session.id);
    const sessionFishCount = sessionCatches.reduce((sum, c) => sum + (c.count || 1), 0);

    if (!groups[yearKey]) groups[yearKey] = { year, totalFish: 0, months: {} };
    if (!groups[yearKey].months[monthKey]) {
      groups[yearKey].months[monthKey] = { month, sessions: [], totalFish: 0 };
    }

    groups[yearKey].months[monthKey].sessions.push(session);
    groups[yearKey].months[monthKey].totalFish += sessionFishCount;
    groups[yearKey].totalFish += sessionFishCount;
    return groups;
  }, {});

  const yearGroups = Object.entries(sessionsByYear)
    .map(([yearKey, group]) => ({ yearKey, ...group }))
    .sort((a, b) => b.year - a.year)
    .map((yearGroup) => ({
      ...yearGroup,
      months: Object.entries(yearGroup.months)
        .map(([monthKey, group]) => ({ monthKey, ...group }))
        .sort((a, b) => b.month - a.month),
    }));

  const latestYearKey = yearGroups[0]?.yearKey ?? null;
  const latestMonthKey = yearGroups[0]?.months[0]?.monthKey ?? null;

  // Een nieuw jaar of nieuwere maand wordt automatisch geopend. Handmatige
  // keuzes blijven daarna behouden zolang de nieuwste periode niet verandert.
  useEffect(() => {
    if (latestYearKey) {
      setExpandedYearIds((prev) => prev.has(latestYearKey) ? prev : new Set(prev).add(latestYearKey));
    }
    if (latestMonthKey) {
      setExpandedMonthIds((prev) => prev.has(latestMonthKey) ? prev : new Set(prev).add(latestMonthKey));
    }
  }, [latestYearKey, latestMonthKey]);

  const toggleHistory = () => setIsHistoryExpanded((prev) => !prev);
  const toggleYear = (yearKey: string) => {
    setExpandedYearIds((prev) => {
      const next = new Set(prev);
      if (next.has(yearKey)) next.delete(yearKey);
      else next.add(yearKey);
      return next;
    });
  };
  const toggleMonth = (monthKey: string) => {
    setExpandedMonthIds((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const calculateLiveDuration = (startTimeIso: string) => {
    const startMs = new Date(startTimeIso).getTime();
    const nowMs = Date.now();
    const diffMin = Math.max(0, Math.floor((nowMs - startMs) / 60000));
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}u ${mins}m`;
  };

  const requestDeleteSession = (session: FishingSession) => {
    if (session.isBenchmark) {
      setErrorMessage('De referentiesessie Lokkershoek is een beschermde benchmark en kan niet worden verwijderd.');
      return;
    }
    setSessionToDelete(session);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      setErrorMessage(null);
      await deleteSessionSafely(sessionToDelete.id);
      setSessionToDelete(null);
      await onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kon sessie niet verwijderen.');
    }
  };

  const handleConfirmDeleteSnapshot = async () => {
    if (!snapshotToDeleteId) return;
    try {
      setErrorMessage(null);
      await deletePrognosisSnapshotSafely(snapshotToDeleteId);
      setSnapshotToDeleteId(null);
      await onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kon prognosemomentopname niet verwijderen.');
    }
  };

  const handleConfirmEndSession = async (
    sessionId: string,
    outcome: SessionOutcome,
    notes?: string
  ) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const endIso = new Date().toISOString();
    const startMs = new Date(session.startTime).getTime();
    const endMs = new Date(endIso).getTime();
    const diffMin = Math.max(1, Math.round((endMs - startMs) / 60000));

    const rodsAtEnd = closeOpenRodIntervals(
      sessionRods.filter((rod) => rod.sessionId === sessionId),
      endIso
    );

    await onSaveSession({
      id: sessionId,
      endTime: endIso,
      durationMinutes: diffMin,
      outcome,
      notes: notes || session.notes,
      updatedAt: endIso,
    }, undefined, rodsAtEnd);
    await onRefreshData();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Foutmelding Banner (bijv. benchmarkbeveiliging) */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 flex items-center justify-between text-xs sm:text-sm animate-fade-in">
                   <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold uppercase underline hover:text-white"
          >
            Sluiten
          </button>
        </div>
      )}

      {/* Header en Nieuwe Sessie Knop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" />
            Vissessies & Logboek
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Registreer actieve sessies aan de waterkant of voeg historische visdagen toe.
          </p>
        </div>

        <button
          onClick={onStartNewSession}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition active:scale-95 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          Sessie Starten
        </button>
      </div>

      {/* Actieve Sessies Sectie (kan meerdere zijn) */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            Actieve Sessie(s) aan het water ({activeSessions.length})
          </h2>

          <div className="grid grid-cols-1 gap-3.5">
            {activeSessions.map((session) => {
              const sessionCatches = catches.filter((c) => c.sessionId === session.id);
              const totalFish = sessionCatches.reduce((sum, c) => sum + (c.count || 1), 0);
              const liveDuration = calculateLiveDuration(session.startTime);

              return (
                <div
                  key={session.id}
                  className="rounded-3xl bg-slate-800 border-2 border-emerald-500/80 p-5 shadow-xl ring-2 ring-emerald-500/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40 animate-pulse">
                          ● Nu Actief
                        </span>
                        <span className="text-base font-black text-white">
                          {session.locationName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-1.5 flex-wrap">
                        <span>Gestart om: {new Date(session.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="font-bold text-emerald-300">Live duur: {liveDuration}</span>
                        {session.participantCount && <><span>•</span><span>{session.participantCount} deelnemer(s)</span></>}
                        {session.rodCount && (
                          <>
                            <span>•</span>
                            <span>{session.rodCount} hengel(s) totaal</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actieknoppen Actieve Sessie */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setAddingCatchForSessionId(session.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Vangst registreren
                      </button>

                      <button
                        onClick={() => setEditingSession(session)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/70 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition border border-slate-600 cursor-pointer"
                        title="Actieve sessie en hengeldetails bewerken"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Bewerken
                      </button>

                      <button
                        onClick={() => setEndingSession(session)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition border border-slate-600 cursor-pointer"
                      >
                        <Square className="w-4 h-4 text-amber-400" />
                        Sessie afronden
                      </button>

                      <button
                        onClick={() => requestDeleteSession(session)}
                        className="p-2 rounded-xl bg-slate-700/60 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 transition border border-slate-600/60 cursor-pointer"
                        title="Actieve sessie annuleren/verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Laatste VisCoach-advies voor deze actieve sessie */}
                  <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <Sparkles className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wide">VisCoach</h3>
                      </div>
                      <button
                        onClick={() => void onManualReassessment(session.id)}
                        className="text-[10px] font-bold text-cyan-300 hover:text-white"
                      >
                        Opnieuw beoordelen
                      </button>
                    </div>
                    {coachAdviceRecords
                      .filter((advice) => advice.sessionId === session.id)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 3).length === 0 ? (
                      <p className="text-xs text-slate-400">Er is nog geen coachadvies voor deze sessie vastgelegd. De coach beoordeelt relevante wijzigingen automatisch.</p>
                    ) : coachAdviceRecords
                      .filter((advice) => advice.sessionId === session.id)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 3)
                      .map((advice, index) => (
                        <div key={advice.id} className={index > 0 ? 'border-t border-slate-700 pt-3 mt-3' : ''}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase tracking-wide text-slate-500">
                              {index === 0 ? 'Actueel advies' : 'Eerder advies'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(advice.createdAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white mt-1">{advice.recommendation}</p>
                          {advice.summary && <p className="text-xs text-slate-300 mt-1">{advice.summary}</p>}
                          {advice.rationale && <p className="text-[11px] text-slate-500 mt-1">{advice.rationale}</p>}
                        </div>
                      ))}
                  </div>

                  {/* Vangsten in deze actieve sessie */}
                  <div className="pt-3.5">
                    <span className="text-xs font-bold text-slate-300 block mb-2">
                      Vangsten in deze sessie ({totalFish} vis{totalFish === 1 ? '' : 'sen'}):
                    </span>
                    {sessionCatches.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Nog geen vangsten geregistreerd tijdens deze sessie.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {sessionCatches.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-white block">
                                {c.count > 1 ? `${c.count}x ` : ''}
                                {c.species}
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                {c.weightKg ? `${c.weightKg} kg` : 'Gewicht onbekend'}
                                {c.bait ? ` • ${c.bait}` : ''}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters voor Afgeronde Sessies */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Filter Sessies:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Alle">Alle uitkomsten</option>
            <option value="catch">Alleen met vangst</option>
            <option value="skunk_confirmed">Alleen bevestigde nulvangsten</option>
            <option value="unknown">Onbekende uitkomsten</option>
          </select>

          <select
            value={filterLocationId}
            onChange={(e) => setFilterLocationId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Alle">Alle locaties</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Historische sessies: inklapbaar per jaar en per maand */}
      <div className="space-y-3.5">
        <button
          type="button"
          onClick={toggleHistory}
          aria-expanded={isHistoryExpanded}
          className="w-full flex items-center justify-between gap-3 text-left p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition cursor-pointer"
        >
          <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Historie ({filteredCompletedSessions.length} sessies)
          </span>
          {isHistoryExpanded ? <ChevronUp className="w-5 h-5 text-emerald-400" /> : <ChevronDown className="w-5 h-5 text-emerald-400" />}
        </button>

        {isHistoryExpanded && (
          filteredCompletedSessions.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/50 text-center text-slate-400">
              Geen sessies gevonden die voldoen aan de geselecteerde filters.
            </div>
          ) : (
            <div className="space-y-3">
              {yearGroups.map((yearGroup) => {
                const isYearExpanded = expandedYearIds.has(yearGroup.yearKey);
                const yearSessionCount = yearGroup.months.reduce((sum, month) => sum + month.sessions.length, 0);

                return (
                  <div key={yearGroup.yearKey} className="rounded-2xl bg-slate-800/70 border border-slate-700/70 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleYear(yearGroup.yearKey)}
                      aria-expanded={isYearExpanded}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-700/30 transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="block text-base font-black text-white">{yearGroup.year}</span>
                        <span className="text-[11px] text-slate-400">
                          {yearSessionCount} {yearSessionCount === 1 ? 'sessie' : 'sessies'} · {yearGroup.totalFish} {yearGroup.totalFish === 1 ? 'vangst' : 'vangsten'}
                        </span>
                      </div>
                      {isYearExpanded ? <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-emerald-400 shrink-0" />}
                    </button>

                    {isYearExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {yearGroup.months.map((monthGroup) => {
                          const isMonthExpanded = expandedMonthIds.has(monthGroup.monthKey);
                          const monthLabel = new Date(yearGroup.year, monthGroup.month, 1).toLocaleDateString('nl-NL', { month: 'long' });

                          return (
                            <div key={monthGroup.monthKey} className="rounded-xl bg-slate-900/60 border border-slate-700/60 overflow-hidden">
                                                          <button
                                type="button"
                                onClick={() => toggleMonth(monthGroup.monthKey)}
                                aria-expanded={isMonthExpanded}
                                className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-slate-800/70 transition cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <span className="block text-sm font-bold text-slate-100 capitalize">{monthLabel}</span>
                                  <span className="text-[11px] text-slate-400">
                                    {monthGroup.sessions.length} {monthGroup.sessions.length === 1 ? 'sessie' : 'sessies'} · {monthGroup.totalFish} {monthGroup.totalFish === 1 ? 'vangst' : 'vangsten'}
                                  </span>
                                </div>
                                {isMonthExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" />}
                              </button>

                              {isMonthExpanded && (
                                <div className="p-2 pt-0 space-y-3">
                                  {monthGroup.sessions
                                    .slice()
                                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                                    .map((session) => {
            const isExpanded = expandedSessionIds.has(session.id);
            const sessionCatches = catches.filter((c) => c.sessionId === session.id);
            const totalFish = sessionCatches.reduce((sum, c) => sum + (c.count || 1), 0);

            const durationFormatted = session.durationMinutes
              ? `${Math.floor(session.durationMinutes / 60)}u ${session.durationMinutes % 60}m`
              : 'Onbekende duur';

            return (
              <div
                key={session.id}
                className={`rounded-3xl border transition overflow-hidden ${
                  session.isBenchmark
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-600'
                }`}
              >
                {/* Header Rij */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Uitkomst Badge */}
                      {session.outcome === 'catch' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Vangst ({totalFish} vis{totalFish === 1 ? '' : 'sen'})
                        </span>
                      ) : session.outcome === 'skunk_confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <XCircle className="w-3.5 h-3.5" />
                          Bevestigde nulvangst
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Onbekende uitkomst
                        </span>
                      )}

                      {/* Benchmark Badge */}
                      {session.isBenchmark && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          Beschermde Benchmark
                        </span>
                      )}

                      <span className="text-base font-bold text-white">
                        {session.locationName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.startTime).toLocaleDateString('nl-NL', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(session.startTime).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        –{' '}
                        {session.endTime
                          ? new Date(session.endTime).toLocaleTimeString('nl-NL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '?'}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-300">Duur: {durationFormatted}</span>
                      {session.technique && (
                        <>
                          <span>•</span>
                          <span>{session.technique}</span>
                        </>
                      )}
                      {session.participantCount && <><span>•</span><span>{session.participantCount} deelnemer(s)</span></>}
                      {session.rodCount && (
                        <>
                          <span>•</span>
                          <span>{Number(session.rodCount)} hengel(s) totaal</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Knoppen & Toggle */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => setAddingCatchForSessionId(session.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-semibold text-xs border border-emerald-700/40 transition cursor-pointer"
                    >
                      + Vangst
                    </button>

                    <button
                      onClick={() => setEditingSession(session)}
                      className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
                      title="Sessie bewerken"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => requestDeleteSession(session)}
                      className="p-2 rounded-xl bg-slate-700/60 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 transition cursor-pointer"
                      title={session.isBenchmark ? 'Benchmark is beschermd' : 'Sessie verwijderen'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleExpand(session.id)}
                      className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Uitgebreide Sessiedetails */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-700/60 bg-slate-900/40 space-y-3.5">
                    {/* Werkelijke hengelinzet; ontbrekende details worden niet uit rodCount afgeleid */}
                    {sessionRods.some((rod) => rod.sessionId === session.id) && (() => {
                      const rodsForSession = sessionRods.filter((rod) => rod.sessionId === session.id);
                      const effort = calculateSessionRodEffort(rodsForSession, session.startTime, session.endTime);
                      return (
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 space-y-2">
                          <div>
                            <strong className="text-white">Hengeluren:</strong> {effort.totalRodHours.toFixed(2)} uur
                            <span className="text-slate-400"> · {effort.activeRodCount} hengels met geregistreerde inzet</span>
                            {effort.incompleteIntervalCount > 0 && <p className="text-amber-300 text-[11px] mt-1">{effort.incompleteIntervalCount} onvolledige of ongeldige interval(len) niet meegerekend.</p>}
                          </div>
                          <div className="space-y-1.5 border-t border-slate-700/60 pt-2">
                            {rodsForSession.map((rod) => (
                              <div key={rod.id} className="rounded-lg bg-slate-900/60 p-2">
                                <div className="font-semibold text-white">Hengel {rod.rodNumber} · {(effort.perRodHours[rod.id] || 0).toFixed(2)} uur</div>
                                <div className="text-[11px] text-slate-400">
                                  {[rod.positionZone, rod.technique, rod.baitPresentation].filter(Boolean).join(' · ') || 'Geen positie, techniek of aas/presentatie vastgelegd'}
                                </div>
                                {rod.events && rod.events.length > 0 && (
                                  <div className="text-[11px] text-cyan-200 mt-1">
                                    {rod.events.length} gebeurtenis(sen): {rod.events.map((event) => `${event.type === 'bite' ? 'aanbeet' : event.type === 'missed' ? 'gemist' : event.type === 'catch' ? 'vangst' : 'overig'}${event.notes ? ` (${event.notes})` : ''}`).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500">Hengelgebeurtenissen zijn toeschrijvingen binnen deze sessie en worden niet als extra sessies of vangsten opgeteld.</p>
                        </div>
                      );
                    })()}

                    {/* Weersgegevens van de sessie */}
                    {session.weatherSnapshot && (
                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-white">
                            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                            {session.weatherSnapshot.temperature} °C
                          </span>
                          <span>Barometer: {session.weatherSnapshot.pressure} hPa</span>
                          <span>
                            Wind: {session.weatherSnapshot.windDirectionText}{' '}
                            {session.weatherSnapshot.windSpeed} km/u
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Bron: {session.weatherSnapshot.source}
                        </span>
                      </div>
                    )}

                    {/* Gekoppelde Prognosemomentopname */}
                    {session.snapshotId && (
                      <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-xs flex-wrap gap-2">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            Gekoppelde Prognosemomentopname
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: {session.snapshotId}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSnapshotToDeleteId(session.snapshotId!)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs transition font-medium cursor-pointer"
                          title="Verwijder alleen de momentopname, behoud de sessie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Alleen momentopname verwijderen
                        </button>
                      </div>
                    )}

                    {/* Notities & Vangsten */}
                    {session.notes && (
                      <p className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl">
                        <strong>Notities:</strong> {session.notes}
                      </p>
                    )}

                    {/* Vangstenlijst */}
                    <div>
                      <span className="text-xs font-bold text-slate-300 block mb-2">
                        Geregistreerde Vangsten:
                      </span>
                      {sessionCatches.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Geen vangsten gekoppeld aan deze sessie.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {sessionCatches.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between text-xs space-y-1.5"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="font-bold text-white text-sm block">
                                    {c.count > 1 ? `${c.count}x ` : ''}
                                    {c.species}
                                  </span>
                                  <span className="text-emerald-300 font-semibold text-xs">
                                    {c.weightKg !== null && c.weightKg !== undefined
                                      ? `${c.weightKg} kg ${c.isGroupWeight ? '(totaal)' : ''}`
                                      : 'Gewicht onbekend'}
                                  </span>
                                </div>
                                                                {c.photoUrl && (
                                  <img
                                    src={c.photoUrl}
                                    alt={c.species}
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-600"
                                  />
                                )}
                              </div>

                              <div className="text-[11px] text-slate-400 space-y-0.5">
                                {c.bait && <div>Aas: {c.bait}</div>}
                                {c.notes && <div>{c.notes}</div>}
                              </div>

                              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/50 flex justify-between">
                                <span>{new Date(c.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
                                <button
                                  onClick={() => setEditingCatch(c)}
                                  className="text-slate-400 hover:text-white underline cursor-pointer"
                                >
                                  Bewerken
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
                                    })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      {editingSession && (
        <SessionModal
          session={editingSession}
          locations={locations}
          initialRodDetails={sessionRods.filter((rod) => rod.sessionId === editingSession.id)}
          onSave={async (updated, _pendingSnapshot, rods) => {
            await onSaveSession(updated, undefined, rods);
            await onRefreshData();
          }}
          onClose={() => setEditingSession(null)}
        />
      )}

      {endingSession && (
        <EndSessionModal
          session={endingSession}
          hasCatches={catches.some((c) => c.sessionId === endingSession.id)}
          onConfirmEnd={handleConfirmEndSession}
          onClose={() => setEndingSession(null)}
        />
      )}

      {addingCatchForSessionId && (
        <CatchModal
          sessionId={addingCatchForSessionId}
          activeSession={sessions.find((s) => s.id === addingCatchForSessionId)}
          onSave={async (catchData) => {
            await onSaveCatch(catchData);
            await onRefreshData();
          }}
          onClose={() => setAddingCatchForSessionId(null)}
        />
      )}

      {editingCatch && (
        <CatchModal
          catchItem={editingCatch}
          sessionId={editingCatch.sessionId}
          activeSession={sessions.find((s) => s.id === editingCatch.sessionId)}
          onSave={async (catchData) => {
            await onSaveCatch(catchData);
            await onRefreshData();
          }}
          onClose={() => setEditingCatch(null)}
        />
      )}

      {/* Bevestigingsmodal Sessie Verwijderen */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-slate-700">
              <div className="p-2.5 rounded-2xl bg-rose-950/80 border border-rose-800">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Vissessie Verwijderen</h3>
                <p className="text-xs text-slate-400">Bevestig de definitieve verwijdering van deze sessie</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p>
                Weet je zeker dat je de sessie op <strong className="text-white">{sessionToDelete.locationName}</strong> van{' '}
                <strong className="text-white">
                  {new Date(sessionToDelete.startTime).toLocaleDateString('nl-NL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>{' '}
                wilt verwijderen?
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Geregistreerde vangsten:</span>
                  <span className="font-bold text-white">
                    {catches.filter((c) => c.sessionId === sessionToDelete.id).length} vangst(en) worden verwijderd
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  {sessionToDelete.snapshotId ? (
                    <div className="space-y-1 text-amber-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        Gekoppelde Prognosemomentopname:
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Deze sessie heeft een gekoppelde prognosemomentopname (<code className="text-cyan-300 px-1 py-0.5 bg-slate-950 rounded font-mono">{sessionToDelete.snapshotId.slice(0, 20)}...</code>).
                        De gekoppelde momentopname en de bijbehorende validatiegegevens voor de Brier-score worden eveneens definitief verwijderd.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Er is geen gekoppelde prognosemomentopname aan deze sessie verbonden.
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-rose-400/90 font-medium">
                Let op: Deze actie kan niet ongedaan worden gemaakt.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSession}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Definitief Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bevestigingsmodal Alleen Momentopname Verwijderen */}
      {snapshotToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-400 pb-3 border-b border-slate-700">
              <div className="p-2.5 rounded-2xl bg-amber-950/80 border border-amber-800">
                <Trash2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Prognosemomentopname Verwijderen</h3>
                <p className="text-xs text-slate-400">Ontkoppelen en verwijderen van voorspellingsmomentopname</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p>
                Weet je zeker dat je deze gekoppelde prognosemomentopname (<code className="text-cyan-300 px-1 py-0.5 bg-slate-900 rounded font-mono">{snapshotToDeleteId.slice(0, 20)}...</code>) wilt verwijderen?
              </p>

              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 space-y-1 text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Vissessie blijft volledig behouden
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  De vissessie zelf en alle geregistreerde vangsten worden <strong>niet</strong> verwijderd. Alleen de verwijzing vanuit de sessie wordt veilig leeggemaakt. De Brier-score en validatiestatistieken worden automatisch opnieuw berekend zonder deze voorspelling.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setSnapshotToDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSnapshot}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Momentopname Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};