import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Als app al geïnstalleerd is, toon geen knop
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition active:scale-95 cursor-pointer"
        title="Installeer Vislogboek op je startscherm voor offline gebruik aan het water"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Installeer</span> App
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Installeer</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  Installeer op iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                1. Tik onderaan in Safari op het <strong>Deel-icoon</strong> (<span className="text-emerald-400">vierkantje met pijltje omhoog</span>).<br />
                2. Scroll naar beneden en kies <strong>Zet op beginscherm</strong>.<br />
                3. Tik op <strong>Voeg toe</strong>.
              </p>
              <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-xs text-emerald-200">
                Hiermee werkt Vislogboek razendsnel en offline aan de waterkant, precies zoals een native app!
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-700 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 transition"
              >
                Begrepen
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
