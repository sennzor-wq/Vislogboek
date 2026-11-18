import React, { useState, useEffect } from 'react';
import {
  FishSpecies,
  ALL_SPECIES,
  DayPrognosis,
  TimeSlot,
  FishingLocation,
  FishingSession,
  TimeSlotAnalysis,
  PresenceObservationType,
  CatchItem,
  WeatherHourlyForecast,
  PrognosisInputContext,
} from '../../types';
import { getForecast, WEATHER_UPDATED_EVENT, formatAmsterdamDate } from '../../services/weatherService';
import { calculateDayPrognosis, createManualWaterTemperatureInput, createPrognosisHistoryFeatureSnapshot, createPrognosisHistoryFingerprint, createPrognosisInputFingerprint, PendingPrognosisSnapshot } from '../../services/prognosisEngine';
import { getWaterTemperatureCalibration } from '../../services/evaluationEngine';
import { SPECIES_PROFILES } from '../../services/fishProfiles';
import { getSpeciesFeedingEvidenceContext } from '../../services/feedingEvidenceService';
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Wind,
  Gauge,
  Thermometer,
  CloudRain,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Sliders,
  BookOpen,
  Fish,
  Utensils,
  Waves,
  Eye,
  Compass,
  Navigation,
} from 'lucide-react';
import { COMPASS_DEGREES_MAP } from '../../services/bankWindEngine';
import { db } from '../../db/db';
import { CompassDirection, COMPASS_DIRECTIONS } from '../../types';
import { collectHistoricalWaterTemperatureObservations } from '../../services/waterTemperatureHistory';

interface PrognosisViewProps {
  locations: FishingLocation[];
  sessions: FishingSession[];
  catches?: CatchItem[];
  onStartSession: (species?: FishSpecies, locationId?: string, pendingSnapshot?: PendingPrognosisSnapshot) => void;
  showAdvancedDetails: boolean;
}

export const PrognosisView: React.FC<PrognosisViewProps> = ({
  locations,
  sessions,
  catches,
  onStartSession,
  showAdvancedDetails,
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | 'Algemeen'>('Karper');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(3);
  const [prebaitAvailableDays, setPrebaitAvailableDays] = useState<number>(2);
  const [prebaitFeedPreference, setPrebaitFeedPreference] = useState<string>('');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('');
  const [selectedPresenceObs, setSelectedPresenceObs] =
    useState<PresenceObservationType>('onbekend');
  const [waterTempInput, setWaterTempInput] = useState<string>('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [dayPrognoses, setDayPrognoses] = useState<DayPrognosis[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<WeatherHourlyForecast[]>([]);
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<string>('');
  const [isCachedWeather, setIsCachedWeather] = useState<boolean>(false);
  const [expandedSlots, setExpandedSlots] = useState<Record<TimeSlot, boolean>>({
    Ochtend: false,
    Avond: false,
    Middag: false,
    Nacht: false,
  });
  const [showAssumptionsModal, setShowAssumptionsModal] = useState<boolean>(false);
  const [showWaterFacingPicker, setShowWaterFacingPicker] = useState<boolean>(false);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  const fetchAndCalculatePrognoses = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const lat = selectedLoc?.latitude ?? 51.961;
      const lon = selectedLoc?.longitude ?? 5.228;

      const weather = await getForecast(lat, lon, forceRefresh);
      setHourlyForecast(weather.hourly);
      // Eén IndexedDB-read per prognoseverversing; de lichte kalibratie draait lokaal in geheugen.
      const storedSnapshots = await db.prognosisSnapshots.toArray();
      const historicalWaterTemperatures = collectHistoricalWaterTemperatureObservations(
        sessions,
        storedSnapshots,
        locations
      );
      setWeatherUpdatedAt(weather.fetchedAt);
      setIsCachedWeather(weather.isFromCache);

      const parsedWaterTemp =
        waterTempInput.trim() !== '' ? parseFloat(waterTempInput.replace(',', '.')) : null;
      const validWaterTemp = parsedWaterTemp !== null && !isNaN(parsedWaterTemp) ? parsedWaterTemp : null;

      // Genereer de komende 8 dagen (vandaag + 7 dagen)
      const prognosesList: DayPrognosis[] = [];
      const baseDate = new Date();

      for (let i = 0; i < 8; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const dateStr = formatAmsterdamDate(d);

        const prog = calculateDayPrognosis(
          dateStr,
          weather.hourly,
          selectedSpecies,
          sessions,
          weather.fetchedAt,
          validWaterTemp,
          baseDate,
          {
            sessionDurationHours: selectedDurationHours,
            locationId: selectedLocationId,
            location: selectedLoc,
            waterTemperatureCalibration: getWaterTemperatureCalibration(storedSnapshots, selectedLocationId, dateStr),
            historicalWaterTemperatures,
            dailySolarTimes: weather.dailySummaries,
            presenceObservation: selectedPresenceObs,
            catches,
            prebaitOptions: {
              availableDaysBefore: prebaitAvailableDays,
              preferredFeedType: prebaitFeedPreference,
              technique: selectedTechnique,
              sessionDurationHours: selectedDurationHours,
              userWaterTemp: validWaterTemp,
            },
          }
        );
        prognosesList.push(prog);
      }

      setDayPrognoses(prognosesList);
    } catch (e) {
      console.error('Fout bij berekenen visprognose:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAndCalculatePrognoses(false);
    const handleWeatherUpdated = () => void fetchAndCalculatePrognoses(false);
    window.addEventListener(WEATHER_UPDATED_EVENT, handleWeatherUpdated);
    return () => window.removeEventListener(WEATHER_UPDATED_EVENT, handleWeatherUpdated);
  }, [
    selectedSpecies,
    selectedLocationId,
    sessions,
    catches,
    waterTempInput,
    selectedDurationHours,
    selectedPresenceObs,
    prebaitAvailableDays,
    prebaitFeedPreference,
    selectedTechnique,
  ]);

  const handleQuickSetWaterFacing = async (dir: CompassDirection) => {
    if (!selectedLoc?.id) return;
    await db.locations.update(selectedLoc.id, {
      waterFacingDirection: dir,
      updatedAt: new Date().toISOString(),
    });
    selectedLoc.waterFacingDirection = dir;
    await fetchAndCalculatePrognoses(false);
  };

  const activeDayProg = dayPrognoses[selectedDayIndex] || dayPrognoses[0];

  // Standaard uitsluitend het Aanbevolen Toekomstige Tijdvak uitgeklapt laten zien
  useEffect(() => {
    if (activeDayProg) {
      const best = activeDayProg.bestTimeSlot;
      setExpandedSlots({
        Nacht: best === 'Nacht',
        Ochtend: best === 'Ochtend',
        Middag: best === 'Middag',
        Avond: best === 'Avond',
      });
    }
  }, [activeDayProg?.date, activeDayProg?.bestTimeSlot]);

  const toggleSlot = (slot: TimeSlot) => {
    setExpandedSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  const currentProfile =
    selectedSpecies !== 'Algemeen'
      ? SPECIES_PROFILES[selectedSpecies]
      : SPECIES_PROFILES['Overig'];

  // Literatuurcontext blijft volledig gescheiden van prognose-uitkomsten.
  const feedingEvidenceContext = selectedSpecies !== 'Algemeen'
    ? getSpeciesFeedingEvidenceContext(selectedSpecies)
    : null;
  const feedingEvidenceSections = feedingEvidenceContext ? [
    {
      title: 'Gemeten voedselopname en voedingsritme',
      description: 'Onderzoek dat daadwerkelijk voedselopname of een voedingsritme heeft gemeten.',
      entries: Array.from(new Map([...feedingEvidenceContext.feedingIntensity, ...feedingEvidenceContext.feedingRhythm].map((entry) => [entry.id, entry] as const)).values()),
    },
    {
      title: 'Foerageergedrag',
      description: 'Waargenomen graas- of zoekgedrag; dit is niet automatisch hetzelfde als voedselopname.',
      entries: feedingEvidenceContext.foragingBehavior,
    },
    {
      title: 'Dieet en prooikeuze',
      description: 'Wat de vis eet of selecteert; dit bewijst geen hogere voedingsactiviteit op een bepaald tijdstip.',
      entries: Array.from(new Map([...feedingEvidenceContext.dietComposition, ...feedingEvidenceContext.preySelection].map((entry) => [entry.id, entry] as const)).values()),
    },
  ] : [];

  const handleStartSessionFromPrognosis = async () => {
    if (!activeDayProg || !selectedLoc) return;
    // Alleen tijdelijke formulierdata; IndexedDB wordt pas bij definitief opslaan gewijzigd.
    const storedSnapshots = await db.prognosisSnapshots.toArray();
    const historicalWaterTemperatures = collectHistoricalWaterTemperatureObservations(
      sessions,
      storedSnapshots,
      locations
    );
    const calculatedAt = new Date().toISOString();
    const parsedManualWaterTemp = waterTempInput.trim() !== '' ? parseFloat(waterTempInput.replace(',', '.')) : null;
    const manualWaterTemperatureInput = createManualWaterTemperatureInput(
      parsedManualWaterTemp !== null && Number.isFinite(parsedManualWaterTemp) ? parsedManualWaterTemp : null,
      calculatedAt
    );
    const historyFeatures = createPrognosisHistoryFeatureSnapshot(sessions, catches ?? []);
    const inputContext: PrognosisInputContext = {
      calculatedAt,
      manualWaterTemperatureInput,
      waterTemperatureCalibration: getWaterTemperatureCalibration(storedSnapshots, selectedLoc.id, activeDayProg.date),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
      targetDate: activeDayProg.date,
      targetSpecies: selectedSpecies,
      sessionDurationHours: selectedDurationHours,
      technique: selectedTechnique ?? null,
      location: {
        id: selectedLoc.id,
        latitude: selectedLoc.latitude,
        longitude: selectedLoc.longitude,
        waterType: selectedLoc.waterType,
        waterDepth: selectedLoc.waterDepth,
        waterFacingDirection: selectedLoc.waterFacingDirection,
        habitatFeatures: selectedLoc.habitatFeatures,
      },
      historicalSessionIds: historyFeatures.historicalSessionFeatures!.map((item) => item.id),
      catchRecordIds: historyFeatures.historicalCatchFeatures!.map((item) => item.id),
      observationIds: [],
      ...historyFeatures,
      presenceObservation: selectedPresenceObs,
      historicalWaterTemperatureSamples: historicalWaterTemperatures,
      historyFingerprint: createPrognosisHistoryFingerprint(sessions, catches ?? [], [], historicalWaterTemperatures),
      historySummary: {
        sessionCount: historyFeatures.historicalSessionFeatures!.length,
        catchRecordCount: historyFeatures.historicalCatchFeatures!.length,
        observationCount: 0,
        historicalWaterTemperatureSampleCount: historicalWaterTemperatures.length,
      },
      weatherFetchedAt: weatherUpdatedAt || undefined,
    };
    const pendingSnapshot: PendingPrognosisSnapshot = {
      prognosis: activeDayProg,
      durationHours: selectedDurationHours,
      durationKnown: true,
      weatherInput: hourlyForecast,
      inputContext,
      inputFingerprint: createPrognosisInputFingerprint({ inputContext, weather: hourlyForecast, technique: selectedTechnique ?? null }),
      runKind: 'session_start',
      locationName: selectedLoc.name,
      chosenSlot: activeDayProg.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag'
        ? (activeDayProg.bestTimeSlot as TimeSlot)
        : undefined,
    };
    onStartSession(
      selectedSpecies !== 'Algemeen' ? selectedSpecies : undefined,
      selectedLocationId,
      pendingSnapshot
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner / Filters */}
      <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-4 sm:p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/70">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Persoonlijke Visprognose
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {showAdvancedDetails
                ? 'Drie gescheiden uitkomsten: thermische activiteitspotentie, persoonlijke vangstkans en beste toekomstige vistijd.'
                : 'Bekijk de verwachte activiteit, je persoonlijke vangstkans en een geschikt vistijdvak.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchAndCalculatePrognoses(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-xs sm:text-sm font-medium text-slate-200 transition border border-slate-600/60 cursor-pointer disabled:opacity-50"
              title="Haal de nieuwste weersvoorspelling op via Open-Meteo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Weer vernieuwen
            </button>

            {showAdvancedDetails && (
              <button
                onClick={() => setShowAssumptionsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-xs sm:text-sm font-medium text-emerald-300 transition border border-emerald-700/50 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Soortprofiel & Bronnen
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 pt-4">
          {/* Vissoort selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gekozen Vissoort *
            </label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="Algemeen">Algemeen (geen specifieke doelsoort)</option>
              {ALL_SPECIES.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Stek / Locatie */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Visstek / Locatie
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.isBenchmark ? '⭐ (Benchmark)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Gewenste Sessieduur */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Geplande Sessieduur
            </label>
            <select
              value={selectedDurationHours}
              onChange={(e) => setSelectedDurationHours(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value={1}>1 uur (korte sessie)</option>
              <option value={2}>2 uur</option>
              <option value={3}>3 uur (standaard)</option>
              <option value={4}>4 uur</option>
              <option value={5}>5 uur</option>
              <option value={6}>6 uur (halve dag)</option>
              <option value={8}>8 uur (lange sessie)</option>
              <option value={10}>10 uur</option>
              <option value={12}>12 uur (halve etmaal)</option>
              <option value={24}>24 uur (volledige etmaal)</option>
            </select>
          </div>

          {/* Vistechniek voor het onderscheid tussen instant voer en voorvoeren */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vistechniek (optioneel)
            </label>
            <select
              value={selectedTechnique}
              onChange={(e) => setSelectedTechnique(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">Niet gekozen</option>
              <option value="Method feeder">Method feeder</option>
              <option value="Feeder">Feedervissen</option>
              <option value="Karper statisch">Karper statisch</option>
              <option value="Penvisserij">Penvisserij</option>
              <option value="Anders">Anders</option>
            </select>
          </div>

          {/* Viswaarneming op de stek */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Viswaarneming</span>
              <span className="text-[10px] text-cyan-400">Optioneel</span>
            </label>
            <select
              value={selectedPresenceObs}
              onChange={(e) => setSelectedPresenceObs(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="onbekend">Niet geobserveerd</option>
              <option value="vis_springen_rollen">Vis zien springen / rollen</option>
              <option value="aasbellen_voedselactiviteit">Aasbellen / bodemactiviteit</option>
              <option value="aanbeten">Recente aanbeten / lijnzwemmers</option>
              <option value="recente_vangst_stek">Recente vangst op stek (&lt;48u)</option>
              <option value="geen_waarnemingen">Geen activiteit gezien</option>
            </select>
          </div>

          {/* Handmatige Watertemperatuur (Optioneel) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Watertemp. (°C)</span>
              <span className="text-[10px] text-emerald-400">Gemeten aan stek</span>
            </label>
            <input
              type="text"
              placeholder="bv. 14.5 (leeg = modelschatting)"
              value={waterTempInput}
              onChange={(e) => setWaterTempInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Waarschuwing als Algemeen gekozen is */}
        {selectedSpecies === 'Algemeen' && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Er is geen specifieke vissoort geselecteerd. De berekening gebruikt een algemeen gemiddeld profiel zonder soortspecifieke fysiologische responscurve.
            </span>
          </div>
        )}
      </div>

      {/* 8-Dagen Strip (Vandaag + komende 7 dagen) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            Kies een dag (Vandaag + 7 dagen vooruit)
          </span>
          {weatherUpdatedAt && (
            <span>
              Weer: {new Date(weatherUpdatedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              {isCachedWeather ? ' (gecached)' : ' (live Open-Meteo)'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {dayPrognoses.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const scoreColor = day.activityScoreAvailable === false
              ? 'text-slate-400 bg-slate-700/40 border-slate-600'
              : day.activityScore >= 7.0
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : day.activityScore >= 4.5
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition text-center cursor-pointer ${
                  isSelected
                    ? 'bg-slate-700/90 border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-800/70 border-slate-700 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-[11px] font-medium text-slate-400">
                  {idx === 0 ? 'Vandaag' : idx === 1 ? 'Morgen' : day.dayName.split(' ')[0]}
                </span>
                <span className="text-xs font-bold text-slate-200 mt-0.5">
                  {new Date(day.date).getDate()}{' '}
                  {new Intl.DateTimeFormat('nl-NL', { month: 'short' }).format(new Date(day.date))}
                </span>
                <div
                  className={`mt-1.5 px-2 py-0.5 rounded-lg text-xs font-black border ${scoreColor}`}
                >
                  {day.activityScoreAvailable === false ? 'N/B' : day.activityScore.toFixed(1)}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">
                  {day.bestTimeSlot === 'Geen toekomstig tijdvak meer vandaag' ? 'Verstreken' : day.bestTimeSlot}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drie Afzonderlijke Voorspellingen Panel */}
      {activeDayProg && (
        <div className="space-y-6">
          {/* Hoofdsectie: 3 Gescheiden Resultaten (Sectie 2 Blueprint) */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/80 p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                    Prognose voor {activeDayProg.dayName}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold">
                    {activeDayProg.species}
                  </span>
                  <span className="text-xs text-slate-400">
                    Stek: {selectedLoc?.name}
                  </span>
                  <span className="text-xs text-cyan-400 font-medium">
                    Sessieduur: {selectedDurationHours} uur
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-1.5">
                  {activeDayProg.summaryRationale}
                </h2>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
                <button
                  onClick={handleStartSessionFromPrognosis}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  Start Sessie op dit moment
                </button>
              </div>
            </div>

            {showAdvancedDetails && activeDayProg.weatherDataQuality && (
              <div className={`rounded-xl border p-3 text-xs ${activeDayProg.weatherDataQuality.status === 'Volledig' ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200' : activeDayProg.weatherDataQuality.status === 'Gedeeltelijk' ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' : 'bg-rose-950/30 border-rose-800/50 text-rose-200'}`}>
                <strong>Weergegevens: {activeDayProg.weatherDataQuality.status}</strong>
                <span className="ml-2">Minimale velddekking: {activeDayProg.weatherDataQuality.coveragePercent}% ({activeDayProg.weatherDataQuality.validHours}/24 uur).</span>
                {activeDayProg.weatherDataQuality.missingFields.length > 0 && <span className="block mt-1">Onvoldoende of ontbrekend: {activeDayProg.weatherDataQuality.missingFields.join(', ')}.</span>}
                {activeDayProg.activityScoreAvailable === false && <span className="block mt-1 font-semibold">Thermische activiteitspotentie en beste vistijd zijn niet betrouwbaar te bepalen, omdat de watertemperatuur niet gemeten of verantwoord geschat kon worden.</span>}
              </div>
            )}

            {!showAdvancedDetails && activeDayProg.activityScoreAvailable === false && (
              <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-xs text-amber-200">
                Onvoldoende watertemperatuurgegevens om activiteit en beste vistijd betrouwbaar te bepalen.
              </div>
            )}

            {/* De 3 Gescheiden Voorspellingen Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* VOORSPELLING A: Thermische activiteitspotentie */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    <Gauge className="w-4 h-4" />
                    Activiteitspotentie
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {activeDayProg.activityScoreAvailable === false ? 'N/B' : activeDayProg.activityScore.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      / 10
                    </span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      activeDayProg.advice === 'Gunstig'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : activeDayProg.advice === 'Gemiddeld'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {activeDayProg.activityScoreAvailable === false ? 'Onvoldoende gegevens' : `${activeDayProg.advice} biologisch perspectief`}
                  </span>

                  {activeDayProg.presenceInfo && (
                    <div className="mt-2.5 p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-start gap-1.5">
                      <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                      <span>{activeDayProg.presenceInfo.note}</span>
                    </div>
                  )}
                </div>

                {showAdvancedDetails && (
<div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <strong>Modelmatige indicatie:</strong> Deze score weerspiegelt uitsluitend de voorlopige soortspecifieke temperatuurrespons op gemeten of geschatte watertemperatuur. Wind, druk, seizoen, tijdstip, bewolking en neerslag zijn context en veranderen deze score niet. Dit is geen gemeten visactiviteit, voedingsactiviteit of vangstkans.
                </div>
)}
              </div>

              {/* VOORSPELLING B: Geschatte Vangstkans */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Persoonlijke vangkans
                  </div>

                  {activeDayProg.personalCatchChance !== null ? (
                    <div>
                      <div className="text-3xl sm:text-4xl font-black text-cyan-300">
                        {activeDayProg.personalCatchChance}%
                      </div>
                      {showAdvancedDetails && activeDayProg.catchUncertaintyInterval && (
                        <div
                          className="text-xs font-semibold text-cyan-400/90 mt-1 cursor-help"
                          title="Binomiaal Wilson-interval van het historische sessiesucces (geen betrouwbaarheidsinterval van de Poisson-duurkans)"
                        >
                          95% Wilson-interval basissessies: [{activeDayProg.catchUncertaintyInterval[0]}% – {activeDayProg.catchUncertaintyInterval[1]}%]
                        </div>
                      )}
                      {showAdvancedDetails && (
                        <div
                          className="text-[11px] text-slate-300 mt-1"
                          title="Categorie op basis van het aantal sessies met bekende duur en bruikbare vangstaantallen; geen statistische betrouwbaarheid van de voorspelde Poisson-kans."
                        >
                          Steekproefbasis: <strong className="text-white">{activeDayProg.personalCatchConfidence}</strong> ({activeDayProg.poissonSessionCount ?? activeDayProg.relevantSessionCount} bruikbare sessies)
                        </div>
                      )}
                      {showAdvancedDetails && activeDayProg.historicalCatchRate && activeDayProg.historicalCatchRate.totalSessions > 0 && (
                        <div className="text-[11px] text-slate-300 mt-1">
                          Historisch vangstpercentage: <strong className="text-white">{activeDayProg.historicalCatchRate.label}</strong>
                        </div>
                      )}
                      {activeDayProg.expectedCatches !== null && activeDayProg.expectedCatches !== undefined && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Verwachte vangstopbrengst:</span>
                          <span className="font-bold text-cyan-200">
                            ~{activeDayProg.expectedCatches} {activeDayProg.species.toLowerCase()} over {activeDayProg.plannedDurationHours ?? selectedDurationHours}u
                            {activeDayProg.hourlyCatchRate !== null && activeDayProg.hourlyCatchRate !== undefined && (
                              {showAdvancedDetails && (
                                <span className="text-[10px] text-cyan-300/80 font-normal ml-1">
                                  (vangsttempo: ~{activeDayProg.hourlyCatchRate}/u)
                                </span>
                              )}
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-base font-bold text-slate-300">
                        Onvoldoende gegevens
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Nog onvoldoende vergelijkbare eigen sessies om een persoonlijke vangstkans te berekenen.
                      </p>
                      {showAdvancedDetails && (
                        activeDayProg.historicalCatchRate && activeDayProg.historicalCatchRate.totalSessions > 0 ? (
                          <div className="text-[11px] text-slate-300 mt-2">
                            Historisch vangstpercentage: <strong className="text-white">{activeDayProg.historicalCatchRate.label}</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              (Minimaal 5 sessies vereist voor Poisson-vangsttempo en vangkans)
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-2">
                            Nog geen eerdere bevestigde sessies voor deze doelsoort en stek.
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {showAdvancedDetails && (
<div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  Kans op minimaal één doelvis bij een geplande duur van {activeDayProg.plannedDurationHours ?? selectedDurationHours} uur (Poisson-model). Vangsttempo blijft constant; cumulatieve kans en verwachte vangstopbrengst stijgen met de duur.
                </div>
)}
              </div>

              {/* VOORSPELLING C: Beste Toekomstige Vistijd */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4" />
                    Beste vistijd
                  </div>

                  {activeDayProg.activityScoreAvailable === false ? (
                    <div className="text-sm font-bold text-slate-300">Niet betrouwbaar te bepalen</div>
                  ) : activeDayProg.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag' && activeDayProg.bestTimeSlot !== 'Geen betekenisvol onderscheid' ? (
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        {activeDayProg.bestTimeSlot}
                      </div>
                      <div className="text-xs text-amber-300 font-semibold mt-0.5">
                        {activeDayProg.timeSlots[activeDayProg.bestTimeSlot]?.timeRange}
                        {showAdvancedDetails && `(Score: ${activeDayProg.timeSlots[activeDayProg.bestTimeSlot]?.activityScore}/10)`}
                      </div>
                      {showAdvancedDetails && activeDayProg.alternativeTimeSlots.length > 0 && (
                        <div className="text-[11px] text-slate-300 mt-1.5">
                          Alternatief: {activeDayProg.alternativeTimeSlots.join(', ')}
                        </div>
                      )}
                    </div>
                  ) : activeDayProg.bestTimeSlot === 'Geen betekenisvol onderscheid' ? (
                    <div>
                      <div className="text-sm font-bold text-slate-300">Geen betekenisvol onderscheid</div>
                      {showAdvancedDetails && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          De beschikbare tijdvakken hebben geen aantoonbaar verschil in de huidige thermische activiteitspotentie. Er wordt daarom geen willekeurig beste tijdvak aangewezen.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-bold text-slate-300">
                        Geen toekomstig tijdvak meer vandaag
                      </div>
                      {showAdvancedDetails && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Alle tijdvakken voor vandaag zijn verstreken. Vergelijk de tijdvakken van morgen voor de beste toekomstige opties.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {showAdvancedDetails && (
<div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <strong>Toekomstgericht:</strong> Uitsluitend niet-verstreken tijdvakken worden vergeleken. Deze aanbeveling biedt geen absolute vangstgarantie.
                </div>
)}
              </div>
            </div>

            {showAdvancedDetails && (
              {/* Biologische voedingsliteratuur: informatief, nooit een prognosescore */}
              <section className="rounded-2xl bg-slate-900/80 border border-amber-800/40 p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-800/50 text-amber-300">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                      Wat zegt onderzoek over voeding bij {selectedSpecies === 'Algemeen' ? 'vissen' : selectedSpecies}?
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Biologische achtergrond uit gepubliceerde studies, geen actuele voedingsvoorspelling voor deze stek of datum.
                      De onderzochte populaties, wateren en omstandigheden kunnen afwijken van jouw situatie.
                    </p>
                  </div>
                </div>
  
                {feedingEvidenceContext ? (
                  <>
                    {feedingEvidenceSections.some((group) => group.entries.length > 0) ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        {feedingEvidenceSections.filter((group) => group.entries.length > 0).map((group) => (
                          <div key={group.title} className="rounded-xl bg-slate-800/70 border border-slate-700/70 p-3 space-y-2">
                            <div>
                              <h4 className="text-[11px] font-bold text-slate-200">{group.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{group.description}</p>
                            </div>
                            {group.entries.map((entry) => (
                              <details key={entry.id} className="rounded-lg bg-slate-950/60 border border-slate-700/60 p-2">
                                <summary className="text-[11px] font-semibold text-cyan-200 cursor-pointer">
                                  {entry.topic}
                                </summary>
                                <div className="pt-2 space-y-2">
                                  <p className="text-[11px] text-slate-300 leading-relaxed">{entry.summary}</p>
                                  {entry.limitations.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">Beperkingen</p>
                                      <ul className="list-disc pl-4 mt-1 space-y-1 text-[10px] text-slate-400">
                                        {entry.limitations.map((limitation, index) => (
                                          <li key={index}>{limitation}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {entry.sourceReferences.length > 0 && (
                                    <p className="text-[10px] text-slate-500 break-words">
                                      Bron: {entry.sourceReferences.join(' · ')}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-slate-500">
                                    Bewijsstatus: {entry.evidenceStrength === 'strong' ? 'sterk' : entry.evidenceStrength === 'moderate' ? 'matig' : entry.evidenceStrength === 'limited' ? 'beperkt' : 'nog onbekend'} · {entry.approvedForPrediction ? 'beoordeeld voor voorspellingsgebruik' : 'nog niet vrijgegeven als voorspellingsfactor'}
                                  </p>
                                </div>
                              </details>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Er is nog geen soortspecifiek voedings- of foerageeronderzoek in het register opgenomen.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Selecteer een specifieke doelsoort om de bijbehorende onderzoeksbronnen en hun beperkingen te bekijken.
                  </p>
                )}
  
                <p className="text-[10px] text-slate-500 border-t border-slate-700/70 pt-2">
                  Deze literatuurcontext verandert de thermische activiteitspotentie, beste vistijd en persoonlijke vangstkans niet.
                </p>
              </section>
            )}

            {!showAdvancedDetails && activeDayProg.thermalAnalysis && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white">Watertemperatuur</span>
                  <span className="text-cyan-300">{activeDayProg.thermalAnalysis.hasMeasuredWaterTemp && activeDayProg.thermalAnalysis.measuredWaterTemp !== null ? `${activeDayProg.thermalAnalysis.measuredWaterTemp} °C gemeten` : activeDayProg.thermalAnalysis.estimatedWaterTemp !== null ? `circa ${activeDayProg.thermalAnalysis.estimatedWaterTemp} °C geschat` : "onvoldoende gegevens"}</span>
                </div>
                <span className="text-slate-300">Watertrend: {activeDayProg.thermalAnalysis.trend.toLowerCase()}</span>
                {showAdvancedDetails && (
                  <span
                    className="text-slate-400"
                    title="Kwalitatieve databasis op basis van meetbron, dekking en ouderdom; geen statistisch betrouwbaarheidspercentage."
                  >Databasis watertemperatuur: {activeDayProg.thermalAnalysis.trendConfidence}</span>
                )}
              </div>
            )}
            {showAdvancedDetails && (<>
            {/* Thermische Waterontwikkeling & Traagheid (Sectie 6-10) */}
            {activeDayProg.thermalAnalysis && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Thermische Ontwikkeling van het Viswater
                    </span>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold self-start sm:self-auto ${
                      activeDayProg.thermalAnalysis.trend === 'Waarschijnlijke opwarming'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : activeDayProg.thermalAnalysis.trend === 'Waarschijnlijke afkoeling'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : activeDayProg.thermalAnalysis.trend === 'Ongeveer stabiel'
                        ? 'bg-slate-700 text-slate-300 border border-slate-600'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {activeDayProg.thermalAnalysis.trend} ({activeDayProg.thermalAnalysis.trendConfidence} betrouwbaarheid)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Lokale watertemperatuurmeting</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {activeDayProg.thermalAnalysis.hasMeasuredWaterTemp && activeDayProg.thermalAnalysis.measuredWaterTemp !== null
                        ? `${activeDayProg.thermalAnalysis.measuredWaterTemp} °C (directe meting)`
                        : 'Niet gemeten (leeg gebleven)'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {activeDayProg.thermalAnalysis.hasMeasuredWaterTemp
                        ? 'Geverifieerd aan de stek'
                        : 'Nooit kunstmatig als 0 °C opgeslagen'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">{activeDayProg.thermalAnalysis.hasMeasuredWaterTemp ? "Watertemperatuur in model" : "Watertemperatuurschatting"}</span>
                    <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                      {activeDayProg.thermalAnalysis.estimatedWaterTemp !== null
                        ? `${activeDayProg.thermalAnalysis.hasMeasuredWaterTemp ? '' : '~'}${activeDayProg.thermalAnalysis.estimatedWaterTemp} °C`
                        : 'Onvoldoende data'}
                      {activeDayProg.thermalAnalysis.estimatedRange && (
                        <span className="text-xs font-normal text-slate-400 ml-1.5">
                          [{activeDayProg.thermalAnalysis.estimatedRange[0]} – {activeDayProg.thermalAnalysis.estimatedRange[1]} °C]
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {activeDayProg.thermalAnalysis.hasMeasuredWaterTemp
                        ? 'Lokale meting is leidend; model- en historische schattingen worden niet gebruikt.'
                        : activeDayProg.thermalAnalysis.waterTemperatureStatus === 'estimated_from_history'
                        ? 'Historische basis: ' + (activeDayProg.thermalAnalysis.historicalWaterTemperatureSamples ?? 0) + ' echte metingen, gecombineerd met weersontwikkeling.'
                        : activeDayProg.thermalAnalysis.waterTemperatureStatus === 'estimated_from_measurement'
                        ? 'Modelschatting vanaf de laatste lokale meting, aangepast met beschikbare weersgegevens.'
                        : activeDayProg.thermalAnalysis.waterTemperatureStatus === 'estimated_from_weather'
                        ? activeDayProg.thermalAnalysis.estimatedRange
                          ? 'Weerafgeleide modelschatting; geen historische watertemperatuurmetingen beschikbaar.'
                          : 'Indicatieve weerafgeleide schatting zonder lokale waterreferentie; absolute temperatuur heeft hoge, niet-gekwantificeerde onzekerheid.'
                        : 'Geen betrouwbare watertemperatuurschatting beschikbaar.'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Watermassa & Traagheid</span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                      {activeDayProg.thermalAnalysis.inertiaFactor}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {activeDayProg.thermalAnalysis.dataPointsAvailable.depthKnown
                        ? `Waterdiepte: ${activeDayProg.thermalAnalysis.dataPointsAvailable.waterDepthMeters} m`
                        : 'Waterdiepte onbekend; er is geen standaarddiepte aangenomen'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p>
                    <strong>Verloop & Analyse:</strong> {activeDayProg.thermalAnalysis.summaryRationale}
                  </p>
                  <p className="text-slate-400">
                    <strong>Oppervlaktelaag vs. Bulk:</strong> {activeDayProg.thermalAnalysis.surfaceVsBulkNote}
                  </p>
                  <p className="text-cyan-300/90 pt-1 border-t border-slate-700/40 text-[11px]">
                    <strong>Invloed op de prognose:</strong> {activeDayProg.thermalAnalysis.prognosisImpactNote}
                  </p>
                </div>
              </div>
            )}


            </>)}
            {/* Hengelpositionering & Visbeweging */}
            {activeDayProg.positioningAdvice && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-800/40 space-y-3.5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Hengelpositionering & Visbeweging
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Tactisch advies op basis van wind, stroming, waterlaag en diepte
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] text-slate-400"
                      title="Kwalitatieve inschatting van de onderbouwing van het stekadvies; geen gekalibreerde kans."
                    >Onderbouwing stekadvies:</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activeDayProg.positioningAdvice.confidenceLevel === 'Redelijk'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : activeDayProg.positioningAdvice.confidenceLevel === 'Matig'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {activeDayProg.positioningAdvice.confidenceLevel}
                    </span>
                  </div>
                </div>

                {/* Hoofdadvies en Alternatief */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-cyan-700/50">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                      Aanbevolen Zoekzone
                    </span>
                    <span className="text-sm font-bold text-white block mb-1.5">
                      {activeDayProg.positioningAdvice.recommendedZone}
                    </span>
                    {showAdvancedDetails && (
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {activeDayProg.positioningAdvice.rationale}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                        Tactisch Alternatief
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {activeDayProg.positioningAdvice.alternativeOption}
                      </p>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-700/50 space-y-1 text-[10px] text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>
                          {activeDayProg.positioningAdvice.windContext.speedKmH === null ? 'Windgegevens: onbekend' : `Wind: ${activeDayProg.positioningAdvice.windContext.directionText} ${activeDayProg.positioningAdvice.windContext.speedKmH} km/u`}
                          {activeDayProg.positioningAdvice.windContext.gustsKmH &&
                            ` (stoten ~${activeDayProg.positioningAdvice.windContext.gustsKmH} km/u)`}
                        </span>
                        <span>Seizoen: {activeDayProg.positioningAdvice.thermalContext.season}</span>
                      </div>
                      {activeDayProg.positioningAdvice.windContext.intraSessionNote && (
                        <p className="text-cyan-300/80 text-[10px]">
                          {activeDayProg.positioningAdvice.windContext.intraSessionNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Persoonlijke Leerresultaten (>=11 sessies drempel) */}
                {showAdvancedDetails && activeDayProg.positioningAdvice.personalEvidence && (
                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-700/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-purple-400" />
                        Persoonlijk Stekprofiel (Richtingshistorie)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {activeDayProg.positioningAdvice.personalEvidence.totalCompletedSessionsOnSpot} voltooide sessies op stek
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {activeDayProg.positioningAdvice.personalEvidence.summaryNote}
                    </p>
                  </div>
                )}

{showAdvancedDetails && (
<>
                {/* Windrichting & Praktische Hengelpositionering (4-ledig onderscheid) */}
                {activeDayProg.positioningAdvice.windCastingGuidance && (() => {
                  const wcg = activeDayProg.positioningAdvice.windCastingGuidance;
                  return (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-850/90 border border-cyan-800/60 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                            Windrichting &amp; Praktische Hengelpositionering
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {wcg.googleMapsVisual.spotGpsText}
                        </span>
                      </div>

                      {/* 4-ledige onderscheiding */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {/* 1. Windherkomst */}
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            1. Wind komt UIT (Herkomst)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-xs">
                              {wcg.windOrigin.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">({wcg.windOrigin.degrees}°)</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            Meteorologische herkomst. Als u in deze richting kijkt, voelt u de wind recht op uw gezicht.
                          </p>
                        </div>

                        {/* 2. Blaasrichting */}
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            2. Wind waait NAAR (Blaasrichting)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-xs">
                              {wcg.windDestination.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">({wcg.windDestination.degrees}°)</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            Richting waarin oppervlaktewater, natuurlijk voedsel en warmte over het water worden geduwd (+180°).
                          </p>
                        </div>

                        {/* 3. Mogelijke Windkant */}
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              3. Mogelijke Windkant
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                wcg.banksContext.isWindwardFavorable
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {wcg.banksContext.isWindwardFavorable ? 'Gunstig' : 'Voorzichtig'}
                            </span>
                          </div>
                          <div className="font-semibold text-white text-xs">
                            {wcg.banksContext.potentialWindwardBank}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {wcg.banksContext.windwardAssessment}
                          </p>
                        </div>

                        {/* 4. Aanbevolen Werprichting */}
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              4. Werprichting vanaf Vispositie
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                wcg.castingAdvice.isCastingDirectionDefinite
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-700/80 text-slate-300 border border-slate-600/40'
                              }`}
                            >
                              {wcg.castingAdvice.isCastingDirectionDefinite
                                ? `Advies: ${wcg.castingAdvice.recommendedDirection}`
                                : 'Oeverafhankelijk'}
                            </span>
                          </div>
                          <div className="font-semibold text-white text-xs">
                            {wcg.castingAdvice.summary}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {wcg.castingAdvice.reason}
                          </p>
                        </div>
                      </div>

                      {/* Google Maps / Kompasoriëntatie */}
                      <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-700/60 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                          Google Maps / Kompasoriëntatie:
                        </span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {wcg.googleMapsVisual.compassRule} &bull; <span className="text-cyan-200">{wcg.googleMapsVisual.mapFlowDescription}</span>
                        </p>
                      </div>

                      {/* Twee Praktische Scenario's: Luwe vs Aanlandige oever */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-1">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                            Als u op de luwe oever vist (wind in de rug):
                          </span>
                          <p className="text-slate-300 text-[11px] leading-snug">
                            {wcg.castingAdvice.scenarioGuidance.standingLeewardBank}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                            Als u op de aanlandige oever vist (wind op uw gezicht):
                          </span>
                          <p className="text-slate-300 text-[11px] leading-snug">
                            {wcg.castingAdvice.scenarioGuidance.standingWindwardBank}
                          </p>
                        </div>
                      </div>

                      {/* Checklist ter plaatse */}
                      <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-[11px] space-y-1">
                        <span className="font-semibold text-slate-200 block">
                          Wat ter plaatse aan de waterkant te controleren:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                          {wcg.onSiteChecklist.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}


</>
)}                {showAdvancedDetails && (
                <>
                {/* Expliciete Beperkingen & Ontbrekende Informatie */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block">
                    Belangrijke nuance & ontbrekende gegevens:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {activeDayProg.positioningAdvice.missingInformation.map((info, idx) => (
                      <li key={idx}>{info}</li>
                    ))}
                  </ul>
                </div>
                </>
                )}
              </div>
            )}

{showAdvancedDetails && (
<>
            {/* ======================================================= */}
            {/* MODULE 2: WIND TEN OPZICHTE VAN DE OEVER               */}
            {/* ======================================================= */}
            {activeDayProg.bankWindAnalysis && (() => {
              const bw = activeDayProg.bankWindAnalysis;
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-blue-800/40 space-y-3.5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-700/50 text-blue-400">
                        <Waves className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Wind ten opzichte van de Oever (GPS-stek)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Relatie tussen windrichting en de gekozen oeverlijn van {selectedLoc?.name || 'de stek'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                        bw.relation.includes('Recht aanlandig')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : bw.relation.includes('Schuin aanlandig')
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : bw.relation.includes('aflandig')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : bw.relation.includes('Zijwind')
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {bw.relation}
                    </span>
                  </div>

                  {bw.isConfigured ? (
                    <div className="space-y-3">
                      {/* Hoek- en Richtingengegevens */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Oeverkijkrichting</span>
                          <span className="text-sm font-bold text-white mt-0.5 block">
                            {bw.waterFacingDirection} ({bw.waterFacingDegrees}°)
                          </span>
                          <span className="text-[10px] text-slate-400">Richting naar het water</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Windherkomst</span>
                          <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                            {bw.windOriginDirection} ({bw.windOriginDegrees}°)
                          </span>
                          <span className="text-[10px] text-slate-400">Komt uit deze hoek</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Blaasrichting</span>
                          <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                            {bw.windDestinationDirection} ({bw.windDestinationDegrees}°)
                          </span>
                          <span className="text-[10px] text-slate-400">Stuwt water hierheen</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Windhoek t.o.v. oever</span>
                          <span className="text-sm font-bold text-amber-300 mt-0.5 block">
                            ~{bw.relativeAngleDegrees}°
                          </span>
                          <span className="text-[10px] text-slate-400">0°=kopwind, 180°=rugwind</span>
                        </div>
                      </div>

                      {/* Biologische Beoordeling */}
                      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            Status: <span className={bw.bankAssessment.isFavorable ? 'text-emerald-400' : 'text-slate-200'}>{bw.bankAssessment.statusLabel}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Snelheid: {bw.windSpeedKmH} km/u</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {bw.bankAssessment.explanation}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-[11px]">
                          <div>
                            <strong className="text-slate-300 block">Golfslag &amp; Branding:</strong>
                            <span className="text-slate-400">{bw.bankAssessment.waveAction}</span>
                          </div>
                          <div>
                            <strong className="text-slate-300 block">Oppervlaktedrift &amp; Onderstroom:</strong>
                            <span className="text-slate-400">{bw.bankAssessment.driftCurrent}</span>
                          </div>
                        </div>
                      </div>

                      {/* Concreet Hengelplaatsingsadvies */}
                      <div className="p-3.5 rounded-xl bg-slate-850 border border-blue-700/50 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                            Aanbevolen Hengel- en Montageplaatsing
                          </span>
                          <button
                            type="button"
                            aria-expanded={showWaterFacingPicker}
                            onClick={() => setShowWaterFacingPicker((open) => !open)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                          >
                            {showWaterFacingPicker ? 'Keuze sluiten' : 'Wijzig kijkrichting'}
                          </button>
                        </div>
                        {showWaterFacingPicker && (
                          <div className="p-3 rounded-xl bg-slate-900/80 border border-blue-700/50 space-y-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                              Kies de richting waarin je vanaf de oever naar het water kijkt
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {COMPASS_DIRECTIONS.map((dir) => (
                                <button
                                  key={dir}
                                  type="button"
                                  aria-pressed={bw.waterFacingDirection === dir}
                                  onClick={async () => {
                                    await handleQuickSetWaterFacing(dir);
                                    setShowWaterFacingPicker(false);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                                    bw.waterFacingDirection === dir
                                      ? 'bg-blue-900/70 border-blue-400 text-white'
                                      : 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-blue-950/60 text-slate-200'
                                  }`}
                                >
                                  {dir} ({COMPASS_DEGREES_MAP[dir]}°)
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="font-bold text-white text-xs">
                          {bw.rodPlacementAdvice.primaryPosition}
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {bw.rodPlacementAdvice.rationale}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-700/50 text-[11px] text-cyan-300/90 font-medium">
                          {bw.rodPlacementAdvice.castingDirectionAdvice}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Oeverkijkrichting nog niet ingesteld */
                    <div className="p-4 rounded-xl bg-slate-800/70 border border-amber-600/40 space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block mb-0.5">
                            Oeveroriëntatie is voor deze stek nog niet eenmalig vastgelegd
                          </strong>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            De GPS-coördinaten bepalen de locatie op de kaart, maar niet aan welke oeverkant je zit. Stel hieronder met één klik in naar welke windrichting je over het open water kijkt:
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          In welke richting kijk je vanaf jouw oever naar het water?
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {COMPASS_DIRECTIONS.map((dir) => (
                            <button
                              key={dir}
                              type="button"
                              onClick={() => handleQuickSetWaterFacing(dir)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-blue-950/60 text-slate-200 text-xs font-semibold text-left transition cursor-pointer"
                            >
                              {dir}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                        {bw.rodPlacementAdvice.castingDirectionAdvice}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}


</>
)}{showAdvancedDetails && (
<>
            {/* ======================================================= */}
            {/* MODULE 3: VISBEWEGING EN HABITATMODEL                   */}
            {/* ======================================================= */}
            {activeDayProg.habitatAnalysis && (() => {
              const ha = activeDayProg.habitatAnalysis;
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-purple-800/40 space-y-3.5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-700/50 text-purple-400">
                        <Fish className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Visbeweging &amp; Habitatmodel
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Ruimtelijke zoekhypothese en migratie tussen rust- en foerageerzones
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold self-start sm:self-auto ${
                        ha.confidenceLevel === 'Redelijk'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : ha.confidenceLevel === 'Matig'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      Onderbouwing habitatinschatting: {ha.confidenceLevel}
                    </span>
                  </div>

                  {/* Primaire en Alternatieve Zoekzone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Primaire zone */}
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-purple-700/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                          Primaire Zoekzone
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-200 border border-purple-700/50 font-semibold">
                          {ha.primaryZone.habitatType}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white block">
                        {ha.primaryZone.name}
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {ha.primaryZone.description}
                      </p>
                      <div className="pt-2 border-t border-slate-700/50 text-[10px] text-slate-400 space-y-0.5">
                        <div><strong>Diepteprofiel:</strong> {ha.primaryZone.depthProfileNote}</div>
                        <div><strong>Structuur:</strong> {ha.primaryZone.structureNote}</div>
                        <div className="text-purple-300/90 pt-1"><strong>Onderbouwing:</strong> {ha.primaryZone.whyLikely}</div>
                      </div>
                    </div>

                    {/* Alternatieve zone */}
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                            Alternatieve Zoekzone
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-semibold">
                            {ha.alternativeZone.habitatType}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white block mb-1">
                          {ha.alternativeZone.name}
                        </span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {ha.alternativeZone.description}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/50 text-[10px] text-slate-400 space-y-0.5">
                        <div><strong>Diepte:</strong> {ha.alternativeZone.depthProfileNote}</div>
                        <div><strong>Structuur:</strong> {ha.alternativeZone.structureNote}</div>
                        <div className="text-amber-300/90 pt-1"><strong>Toepassing:</strong> {ha.alternativeZone.whyLikely}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bewegingshypothese & Trekroutes */}
                  <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/70 space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Bewegingshypothese &amp; Dag/Nachtdynamiek
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <strong className="text-white block">Waarschijnlijke Verplaatsing:</strong>
                        <span className="text-slate-300">{ha.movementHypothesis.likelyDirection}</span>
                      </div>
                      <div>
                        <strong className="text-white block">Migratietrigger:</strong>
                        <span className="text-slate-300">{ha.movementHypothesis.migrationalTrigger}</span>
                      </div>
                      <div>
                        <strong className="text-white block">Tijdvakdynamiek:</strong>
                        <span className="text-slate-300">{ha.movementHypothesis.timeOfDayDynamic}</span>
                      </div>
                      <div>
                        <strong className="text-white block">Verwachte Trekroute:</strong>
                        <span className="text-slate-300">{ha.movementHypothesis.transitRoute}</span>
                      </div>
                    </div>
                  </div>

                  {/* Controleerbare Herkomst (Data Provenance) */}
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-1.5 text-[11px]">
                    <span className="font-semibold text-slate-300 block">
                      Controleerbare herkomst van dit model:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ha.dataProvenance.measuredDataPoints.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                          {item}
                        </span>
                      ))}
                      {ha.dataProvenance.userObservations.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-cyan-950/70 text-cyan-300 border border-cyan-700/50">
                          {item}
                        </span>
                      ))}
                      {ha.dataProvenance.modelInferences.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-purple-950/70 text-purple-300 border border-purple-700/50">
                          {item}
                        </span>
                      ))}
                    </div>
                    {ha.missingInformation.length > 0 && (
                      <p className="text-slate-400 text-[10px] pt-1">
                        Ontbrekend: {ha.missingInformation.join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}


</>
)}            {/* ======================================================= */}
            {/* MODULE 1: GESTRUCTUREERD VOORVOERPROGRAMMA             */}
            {/* ======================================================= */}
            {activeDayProg.prebaitPlan && (() => {
              const pp = activeDayProg.prebaitPlan;
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-800/40 space-y-3.5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          Gestructureerd Voorvoerprogramma (Voerplanner)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Gefundeerd voeradvies op maat voor de geplande sessie op {activeDayProg.dayName.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                        pp.suitability === 'Zeer zinvol'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : pp.suitability === 'Matig zinvol'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : pp.suitability === 'Beperkt / voorzichtig'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {pp.suitability}
                    </span>
                  </div>

                  {/* Beschikbare voorbereidingstijd: invoer voor de berekening, geen verplicht voerschema */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-200 font-semibold block">Hoeveel voorbereidingstijd heb je?</span>
                      <span className="text-slate-400 text-[10px]">Dit is je beschikbare tijd. Het advies bepaalt of vooraf voeren zinvol is.</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 1, 2, 3].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setPrebaitAvailableDays(days)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            prebaitAvailableDays === days
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {days === 0 ? 'Instant' : `${days} ${days === 1 ? 'dag' : 'dagen'}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biologische conclusie */}
                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
                    <div className="font-bold text-white text-sm">{pp.campaignSummary}</div>
                    {showAdvancedDetails && (
                      <>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{pp.biologicalRationale}</p>
                        <p className="text-emerald-300/90 text-[11px] pt-1 border-t border-slate-700/50">
                          <strong>Temperatuurinvloed:</strong> {pp.temperatureFactorExplanation}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Alleen voorafgaande voermomenten; de visdag staat in het aparte sessieadvies */}
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Voorvoerschema ({pp.moments.filter((m) => m.dayOffset < 0).length} voorafgaande momenten)
                    </span>
                    {pp.moments.some((m) => m.dayOffset < 0) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pp.moments.filter((m) => m.dayOffset < 0).map((m, idx) => (
                          <div key={idx} className="p-3 rounded-xl border space-y-1 bg-slate-800/80 border-slate-700/70">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">{m.dayLabel} ({m.date})</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-bold">{m.amountDisplay}</span>
                            </div>
                            <div className="text-[11px] text-cyan-300 font-medium">Tijdstip: {m.suggestedTime}</div>
                            <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-700/40">{m.purpose}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-slate-300 text-[11px] leading-relaxed">
                        Geen voorafgaande voerbeurten aanbevolen. Richt je op een gerichte, kleine instant-presentatie tijdens het vissen.
                      </div>
                    )}
                  </div>

                  {/* Voersamenstelling één keer tonen; sessieadvies combineert bijvoeren en techniek */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Voersamenstelling</span>
                      <p className="text-white font-semibold text-[11px]">{pp.feedCompositionAdvice.recommendedMix}</p>
                      <p className="text-slate-400 text-[10px]">{pp.feedCompositionAdvice.digestibilityNote}</p>
                      <p className="text-slate-400 text-[10px]">{pp.feedCompositionAdvice.particleSizeNote}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                      <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Tijdens de vissessie</span>
                      <p className="text-white font-semibold text-[11px]">
                        {pp.sessionDayGuidance.feedDuringSession
                          ? `Spaarzaam bijvoeren (~${pp.sessionDayGuidance.recommendedAmountGrams}g)`
                          : 'Geen extra bijvoeradvies; gericht instant vissen'}
                      </p>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{pp.sessionDayGuidance.advice}</p>
                      {pp.methodFeederGuidance && (
                        <p className="text-cyan-200 text-[11px] leading-relaxed pt-2 border-t border-slate-700/50">
                          <strong>Method feeder:</strong> {pp.methodFeederGuidance}
                        </p>
                      )}
                    </div>
                  </div>

                  {showAdvancedDetails && pp.missingInformation.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-100 text-[11px] leading-relaxed">
                      <strong className="block mb-1">Beperkingen van dit voeradvies</strong>
                      <ul className="list-disc pl-4 space-y-1">
                        {pp.missingInformation.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {showAdvancedDetails && pp.personalEvidence && (
                    <div className="p-3 rounded-xl bg-slate-850 border border-slate-700/70 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Eigen logboekervaring</span>
                        <span className="text-[10px] text-slate-400">
                          {pp.personalEvidence.relevantPrebaitedSessionsCount} sessies
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {pp.personalEvidence.summaryNote}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

{showAdvancedDetails && (
<>
            {/* Databeschikbaarheid & Modelonzekerheden */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                Databeschikbaarheid & Onzekerheden voor deze dag:
              </span>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                <li>
                  <strong>Watertemperatuur:</strong> {activeDayProg.waterTemperatureInfo?.note}
                </li>
                <li>
                  <strong>Luchtdruktrend:</strong> {activeDayProg.pressureTrendInfo?.note}
                </li>
                <li>
                  <strong>Herkomst prognose:</strong> {activeDayProg.provenance}.
                </li>
                {activeDayProg.uncertaintyNotes &&
                  activeDayProg.uncertaintyNotes.map((un, i) => (
                    <li key={i} className="text-slate-400">
                      {un}
                    </li>
                  ))}
              </ul>
            </div>
</>
)}
          </div>
          {/* Gedetailleerde Analyse per Tijdvak */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Uitklapbare Analyse per Tijdvak
              </h3>
              {showAdvancedDetails && (
                <span className="text-xs text-slate-400">
                  Toont fysiologische temperatuurefficiëntie en niet-lineaire omgevingsfactoren
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {(['Nacht', 'Ochtend', 'Middag', 'Avond'] as TimeSlot[]).map((slot) => {
                const analysis: TimeSlotAnalysis = activeDayProg.timeSlots[slot];
                const isExpanded = expandedSlots[slot];
                const isBest = activeDayProg.activityScoreAvailable !== false && activeDayProg.bestTimeSlot === slot;
                const isPast = analysis.isPast;

                const slotIcon =
                  slot === 'Nacht' ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : slot === 'Ochtend' ? (
                    <Sunrise className="w-4 h-4 text-amber-400" />
                  ) : slot === 'Middag' ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Sunset className="w-4 h-4 text-orange-400" />
                  );

                return (
                  <div
                    key={slot}
                    className={`rounded-2xl border transition overflow-hidden ${
                      isPast
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : isBest
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    {/* Header bar */}
                    <button
                      onClick={() => toggleSlot(slot)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">
                          {slotIcon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base">{slot}</span>
                            <span className="text-xs text-slate-400 font-medium">
                              ({analysis.timeRange})
                            </span>
                            {isPast ? (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                Reeds verstreken
                              </span>
                            ) : isBest ? (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Aanbevolen Toekomstig Tijdvak
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                            {analysis.conclusion}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-black text-white">
                            {analysis.activityScoreAvailable === false ? 'N/B' : analysis.activityScore.toFixed(1)}
                            <span className="text-xs text-slate-400 font-normal">/10</span>
                          </div>
                        </div>
                        <div className="p-1 rounded-lg text-slate-400 hover:text-white">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {showAdvancedDetails && isExpanded && (
                      <div className="p-4 pt-2 border-t border-slate-700/50 bg-slate-900/40 space-y-4">
{showAdvancedDetails && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Temperatuur */}
                          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                                {analysis.temperatureFactor.title}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  analysis.temperatureFactor.impact === 'positief'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : analysis.temperatureFactor.impact === 'negatief'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {analysis.temperatureFactor.dataAvailable === false ? 'onbekend' : analysis.temperatureFactor.impact}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {analysis.temperatureFactor.detail}
                            </p>
                          </div>

                          {/* Luchtdruk */}
                          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                                {analysis.pressureFactor.title}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  analysis.pressureFactor.impact === 'positief'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : analysis.pressureFactor.impact === 'negatief'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {analysis.pressureFactor.dataAvailable === false ? 'onbekend' : analysis.pressureFactor.impact}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {analysis.pressureFactor.detail}
                            </p>
                          </div>

                          {/* Wind */}
                          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                                {analysis.windFactor.title}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  analysis.windFactor.impact === 'positief'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : analysis.windFactor.impact === 'negatief'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {analysis.windFactor.dataAvailable === false ? 'onbekend' : analysis.windFactor.impact}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {analysis.windFactor.detail}
                            </p>
                          </div>

                          {/* Seizoen */}
                          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                {analysis.seasonFactor.title}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  analysis.seasonFactor.impact === 'positief'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : analysis.seasonFactor.impact === 'negatief'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {analysis.seasonFactor.impact}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {analysis.seasonFactor.detail}
                            </p>
                          </div>

                          {/* Tijdstip */}
                          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                {analysis.timeOfDayFactor.title}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  analysis.timeOfDayFactor.impact === 'positief'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : analysis.timeOfDayFactor.impact === 'negatief'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {analysis.timeOfDayFactor.impact}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {analysis.timeOfDayFactor.detail}
                            </p>
                          </div>

                          {/* Bewolking / Neerslag */}
                          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
                                {analysis.precipitationFactor.title}
                              </span>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  analysis.precipitationFactor.impact === 'positief'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : analysis.precipitationFactor.impact === 'negatief'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {analysis.precipitationFactor.dataAvailable === false ? 'onbekend' : analysis.precipitationFactor.impact}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {analysis.precipitationFactor.detail}
                            </p>
                          </div>
                        </div>


)}
                                                {/* Eigen historische ervaring in dit tijdvak */}
                        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                          <span className="font-bold text-slate-300 block mb-1">
                            Eigen sessie-uitkomsten bij starts in dit tijdvak ({slot}):
                          </span>
                          <span className="text-slate-300">{analysis.personalExperience.note}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal voor Biologische Soortprofielen, Aannames & Wetenschappelijke Bronnen */}
      {showAdvancedDetails && showAssumptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Biologisch Soortprofiel: {currentProfile.dutchName}
                </h3>
                <span className="text-xs text-slate-400 italic">
                  {currentProfile.scientificName}
                </span>
              </div>
              <button
                onClick={() => setShowAssumptionsModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-300 leading-relaxed bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/40">
                {currentProfile.description}
              </p>

              <div>
                <h4 className="font-bold text-white mb-2">Gedocumenteerde Aannames & Fysiologische Eigenschappen:</h4>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-300">
                  {currentProfile.assumptions.map((ass, i) => (
                    <li key={i}>{ass}</li>
                  ))}
                </ul>
              </div>

              {/* Wetenschappelijke Literatuurreferenties */}
              {currentProfile.scientificReferences && currentProfile.scientificReferences.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/40">
                  <h4 className="font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    Controleerbare Wetenschappelijke Bronnen (Ichthyologie):
                  </h4>
                  <ul className="space-y-1 list-disc pl-5 text-slate-300 text-xs">
                    {currentProfile.scientificReferences.map((ref, idx) => (
                      <li key={idx} className="font-mono text-[11px] text-slate-300">{ref}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <span className="text-[11px] text-slate-400 block font-semibold">Voorlopige modelpiek</span>
                  <span className="font-bold text-white">{currentProfile.thermalOptimum} °C</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <span className="text-[11px] text-slate-400 block font-semibold">Curvebreedte koud / warm</span>
                  <span className="font-bold text-white">{currentProfile.thermalWidthCold} / {currentProfile.thermalWidthWarm}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/30 text-xs text-amber-200">
                <strong>Modelbeperking:</strong> De modelpiek en curvebreedtes zijn voorlopige modelinstellingen, geen empirisch gevalideerde optimale of fysiologische tolerantiegrenzen. De curve geeft alleen een relatieve thermische activiteitspotentie; geen voedselopname, aanwezigheid of vangstkans. Luchtdruk-, wind-, regen-, bewolkings- en seizoensvoorkeuren worden niet als numerieke profielcorrecties gebruikt.
              </div>
            </div>

            <button
              onClick={() => setShowAssumptionsModal(false)}
              className="mt-6 w-full rounded-2xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-700 transition cursor-pointer"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};