import React, { useState } from 'react';
import {
  FishingSession,
  FishingLocation,
  FishSpecies,
  ALL_SPECIES,
  SessionOutcome,
  CompassDirection,
  COMPASS_DIRECTIONS,
} from '../../types';
import { getCurrentWeatherSnapshot, fetchHistoricalWeatherSnapshot } from '../../services/weatherService';
import { createLiveSnapshotForSessionStart, PendingPrognosisSnapshot } from '../../services/prognosisEngine';
import { Calendar, Clock, MapPin, Sparkles, Thermometer, Wind, AlertCircle, History, Compass } from 'lucide-react';

interface SessionModalProps {
  session?: FishingSession | null;
  locations: FishingLocation[];
  onSave: (sessionData: Partial<FishingSession>, pendingSnapshot?: PendingPrognosisSnapshot) => Promise<void>;
  pendingPrognosisSnapshot?: PendingPrognosisSnapshot;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  session,
  locations,
  onSave,
  pendingPrognosisSnapshot,
  onClose,
}) => {
  const isEditing = !!session;

  const now = new Date();
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const defaultStartTime = session ? session.startTime.slice(0, 16) : formatDateTimeLocal(now);
  const defaultEndTime = session?.endTime ? session.endTime.slice(0, 16) : '';

  const [locationId, setLocationId] = useState(session?.locationId || locations[0]?.id || '');
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [isCompleted, setIsCompleted] = useState(isEditing ? session.outcome !== 'active' : false);
  const [outcome, setOutcome] = useState<SessionOutcome>(session?.outcome || 'active');
  const [selectedTargetSpecies, setSelectedTargetSpecies] = useState<FishSpecies[]>(
    session?.targetSpecies || ['Karper']
  );
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
    setSelectedPresenceObs((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const loc = locations.find((l) => l.id === locationId);
      const calculatedDur = isCompleted && endTime ? calculateDurationMinutes(startTime, endTime) : undefined;

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
        outcome: isCompleted ? outcome : 'active',
        targetSpecies: selectedTargetSpecies,
        rodCount: parsedRods,
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
        notes,
        weatherSnapshot,
        presenceObservations: selectedPresenceObs,
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && session?.id) {
        payload.id = session.id;
      } else {
        payload.id = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
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
        if (payload.outcome === 'active' && !payload.snapshotId && loc) {
          try {
            const autoSnap = await createLiveSnapshotForSessionStart(
              loc,
              selectedTargetSpecies[0] || 'Karper',
              3,
              technique,
              payload.weatherSnapshot
            );
            if (autoSnap) {
              payload.snapshotId = autoSnap.id;
            }
          } catch (snapErr) {
            console.error('Fout bij automatisch aanmaken pre-sessie snapshot:', snapErr);
          }
        }
      }

      await onSave(payload, pendingPrognosisSnapshot);
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
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <span className="text-[10px] text-cyan-400">Verhoogt biologische validatie</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { type: 'vis_springen_rollen', label: 'Vis zien springen / rollen' },
                { type: 'aasbellen_voedselactiviteit', label: 'Aasbellen / bodemwoeling' },
                { type: 'aanbeten', label: 'Aanbeten / lijnzwemmers' },
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

          {/* Hengels, Techniek en Aas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aantal Hengels
              </label>
              <input
                type="number"
                min={1}
                value={rodCount}
                onChange={(e) => {
                  const valStr = e.target.value;
                  if (valStr === '') {
                    setRodCount('');
                  } else {
                    const parsed = parseInt(valStr, 10);
                    setRodCount(isNaN(parsed) ? 1 : Math.max(1, parsed));
                  }
                }}
                onBlur={() => {
                  if (typeof rodCount !== 'number' || isNaN(rodCount) || rodCount < 1) {
                    setRodCount(1);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vistechniek
              </label>
              <input
                type="text"
                placeholder="bv. Feeder, Statisch, Dobber"
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aas & Voer
              </label>
              <input
                type="text"
                placeholder="bv. Boilies, maden, mais"
                value={baitAndFeed}
                onChange={(e) => setBaitAndFeed(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Vul de daadwerkelijk gemeten watertemperatuur in. De starttijd van deze sessie wordt automatisch gebruikt als meettijdstip; je hoeft geen apart tijdstip in te voeren.
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