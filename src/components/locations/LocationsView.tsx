import React, { useState } from 'react';
import { FishingLocation, FishingSession, CatchItem } from '../../types';
import { LocationModal } from './LocationModal';
import { deleteLocationSafely } from '../../db/db';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Navigation,
  Fish,
  Clock,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface LocationsViewProps {
  locations: FishingLocation[];
  sessions: FishingSession[];
  catches: CatchItem[];
  onRefreshData: () => Promise<void>;
  onSaveLocation: (loc: FishingLocation) => Promise<void>;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  locations,
  sessions,
  catches,
  onRefreshData,
  onSaveLocation,
}) => {
  const [editingLocation, setEditingLocation] = useState<FishingLocation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async (locId: string) => {
    try {
      setErrorMessage(null);
      await deleteLocationSafely(locId);
      await onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kon locatie niet verwijderen.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-400" />
            Visstekken & Locaties
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Beheer jouw viswateren, oeverstekken en gekoppelde vangststatistieken.
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Stek Toevoegen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => {
          const locSessions = sessions.filter((s) => s.locationId === loc.id);
          const locCatches = catches.filter((c) => c.locationId === loc.id || locSessions.some((s) => s.id === c.sessionId));
          const totalFish = locCatches.reduce((sum, c) => sum + (c.count || 1), 0);
          const totalDurationMin = locSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
          const totalHours = totalDurationMin / 60;
          const cpue = totalHours > 0 ? (totalFish / totalHours).toFixed(2) : '0.00';

          return (
            <div
              key={loc.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition ${
                loc.isBenchmark
                  ? 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                  : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{loc.name}</h3>
                      {loc.isBenchmark && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-600/40">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          Beschermde Benchmark
                        </span>
                      )}
                    </div>
                    {loc.description && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {loc.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingLocation(loc)}
                      className="p-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
                      title="Stek bewerken"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id)}
                      className="p-1.5 rounded-xl bg-slate-700/60 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 transition"
                      title={loc.isBenchmark ? 'Benchmark kan niet worden verwijderd' : 'Stek verwijderen'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Eigenschappen Tags */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300 mt-3">
                  {loc.waterType && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700">
                      {loc.waterType}
                    </span>
                  )}
                  {loc.waterDepth && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700">
                      Diepte: {loc.waterDepth}m
                    </span>
                  )}
                  {loc.latitude && loc.longitude && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center gap-1 text-[11px] text-slate-400">
                      <Navigation className="w-3 h-3 text-emerald-400" />
                      {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}
                    </span>
                  )}
                </div>

                {(loc.windExposure || loc.effectiveFetchM !== undefined || loc.secchiDepthM !== undefined || loc.waterMovement) && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                    {loc.windExposure && <span className="rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1">Wind: {loc.windExposure === 'sheltered' ? 'beschut' : loc.windExposure === 'partly_exposed' ? 'deels open' : 'open'}</span>}
                    {loc.effectiveFetchM !== undefined && <span className="rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1">Fetch: {loc.effectiveFetchM} m</span>}
                    {loc.secchiDepthM !== undefined && <span className="rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1">Zichtdiepte: {loc.secchiDepthM} m</span>}
                    {loc.waterMovement && loc.waterMovement !== 'unknown' && <span className="rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1">Waterbeweging: {loc.waterMovement === 'still' ? 'stil' : loc.waterMovement === 'weak_flow' ? 'zwak stromend' : loc.waterMovement === 'flowing' ? 'stromend' : 'getijde'}</span>}
                  </div>
                )}

                {loc.notes && (
                  <p className="text-xs text-slate-400 mt-3 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    {loc.notes}
                  </p>
                )}
              </div>

              {/* Statistieken Voettekst */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-3.5 border-t border-slate-700/60 text-center">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sessies</span>
                  <span className="text-sm font-bold text-white">{locSessions.length}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vissen</span>
                  <span className="text-sm font-bold text-emerald-400">{totalFish}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vangst / Uur</span>
                  <span className="text-sm font-bold text-cyan-300">{cpue}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(editingLocation || isAddingNew) && (
        <LocationModal
          location={editingLocation}
          onSave={async (locData) => {
            await onSaveLocation(locData);
            await onRefreshData();
            setIsAddingNew(false);
            setEditingLocation(null);
          }}
          onClose={() => {
            setIsAddingNew(false);
            setEditingLocation(null);
          }}
        />
      )}
    </div>
  );
};
