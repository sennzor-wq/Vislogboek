import React, { useState } from 'react';
import { FishingLocation } from '../../types';
import { MapPin, Navigation, Sparkles } from 'lucide-react';

interface LocationModalProps {
  location?: FishingLocation | null;
  onSave: (loc: FishingLocation) => Promise<void>;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  location,
  onSave,
  onClose,
}) => {
  const isEditing = !!location;

  const [name, setName] = useState(location?.name || '');
  const [description, setDescription] = useState(location?.description || '');
  const [waterType, setWaterType] = useState<FishingLocation['waterType']>(
    location?.waterType || 'Onbekend'
  );
  const [waterDepth, setWaterDepth] = useState<string>(
    location?.waterDepth !== undefined ? String(location.waterDepth) : ''
  );
  const [latitude, setLatitude] = useState<string>(
    location?.latitude !== undefined ? String(location.latitude) : ''
  );
  const [longitude, setLongitude] = useState<string>(
    location?.longitude !== undefined ? String(location.longitude) : ''
  );
  const [notes, setNotes] = useState(location?.notes || '');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS wordt niet ondersteund door deze browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(5));
        setLongitude(pos.coords.longitude.toFixed(5));
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`GPS fout: ${err.message}`);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(latitude.replace(',', '.'));
    const lonNum = parseFloat(longitude.replace(',', '.'));
    const depthNum = waterDepth.trim() !== '' ? parseFloat(waterDepth.replace(',', '.')) : undefined;
    const hasAnyGps = latitude.trim() !== '' || longitude.trim() !== '';
    const validGps = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90 && Number.isFinite(lonNum) && lonNum >= -180 && lonNum <= 180;
    if (hasAnyGps && !validGps) { setGpsError('Vul beide geldige GPS-coördinaten in, of laat beide velden leeg.'); return; }

    const locPayload: FishingLocation = {
      id: location?.id || 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      description: description.trim() || undefined,
      waterType,
      waterDepth: depthNum && !isNaN(depthNum) ? depthNum : undefined,
      latitude: validGps ? latNum : undefined,
      longitude: validGps ? lonNum : undefined,
      notes: notes.trim() || undefined,
      isBenchmark: location?.isBenchmark || false,
      createdAt: location?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSave(locPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            {isEditing ? 'Visstek Bewerken' : 'Nieuwe Visstek Toevoegen'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Naam van de visstek *
            </label>
            <input
              type="text"
              required
              placeholder="bv. Lokkershoek, Lekdijk, Kromme Rijn..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Beschrijving / Oeverzijde
            </label>
            <input
              type="text"
              placeholder="bv. Campingzijde bij het doodlopende gedeelte en de bomen"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Watertype
              </label>
              <select
                value={waterType}
                onChange={(e) => setWaterType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Onbekend">Onbekend / nog niet vastgesteld</option>
                <option value="Plas/Zandafgraving">Plas / Zandafgraving</option>
                <option value="Kanaal">Kanaal</option>
                <option value="Rivier">Rivier</option>
                <option value="Polder">Polder / Wetering</option>
                <option value="Stadswater">Stadswater / Singel</option>
                <option value="Haven">Haven</option>
                <option value="Overig">Overig</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Waterdiepte (m, optioneel)
              </label>
              <input
                type="text"
                placeholder="bv. 2.5"
                value={waterDepth}
                onChange={(e) => setWaterDepth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* GPS Coördinaten met auto-detect */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                GPS Coördinaten (voor weer & voorspelling)
              </span>
              <button
                type="button"
                onClick={handleGetCurrentGps}
                disabled={gpsLoading}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
              >
                {gpsLoading ? 'GPS bepalen...' : 'Huidige GPS gebruiken'}
              </button>
            </div>

            {gpsError && (
              <span className="text-[11px] text-rose-400 block">{gpsError}</span>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Breedtegraad (Lat)</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Lengtegraad (Lon)</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notities / Bodemverloop
            </label>
            <textarea
              rows={2}
              placeholder="Bodemgesteldheid (hard zand, slib, mosselbanken), visrecht, parkeerinfo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg cursor-pointer"
            >
              {isEditing ? 'Locatie Opslaan' : 'Locatie Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
