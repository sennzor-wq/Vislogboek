import React, { useState, useEffect } from 'react';
import { FishingLocation, WeatherHourlyForecast } from '../../types';
import { getForecast, getWeatherDescription, WEATHER_UPDATED_EVENT, formatAmsterdamDate } from '../../services/weatherService';
import {
  CloudSun,
  Thermometer,
  Gauge,
  Wind,
  CloudRain,
  Compass,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  AlertCircle,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface WeatherViewProps {
  locations: FishingLocation[];
}

export const WeatherView: React.FC<WeatherViewProps> = ({ locations }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [hourlyForecast, setHourlyForecast] = useState<WeatherHourlyForecast[]>([]);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  const fetchWeather = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const lat = selectedLoc?.latitude ?? 51.961;
      const lon = selectedLoc?.longitude ?? 5.228;
      const res = await getForecast(lat, lon, forceRefresh);
      setHourlyForecast(res.hourly);
      setDailySummaries(res.dailySummaries);
      setIsFromCache(res.isFromCache);
      setFetchedAt(res.fetchedAt);
    } catch (err) {
      console.error('Fout bij ophalen weerdata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWeather(false);
    const handleWeatherUpdated = () => void fetchWeather(false);
    window.addEventListener(WEATHER_UPDATED_EVENT, handleWeatherUpdated);
    return () => window.removeEventListener(WEATHER_UPDATED_EVENT, handleWeatherUpdated);
  }, [selectedLocationId]);

  // Huidige omstandigheid
  const currentWeather = hourlyForecast[0];

  // Filter uren voor de geselecteerde dag
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDayOffset);
  const targetDateStr = formatAmsterdamDate(targetDate);
  const dayHourly = hourlyForecast.filter((h) => h.time.startsWith(targetDateStr));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-emerald-400" />
            Weer & Barometer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Gedetailleerde weersverwachting, luchtdruktrend en windcondities voor jouw visstekken.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-medium focus:ring-2 focus:ring-emerald-500"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchWeather(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Vernieuwen
          </button>
        </div>
      </div>

      {/* Herkomst en Cache Indicatie */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Locatie: <strong className="text-slate-200">{selectedLoc?.name}</strong> (
          {selectedLoc?.latitude?.toFixed(3)}, {selectedLoc?.longitude?.toFixed(3)})
        </span>
        <span>
          Status:{' '}
          <span className={isFromCache ? 'text-amber-400' : 'text-emerald-400'}>
            {isFromCache ? 'Gecachete data (offline beschikbaar)' : 'Actuele Open-Meteo data'}
          </span>
          {fetchedAt && ` • ${new Date(fetchedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
        </span>
      </div>

      {/* Actuele Status Kaart */}
      {currentWeather && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/80 p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                Nu aan de waterkant
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {currentWeather.temperature.toFixed(1)} °C
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-300">
                  {getWeatherDescription(currentWeather.weatherCode)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Luchtdruk</span>
                <span className="text-base font-black text-cyan-300">{currentWeather.pressure} hPa</span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Wind</span>
                <span className="text-base font-black text-teal-300">
                  {currentWeather.windDirectionText} {currentWeather.windSpeed} km/u
                </span>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Regenkans</span>
                <span className="text-base font-black text-blue-300">
                  {currentWeather.precipitationProbability}%
                </span>
              </div>
            </div>
          </div>

          {/* Barometer Visinzicht */}
          <div className="pt-4 text-xs sm:text-sm text-slate-300 flex items-start gap-3">
            <Gauge className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">
                Barometer Invloed voor Sportvissers:
              </span>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {currentWeather.pressure >= 1012 && currentWeather.pressure <= 1022
                  ? 'Ideale stabiele luchtdruk. Vissen hebben geen last van snelle drukverschuivingen in de zwemblaas en foerageren gelijkmatig over de waterlagen.'
                  : currentWeather.pressure < 1008
                  ? 'Lagedrukgebied / naderend front. Vaak zorgt de uren voorafgaand aan een koufront voor felle vreetdrang bij snoek en karper.'
                  : 'Hoge luchtdruk. Vaak helder en stil weer; vis zoekt vaak diepere holen of schaduwrijke waterpartijen op.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dagen Selector (Vandaag tot +7 dagen) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
          7-Daagse Uurlijkse Verwachting
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const isSelected = offset === selectedDayOffset;
            const dayName =
              offset === 0
                ? 'Vandaag'
                : offset === 1
                ? 'Morgen'
                : new Intl.DateTimeFormat('nl-NL', { weekday: 'short' }).format(d);

            return (
              <button
                key={offset}
                onClick={() => setSelectedDayOffset(offset)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {dayName} {d.getDate()}/{d.getMonth() + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Uurlijkse Tabel voor gekozen dag */}
      <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <span className="font-bold text-sm text-white">
            Uur voor uur op {targetDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="text-xs text-slate-400">Lokale tijd (Europe/Amsterdam)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="p-3">Tijd</th>
                <th className="p-3">Temp.</th>
                <th className="p-3">Weerbeeld</th>
                <th className="p-3">Luchtdruk</th>
                <th className="p-3">Wind</th>
                <th className="p-3">Regenkans</th>
                <th className="p-3">Neerslag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 font-medium">
              {dayHourly.map((hour) => {
                const hourNum = parseInt(hour.time.slice(11, 13), 10);
                const isDay = hourNum >= 7 && hourNum <= 20;

                return (
                  <tr key={hour.time} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-bold text-white flex items-center gap-1.5">
                      {isDay ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                      )}
                      {hour.time.slice(11, 16)}
                    </td>
                    <td className="p-3 font-semibold text-emerald-300">
                      {hour.temperature.toFixed(1)} °C
                    </td>
                    <td className="p-3 text-slate-300">
                      {getWeatherDescription(hour.weatherCode)}
                    </td>
                    <td className="p-3 text-cyan-300">{hour.pressure} hPa</td>
                    <td className="p-3 text-teal-300">
                      {hour.windDirectionText} {hour.windSpeed} km/u
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hour.precipitationProbability > 40
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {hour.precipitationProbability}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {hour.precipitation > 0 ? `${hour.precipitation.toFixed(1)} mm` : '0 mm'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};