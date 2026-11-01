import React, { useState } from 'react';
import { FishingSession, SessionOutcome } from '../../types';
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';

interface EndSessionModalProps {
  session: FishingSession;
  hasCatches: boolean;
  onConfirmEnd: (sessionId: string, outcome: SessionOutcome, notes?: string) => Promise<void>;
  onClose: () => void;
}

export const EndSessionModal: React.FC<EndSessionModalProps> = ({
  session,
  hasCatches,
  onConfirmEnd,
  onClose,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<SessionOutcome>(
    hasCatches ? 'catch' : 'skunk_confirmed'
  );
  const [notes, setNotes] = useState(session.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirmEnd(session.id, selectedOutcome, notes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100">
        <h3 className="text-xl font-black text-white">Vissessie Beëindigen</h3>
        <p className="text-xs text-slate-400 mt-1">
          Locatie: <span className="text-slate-200 font-semibold">{session.locationName || 'Geen vaste stek'}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Wat was de definitieve uitkomst van deze sessie?
            </label>

            {hasCatches ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 flex items-center gap-3 text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-sm text-white">Vangst(en) geregistreerd</span>
                  Er zijn al vangsten gekoppeld aan deze sessie. De uitkomst wordt opgeslagen als geslaagde vangstsessie.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedOutcome === 'skunk_confirmed'
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="skunk_confirmed"
                    checked={selectedOutcome === 'skunk_confirmed'}
                    onChange={() => setSelectedOutcome('skunk_confirmed')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-amber-400" />
                      Bevestigde nulvangst (Blank)
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Je hebt gevist maar er is geen vis geland. Dit levert waardevolle biologische data voor de prognoseberekening.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    selectedOutcome === 'unknown'
                      ? 'bg-slate-700/60 border-slate-500/80 shadow-md ring-1 ring-slate-400/30'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="unknown"
                    checked={selectedOutcome === 'unknown'}
                    onChange={() => setSelectedOutcome('unknown')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      Onbekend / Niet bevestigd
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Gebruik dit als de registratie onvolledig was of niet representatief is. Deze sessie telt dan niet mee als nulvangst.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Afsluitende notities (optioneel)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijv. beetregistratie, opvallend visgedrag, watertroebelheid..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg transition active:scale-95"
            >
              Sessie Opslaan & Afsluiten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
