import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CatchItem, FishingLocation, FishingSession, WeatherHourlyForecast } from '../../types';
import { getForecast, getWeatherDescription } from '../../services/weatherService';
import { selectWelcomeGreeting, WelcomeGreeting } from '../../services/visCoachGreetingService';
import { CalendarDays, CloudRain, Fish, MapPin, Play, Sparkles, X } from 'lucide-react';

interface VisCoachWelcomeModalProps {
  isOpen: boolean;
  locations: FishingLocation[];
  sessions: FishingSession[];
  catches: CatchItem[];
  activeSessions: FishingSession[];
  onClose: () => void;
  onOpenPlan: () => void;
  onResumeSession: () => void;
  onOpenLocations: () => void;
}

const LAST_GREETING_KEY = 'vislogboek.viscoach.lastWelcomeGreeting';

function readPreviousGreetingId(): string | null {
  try {
    return window.localStorage.getItem(LAST_GREETING_KEY);
  } catch {
    return null;
  }
}

function storeGreetingId(id: string): void {
  try {
    window.localStorage.setItem(LAST_GREETING_KEY, id);
  } catch {
    // Welkomstteksten blijven werken wanneer lokale opslag niet beschikbaar is.
  }
}

export const VisCoachWelcomeModal: React.FC<VisCoachWelcomeModalProps> = ({
  isOpen,
  locations,
  sessions,
  catches,
  activeSessions,
  onClose,
  onOpenPlan,
  onResumeSession,
  onOpenLocations,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [weather, setWeather] = useState<WeatherHourlyForecast | null>(null);
  const [greeting, setGreeting] = useState<WelcomeGreeting>(() => selectWelcomeGreeting({}));

  const latestCompletedSession = useMemo(() => sessions
    .filter((session) => session.outcome !== 'active' && Number.isFinite(new Date(session.startTime).getTime()))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0] || null, [sessions]);

  const lastSessionTimestamp = latestCompletedSession
    ? new Date(latestCompletedSession.endTime || latestCompletedSession.startTime).getTime()
    : NaN;
  const daysSinceLastSession = Number.isFinite(lastSessionTimestamp)
    ? Math.max(0, Math.floor((Date.now() - lastSessionTimestamp) / 86400000))
    : null;

  const hasRecordedCatch = latestCompletedSession
    ? catches.some((item) => item.sessionId === latestCompletedSession.id)
    : false;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setWeather(null);

    const previousGreetingId = readPreviousGreetingId();
    const updateGreeting = (forecast: WeatherHourlyForecast | null, persist: boolean) => {
      const selected = selectWelcomeGreeting({
        date: new Date(),
        daysSinceLastSession,
        previousSessionOutcome: latestCompletedSession?.outcome ?? null,
        hasRecordedCatch,
        weather: forecast,
      }, previousGreetingId);
      setGreeting(selected);
      if (persist) storeGreetingId(selected.id);
    };

    const location = locations.find((item) =>
      typeof item.latitude === 'number' && Number.isFinite(item.latitude) &&
      typeof item.longitude === 'number' && Number.isFinite(item.longitude)
    );
    updateGreeting(null, !location);
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return () => { cancelled = true; };
    }

    void getForecast(location.latitude, location.longitude, false).then((result) => {
      if (cancelled) return;
      const fetchedAt = new Date(result.fetchedAt).getTime();
      const isFresh = Number.isFinite(fetchedAt) && Date.now() - fetchedAt <= 30 * 60 * 1000;
      if (!isFresh || result.hourly.length === 0) {
        updateGreeting(null, true);
        return;
      }

      const now = Date.now();
      const closest = result.hourly.reduce((best, candidate) =>
        Math.abs(new Date(candidate.time).getTime() - now) < Math.abs(new Date(best.time).getTime() - now)
          ? candidate
          : best
      );
      setWeather(closest);
      updateGreeting(closest, true);
    }).catch((error) => {
      if (!cancelled) updateGreeting(null, true);
      console.warn('Weercontext voor VisCoach-welkomsttekst kon niet worden geladen:', error);
    });

    return () => { cancelled = true; };
  }, [isOpen, locations, daysSinceLastSession, latestCompletedSession?.id, latestCompletedSession?.outcome, hasRecordedCatch]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedLocation = locations.find((item) =>
    typeof item.latitude === 'number' && Number.isFinite(item.latitude) &&
    typeof item.longitude === 'number' && Number.isFinite(item.longitude)
  ) || locations[0] || null;

  const weatherSummary = weather
    ? `${Math.round(weather.temperature)} °C · ${getWeatherDescription(weather.weatherCode)} · wind ${Math.round(weather.windSpeed)} km/u`
    : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-0 sm:p-4 backdrop-blur-md"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="viscoach-welcome-title"
        aria-describedby="viscoach-welcome-greeting"
        className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 text-slate-100 shadow-2xl sm:h-[min(88vh,780px)] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-700/70 px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-3 text-emerald-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Vislogboek</p>
              <h1 id="viscoach-welcome-title" className="text-xl font-black text-white sm:text-2xl">Welkom bij VisCoach</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Welkomstvenster sluiten"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-10 sm:py-10">
          <div className="mx-auto flex h-full max-w-3xl flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <Fish className="h-4 w-4" />
              Jouw vismoment begint met een goed plan
            </div>

            <p id="viscoach-welcome-greeting" className="max-w-2xl text-2xl font-bold leading-snug text-white sm:text-4xl">
              {greeting.text}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              VisCoach helpt je de omstandigheden te bekijken en een praktisch plan te maken. De adviezen gebruiken de bestaande prognose en jouw geregistreerde sessiegegevens.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-950/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-300">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Jouw stek</span>
                </div>
                <p className="font-semibold text-white">{selectedLocation?.name || 'Nog geen stek geregistreerd'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedLocation ? 'Je kunt bij het maken van een plan een andere stek kiezen.' : 'Voeg eerst een visstek toe om een visplan te maken.'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700/80 bg-slate-950/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-sky-300">
                  <CloudRain className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Weer op dit moment</span>
                </div>
                <p className="font-semibold text-white">{weatherSummary || 'Geen actuele weergegevens beschikbaar'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {weather ? `Uurverwachting voor ${selectedLocation?.name || 'je geselecteerde stek'}.` : 'We noemen geen weersomstandigheden wanneer actuele gegevens ontbreken.'}
                </p>
              </div>
            </div>

            {activeSessions.length > 0 && (
              <div className="mt-5 rounded-2xl border border-emerald-500/35 bg-emerald-950/35 p-4">
                <p className="font-bold text-emerald-200">
                  Je hebt {activeSessions.length} actieve {activeSessions.length === 1 ? 'vissessie' : 'vissessies'}.
                </p>
                <p className="mt-1 text-xs text-slate-300">Je kunt verdergaan waar je gebleven bent. De actieve sessie blijft leidend.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-700/70 bg-slate-950/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Sluiten en verder
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {locations.length === 0 && (
              <button
                type="button"
                onClick={onOpenLocations}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <MapPin className="h-4 w-4" /> Stek toevoegen
              </button>
            )}
            {activeSessions.length > 0 && (
              <button
                type="button"
                onClick={onResumeSession}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <Play className="h-4 w-4 fill-current" /> Sessie hervatten
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPlan}
              disabled={locations.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <CalendarDays className="h-4 w-4" /> Maak mijn visplan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
