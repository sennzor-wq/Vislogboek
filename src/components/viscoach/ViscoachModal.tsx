import React, { useState, useEffect } from 'react';
import {
  FishingLocation,
  HomeLocation,
  ViscoachTargetSpecies,
  VISCOACH_SPECIES_OPTIONS,
  ViscoachSessionContext,
  FishSpecies,
} from '../../types';
import {
  calculateHaversineDistanceKm,
  getHomeLocation,
  saveHomeLocation,
  isDuplicateSpotName,
  buildViscoachSessionContext,
} from '../../services/viscoachService';
import {
  Sparkles,
  MapPin,
  Home,
  Navigation,
  Clock,
  Fish,
  AlertCircle,
  CheckCircle2,
  Plus,
  Compass,
  Play,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';

interface ViscoachModalProps {
  locations: FishingLocation[];
  isOpen: boolean;
  onClose: () => void;
  onSaveLocation: (loc: FishingLocation) => Promise<void>;
  onNavigateToPrognosis: (locationId: string, species?: FishSpecies) => void;
  onStartSessionFromViscoach: (
    locationId: string,
    species?: FishSpecies,
    durationHours?: number
  ) => void;
}

export const ViscoachModal: React.FC<ViscoachModalProps> = ({
  locations,
  isOpen,
  onClose,
  onSaveLocation,
  onNavigateToPrognosis,
  onStartSessionFromViscoach,
}) => {
  // 1. Visstek selectie (eerste opgeslagen stek als beginwaarde indien aanwezig)
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');

  // 2. Thuislocatie state
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [isEditingHome, setIsEditingHome] = useState<boolean>(false);
  const [homeName, setHomeName] = useState<string>('');
  const [homeLat, setHomeLat] = useState<string>('');
  const [homeLon, setHomeLon] = useState<string>('');
  const [homeGpsLoading, setHomeGpsLoading] = useState<boolean>(false);
  const [homeGpsError, setHomeGpsError] = useState<string | null>(null);

  // 3. Doelvis selectie: STANDAARD IS ALTIJD 'Geen voorkeur'
  const [targetSpecies, setTargetSpecies] = useState<ViscoachTargetSpecies>('Geen voorkeur');

  // 4. Sessieduur selectie: STANDAARD IS STRIKT NULL (GEEN VERZONNEN STANDAARD)
  const [selectedDurationHours, setSelectedDurationHours] = useState<number | null>(null);
  const [customDurationInput, setCustomDurationInput] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [durationPromptVisible, setDurationPromptVisible] = useState<boolean>(false);

  // 5. Nieuwe visstek toevoegen inline/modal state
  const [isAddingNewSpot, setIsAddingNewSpot] = useState<boolean>(false);
  const [newSpotName, setNewSpotName] = useState<string>('');
  const [newSpotWaterType, setNewSpotWaterType] = useState<FishingLocation['waterType']>('Plas/Zandafgraving');
  const [newSpotDepth, setNewSpotDepth] = useState<string>('');
  const [newSpotLat, setNewSpotLat] = useState<string>('51.9610');
  const [newSpotLon, setNewSpotLon] = useState<string>('5.2280');
  const [newSpotError, setNewSpotError] = useState<string | null>(null);
  const [newSpotGpsLoading, setNewSpotGpsLoading] = useState<boolean>(false);

  // Laad de opgeslagen thuislocatie bij het openen
  useEffect(() => {
    let isMounted = true;
    async function fetchHome() {
      const saved = await getHomeLocation();
      if (isMounted && saved) {
        setHomeLocation(saved);
        setHomeName(saved.name || '');
        setHomeLat(saved.latitude !== null && saved.latitude !== undefined ? String(saved.latitude) : '');
        setHomeLon(saved.longitude !== null && saved.longitude !== undefined ? String(saved.longitude) : '');
      }
    }
    if (isOpen) {
      fetchHome();
      // Zorg dat de geselecteerde stek geldig is
      if (!selectedLocationId && locations.length > 0) {
        setSelectedLocationId(locations[0].id);
      }
      // Sessieduur mag nooit ongemerkt van een eerdere sessie overgenomen worden
      setSelectedDurationHours(null);
      setIsCustomDuration(false);
      setCustomDurationInput('');
      setDurationPromptVisible(false);
      setIsAddingNewSpot(false);
      setIsEditingHome(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, locations]);

  if (!isOpen) return null;

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) || null;

  // Afstand berekening via Haversine
  const distanceKm = calculateHaversineDistanceKm(
    homeLocation?.latitude,
    homeLocation?.longitude,
    selectedLocation?.latitude,
    selectedLocation?.longitude
  );

  const isWithin5Km = distanceKm !== null ? distanceKm <= 5.0 : null;

  // Bouw de herbruikbare gegevensstructuur
  const sessionContext: ViscoachSessionContext = buildViscoachSessionContext({
    selectedLocation,
    homeLocation,
    targetSpecies,
    sessionDurationHours: selectedDurationHours,
    isCustomDuration,
  });

  // Handmatige thuislocatie opslaan
  const handleSaveHomeLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const latNum = parseFloat(homeLat.replace(',', '.'));
    const lonNum = parseFloat(homeLon.replace(',', '.'));

    const payload: HomeLocation = {
      name: homeName.trim() || 'Mijn Thuislocatie',
      latitude: !isNaN(latNum) ? latNum : null,
      longitude: !isNaN(lonNum) ? lonNum : null,
      updatedAt: new Date().toISOString(),
    };

    await saveHomeLocation(payload);
    setHomeLocation(payload);
    setIsEditingHome(false);
    setHomeGpsError(null);
  };

  // Eenmalige GPS-locatiebepaling voor thuislocatie (uitsluitend na expliciete klik)
  const handleGetHomeGps = () => {
    if (!navigator.geolocation) {
      setHomeGpsError('GPS-locatiebepaling wordt niet ondersteund door deze browser.');
      return;
    }
    setHomeGpsLoading(true);
    setHomeGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHomeLat(pos.coords.latitude.toFixed(5));
        setHomeLon(pos.coords.longitude.toFixed(5));
        if (!homeName.trim()) {
          setHomeName('Mijn Thuislocatie (GPS)');
        }
        setHomeGpsLoading(false);
      },
      (err) => {
        setHomeGpsError(`GPS fout: ${err.message}`);
        setHomeGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Nieuwe visstek toevoegen vanuit Viscoach met duplicaatcontrole
  const handleAddNewSpotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSpotName.trim();
    if (!cleanName) {
      setNewSpotError('Voer een naam in voor de visstek.');
      return;
    }

    if (isDuplicateSpotName(cleanName, locations)) {
      setNewSpotError(`Er bestaat al een visstek met de naam "${cleanName}". Kies een unieke naam.`);
      return;
    }

    const latNum = parseFloat(newSpotLat.replace(',', '.'));
    const lonNum = parseFloat(newSpotLon.replace(',', '.'));
    const depthNum = newSpotDepth.trim() ? parseFloat(newSpotDepth.replace(',', '.')) : undefined;

    const newLoc: FishingLocation = {
      id: 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: cleanName,
      waterType: newSpotWaterType,
      waterDepth: depthNum && !isNaN(depthNum) ? depthNum : undefined,
      latitude: !isNaN(latNum) ? latNum : undefined,
      longitude: !isNaN(lonNum) ? lonNum : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveLocation(newLoc);
    setSelectedLocationId(newLoc.id);
    setIsAddingNewSpot(false);
    setNewSpotName('');
    setNewSpotDepth('');
    setNewSpotError(null);
  };

  // Duration selectie presets
  const standardDurations = [1, 2, 3, 4, 5, 6, 8, 10];

  const handleSelectPresetDuration = (hours: number) => {
    setSelectedDurationHours(hours);
    setIsCustomDuration(false);
    setCustomDurationInput('');
    setDurationPromptVisible(false);
  };

  const handleCustomDurationChange = (val: string) => {
    setCustomDurationInput(val);
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedDurationHours(parsed);
      setIsCustomDuration(true);
      setDurationPromptVisible(false);
    } else {
      setSelectedDurationHours(null);
    }
  };

  // Validatie bij doorklikken naar prognose of sessiestart
  const handleProceedToPrognosis = () => {
    if (!selectedLocationId) return;
    if (selectedDurationHours === null) {
      setDurationPromptVisible(true);
      return;
    }
    const speciesArg = targetSpecies === 'Geen voorkeur' || targetSpecies === 'Overig' ? undefined : (targetSpecies as FishSpecies);
    onNavigateToPrognosis(selectedLocationId, speciesArg);
    onClose();
  };

  const handleStartSessionNow = () => {
    if (!selectedLocationId) return;
    if (selectedDurationHours === null) {
      setDurationPromptVisible(true);
      return;
    }
    const speciesArg = targetSpecies === 'Geen voorkeur' || targetSpecies === 'Overig' ? undefined : (targetSpecies as FishSpecies);
    onStartSessionFromViscoach(selectedLocationId, speciesArg, selectedDurationHours);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="viscoach-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-800/60 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header Rij */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950/70 border-b border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="viscoach-modal-title" className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Viscoach
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Deel 1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sessie-intake, visstekselectie, thuislocatie &amp; doelvis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Sluiten"
            aria-label="Sluit Viscoach pop-up"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollbare Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* 1. VISSTEK SELECTIE */}
          <section className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/70">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                1. Visstek selecteren
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewSpot(!isAddingNewSpot);
                  setNewSpotError(null);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNewSpot ? 'Annuleer nieuwe stek' : 'Nieuwe visstek toevoegen'}</span>
              </button>
            </div>

            {/* Formulier voor nieuwe stek toevoegen indien geopend */}
            {isAddingNewSpot ? (
              <form onSubmit={handleAddNewSpotSubmit} className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-3">
                <span className="text-xs font-bold text-emerald-400 block">
                  Nieuwe visstek registreren
                </span>
                {newSpotError && (
                  <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{newSpotError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Naam van de visstek *</label>
                  <input
                    type="text"
                    required
                    placeholder="bv. Lokkershoek Westoever, Zandgat..."
                    value={newSpotName}
                    onChange={(e) => setNewSpotName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Watertype</label>
                    <select
                      value={newSpotWaterType}
                      onChange={(e) => setNewSpotWaterType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Plas/Zandafgraving">Plas / Zandafgraving</option>
                      <option value="Kanaal">Kanaal</option>
                      <option value="Rivier">Rivier</option>
                      <option value="Polder">Polder / Wetering</option>
                      <option value="Stadswater">Stadswater</option>
                      <option value="Haven">Haven</option>
                      <option value="Overig">Overig</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Diepte (m, optioneel)</label>
                    <input
                      type="text"
                      placeholder="bv. 2.5"
                      value={newSpotDepth}
                      onChange={(e) => setNewSpotDepth(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Breedtegraad (Lat)</label>
                    <input
                      type="text"
                      value={newSpotLat}
                      onChange={(e) => setNewSpotLat(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Lengtegraad (Lon)</label>
                    <input
                      type="text"
                      value={newSpotLon}
                      onChange={(e) => setNewSpotLon(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSpot(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Opslaan &amp; Selecteren
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <label className="block text-[11px] text-slate-300 font-semibold">
                  Kies een geregistreerde visstek:
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.waterType ? `(${loc.waterType})` : ''}
                    </option>
                  ))}
                </select>

                {selectedLocation && (
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white block">{selectedLocation.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {selectedLocation.waterType || 'Geen watertype'} &bull;{' '}
                        {selectedLocation.waterDepth !== undefined ? `Diepte ~${selectedLocation.waterDepth} m` : 'Diepte onbekend'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {selectedLocation.latitude !== undefined && selectedLocation.longitude !== undefined
                        ? `GPS: ${selectedLocation.latitude.toFixed(4)}° NB, ${selectedLocation.longitude.toFixed(4)}° OL`
                        : 'Geen GPS-coördinaten vastgelegd'}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>De gekozen visstek is altijd de locatie waarop weersverwachting en visprognose worden gebaseerd.</span>
                </p>
              </div>
            )}
          </section>

          {/* 2. THUISLOCATIE INSTELLEN & AFSTAND */}
          <section className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/70">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-4 h-4 text-cyan-400" />
                2. Thuislocatie &amp; Afstand tot visstek
              </span>
              <button
                type="button"
                onClick={() => setIsEditingHome(!isEditingHome)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
              >
                {isEditingHome ? 'Sluit bewerken' : homeLocation ? 'Thuislocatie wijzigen' : 'Thuislocatie instellen'}
              </button>
            </div>

            {/* Weergave huidige thuislocatie & Afstand */}
            {!isEditingHome && (
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/70 border border-slate-700/60">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                      Thuisbasis:
                    </span>
                    <span className="text-white font-bold block">
                      {homeLocation?.name || 'Nog geen thuislocatie opgeslagen'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {homeLocation?.latitude !== null && homeLocation?.latitude !== undefined
                        ? `${homeLocation.latitude.toFixed(4)}° NB, ${homeLocation.longitude?.toFixed(4)}° OL`
                        : 'GPS-coördinaten niet ingesteld'}
                    </span>
                  </div>

                  {/* Afstand Badge en Waarde */}
                  <div className="flex flex-col sm:items-end">
                    <span className="text-[11px] text-slate-400 font-semibold">Afstand tot stek:</span>
                    {distanceKm !== null ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-black text-white">{distanceKm} km</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isWithin5Km
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {isWithin5Km ? '≤ 5 km (thuiszone)' : '> 5 km'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic mt-0.5">
                        Coördinaten ontbreken
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>De thuislocatie staat los van de visstek en wordt nooit gebruikt als vervanging in weer- of prognoseberekeningen.</span>
                </p>
              </div>
            )}

            {/* Formulier voor thuislocatie bewerken */}
            {isEditingHome && (
              <form onSubmit={handleSaveHomeLocation} className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">Thuislocatie instellen</span>
                  <button
                    type="button"
                    onClick={handleGetHomeGps}
                    disabled={homeGpsLoading}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{homeGpsLoading ? 'GPS bepalen...' : 'Huidige GPS gebruiken'}</span>
                  </button>
                </div>

                {homeGpsError && (
                  <span className="text-[11px] text-rose-400 block">{homeGpsError}</span>
                )}

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 font-semibold">Naam / Omschrijving thuislocatie</label>
                  <input
                    type="text"
                    placeholder="bv. Thuis Utrecht, Woonplaats..."
                    value={homeName}
                    onChange={(e) => setHomeName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Breedtegraad (Lat)</label>
                    <input
                      type="text"
                      placeholder="bv. 52.0907"
                      value={homeLat}
                      onChange={(e) => setHomeLat(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Lengtegraad (Lon)</label>
                    <input
                      type="text"
                      placeholder="bv. 5.1214"
                      value={homeLon}
                      onChange={(e) => setHomeLon(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingHome(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                  >
                    Thuislocatie Opslaan
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 3. DOELVIS SELECTEREN (STANDAARD IS ALTIJD 'Geen voorkeur') */}
          <section className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/70">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Fish className="w-4 h-4 text-emerald-400" />
                3. Doelvis selecteren
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Gekozen: <strong className="text-emerald-300">{targetSpecies}</strong>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              De standaardkeuze is altijd <strong>Geen voorkeur</strong>. Viscoach houdt in dat geval rekening met zowel witvis als roofvis.
            </p>

            {/* Species button grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {VISCOACH_SPECIES_OPTIONS.map((spec) => {
                const isSelected = targetSpecies === spec;
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setTargetSpecies(spec)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-1 ring-emerald-400/30'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. SESSIEDUUR SELECTEREN (STRIKT GEEN STANDAARDWAARDE) */}
          <section className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/70">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                4. Gewenste sessieduur selecteren
              </span>
              <span className="text-[11px] font-medium">
                {selectedDurationHours !== null ? (
                  <span className="text-amber-300 font-bold">{selectedDurationHours} uur geselecteerd</span>
                ) : (
                  <span className="text-rose-400 font-semibold italic">Nog geen duur gekozen</span>
                )}
              </span>
            </div>

            {durationPromptVisible && (
              <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-600/70 text-amber-200 text-xs flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Sessieduur vereist:</strong> Kies eerst hoe lang u wilt vissen voordat een advies of sessie kan worden gestart. Viscoach vult nooit automatisch een sessieduur in.
                </span>
              </div>
            )}

            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {standardDurations.map((hrs) => {
                const isSelected = selectedDurationHours === hrs && !isCustomDuration;
                return (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => handleSelectPresetDuration(hrs)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {hrs} {hrs === 1 ? 'uur' : 'uur'}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setIsCustomDuration(true);
                  if (customDurationInput) {
                    handleCustomDurationChange(customDurationInput);
                  } else {
                    setSelectedDurationHours(null);
                  }
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                  isCustomDuration
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                Eigen duur
              </button>
            </div>

            {/* Eigen duur input */}
            {isCustomDuration && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs text-slate-300 font-semibold shrink-0">
                  Aantal uren:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  placeholder="bv. 3.5 of 7"
                  value={customDurationInput}
                  onChange={(e) => handleCustomDurationChange(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-400">
                  (Voer het gewenste aantal uren in, bijv. 2.5 of 7 uur)
                </span>
              </div>
            )}
          </section>

          {/* 5. OVERZICHT VISCOACH GEGEVENSSTRUCTUUR */}
          <section className="p-3.5 rounded-2xl bg-slate-950/60 border border-cyan-900/40 space-y-2">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
              Samenvatting Viscoach Gegevens (Deel 1):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Visstek:</span>
                <span className="font-semibold text-white">
                  {selectedLocation?.name || 'Geen stek'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {selectedLocation?.latitude !== undefined
                    ? `${selectedLocation.latitude.toFixed(4)}° NB, ${selectedLocation.longitude?.toFixed(4)}° OL`
                    : 'GPS onbekend'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Thuislocatie &amp; Afstand:</span>
                <span className="font-semibold text-white">
                  {homeLocation?.name || 'Niet ingesteld'}
                </span>
                <span className="text-[10px] text-cyan-300 block">
                  {distanceKm !== null ? `${distanceKm} km (${isWithin5Km ? 'binnen 5 km' : '> 5 km'})` : 'Afstand onbekend'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Doelvis:</span>
                <span className="font-semibold text-emerald-300">
                  {targetSpecies}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Sessieduur:</span>
                <span className={`font-semibold ${selectedDurationHours !== null ? 'text-amber-300' : 'text-rose-400 italic'}`}>
                  {selectedDurationHours !== null ? `${selectedDurationHours} uur` : 'Geen duur gekozen'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Sluiten
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleProceedToPrognosis}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-800 hover:bg-cyan-700 text-cyan-100 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-cyan-300" />
              <span>Naar Visprognose</span>
            </button>
            <button
              type="button"
              onClick={handleStartSessionNow}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Vissessie</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
