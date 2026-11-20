import React, { useState, useEffect } from 'react';
import { db, initializeDatabase, syncSessionPresenceObservations } from './db/db';
import { FishingLocation, FishingSession, CatchItem, FishSpecies, SessionRod, PlannedFishingSession, WaterTemperatureMeasurement } from './types';
import { PendingPrognosisSnapshot, saveSessionWithPrognosisSnapshot } from './services/prognosisEngine';
import { Navbar, TabType } from './components/Navbar';
import { PrognosisView } from './components/prognosis/PrognosisView';
import { SessionsView } from './components/sessions/SessionsView';
import { LocationsView } from './components/locations/LocationsView';
import { StatsView } from './components/stats/StatsView';
import { WeatherView } from './components/weather/WeatherView';
import { SettingsView } from './components/settings/SettingsView';
import { SessionModal } from './components/sessions/SessionModal';
import { VisCoachView } from './components/viscoach/VisCoachView';
import { VisCoachWelcomeModal } from './components/viscoach/VisCoachWelcomeModal';
import { VisCoachPlan, saveVisCoachPlan, cancelVisCoachPlan } from './services/viscoachService';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  Play,
  WifiOff,
  Fish,
} from 'lucide-react';
import { autoSyncSessionOutcomeToSnapshot } from './services/evaluationEngine';
import { startWeatherAutoRefresh, WEATHER_UPDATED_EVENT } from './services/weatherService';
import {
  reassessActiveSessions,
  createInitialCoachAdviceRecord,
  getSessionUpdateTrigger,
  updateCoachAdviceFeedback,
  VISCOACH_UPDATED_EVENT,
} from './services/sessionCoachService';

export default function App() {
  const isOnline = useOnlineStatus();
  const [currentTab, setCurrentTab] = useState<TabType>('viscoach');
  const [showVisCoachWelcome, setShowVisCoachWelcome] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [locations, setLocations] = useState<FishingLocation[]>([]);
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [catches, setCatches] = useState<CatchItem[]>([]);
  const [sessionRods, setSessionRods] = useState<SessionRod[]>([]);
  const [plannedSessions, setPlannedSessions] = useState<PlannedFishingSession[]>([]);
  const [coachAdviceRecords, setCoachAdviceRecords] = useState<import('./types').CoachAdviceRecord[]>([]);
  const [prefilledPlannedSessionId, setPrefilledPlannedSessionId] = useState<string | undefined>(undefined);
  const [prefilledSessionId, setPrefilledSessionId] = useState<string | undefined>(undefined);
  const [prefilledSessionDurationHours, setPrefilledSessionDurationHours] = useState<number | undefined>(undefined);
  const [prefilledPlannedEndTime, setPrefilledPlannedEndTime] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [prefilledSpecies, setPrefilledSpecies] = useState<FishSpecies | undefined>(undefined);
  const [prefilledLocationId, setPrefilledLocationId] = useState<string | undefined>(undefined);
  const [pendingPrognosisSnapshot, setPendingPrognosisSnapshot] = useState<PendingPrognosisSnapshot | undefined>(undefined);
  const [showAdvancedPrognosisDetails, setShowAdvancedPrognosisDetails] = useState<boolean>(() => {
    try { return window.localStorage.getItem('vislogboek.prognosis.advancedDetails') === 'true'; }
    catch { return false; }
  });

  const handleToggleAdvancedPrognosisDetails = (enabled: boolean) => {
    setShowAdvancedPrognosisDetails(enabled);
    try { window.localStorage.setItem('vislogboek.prognosis.advancedDetails', String(enabled)); }
    catch (error) { console.warn('Prognoseweergave kon niet lokaal worden opgeslagen:', error); }
  };

  const loadData = async () => {
    try {
      await initializeDatabase();
      const [allLocations, allSessions, allCatches, allSessionRods, allPlannedSessions, allCoachAdviceRecords] = await Promise.all([
        db.locations.toArray(),
        db.sessions.reverse().sortBy('startTime'),
        db.catches.reverse().sortBy('timestamp'),
        db.sessionRods.toArray(),
        db.plannedSessions.toArray(),
        db.coachAdviceRecords.toArray(),
      ]);
      setLocations(allLocations);
      setSessions(allSessions);
      setCatches(allCatches);
      setSessionRods(allSessionRods);
      setPlannedSessions(allPlannedSessions);
      setCoachAdviceRecords(allCoachAdviceRecords);
    } catch (err) {
      console.error('Fout bij laden van Vislogboek data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Haal weerdata op voor alle stekken en ververs die daarna iedere 30 minuten.
  // Alleen een echte locatie-/coördinatenwijziging start de timer opnieuw.
  const weatherLocationKey = locations
    .map((loc) => `${loc.id}:${loc.latitude ?? ''}:${loc.longitude ?? ''}`)
    .join('|');

  useEffect(() => {
    if (!isOnline || locations.length === 0) return;
    return startWeatherAutoRefresh(locations);
  }, [weatherLocationKey, isOnline]);

  // De VisCoach-coördinator reageert op dezelfde weerupdate als de bestaande Prognosepagina.
  useEffect(() => {
    const handleWeatherUpdated = () => {
      void reassessActiveSessions('weather_update').catch((error) => {
        console.error('VisCoach kon actieve sessies niet herbeoordelen na een weerupdate:', error);
      });
    };
    window.addEventListener(WEATHER_UPDATED_EVENT, handleWeatherUpdated);
    return () => window.removeEventListener(WEATHER_UPDATED_EVENT, handleWeatherUpdated);
  }, []);

  useEffect(() => {
    const handleVisCoachUpdated = () => {
      void db.coachAdviceRecords.toArray().then(setCoachAdviceRecords).catch((error) => {
        console.error('VisCoach-advieshistorie kon niet worden bijgewerkt:', error);
      });
    };
    window.addEventListener(VISCOACH_UPDATED_EVENT, handleVisCoachUpdated);
    return () => window.removeEventListener(VISCOACH_UPDATED_EVENT, handleVisCoachUpdated);
  }, []);

  // Na openen/herladen wordt iedere actieve sessie met de laatst beschikbare gegevens gecontroleerd.
  useEffect(() => {
    if (loading) return;
    void reassessActiveSessions('app_resume').catch((error) => {
      console.error('VisCoach kon actieve sessies niet hervatten:', error);
    });
  }, [loading]);

  // Een geïnstalleerde PWA kan lang gemonteerd blijven terwijl zij op de achtergrond staat.
  // Herbeoordeel daarom ook bij terugkeer naar een zichtbare app; vertrouw niet alleen op mount/reload.
  useEffect(() => {
    if (loading) return;

    const handleAppVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void reassessActiveSessions('app_resume').catch((error) => {
        console.error('VisCoach kon actieve sessies niet herbeoordelen na terugkeer naar de app:', error);
      });
    };

    document.addEventListener('visibilitychange', handleAppVisible);
    window.addEventListener('pageshow', handleAppVisible);
    return () => {
      document.removeEventListener('visibilitychange', handleAppVisible);
      window.removeEventListener('pageshow', handleAppVisible);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading && sessions.some((session) => session.outcome === 'active')) {
      setCurrentTab('sessions');
    }
  }, [loading]);

  const activeSessions = sessions.filter((s) => s.outcome === 'active');

  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
    if (tab === 'viscoach') setShowVisCoachWelcome(true);
  };

  const handleStartSession = (species?: FishSpecies, locationId?: string, pendingSnapshot?: PendingPrognosisSnapshot, durationHours?: number, plannedEndTime?: string | null) => {
    setPrefilledSpecies(species);
    setPrefilledLocationId(locationId);
    setPrefilledSessionId(`session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    setPendingPrognosisSnapshot(pendingSnapshot);
    setPrefilledSessionDurationHours(durationHours ?? (pendingSnapshot?.durationKnown ? pendingSnapshot.durationHours : undefined));
    setPrefilledPlannedEndTime(plannedEndTime ?? null);
    setPrefilledPlannedSessionId(undefined);
    setIsStartingSession(true);
  };

  const handleStartPlannedSession = async (planned: PlannedFishingSession) => {
    const location = locations.find((item) => item.id === planned.locationId);
    if (!location) throw new Error('De stek van deze geplande sessie bestaat niet meer.');
    const species: FishSpecies = planned.targetSpecies === 'Algemeen' ? 'Overig' : planned.targetSpecies;
    const now = new Date();
    const plannedEnd = planned.plannedEndTime && new Date(planned.plannedEndTime).getTime() > now.getTime()
      ? planned.plannedEndTime
      : null;
    const plannedDuration = plannedEnd
      ? (new Date(plannedEnd).getTime() - now.getTime()) / 3600000
      : undefined;
    setPrefilledSpecies(species);
    setPrefilledLocationId(planned.locationId);
    setPrefilledSessionId(`session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    setPendingPrognosisSnapshot(undefined);
    setPrefilledSessionDurationHours(plannedDuration && plannedDuration > 0 && plannedDuration <= 24
      ? plannedDuration
      : undefined);
    setPrefilledPlannedEndTime(plannedEnd);
    setPrefilledPlannedSessionId(planned.id);
    setIsStartingSession(true);
  };

  const handleManualReassessment = async (sessionId: string) => {
    await reassessActiveSessions('manual_reanalysis', sessionId);
    setCoachAdviceRecords(await db.coachAdviceRecords.toArray());
  };

  const handleUpdateCoachAdvice = async (
    adviceId: string,
    updates: { response?: import('./types').CoachAdviceResponse; executedTactic?: string }
  ) => {
    await updateCoachAdviceFeedback(adviceId, updates);
    setCoachAdviceRecords(await db.coachAdviceRecords.toArray());
  };

  const handleSavePlannedSession = async (plan: VisCoachPlan, location: FishingLocation, species: FishSpecies) => {
    const saved = await saveVisCoachPlan(plan, location, species);
    setPlannedSessions((previous) => [...previous.filter((item) => item.id !== saved.id), saved]
      .sort((a, b) => new Date(a.plannedStartTime).getTime() - new Date(b.plannedStartTime).getTime()));
  };

  const handleCancelPlannedSession = async (planId: string) => {
    await cancelVisCoachPlan(planId);
    setPlannedSessions((previous) => previous.map((item) => item.id === planId
      ? { ...item, status: 'cancelled', updatedAt: new Date().toISOString() }
      : item));
  };

  const handleSaveSession = async (
    sessionData: Partial<FishingSession>,
    pendingSnapshot?: PendingPrognosisSnapshot,
    rods?: SessionRod[],
    waterMeasurements?: WaterTemperatureMeasurement[]
  ) => {
    if (!sessionData.id) return;

    const previousSession = await db.sessions.get(sessionData.id);
    if (!previousSession && sessionData.outcome === 'active' && !pendingSnapshot && !sessionData.snapshotId) {
      throw new Error('Een nieuwe actieve sessie kan niet starten zonder vooraf berekende prognosesnapshot.');
    }
    let savedSession: FishingSession | undefined;
    if (pendingSnapshot && sessionData.outcome === 'active') {
      // Sessie en vooraf gekozen prognose worden atomair vastgelegd.
      savedSession = await saveSessionWithPrognosisSnapshot(
        sessionData as FishingSession,
        pendingSnapshot,
        rods,
        waterMeasurements
      );
    } else {
      const hasPresenceObservations = Object.prototype.hasOwnProperty.call(sessionData, 'presenceObservations');
      await db.transaction('rw', db.sessions, db.presenceObservations, db.sessionRods, db.waterTemperatureMeasurements, async () => {
        const existing = await db.sessions.get(sessionData.id!);
        const mergedSession = existing
          ? ({ ...existing, ...sessionData } as FishingSession)
          : (sessionData as FishingSession);
        await db.sessions.put(mergedSession);
        if (waterMeasurements !== undefined) {
          await db.waterTemperatureMeasurements.where('sessionId').equals(sessionData.id!).delete();
          if (waterMeasurements.length > 0) {
            await db.waterTemperatureMeasurements.bulkPut(waterMeasurements.map((item) => ({
              ...item,
              sessionId: sessionData.id!,
              locationId: item.locationId || mergedSession.locationId || '',
            })));
          }
        }
        if (hasPresenceObservations) {
          await syncSessionPresenceObservations(mergedSession);
        }
        if (rods !== undefined) {
          await db.sessionRods.where('sessionId').equals(sessionData.id!).delete();
          if (rods.length > 0) {
            await db.sessionRods.bulkPut(rods.map((rod) => ({ ...rod, sessionId: sessionData.id! })));
          }
        }
      });
      savedSession = await db.sessions.get(sessionData.id);
    }

    if (prefilledPlannedSessionId && savedSession?.outcome === 'active') {
      const updatedAt = new Date().toISOString();
      await db.plannedSessions.update(prefilledPlannedSessionId, {
        status: 'started',
        startedSessionId: savedSession.id,
        updatedAt,
      });
      setPlannedSessions((previous) => previous.map((item) => item.id === prefilledPlannedSessionId
        ? { ...item, status: 'started', startedSessionId: savedSession!.id, updatedAt }
        : item));
      setPrefilledPlannedSessionId(undefined);
    }

    if (pendingSnapshot && savedSession?.outcome === 'active' && savedSession.snapshotId) {
      const startSnapshot = await db.prognosisSnapshots.get(savedSession.snapshotId);
      if (startSnapshot) {
        await createInitialCoachAdviceRecord(savedSession, startSnapshot);
      }
    }

    // Automatische uitkomstkoppeling naar de voorwaarts opgeslagen momentopname.
    if (savedSession?.snapshotId) {
      await autoSyncSessionOutcomeToSnapshot(savedSession);
    }

    // Werk alleen de gewijzigde sessie bij; haal niet alle tabellen opnieuw op.
    if (rods !== undefined) {
      setSessionRods((previous) => [
        ...previous.filter((rod) => rod.sessionId !== sessionData.id),
        ...rods.map((rod) => ({ ...rod, sessionId: sessionData.id! })),
      ]);
    }

    if (savedSession) {
      setSessions((previous) =>
        [...previous.filter((session) => session.id !== savedSession.id), savedSession]
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      );
      if (savedSession.outcome === 'active') setCurrentTab('sessions');
      if (savedSession.outcome === 'active' && !pendingSnapshot) {
        const trigger = getSessionUpdateTrigger(previousSession, savedSession);
        void reassessActiveSessions(trigger, savedSession.id).catch((error) => {
          console.error('VisCoach kon de gewijzigde sessie niet herbeoordelen:', error);
        });
      }
    }
  };

  const handleSaveCatch = async (catchData: CatchItem) => {
    await db.catches.put(catchData);

    // Werk automatisch sessiestatus bij naar 'catch' indien van toepassing.
    const sess = await db.sessions.get(catchData.sessionId);
    if (sess && (sess.outcome === 'skunk_confirmed' || sess.outcome === 'unknown')) {
      await db.sessions.update(catchData.sessionId, {
        outcome: 'catch',
        updatedAt: new Date().toISOString(),
      });
    }

    const updatedSess = await db.sessions.get(catchData.sessionId);
    if (updatedSess?.snapshotId) {
      await autoSyncSessionOutcomeToSnapshot(updatedSess);
    }

    // Alleen de vangst en eventueel gewijzigde sessie in React-state synchroniseren.
    setCatches((previous) =>
      [...previous.filter((item) => item.id !== catchData.id), catchData]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
    if (updatedSess) {
      setSessions((previous) =>
        [...previous.filter((session) => session.id !== updatedSess.id), updatedSess]
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      );
      if (updatedSess.outcome === 'active') {
        void reassessActiveSessions('catch_recorded').catch((error) => {
          console.error('VisCoach kon de sessie na een vangst niet herbeoordelen:', error);
        });
      }
    }
  };

  const handleSaveLocation = async (locData: FishingLocation) => {
    await db.locations.put(locData);
    // Locaties worden direct bijgewerkt zonder alle sessies en vangsten opnieuw te laden.
    setLocations((previous) => {
      const exists = previous.some((location) => location.id === locData.id);
      return exists
        ? previous.map((location) => location.id === locData.id ? locData : location)
        : [...previous, locData];
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500 flex items-center justify-center animate-pulse mb-4">
          <Fish className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white">Vislogboek</h2>
        <p className="text-xs text-slate-400 mt-1">Lokale database initialiseren...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-600 selection:text-white">
      {!isOnline && (
        <div className="bg-amber-600 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline modus actief — Vislogboek werkt lokaal door met gecachete gegevens.</span>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div
            onClick={() => handleSelectTab('viscoach')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-0.5 shadow-lg shadow-emerald-950/60 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Fish className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight leading-none block">Vislogboek</span>
              <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider block mt-0.5">Prognose & Sessies</span>
            </div>
          </div>

          <Navbar currentTab={currentTab} onSelectTab={handleSelectTab} activeSessionCount={activeSessions.length} />

          <div className="flex items-center gap-2.5">
            {activeSessions.length > 0 && (
              <button
                onClick={() => setCurrentTab('sessions')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold animate-pulse hover:bg-emerald-500/30 transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {activeSessions.length} actieve sessie
              </button>
            )}
            <PWAInstallButton />
            <button
              onClick={() => handleStartSession()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Start</span> Sessie
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 pb-24 md:pb-12 max-w-6xl mx-auto w-full">
        {currentTab === 'viscoach' && (
          <VisCoachView
            locations={locations}
            sessions={sessions}
            catches={catches}
            plannedSessions={plannedSessions}
            onStartSession={handleStartSession}
            onStartPlannedSession={handleStartPlannedSession}
            onSavePlan={handleSavePlannedSession}
            onCancelPlan={handleCancelPlannedSession}
          />
        )}
        {currentTab === 'prognosis' && (
          <PrognosisView locations={locations} sessions={sessions} catches={catches} onStartSession={handleStartSession} showAdvancedDetails={showAdvancedPrognosisDetails} />
        )}
        {currentTab === 'sessions' && (
          <SessionsView
            sessions={sessions}
            catches={catches}
            locations={locations}
            onRefreshData={loadData}
            onStartNewSession={() => handleStartSession()}
            onSaveSession={handleSaveSession}
            sessionRods={sessionRods}
            onSaveCatch={handleSaveCatch}
            coachAdviceRecords={coachAdviceRecords}
            onManualReassessment={handleManualReassessment}
            onUpdateCoachAdvice={handleUpdateCoachAdvice}
          />
        )}
        {currentTab === 'locations' && (
          <LocationsView
            locations={locations}
            sessions={sessions}
            catches={catches}
            onRefreshData={loadData}
            onSaveLocation={handleSaveLocation}
          />
        )}
        {currentTab === 'stats' && (
          <StatsView sessions={sessions} catches={catches} locations={locations} onRefreshData={loadData} showAdvancedDetails={showAdvancedPrognosisDetails} />
        )}
        {currentTab === 'weather' && <WeatherView locations={locations} />}
        {currentTab === 'settings' && (
          <SettingsView locations={locations} sessions={sessions} catches={catches} onRefreshData={loadData} showAdvancedPrognosisDetails={showAdvancedPrognosisDetails} onToggleAdvancedPrognosisDetails={handleToggleAdvancedPrognosisDetails} />
        )}
      </main>

      <VisCoachWelcomeModal
        isOpen={showVisCoachWelcome}
        locations={locations}
        sessions={sessions}
        catches={catches}
        activeSessions={activeSessions}
        onClose={() => setShowVisCoachWelcome(false)}
        onOpenPlan={() => {
          setCurrentTab('viscoach');
          setShowVisCoachWelcome(false);
        }}
        onResumeSession={() => {
          setCurrentTab('sessions');
          setShowVisCoachWelcome(false);
        }}
        onOpenLocations={() => {
          setCurrentTab('locations');
          setShowVisCoachWelcome(false);
        }}
      />

      {isStartingSession && (
        <SessionModal
          locations={locations}
          session={
            prefilledLocationId || prefilledSpecies
              ? ({
                  id: prefilledSessionId || 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                  locationId: prefilledLocationId || locations[0]?.id,
                  targetSpecies: prefilledSpecies ? [prefilledSpecies] : ['Karper'],
                  startTime: new Date().toISOString(),
                  outcome: 'active',
                  rodCount: 2,
                  technique: 'Feeder / Statisch',
                  baitAndFeed: 'Boilies, maden & mais',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as FishingSession)
              : null
          }
          pendingPrognosisSnapshot={pendingPrognosisSnapshot}
          sessionDurationHours={prefilledSessionDurationHours}
          plannedEndTime={prefilledPlannedEndTime}
          createStartSnapshot={true}
          isNewSession={true}
          initialRodDetails={[]}
          onSave={async (newSess, pendingSnapshot, rods, waterMeasurements) => {
            await handleSaveSession(newSess, pendingSnapshot, rods, waterMeasurements);
            setCurrentTab('sessions');
            setIsStartingSession(false);
            setPendingPrognosisSnapshot(undefined);
            setPrefilledSessionDurationHours(undefined);
            setPrefilledPlannedEndTime(null);
            setPrefilledPlannedSessionId(undefined);
            setPrefilledSessionId(undefined);
          }}
          onClose={() => {
            setIsStartingSession(false);
            setPendingPrognosisSnapshot(undefined);
            setPrefilledSessionDurationHours(undefined);
            setPrefilledPlannedEndTime(null);
            setPrefilledPlannedSessionId(undefined);
            setPrefilledSessionId(undefined);
          }}
        />
      )}
    </div>
  );
}