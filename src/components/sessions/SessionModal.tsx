import React, { useState } from 'react';
import {
  FishingSession,
  FishingLocation,
  FishSpecies,
  ALL_SPECIES,
  SessionOutcome,
  CompassDirection,
  COMPASS_DIRECTIONS,
  SessionRod,
} from '../../types';
import { getCurrentWeatherSnapshot, fetchHistoricalWeatherSnapshot } from '../../services/weatherService';
import { createLiveSnapshotForSessionStart, PendingPrognosisSnapshot } from '../../services/prognosisEngine';
import { Calendar, Clock, MapPin, Sparkles, Thermometer, Wind, AlertCircle, History, Compass } from 'lucide-react';
import { formatDateTimeLocalInput as formatDateTimeLocal } from '../../utils/dateTime';

interface SessionModalProps {
  session?: FishingSession | null;
  locations: FishingLocation[];
  onSave: (sessionData: Partial<FishingSession>, pendingSnapshot?: PendingPrognosisSnapshot, rods?: SessionRod[]) => Promise<void>;
  initialRodDetails?: SessionRod[];
  pendingPrognosisSnapshot?: PendingPrognosisSnapshot;
  sessionDurationHours?: number;
  plannedEndTime?: string | null;
  createStartSnapshot?: boolean;
  /** Een vooringevulde draft voor een nieuwe sessie is geen bestaande sessie om te bewerken. */
  isNewSession?: boolean;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  session,
  locations,
  onSave,
  pendingPrognosisSnapshot,
  sessionDurationHours,
  plannedEndTime,
  createStartSnapshot = false,
  isNewSession = false,
  initialRodDetails = [],
  onClose,
}) => {
  const isEditing = !!session && !isNewSession;

  const now = new Date();
  const defaultStartTime = session ? formatDateTimeLocal(new Date(session.startTime)) : formatDateTimeLocal(now);
  const defaultEndTime = session?.endTime ? formatDateTimeLocal(new Date(session.endTime)) : '';

  const [locationId, setLocationId] = useState(session?.locationId || locations[0]?.id || '');
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [isCompleted, setIsCompleted] = useState(isEditing ? session.outcome !== 'active' : false);
  const [outcome, setOutcome] = useState<SessionOutcome>(session?.outcome || 'active');
  const [selectedTargetSpecies, setSelectedTargetSpecies] = useState<FishSpecies[]>(
    session?.targetSpecies || ['Karper']
  );
  const [participantCount, setParticipantCount] = useState<number | string>(session?.participantCount ?? '');
  const [sessionRods, setSessionRods] = useState<SessionRod[]>(initialRodDetails);
  const [showRodDetails, setShowRodDetails] = useState(initialRodDetails.length > 0);
  const [rodCount, setRodCount] = useState<number | string>(
    session?.rodCount !== undefined ? Number(session.rodCount) : 2
  );
  const [technique, setTechnique] = useState(session?.technique || 'Statisch / Feeder');
  const [baitAndFeed, setBaitAndFeed] = useState(session?.baitAndFeed || 'Boilies, maden & mais');
  const [prebaited, setPrebaited] = useState<boolean>(session?.prebaited || false);
  const [prebaitDays, setPrebaitDays] = useState<number>(session?.prebaitDays || 1);
  const [prebaitAmountGrams, setPrebaitAmountGrams] = useState<string>(
    session?.prebaitAmountGrams !== undefined ? String(session.prebaitAmountGrams) : ''
  );
  const [prebaitFeedType, setPrebaitFeedType] = useState<string>(session?.prebaitFeedType || '');
  const [baitDirection, setBaitDirection] = useState<CompassDirection | 'Niet geregistreerd'>(
    session?.baitDirection || 'Niet geregistreerd'
  );
  const [bitesCount, setBitesCount] = useState<number | undefined>(session?.bitesCount);
  const [missedCount, setMissedCount] = useState<number | undefined>(session?.missedCount);
  const [waterDepth, setWaterDepth] = useState<number | undefined>(session?.waterDepth);
  const [waterTemperature, setWaterTemperature] = useState<number | undefined>(session?.waterTemperature ?? undefined);
  const [waterTemperatureMeasuredAt, setWaterTemperatureMeasuredAt] = useState<string>(session?.waterTemperatureMeasuredAt ? formatDateTimeLocal(new Date(session.waterTemperatureMeasuredAt)) : '');
  const [waterTemperatureMeasurementSource, setWaterTemperatureMeasurementSource] = useState<'manual' | 'imported' | 'unknown'>(session?.waterTemperatureMeasurementSource ?? 'manual');
  const [waterTemperatureMeasurementMethod, setWaterTemperatureMeasurementMethod] = useState<'thermometer' | 'probe' | 'other' | 'unknown'>(session?.waterTemperatureMeasurementMethod ?? 'unknown');
  const [waterTemperatureMeasurementDepthM, setWaterTemperatureMeasurementDepthM] = useState<number | undefined>(session?.waterTemperatureMeasurementDepthM);
  const [notes, setNotes] = useState(session?.notes || '');
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherSnapshot, setWeatherSnapshot] = useState(session?.weatherSnapshot);
  const [weatherFetchMsg, setWeatherFetchMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedPresenceObs, setSelectedPresenceObs] = useState<import('../../types').PresenceObservationType[]>(
    session?.presenceObservations || []
  );

  // Bereken duur over middernacht
  const calculateDurationMinutes = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const startMs = new Date(startStr).getTime();
    const endMs = new Date(endStr).getTime();
    const diffMin = (endMs - startMs) / 60000;
    return diffMin > 0 ? Math.round(diffMin) : 0;
  };

  const durationMin = calculateDurationMinutes(startTime, endTime);
  const durationHoursFormatted = `${Math.floor(durationMin / 60)}u ${durationMin % 60}m`;

  const handleFetchWeather = async () => {
    const loc = locations.find((l) => l.id === locationId);
    setFetchingWeather(true);
    setWeatherFetchMsg(null);
    try {
      const snap = await getCurrentWeatherSnapshot(loc?.latitude, loc?.longitude);
      setWeatherSnapshot(snap);
      setWeatherFetchMsg('Actueel weer succesvol gekoppeld.');
    } catch (err) {
      console.warn('Geen betrouwbare actuele weerdata beschikbaar:', err);
      setWeatherFetchMsg('Geen actuele weerdata beschikbaar. Sessie kan zonder weersnapshot worden opgeslagen.');
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleFetchHistoricalWeather = async () => {
    const loc = locations.find((l) => l.id === locationId);
    setFetchingWeather(true);
    setWeatherFetchMsg(null);
    try {
      const res = await fetchHistoricalWeatherSnapshot(
        loc?.latitude ?? 51.961,
        loc?.longitude ?? 5.228,
        startTime,
        endTime
      );
      if (res.snapshot) {
        setWeatherSnapshot(res.snapshot);
      }
      setWeatherFetchMsg(res.message);
    } finally {
      setFetchingWeather(false);
    }
  };

  const toggleSpecies = (sp: FishSpecies) => {
    setSelectedTargetSpecies((prev) =>
      prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp]
    );
  };

  const togglePresenceObs = (type: import('../../types').PresenceObservationType) => {
    setSelectedPresenceObs((prev) => {
      if (prev.includes(type)) return prev.filter((item) => item !== type);
      if (type === 'geen_waarnemingen') return [type];
      return [...prev.filter((item) => item !== 'geen_waarnemingen'), type];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const loc = locations.find((l) => l.id === locationId);
      let snapshotToSave = createStartSnapshot ? undefined : pendingPrognosisSnapshot;
      const calculatedDur = isCompleted && endTime ? calculateDurationMinutes(startTime, endTime) : undefined;
      const plannedEndIso = plannedEndTime ?? session?.plannedEndTime ?? null;
      const plannedStartMs = new Date(startTime).getTime();
      const plannedEndMs = plannedEndIso ? new Date(plannedEndIso).getTime() : NaN;
      const calculatedPlannedDuration = plannedEndIso
        ? (Number.isFinite(plannedEndMs) && plannedEndMs > plannedStartMs &&
            plannedEndMs - plannedStartMs <= 24 * 3600000
            ? (plannedEndMs - plannedStartMs) / 3600000
            : null)
        : sessionDurationHours ?? session?.plannedDurationHours ?? null;
      const snapshotDurationHours = plannedEndIso
        ? calculatedPlannedDuration ?? undefined
        : sessionDurationHours ?? session?.plannedDurationHours ?? undefined;

      const parsedRods = typeof rodCount === 'number'
        ? Math.max(1, Math.floor(rodCount))
        : (parseInt(String(rodCount), 10) || 1);

      const payload: Partial<FishingSession> = {
        ...(session || {}),
        locationId,
        locationName: loc?.name || 'Onbekende stek',
        startTime: new Date(startTime).toISOString(),
        endTime: isCompleted && endTime ? new Date(endTime).toISOString() : null,
        durationMinutes: calculatedDur,
        plannedDurationHours: calculatedPlannedDuration,
        plannedEndTime: plannedEndIso,
        outcome: isCompleted ? outcome : 'active',
        targetSpecies: selectedTargetSpecies,
        rodCount: parsedRods,
        participantCount: participantCount === '' ? undefined : Math.min(50, Math.max(1, Math.floor(Number(participantCount) || 1))),
        technique,
        baitAndFeed,
        prebaited,
        prebaitDays: prebaited ? prebaitDays : undefined,
        prebaitAmountGrams: prebaited && prebaitAmountGrams.trim() !== '' ? Number(prebaitAmountGrams) : undefined,
        prebaitFeedType: prebaited && prebaitFeedType.trim() !== '' ? prebaitFeedType.trim() : undefined,
        baitDirection: baitDirection === 'Niet geregistreerd' ? null : baitDirection,
        bitesCount: bitesCount !== undefined ? Number(bitesCount) : undefined,
        missedCount: missedCount !== undefined ? Number(missedCount) : undefined,
        waterDepth: waterDepth !== undefined ? Number(waterDepth) : undefined,
        waterTemperature: waterTemperature !== undefined ? Number(waterTemperature) : undefined,
        waterTemperatureMeasuredAt: waterTemperature !== undefined && waterTemperatureMeasuredAt ? new Date(waterTemperatureMeasuredAt).toISOString() : undefined,
        waterTemperatureMeasurementSource: waterTemperature !== undefined ? waterTemperatureMeasurementSource : undefined,
        waterTemperatureMeasurementMethod: waterTemperature !== undefined ? waterTemperatureMeasurementMethod : undefined,
        waterTemperatureMeasurementDepthM: waterTemperature !== undefined && waterTemperatureMeasurementDepthM !== undefined ? Number(waterTemperatureMeasurementDepthM) : undefined,
        notes,
        weatherSnapshot,
        presenceObservations: selectedPresenceObs,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && session?.id) {
        payload.id = session.id;
      } else {
        payload.id = session?.id || ('session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
        payload.createdAt = new Date().toISOString();
        if (!payload.weatherSnapshot) {
          // Probeer weerdata automatisch te koppelen; geen verzonnen data en geen blokkade bij offline gebruik.
          try {
            payload.weatherSnapshot = await getCurrentWeatherSnapshot(loc?.latitude, loc?.longitude);
          } catch (weatherErr) {
            console.warn('Geen weerdata beschikbaar; sessie wordt zonder weersnapshot opgeslagen:', weatherErr);
          }
        }
        // Automatische momentopname bij start van een nieuwe live actieve sessie (nooit achteraf voor historische sessies!)
        if (payload.outcome === 'active' && !payload.snapshotId && !snapshotToSave) {
          if (!loc) {
            throw new Error('Kies eerst een vislocatie voordat je een sessie start.');
          }
          try {
            snapshotToSave = await createLiveSnapshotForSessionStart(
              loc,
              selectedTargetSpecies[0] || 'Karper',
              snapshotDurationHours,
              technique,
              payload.weatherSnapshot,
              payload.waterTemperature ?? null
            ) ?? undefined;
          } catch (snapErr) {
            console.error('Fout bij voorbereiden pre-sessie snapshot:', snapErr);
            throw new Error('De prognose voor de startsnapshot kon niet worden berekend. De sessie is niet gestart. Controleer je verbinding en probeer opnieuw.');
          }
          if (!snapshotToSave) {
            throw new Error('Er kon geen prognosesnapshot worden gemaakt. De sessie is niet gestart; probeer het opnieuw wanneer de prognose beschikbaar is.');
          }
        }
      }

      // De starttijd is het daadwerkelijke startmoment ná het berekenen van de snapshot.
      // De eerder ingevulde datetime-local waarde mag de voorspelling nooit achteraf dateren.
      if (!isEditing && payload.outcome === 'active') {
        if (!snapshotToSave) {
          throw new Error('De startsnapshot ontbreekt. De sessie is niet gestart.');
        }
        const forecastTimestamp = snapshotToSave.forecastTimestamp ?? snapshotToSave.inputContext?.calculatedAt;
        const forecastMs = forecastTimestamp ? Date.parse(forecastTimestamp) : NaN;
        const actualStart = new Date();
        if (!Number.isFinite(forecastMs) || forecastMs >= actualStart.getTime()) {
          throw new Error('De prognose is niet aantoonbaar vóór de sessiestart berekend. De sessie is niet gestart; probeer opnieuw.');
        }
        payload.startTime = actualStart.toISOString();
        payload.updatedAt = payload.startTime;
      }

      const normalizedRods = showRodDetails ? sessionRods.slice(0, parsedRods).map((rod) => ({
        ...rod,
        sessionId: payload.id!,
        activeIntervals: rod.activeIntervals.map((interval) => ({
          ...interval,
          startTime: interval.startTime ? new Date(interval.startTime).toISOString() : '',
          endTime: interval.endTime ? new Date(interval.endTime).toISOString() : null,
        })),
        events: (rod.events || []).map((event) => ({
          ...event,
          timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : '',
        })),
        updatedAt: new Date().toISOString(),
      })) : [];
      await onSave(payload, snapshotToSave, normalizedRods);
      onClose();
    } catch (err: any) {
      console.error('Fout bij opslaan sessie:', err);
      setSaveError(err.message || 'Er is een fout opgetreden bij het opslaan van de sessie.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <h3 className="text-xl font-black text-white">
            {isEditing ? 'Sessie Bewerken' : 'Nieuwe Vissessie Registreren'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs sm:text-sm">
          {/* Stekselectie */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vislocatie / Stek *
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.waterType ? `(${loc.waterType})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tijden Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Startdatum & Tijd *
              </label>
              {isEditing && (
                <p className="mb-1 text-[11px] text-slate-500">De starttijd staat vast sinds deze sessie is gestart.</p>
              )}
              {!isEditing && !isCompleted && (
                <p className="mb-1 text-[11px] text-slate-500">Bij het starten legt Vislogboek de werkelijke starttijd automatisch vast ná de prognosesnapshot.</p>
              )}
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isEditing || (!isEditing && !isCompleted)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Einddatum & Tijd
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (e.target.value) setIsCompleted(true);
                }}
                disabled={!isCompleted}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Status schakelaar */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <input
              type="checkbox"
              id="completedCheckbox"
              checked={isCompleted}
              onChange={(e) => {
                setIsCompleted(e.target.checked);
                if (e.target.checked && !endTime) {
                  setEndTime(formatDateTimeLocal(new Date()));
                }
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="completedCheckbox" className="text-xs sm:text-sm text-slate-200 cursor-pointer">
              Sessie is afgerond (geen actieve sessie meer)
            </label>
            {isCompleted && durationMin > 0 && (
              <span className="ml-auto text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                Berekende duur: {durationHoursFormatted}
              </span>
            )}
          </div>

          {/* Uitkomstselectie wanneer afgerond */}
          {isCompleted && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Definitieve Sessie-uitkomst *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOutcome('catch')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                    outcome === 'catch'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  ✓ Vangst(en) geland
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('skunk_confirmed')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                    outcome === 'skunk_confirmed'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  ✕ Bevestigde nulvangst
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('unknown')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                    outcome === 'unknown'
                      ? 'bg-slate-700 border-slate-500 text-slate-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  ? Onbekend / Niet zeker
                </button>
              </div>
            </div>
          )}

          {/* Viswaarnemingen op de stek */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Viswaarnemingen op de stek</span>
              <span className="text-[10px] text-cyan-400">Geen automatische verhoging van de vangstkans</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { type: 'vis_springen_rollen', label: 'Vis zien springen / rollen' },
                { type: 'aasbellen_voedselactiviteit', label: 'Aasbellen / bodemwoeling' },
                { type: 'recente_vangst_stek', label: 'Recente vangst op deze stek' },
                { type: 'geen_waarnemingen', label: 'Geen activiteit waargenomen' },
              ].map((item) => {
                const isSelected = selectedPresenceObs.includes(item.type as any);
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => togglePresenceObs(item.type as any)}
                    className={`p-2 rounded-xl border text-left font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '○ '} {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doelsoorten Badges */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Doelsoorten (selecteer een of meer)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SPECIES.map((sp) => {
                const isSelected = selectedTargetSpecies.includes(sp);
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => toggleSpecies(sp)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {sp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Groepsgrootte en totale hengelinzet */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Aantal deelnemers (optioneel)</label>
              <input type="number" min={1} max={50} value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value === '' ? '' : Math.min(50, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
                placeholder="Bijv. 3" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Totaal aantal hengels</label>
              <input type="number" min={1} value={rodCount}
                onChange={(e) => setRodCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                onBlur={() => setRodCount(typeof rodCount === 'number' && rodCount >= 1 ? rodCount : 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-slate-300 pb-2">
                <input type="checkbox" checked={showRodDetails} onChange={(e) => {
                  const enabled = e.target.checked;
                  setShowRodDetails(enabled);
                  if (enabled && sessionRods.length === 0) {
                    const count = Math.max(1, Number(rodCount) || 1);
                    setSessionRods(Array.from({ length: count }, (_, index) => ({
                      id: `rod-${Date.now()}-${index}`, sessionId: session?.id || '', rodNumber: index + 1,
                      activeIntervals: [], events: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                    })));
                  }
                }} className="w-4 h-4" />
                Details per hengel
              </label>
            </div>
          </div>
          {showRodDetails && (
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div>
                <div className="text-xs font-bold text-white">Hengeldetails (optioneel)</div>
                <p className="text-[11px] text-slate-400">Vul alleen de hengels en actieve periodes in die je wilt bijhouden. Onbekende inzet wordt niet geschat.</p>
              </div>
              {sessionRods.slice(0, Math.max(1, Number(rodCount) || 1)).map((rod, index) => (
                <div key={rod.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 space-y-2">
                  <div className="font-bold text-xs text-emerald-300">Hengel {rod.rodNumber}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input value={rod.positionZone || ''} onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, positionZone: e.target.value, updatedAt: new Date().toISOString() } : item))} placeholder="Positie / zone" className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs" />
                    <input value={rod.technique || ''} onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, technique: e.target.value, updatedAt: new Date().toISOString() } : item))} placeholder="Techniek" className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs" />
                    <input value={rod.baitPresentation || ''} onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, baitPresentation: e.target.value, updatedAt: new Date().toISOString() } : item))} placeholder="Aas / presentatie" className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs" />
                  </div>
                  <div className="text-[11px] text-slate-400">Actieve periode (optioneel; alleen volledige intervallen tellen mee)</div>
                  {(rod.activeIntervals || []).map((interval) => (
                    <div key={interval.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input type="datetime-local" value={interval.startTime ? formatDateTimeLocal(new Date(interval.startTime)) : ''} onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, activeIntervals: item.activeIntervals.map((x) => x.id === interval.id ? { ...x, startTime: e.target.value } : x) } : item))} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs" />
                      <input type="datetime-local" value={interval.endTime ? formatDateTimeLocal(new Date(interval.endTime)) : ''} onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, activeIntervals: item.activeIntervals.map((x) => x.id === interval.id ? { ...x, endTime: e.target.value || null } : x) } : item))} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs" />
                      <button type="button" onClick={() => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, activeIntervals: item.activeIntervals.filter((x) => x.id !== interval.id) } : item))} className="text-rose-300 text-xs">Verwijderen</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, activeIntervals: [...item.activeIntervals, { id: `interval-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, startTime: '', endTime: null }] } : item))} className="text-cyan-300 text-[11px] underline">+ Actieve periode toevoegen</button>
                  <div className="border-t border-slate-700 pt-2 space-y-2">
                    <div className="text-[11px] text-slate-400">Gebeurtenissen op deze hengel (optioneel)</div>
                    {(rod.events || []).map((event) => (
                      <div key={event.id} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                        <select aria-label="Type hengelgebeurtenis" value={event.type} onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, events: (item.events || []).map((x) => x.id === event.id ? { ...x, type: e.target.value as 'bite' | 'missed' | 'catch' | 'other' } : x) } : item))} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs">
                          <option value="bite">Aanbeet</option><option value="missed">Gemist</option><option value="catch">Vangst</option><option value="other">Overig</option>
                        </select>
                        <input type="datetime-local" aria-label="Tijdstip gebeurtenis" value={event.timestamp ? formatDateTimeLocal(new Date(event.timestamp)) : ''} onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, events: (item.events || []).map((x) => x.id === event.id ? { ...x, timestamp: e.target.value, timestampEntryMode: e.target.value ? 'user_adjusted' : undefined } : x) } : item))} className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs" />
                        <input value={event.notes || ''} aria-label="Toelichting gebeurtenis" onChange={(e) => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, events: (item.events || []).map((x) => x.id === event.id ? { ...x, notes: e.target.value } : x) } : item))} placeholder="Notitie" className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs" />
                        <button type="button" onClick={() => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, events: (item.events || []).filter((x) => x.id !== event.id) } : item))} className="text-rose-300 text-xs">Verwijderen</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setSessionRods((prev) => prev.map((item) => item.id === rod.id ? { ...item, events: [...(item.events || []), { id: `event-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, timestamp: new Date().toISOString(), timestampEntryMode: 'automatic', type: 'other', notes: '' }] } : item))} className="text-cyan-300 text-[11px] underline">+ Gebeurtenis toevoegen</button>
                  </div>
                </div>
              ))}
              {sessionRods.length < Math.max(1, Number(rodCount) || 1) && (
                <button type="button" onClick={() => setSessionRods((prev) => [...prev, { id: `rod-${Date.now()}`, sessionId: session?.id || '', rodNumber: prev.length + 1, activeIntervals: [], events: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])} className="text-cyan-300 text-xs underline">+ Hengel toevoegen</button>
              )}
            </div>
          )}

          {/* Algemene techniek en aas van de sessie; per-hengeldetails kunnen dit verfijnen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vistechniek (algemeen)</label>
              <input type="text" placeholder="bv. Feeder, Statisch, Dobber" value={technique}
                onChange={(e) => setTechnique(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Aas & Voer (algemeen)</label>
              <input type="text" placeholder="bv. Boilies, maden, mais" value={baitAndFeed}
                onChange={(e) => setBaitAndFeed(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Voorvoeren Registratie (Optioneel) */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prebaited}
                  onChange={(e) => setPrebaited(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Vooraf gevoerd op deze stek voor aanvang?</span>
              </label>
              <span className="text-[10px] text-slate-400">Voorvoerhistorie</span>
            </div>

            {prebaited && (
              <div className="pt-2 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Dagen vooraf</label>
                  <select
                    value={prebaitDays}
                    onChange={(e) => setPrebaitDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  >
                    <option value={1}>1 dag vooraf (gisteren)</option>
                    <option value={2}>2 dagen vooraf</option>
                    <option value={3}>3 dagen vooraf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Totaal voer (gram)</label>
                  <input
                    type="number"
                    placeholder="bv. 500"
                    value={prebaitAmountGrams}
                    onChange={(e) => setPrebaitAmountGrams(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Voersoort</label>
                  <input
                    type="text"
                    placeholder="bv. Boilies, hennep, pellets"
                    value={prebaitFeedType}
                    onChange={(e) => setPrebaitFeedType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Richting van Aasaanbieding / Werprichting (Optioneel) */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Richting Aasaanbieding / Werprichting (optioneel)
              </label>
              <span className="text-[10px] text-slate-400">Kompasrichting t.o.v. de stek</span>
            </div>
            <select
              value={baitDirection}
              onChange={(e) => setBaitDirection(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-xs sm:text-sm"
            >
              <option value="Niet geregistreerd">Niet geregistreerd / Onbekend</option>
              {COMPASS_DIRECTIONS.map((dir) => (
                <option key={dir} value={dir}>
                  {dir} (aas ligt richting {dir.toLowerCase()} van de stek)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Registreert in welke kompasrichting het aas ten opzichte van de oeverstek ligt. Wordt uitsluitend gebruikt voor een voorzichtige persoonlijke empirische nuance op deze specifieke stek na minimaal 11 voltooide sessies (≥6 met richting).
            </p>
          </div>

          {/* Gemeten watertemperatuur (optioneel) */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="session-water-temperature">
              Gemeten watertemperatuur (°C) — optioneel
            </label>
            <input
              id="session-water-temperature"
              type="number"
              min={0}
              max={35}
              step="0.1"
              inputMode="decimal"
              placeholder="Bijv. 12,5"
              value={waterTemperature ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setWaterTemperature(value === '' ? undefined : Number(value));
              }}
              className="w-full sm:max-w-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="block text-xs text-slate-300">
                Meetdatum en -tijd
                <input type="datetime-local" value={waterTemperatureMeasuredAt}
                  onChange={(e) => setWaterTemperatureMeasuredAt(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
              </label>
              <label className="block text-xs text-slate-300">
                Meetmethode
                <select value={waterTemperatureMeasurementMethod}
                  onChange={(e) => setWaterTemperatureMeasurementMethod(e.target.value as typeof waterTemperatureMeasurementMethod)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white">
                  <option value="unknown">Onbekend</option>
                  <option value="thermometer">Thermometer</option>
                  <option value="probe">Meetprobe / sonde</option>
                  <option value="other">Anders</option>
                </select>
              </label>
              <label className="block text-xs text-slate-300">
                Meetdiepte in meter (optioneel)
                <input type="number" min={0} max={100} step="0.1" value={waterTemperatureMeasurementDepthM ?? ''}
                  onChange={(e) => setWaterTemperatureMeasurementDepthM(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="Bijv. 0,5"
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white" />
              </label>
              <label className="block text-xs text-slate-300">
                Herkomst
                <select value={waterTemperatureMeasurementSource}
                  onChange={(e) => setWaterTemperatureMeasurementSource(e.target.value as typeof waterTemperatureMeasurementSource)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white">
                  <option value="manual">Handmatig ingevoerd</option>
                  <option value="imported">Geïmporteerd</option>
                  <option value="unknown">Onbekend</option>
                </select>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Het meettijdstip wordt niet meer afgeleid van de sessiestart. Alleen met een expliciet meettijdstip en bekende herkomst en methode kan deze meting worden gebruikt voor temperatuurvalidatie. Oude metingen blijven behouden, maar tellen zonder deze gegevens niet mee.
            </p>
          </div>

          {/* Aanbeten & Gemist */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aanbeten (optioneel)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={bitesCount ?? ''}
                onChange={(e) => setBitesCount(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gemiste vissen / Lossers (optioneel)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={missedCount ?? ''}
                onChange={(e) => setMissedCount(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Weer Snapshot Weergave & Knoppen */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                Gekoppeld Weer
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleFetchWeather}
                  disabled={fetchingWeather}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                >
                  {fetchingWeather ? 'Ophalen...' : 'Actueel weer vastleggen'}
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={handleFetchHistoricalWeather}
                  disabled={fetchingWeather}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer flex items-center gap-1"
                  title="Haalt uurdata op uit het Open-Meteo Archief voor deze sessiedatum en -coördinaten"
                >
                  <History className="w-3 h-3" />
                  {fetchingWeather ? 'Archief raadplegen...' : 'Historisch weer ophalen (Archief)'}
                </button>
              </div>
            </div>

            {weatherFetchMsg && (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300">
                {weatherFetchMsg}
              </div>
            )}

            {weatherSnapshot ? (
              <div className="text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Temperatuur</span>
                  <span className="font-bold text-white">{weatherSnapshot.temperature} °C</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Luchtdruk</span>
                  <span className="font-bold text-white">{weatherSnapshot.pressure} hPa</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Wind</span>
                  <span className="font-bold text-white">
                    {weatherSnapshot.windDirectionText || 'ZW'} {weatherSnapshot.windSpeed} km/u
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Bron</span>
                  <span className="font-bold text-slate-300 capitalize">{weatherSnapshot.source}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Nog geen weer gekoppeld. Bij het opslaan wordt automatisch een actuele weersmeting toegevoegd.
              </p>
            )}
          </div>

          {/* Notities */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notities & Waarnemingen
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijzonderheden over stroming, voerplek, waargenomen visactiviteit..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Foutmelding bij opslaan */}
          {saveError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Knoppen */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold transition disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? 'Opslaan...' : isEditing ? 'Wijzigingen Opslaan' : 'Sessie Starten'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};