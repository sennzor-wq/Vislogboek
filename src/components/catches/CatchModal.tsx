import React, { useState } from 'react';
import { CatchItem, FishSpecies, ALL_SPECIES, FishingSession } from '../../types';
import { Camera, Scale, Sparkles, X, Image as ImageIcon } from 'lucide-react';

interface CatchModalProps {
  catchItem?: CatchItem | null;
  sessionId: string;
  activeSession?: FishingSession;
  onSave: (catchData: CatchItem) => Promise<void>;
  onClose: () => void;
}

export const CatchModal: React.FC<CatchModalProps> = ({
  catchItem,
  sessionId,
  activeSession,
  onSave,
  onClose,
}) => {
  const isEditing = !!catchItem;

  const now = new Date();
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const [species, setSpecies] = useState<FishSpecies | ''>(
    catchItem
      ? catchItem.legacyImportQuality?.speciesKnown === false ? '' : catchItem.species
      : activeSession?.targetSpecies?.[0] || ''
  );
  const [count, setCount] = useState<number>(
    catchItem && catchItem.legacyImportQuality?.countKnown === false ? 0 : catchItem?.count ?? 1
  );
  const [weightInput, setWeightInput] = useState<string>(
    catchItem?.weightKg !== undefined && catchItem?.weightKg !== null ? String(catchItem.weightKg) : ''
  );
  const [isGroupWeight, setIsGroupWeight] = useState<boolean>(catchItem?.isGroupWeight || false);
  const [lengthInput, setLengthInput] = useState<string>(
    catchItem?.lengthCm !== undefined && catchItem?.lengthCm !== null ? String(catchItem.lengthCm) : ''
  );
  const [timestamp, setTimestamp] = useState<string>(
    catchItem
      ? catchItem.legacyImportQuality?.timestampKnown === false ? '' : catchItem.timestamp.slice(0, 16)
      : formatDateTimeLocal(now)
  );
  const [rod, setRod] = useState<string>(catchItem?.rod || '');
  const [bait, setBait] = useState<string>(catchItem?.bait || activeSession?.baitAndFeed || '');
  const [technique, setTechnique] = useState<string>(catchItem?.technique || activeSession?.technique || '');
  const [notes, setNotes] = useState<string>(catchItem?.notes || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(catchItem?.photoUrl);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!species || !Number.isInteger(count) || count < 1 || !timestamp || !Number.isFinite(new Date(timestamp).getTime())) {
        setSubmitting(false);
        return;
      }
      const parsedWeight = weightInput.trim() !== '' ? parseFloat(weightInput.replace(',', '.')) : null;
      const parsedLength = lengthInput.trim() !== '' ? parseFloat(lengthInput.replace(',', '.')) : null;

      const payload: CatchItem = {
        id: catchItem?.id || 'catch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        sessionId,
        locationId: activeSession?.locationId,
        species: species as FishSpecies,
        count,
        weightKg: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : null,
        isGroupWeight: count > 1 ? isGroupWeight : false,
        lengthCm: parsedLength && !isNaN(parsedLength) ? parsedLength : null,
        timestamp: new Date(timestamp).toISOString(),
        rod: rod.trim() || undefined,
        bait: bait.trim() || undefined,
        technique: technique.trim() || undefined,
        notes: notes.trim() || undefined,
        photoUrl,
        createdAt: catchItem?.createdAt || new Date().toISOString(),
      };

      await onSave(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            {isEditing ? 'Vangst Bewerken' : 'Nieuwe Vangst Registreren'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs sm:text-sm">
          {/* Vissoort */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vissoort *
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as FishSpecies)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            >
              <option value="">Selecteer soort...</option>
              {ALL_SPECIES.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          {/* Aantal & Datum/Tijd */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aantal gevangen vissen *
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {count > 1 ? 'Groepsvangst (bijv. school brasems of voorns)' : 'Individuele vangst'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vangsttijdstip *
              </label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Gewicht en Lengte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gewicht in kg (optioneel)
              </label>
              <input
                type="text"
                placeholder="bv. 10.2 (leeg laten indien ongewogen)"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {count > 1 && (
                <label className="flex items-center gap-2 mt-1.5 text-slate-300 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isGroupWeight}
                    onChange={(e) => setIsGroupWeight(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Dit gewicht is het totaalgewicht van de groep</span>
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lengte in cm (optioneel)
              </label>
              <input
                type="text"
                placeholder="bv. 84.5"
                value={lengthInput}
                onChange={(e) => setLengthInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Aas & Techniek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gebruikt Aas
              </label>
              <input
                type="text"
                placeholder="bv. Maden, 15mm boilie, plug"
                value={bait}
                onChange={(e) => setBait(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Techniek / Hengel
              </label>
              <input
                type="text"
                placeholder="bv. Feederhengel links, werpend"
                value={rod}
                onChange={(e) => setRod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Foto upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Foto van de vangst (lokaal opgeslagen)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition text-xs font-semibold">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Foto kiezen of maken</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photoUrl && (
                <div className="relative group">
                  <img
                    src={photoUrl}
                    alt="Vangst preview"
                    className="w-12 h-12 object-cover rounded-xl border border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notities */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notities bij de vangst
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Drilverloop, conditie van de vis, bijzondere kenmerken..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Knoppen */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition active:scale-95 cursor-pointer"
            >
              {isEditing ? 'Vangst Bijwerken' : 'Vangst Registreren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
