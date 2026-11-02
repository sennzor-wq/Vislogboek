import React, { useState, useEffect } from 'react';
import { db, initializeDatabase, syncSessionPresenceObservations } from './db/db';
import { FishingLocation, FishingSession, CatchItem, FishSpecies } from './types';
import { PendingPrognosisSnapshot, saveSessionWithPrognosisSnapshot } from './services/prognosisEngine';
import { Navbar, TabType } from './components/Navbar';
import { PrognosisView } from './components/prognosis/PrognosisView';
import { SessionsView } from './components/sessions/SessionsView';
import { LocationsView } from './components/locations/LocationsView';
import { StatsView } from './components/stats/StatsView';
import { WeatherView } from './components/weather/WeatherView';
import { SettingsView } from './components/settings/SettingsView';
import { SessionModal } from './components/sessions/SessionModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  Play,
  WifiOff,
  Fish,
} from 'lucide-react';
import { autoSyncSessionOutcomeToSnapshot } from './services/evaluationEngine';
import { startWeatherAutoRefresh } from './services/weatherService';

export default function App() {
  const isOnline = useOnlineStatus();
  const [currentTab, setCurrentTab] = useState<TabType>('prognosis');
  const [loading, setLoading] = useState<boolean>(true);
  const [locations, setLocations] = useState<FishingLocation[]>([]);
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [catches, setCatches] = useState<CatchItem[]>([]);
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
      const [allLocations, allSessions, allCatches] = await Promise.all([
        db.locations.toArray(),
        db.sessions.reverse().sortBy('startTime'),
        db.catches.reverse().sortBy('timestamp'),
      ]);
      setLocations(allLocations);
      setSessions(allSessions);
      setCatches(allCatches);
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

  const activeSessions = sessions.filter((s) => s.outcome === 'active');

  const handleStartSession = (species?: FishSpecies, locationId?: string, pendingSnapshot?: PendingPrognosisSnapshot) => {
    setPrefilledSpecies(species);
    setPrefilledLocationId(locationId);
    setPendingPrognosisSnapshot(pendingSnapshot);
    setIsStartingSession(true);
  };

  const handleSaveSession = async (
    sessionData: Partial<FishingSession>,
    pendingSnapshot?: PendingPrognosisSnapshot
  ) => {
    if (!sessionData.id) return;

    let savedSession: FishingSession | undefined;
    if (pendingSnapshot && sessionData.outcome === 'active') {
      // Sessie en vooraf gekozen prognose worden atomair vastgelegd.
      savedSession = await saveSessionWithPrognosisSnapshot(
        sessionData as FishingSession,
        pendingSnapshot
      );
    } else {
      const hasPresenceObservations = Object.prototype.hasOwnProperty.call(sessionData, 'presenceObservations');
      await db.transaction('rw', db.sessions, db.presenceObservations, async () => {
        const existing = await db.sessions.get(sessionData.id!);
        const mergedSession = existing
          ? ({ ...existing, ...sessionData } as FishingSession)
          : (sessionData as FishingSession);
        await db.sessions.put(mergedSession);
        if (hasPresenceObservations) {
          await syncSessionPresenceObservations(mergedSession);
        }
      });
      savedSession = await db.sessions.get(sessionData.id);
    }

    // Automatische uitkomstkoppeling naar de voorwaarts opgeslagen momentopname.
    if (savedSession?.snapshotId) {
      await autoSyncSessionOutcomeToSnapshot(savedSession);
    }

    // Werk alleen de gewijzigde sessie bij; haal niet alle tabellen opnieuw op.
    if (savedSession) {
      setSessions((previous) =>
        [...previous.filter((session) => session.id !== savedSession.id), savedSession]
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      );
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
            onClick={() => setCurrentTab('prognosis')}
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

          <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} activeSessionCount={activeSessions.length} />

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
            onSaveCatch={handleSaveCatch}
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

      {isStartingSession && (
        <SessionModal
          locations={locations}
          session={
            prefilledLocationId || prefilledSpecies
              ? ({
                  id: 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
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
          onSave={async (newSess, pendingSnapshot) => {
            await handleSaveSession(newSess, pendingSnapshot);
            setCurrentTab('sessions');
            setIsStartingSession(false);
            setPendingPrognosisSnapshot(undefined);
          }}
          onClose={() => {
            setIsStartingSession(false);
            setPendingPrognosisSnapshot(undefined);
          }}
        />
      )}
    </div>
  );
}