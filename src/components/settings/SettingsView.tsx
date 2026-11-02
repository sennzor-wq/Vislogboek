
import React, { useState } from 'react';
import {
  exportDatabaseToJson,
  exportCatchesToCsv,
  inspectImportFile,
  mergeImportData,
  replaceWithImportData,
  MAX_BACKUP_FILE_SIZE_BYTES,
  ImportPreview,
  BackupData,
} from '../../services/backupService';
import { FishingLocation, FishingSession, CatchItem } from '../../types';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Smartphone,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface SettingsViewProps {
  locations: FishingLocation[];
  sessions: FishingSession[];
  catches: CatchItem[];
  onRefreshData: () => Promise<void>;
  showAdvancedPrognosisDetails: boolean;
  onToggleAdvancedPrognosisDetails: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  locations,
  sessions,
  catches,
  onRefreshData,
  showAdvancedPrognosisDetails,
  onToggleAdvancedPrognosisDetails,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [importing, setImporting] = useState<boolean>(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [pendingBackupData, setPendingBackupData] = useState<BackupData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExportJson = async () => {
    try {
      setStatusMessage('JSON-back-up succesvol gegenereerd en gedownload.');
      await exportDatabaseToJson();
    } catch (e: any) {
      setErrorMessage(`Export mislukt: ${e.message}`);
    }
  };

  const handleExportCsv = async () => {
    try {
      setStatusMessage('CSV-bestand met alle geregistreerde vangsten gedownload.');
      await exportCatchesToCsv();
    } catch (e: any) {
      setErrorMessage(`CSV export mislukt: ${e.message}`);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BACKUP_FILE_SIZE_BYTES) {
      setErrorMessage(`Back-upbestand is te groot. De maximale bestandsgrootte is ${Math.round(MAX_BACKUP_FILE_SIZE_BYTES / (1024 * 1024))} MB.`);
      e.target.value = '';
      return;
    }

    setImporting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const content = reader.result as string;
        const { preview, data } = await inspectImportFile(content);

        if (!preview.valid || !data) {
          setErrorMessage(preview.error || 'Ongeldig JSON back-upbestand.');
          setImporting(false);
          return;
        }

        setImportPreview(preview);
        setPendingBackupData(data);
      } catch (err: any) {
        setErrorMessage(`Fout bij controleren van back-up: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Het back-upbestand kon niet worden gelezen.');
      setImporting(false);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmMerge = async () => {
    if (!pendingBackupData) return;

    try {
      const result = await mergeImportData(pendingBackupData);

      setStatusMessage(
        `Gegevens samengevoegd: ${result.addedSessions} sessie(s), ${result.addedCatches} vangst(en), ${result.addedLocations} locatie(s), ${result.addedWeatherCache} weeritem(s), ${result.addedPrognosisSnapshots} prognose(s) en ${result.addedPresenceObservations} waarneming(en) toegevoegd${result.settingsImported ? ', inclusief instellingen' : ''}.`
      );

      setImportPreview(null);
      setPendingBackupData(null);
      await onRefreshData();
    } catch (err: any) {
      setErrorMessage(`Fout bij samenvoegen: ${err.message}`);
    }
  };

  const handleConfirmReplace = async () => {
    if (!pendingBackupData) return;

    try {
      await replaceWithImportData(pendingBackupData);

      setStatusMessage(
        `Database volledig hersteld, inclusief instellingen, weercache, prognosehistorie, waarnemingen en foto's. Er is vóór het overschrijven automatisch een volledige veiligheidsback-up gedownload.`
      );

      setImportPreview(null);
      setPendingBackupData(null);
      await onRefreshData();
    } catch (err: any) {
      setErrorMessage(`Fout bij herstellen: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          Instellingen & Gegevensbeheer
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Beheer lokale opslag, back-ups en CSV-exports.
        </p>
      </div>

      {/* Meldingen */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 flex items-center justify-between text-xs sm:text-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold uppercase underline hover:text-white"
          >
            Sluiten
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 flex items-center justify-between text-xs sm:text-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
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

      {/* Lokale Opslag & Privacy Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lokale Opslag Overzicht */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-3.5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            Lokale Opslag (IndexedDB)
          </h2>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">Sessies</span>
              <span className="text-lg font-black text-white">{sessions.length}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">Vangsten</span>
              <span className="text-lg font-black text-emerald-400">{catches.length}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">Locaties</span>
              <span className="text-lg font-black text-cyan-300">{locations.length}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Alle gegevens worden 100% lokaal in jouw browser bewaard. Geen externe account of verplichte cloud-login vereist.
          </p>
        </div>

        {/* PWA Installatiestatus */}
        <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Progressive Web App (PWA)
            </h2>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-300 font-semibold">Installatiestatus:</span>

              {isInstalled ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  Geïnstalleerd als applicatie
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                  Web browser weergave
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Installeer Vislogboek op je mobiele startscherm voor snelle offline toegang en een native app-ervaring aan de waterkant.
            </p>
          </div>

          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Installeer Nu op Apparaat
            </button>
          )}
        </div>
      </div>

      {/* Prognoseweergave */}
      <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            Weergave van de prognosepagina
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Kies hoeveel technische uitleg je wilt zien. De berekeningen en onderliggende gegevens blijven altijd hetzelfde.</p>
        </div>
        <button type="button" role="switch" aria-checked={showAdvancedPrognosisDetails}
          onClick={() => onToggleAdvancedPrognosisDetails(!showAdvancedPrognosisDetails)}
          className="w-full flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900 border border-slate-700 text-left cursor-pointer hover:border-emerald-600/60 transition">
          <span>
            <span className="block text-sm font-semibold text-white">{showAdvancedPrognosisDetails ? "Geavanceerde weergave" : "Standaardweergave"}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">{showAdvancedPrognosisDetails ? "Technische analyses, modeldetails en onzekerheden zijn zichtbaar." : "Praktische prognose en adviezen; technische modeluitleg is verborgen."}</span>
          </span>
          <span className={"relative w-11 h-6 rounded-full shrink-0 transition " + (showAdvancedPrognosisDetails ? "bg-emerald-600" : "bg-slate-700")}>
            <span className={"absolute top-1 w-4 h-4 rounded-full bg-white transition " + (showAdvancedPrognosisDetails ? "left-6" : "left-1")} />
          </span>
        </button>
      </div>
      {/* Back-up & Export Sectie */}
      <div className="p-6 rounded-3xl bg-slate-800/70 border border-slate-700/70 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Back-up, Exporteren & Importeren
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            Exporteer je gegevens regelmatig om ze veilig te stellen of over te zetten naar een ander apparaat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Volledige JSON Export */}
          <button
            onClick={handleExportJson}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-emerald-500/60 transition group cursor-pointer text-center"
          >
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 group-hover:scale-110 transition">
              <Download className="w-5 h-5" />
            </div>

            <span className="text-sm font-bold text-white mt-3">JSON Back-up Maken</span>

            <span className="text-[11px] text-slate-400 mt-1">
              Volledig archief van locaties, sessies, vangsten en instellingen.
            </span>
          </button>

          {/* CSV Vangsten Export */}
          <button
            onClick={handleExportCsv}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-cyan-500/60 transition group cursor-pointer text-center"
          >
            <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 group-hover:scale-110 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <span className="text-sm font-bold text-white mt-3">CSV Vangsten Export</span>

            <span className="text-[11px] text-slate-400 mt-1">
              Geschikt voor tabellen en analyses in Excel of Google Sheets.
            </span>
          </button>

          {/* JSON Import Knop */}
          <label className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-purple-500/60 transition group cursor-pointer text-center">
            <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-purple-400 group-hover:scale-110 transition">
              <Upload className="w-5 h-5" />
            </div>

            <span className="text-sm font-bold text-white mt-3">Back-up Herstellen</span>

            <span className="text-[11px] text-slate-400 mt-1">
              Selecteer een eerder opgeslagen .json-bestand met preview.
            </span>

            <input
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Import Preview Modal */}
      {importPreview && pendingBackupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-850 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              Back-up Bestand Inspectie
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Back-up Versie:</span>
                <span className="font-bold text-white">v{importPreview.version || 2}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Exportdatum:</span>
                <span className="text-slate-200">
                  {importPreview.exportedAt
                    ? new Date(importPreview.exportedAt).toLocaleString('nl-NL')
                    : 'Onbekend'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Aantal Sessies:</span>
                <span className="font-bold text-emerald-400">{importPreview.sessionsCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Aantal Vangsten:</span>
                <span className="font-bold text-cyan-400">{importPreview.catchesCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Aantal Locaties:</span>
                <span className="font-bold text-amber-400">{importPreview.locationsCount}</span>
              </div>

              {importPreview.duplicateSessionCount > 0 && (
                <div className="flex justify-between text-amber-300 font-semibold pt-1 border-t border-slate-800">
                  <span>Reeds bestaande sessie-ID's:</span>
                  <span>{importPreview.duplicateSessionCount} dubbel</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Hoe wil je deze gegevens inladen?
              </span>

              {/* Optie 1: Samenvoegen */}
              <button
                onClick={handleConfirmMerge}
                className="w-full p-3.5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500 text-left transition cursor-pointer"
              >
                <span className="font-bold text-white text-sm block">
                  1. Samenvoegen (Aanbevolen)
                </span>

                <span className="text-xs text-slate-400 block mt-0.5">
                  Voegt nieuwe sessies en vangsten toe aan jouw huidige database zonder bestaande gegevens te wissen.
                </span>
              </button>

              {/* Optie 2: Volledig Vervangen */}
              <button
                onClick={handleConfirmReplace}
                className="w-full p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 hover:border-rose-500 text-left transition cursor-pointer"
              >
                <span className="font-bold text-rose-300 text-sm block">
                  2. Volledig Vervangen
                </span>

                <span className="text-xs text-rose-200/80 block mt-0.5">
                  Wist de huidige gebruikersdata en herstelt de geselecteerde back-up. Er wordt automatisch eerst een veiligheidsback-up gedownload.
                </span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setImportPreview(null);
                  setPendingBackupData(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
