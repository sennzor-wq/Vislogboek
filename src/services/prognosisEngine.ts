import {
  FishSpecies,
  TimeSlot,
  DayPrognosis,
  TimeSlotAnalysis,
  FactorBreakdown,
  WeatherHourlyForecast,
  FishingSession,
  PresenceObservationType,
  PrognosisSnapshot,
  FishingLocation,
  WaterThermalAnalysis,
  CatchItem,
  HistoricalCatchRateInfo,
  WeatherSnapshot,
  PrognosisInputContext,
  ManualWaterTemperatureInput,
} from '../types';
import { SPECIES_PROFILES, SpeciesProfile, calculateThermalEfficiency } from './fishProfiles';
import { getSpeciesDielTimeContextText } from './dielBehaviorEvidenceService';
import { getSpeciesThermalEvidenceContextText } from './thermalEvidenceService';
import { calculateCivilTwilightTimes } from './solarTimeEngine';
import type { CivilTwilightTimes } from './solarTimeEngine';
import { db, syncSessionPresenceObservations } from '../db/db';
import { analyzeWaterThermalDevelopment } from './waterThermalEngine';
import { HistoricalWaterTemperatureObservation, collectHistoricalWaterTemperatureObservations } from './waterTemperatureHistory';
import { getWaterTemperatureCalibration } from './evaluationEngine';
import { analyzeRodPositioning } from './rodPositioningEngine';
import { getForecast } from './weatherService';
import { analyzeBankWind } from './bankWindEngine';
import { analyzeHabitatMovement } from './habitatMovementEngine';
import { calculatePrebaitPlan, supportsPrebaitPlanning } from './prebaitEngine';
import { PrebaitProgramOptions, PresenceObservation } from '../types';
import { createDataQualityReport } from './dataQualityEngine';
import { PROGNOSIS_ENGINE_VERSIONS, PROGNOSIS_MODEL_VERSION } from './modelVersions';
import { addCalendarDays, getAmsterdamDateKey, getAmsterdamHour, getAmsterdamMonth } from '../utils/dateTime';

/**
 * Legt een handmatige watertemperatuur vast zonder het invoermoment te verwarren
 * met het fysieke meetmoment. Methode, meetdiepte en meettijd blijven onbekend
 * totdat de gebruiker ze expliciet registreert.
 */
export function createManualWaterTemperatureInput(
  temperatureC: number | null | undefined,
  recordedAt: string
): ManualWaterTemperatureInput | null {
  if (typeof temperatureC !== 'number' || !Number.isFinite(temperatureC) || !Number.isFinite(Date.parse(recordedAt))) {
    return null;
  }
  return {
    temperatureC,
    recordedAt,
    measurementTimestamp: null,
    measurementSource: 'manual',
    measurementMethod: null,
    measurementDepthM: null,
  };
}

/** Deterministische fingerprint van de invoer die een prognoserun heeft gebruikt. */
export function createPrognosisInputFingerprint(value: unknown): string {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Maakt een minimale, privacybewuste kopie van historische kenmerken die de
 * prognose-engines daadwerkelijk kunnen beïnvloeden. Vrije notities en foto's
 * worden nooit in een prognosesnapshot gekopieerd.
 */
export function createPrognosisHistoryFeatureSnapshot(
  sessions: FishingSession[],
  catches: CatchItem[],
  observations: PresenceObservation[] = []
): Pick<PrognosisInputContext,
  'historicalSessionFeatures' | 'historicalCatchFeatures' |
  'historicalObservationFeatures' | 'historyFeatureSchemaVersion'
> {
  const benchmarkSessionIds = new Set(
    sessions.filter((session) => session.isBenchmark === true).map((session) => session.id)
  );

  const historicalSessionFeatures: NonNullable<PrognosisInputContext['historicalSessionFeatures']> =
    sessions.filter((session) => session.isBenchmark !== true).map((session) => ({
      id: session.id,
      locationId: session.locationId,
      startTime: session.startTime,
      endTime: session.endTime,
      durationMinutes: session.durationMinutes,
      outcome: session.outcome,
      targetSpecies: session.targetSpecies ? [...session.targetSpecies] : undefined,
      isBenchmark: false,
      legacyImportQuality: session.legacyImportQuality ? { ...session.legacyImportQuality } : undefined,
      technique: session.technique,
      baitDirection: session.baitDirection,
      prebaited: session.prebaited,
      baitAndFeed: session.baitAndFeed,
      waterDepth: session.waterDepth,
      waterTemperature: session.waterTemperature,
      waterTemperatureMeasuredAt: session.waterTemperatureMeasuredAt,
      waterTemperatureMeasurementSource: session.waterTemperatureMeasurementSource,
      waterTemperatureMeasurementMethod: session.waterTemperatureMeasurementMethod,
      waterTemperatureMeasurementDepthM: session.waterTemperatureMeasurementDepthM,
    })).sort((a, b) => a.id.localeCompare(b.id));

  const historicalCatchFeatures: NonNullable<PrognosisInputContext['historicalCatchFeatures']> =
    catches.filter((item) => !benchmarkSessionIds.has(item.sessionId)).map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      locationId: item.locationId,
      species: item.species,
      count: item.count,
      weightKg: item.weightKg,
      lengthCm: item.lengthCm,
      timestamp: item.timestamp,
      timestampEntryMode: item.timestampEntryMode,
      bait: item.bait,
      technique: item.technique,
      legacyImportQuality: item.legacyImportQuality ? { ...item.legacyImportQuality } : undefined,
    })).sort((a, b) => a.id.localeCompare(b.id));

  const historicalObservationFeatures: NonNullable<PrognosisInputContext['historicalObservationFeatures']> =
    observations.filter((item) => !item.sessionId || !benchmarkSessionIds.has(item.sessionId)).map((item) => ({
      id: item.id,
      locationId: item.locationId,
      sessionId: item.sessionId,
      observationType: item.observationType,
      timestamp: item.timestamp,
    })).sort((a, b) => a.id.localeCompare(b.id));

  return {
    historicalSessionFeatures,
    historicalCatchFeatures,
    historicalObservationFeatures,
    historyFeatureSchemaVersion: 2,
  };
}

/** Fingerprint van exact dezelfde whitelisted historie die in de snapshot wordt bewaard. */
export function createPrognosisHistoryFingerprint(
  sessions: FishingSession[],
  catches: CatchItem[],
  observations: PresenceObservation[] = [],
  historicalWaterTemperatures: HistoricalWaterTemperatureObservation[] = []
): string {
  return createPrognosisInputFingerprint({
    ...createPrognosisHistoryFeatureSnapshot(sessions, catches, observations),
    historicalWaterTemperatures,
  });
}

export const TIME_SLOT_HOURS: Record<TimeSlot, { start: number; end: number; rangeLabel: string }> = {
  Nacht: { start: 0, end: 6, rangeLabel: '00:00 – 06:00' },
  Ochtend: { start: 6, end: 12, rangeLabel: '06:00 – 12:00' },
  Middag: { start: 12, end: 18, rangeLabel: '12:00 – 18:00' },
  Avond: { start: 18, end: 24, rangeLabel: '18:00 – 24:00' },
};

function getSeason(month: number): 'winter' | 'lente' | 'zomer' | 'herfst' {
  if (month === 12 || month === 1 || month === 2) return 'winter';
  if (month >= 3 && month <= 5) return 'lente';
  if (month >= 6 && month <= 8) return 'zomer';
  return 'herfst';
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getSolarTransitionContext(
  slot: TimeSlot,
  solarTimes?: CivilTwilightTimes | null
): string {
  if (!solarTimes) {
    return 'Civiele dageraad en schemering zijn voor deze datum niet betrouwbaar beschikbaar; zonne-relatieve tijdcontext blijft onbekend.';
  }
  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };
  const slotStart = TIME_SLOT_HOURS[slot].start * 60;
  const slotEnd = TIME_SLOT_HOURS[slot].end * 60;
  const overlap = (start: number, end: number) => Math.max(0, Math.min(slotEnd, end) - Math.max(slotStart, start));
  const dawnOverlap = overlap(toMinutes(solarTimes.civilDawn), toMinutes(solarTimes.sunrise));
  const duskOverlap = overlap(toMinutes(solarTimes.sunset), toMinutes(solarTimes.civilDusk));
  const periods: string[] = [];
  if (dawnOverlap > 0) periods.push('civiele dageraad (' + solarTimes.civilDawn + '–' + solarTimes.sunrise + ')');
  if (duskOverlap > 0) periods.push('civiele schemering (' + solarTimes.sunset + '–' + solarTimes.civilDusk + ')');
  return periods.length > 0
    ? 'Dit tijdvak omvat ' + periods.join(' en ') + '. Dit is zonne-relatieve context, geen gevalideerde activiteitsscore.'
    : 'Civiele dageraad is ' + solarTimes.civilDawn + '–' + solarTimes.sunrise + ' en civiele schemering ' + solarTimes.sunset + '–' + solarTimes.civilDusk + '; beide vallen buiten dit tijdvak. Dit verandert de score niet.';
}



// Eén prognoseronde gebruikt dezelfde forecast-array voor alle dagen en tijdvakken.
// Valide luchtdrukmetingen daarom één keer voorbereiden en hergebruiken.
const pressureForecastCache = new WeakMap<WeatherHourlyForecast[], WeatherHourlyForecast[]>();
const completedSessionCache = new WeakMap<FishingSession[], FishingSession[]>();
const comparableSessionCache = new WeakMap<FishingSession[], Map<string, FishingSession[]>>();
const catchSessionIndexCache = new WeakMap<CatchItem[], Map<string, CatchItem[]>>();

function getSimilarSessions(
  sessions: FishingSession[],
  catches: CatchItem[],
  species: FishSpecies,
  slot: TimeSlot
): FishingSession[] {
  const hours = TIME_SLOT_HOURS[slot];
  return sessions.filter((session) => {
    if (session.outcome !== 'catch' && session.outcome !== 'skunk_confirmed') return false;
    if (session.isBenchmark || session.legacyImportQuality?.startTimeKnown === false) return false;
    if (!session.targetSpecies?.includes(species)) return false;
    const hour = getAmsterdamHour(session.startTime);
    if (hour === null || hour < hours.start || hour >= hours.end) return false;
    if (session.outcome === 'skunk_confirmed') return true;
    return catches.some((item) => item.sessionId === session.id && item.species === species && item.legacyImportQuality?.speciesKnown !== false);
  });
}

function getCompletedSessions(sessions: FishingSession[]): FishingSession[] {
  const cached = completedSessionCache.get(sessions);
  if (cached) return cached;
  const completed = sessions.filter(
    (session) => (session.outcome === 'catch' || session.outcome === 'skunk_confirmed') && !session.isBenchmark
  );
  completedSessionCache.set(sessions, completed);
  return completed;
}

function getComparableSessions(
  sessions: FishingSession[],
  species: FishSpecies | 'Algemeen',
  locationId?: string
): FishingSession[] {
  let byKey = comparableSessionCache.get(sessions);
  if (!byKey) {
    byKey = new Map<string, FishingSession[]>();
    comparableSessionCache.set(sessions, byKey);
  }
  const key = `${species}|${locationId ?? '*'}`;
  const cached = byKey.get(key);
  if (cached) return cached;
  const filtered = getCompletedSessions(sessions).filter((session) => {
    if (species !== 'Algemeen' && (!session.targetSpecies || !session.targetSpecies.includes(species))) return false;
    if (locationId && session.locationId !== locationId) return false;
    return true;
  });
  byKey.set(key, filtered);
  return filtered;
}

function getCatchSessionIndex(catches: CatchItem[]): Map<string, CatchItem[]> {
  const cached = catchSessionIndexCache.get(catches);
  if (cached) return cached;
  const index = new Map<string, CatchItem[]>();
  for (const item of catches) {
    const items = index.get(item.sessionId) ?? [];
    items.push(item);
    index.set(item.sessionId, items);
  }
  catchSessionIndexCache.set(catches, index);
  return index;
}

function getValidPressureForecasts(forecasts: WeatherHourlyForecast[]): WeatherHourlyForecast[] {
  const cached = pressureForecastCache.get(forecasts);
  if (cached) return cached;
  const valid = forecasts.filter((h) =>
    Number.isFinite(h.pressure) && h.pressure >= 850 && h.pressure <= 1100
  );
  pressureForecastCache.set(forecasts, valid);
  return valid;
}

/**
 * Berekent het Wilson score 95% betrouwbaarheidsinterval voor een binomiaal percentage.
 * Let op: berekent de steekproefonzekerheid van de binomiale fractie, maar corrigeert niet
 * voor variatie in sessieduur, vistechniek of stekclustering.
 */
export function calculateWilsonInterval(
  successes: number,
  total: number,
  confidenceZ = 1.96
): [number, number] {
  if (total <= 0) return [0, 0];
  const p = successes / total;
  const z = confidenceZ;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const spread = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denominator;

  const lower = Math.max(0, Math.round((center - spread) * 100));
  const upper = Math.min(100, Math.round((center + spread) * 100));
  return [lower, upper];
}

/**
 * Berekent de luchtdrukverandering (Delta P) over de afgelopen 6–24 uur uit de uurlijkse reeks.
 */
export function findPressureTrend(
  targetTimeIso: string,
  allForecasts: WeatherHourlyForecast[]
): { deltaHpa: number | null; trendDescription: string; known: boolean } {
  const targetDateMs = new Date(targetTimeIso).getTime();
  const validPressureForecasts = getValidPressureForecasts(allForecasts);
  if (isNaN(targetDateMs) || validPressureForecasts.length === 0) {
    return { deltaHpa: null, trendDescription: 'Druktrend onbekend (onvoldoende uurdata)', known: false };
  }

  // Zoek uurmeting dichtst bij target
  const currentEntry = validPressureForecasts.find(
    (h) => Math.abs(new Date(h.time).getTime() - targetDateMs) < 1800000
  );
  if (!currentEntry) {
    return { deltaHpa: null, trendDescription: 'Druktrend onbekend', known: false };
  }

  // Zoek meting van 12 uur (of tussen 6 en 18 uur) daarvóór
  const targetPastMs = targetDateMs - 12 * 3600000;
  let pastEntry: WeatherHourlyForecast | null = null;
  let minDiff = Infinity;

  for (const h of validPressureForecasts) {
    const hMs = new Date(h.time).getTime();
    const diff = Math.abs(hMs - targetPastMs);
    if (diff < minDiff && diff <= 3 * 3600000) {
      minDiff = diff;
      pastEntry = h;
    }
  }

  if (!pastEntry) {
    return {
      deltaHpa: null,
      trendDescription: 'Druktrend onbekend (geen historische 12-uurs meting beschikbaar in dataset)',
      known: false,
    };
  }

  const delta = Math.round((currentEntry.pressure - pastEntry.pressure) * 10) / 10;

  if (delta > 2.5) {
    return { deltaHpa: delta, trendDescription: `Snel stijgende luchtdruk (+${delta} hPa in 12u)`, known: true };
  } else if (delta < -2.5) {
    return { deltaHpa: delta, trendDescription: `Dalende luchtdruk (${delta} hPa in 12u, naderend front)`, known: true };
  } else {
    return { deltaHpa: delta, trendDescription: `Stabiele barometer (${delta >= 0 ? '+' : ''}${delta} hPa in 12u)`, known: true };
  }
}

/**
 * Analyseert één specifiek tijdvak voor een vissoort op een gegeven datum
 */
function analyzeTimeSlot(
  slot: TimeSlot,
  forecastsInSlot: WeatherHourlyForecast[],
  allForecasts: WeatherHourlyForecast[],
  species: FishSpecies,
  profile: SpeciesProfile,
  date: Date,
  historicalSessions: FishingSession[],
  historicalCatches: CatchItem[],
  currentDateRef: Date,
  userWaterTemp?: number | null,
  presenceObs?: PresenceObservationType,
  thermalAnalysis?: WaterThermalAnalysis,
  solarTimes?: CivilTwilightTimes | null
): TimeSlotAnalysis {
  const hoursConfig = TIME_SLOT_HOURS[slot];
  const month = getAmsterdamMonth(date) ?? 1;
  const season = getSeason(month);

  // Controleer of dit tijdvak reeds volledig verstreken is
  const targetDateStr = getAmsterdamDateKey(date) ?? '';
  const curDateStr = getAmsterdamDateKey(currentDateRef) ?? '';
  const curHour = getAmsterdamHour(currentDateRef) ?? -1;

  let isPast = false;
  let remainingHours = hoursConfig.end - hoursConfig.start;

  if (targetDateStr < curDateStr) {
    isPast = true;
    remainingHours = 0;
  } else if (targetDateStr === curDateStr) {
    if (curHour >= hoursConfig.end) {
      isPast = true;
      remainingHours = 0;
    } else if (curHour >= hoursConfig.start) {
      // Actief tijdvak
      isPast = false;
      remainingHours = Math.max(1, hoursConfig.end - curHour);
    }
  }

  // Ontbrekende of onplausibele waarden blijven onbekend; ze worden niet door standaardweer vervangen.
  const inRange = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  const tempSamples = forecastsInSlot.filter(h => inRange(h.temperature, -30, 55));
  const pressureSamples = forecastsInSlot.filter(h => inRange(h.pressure, 850, 1100));
  const windSamples = forecastsInSlot.filter(h => inRange(h.windSpeed, 0, 200) && inRange(h.windDirection, 0, 360) && typeof h.windDirectionText === 'string' && h.windDirectionText.trim().length > 0);
  const precipSamples = forecastsInSlot.filter(h => inRange(h.precipitation, 0, 300));
  const cloudSamples = forecastsInSlot.filter(h => inRange(h.cloudCover, 0, 100));
  const minimumSamples = Math.max(1, Math.ceil((hoursConfig.end - hoursConfig.start) / 2));
  const hasAirTemp = tempSamples.length >= minimumSamples, hasPressure = pressureSamples.length >= minimumSamples, hasWind = windSamples.length >= minimumSamples, hasPrecip = precipSamples.length >= minimumSamples, hasCloud = cloudSamples.length >= minimumSamples;
  
  const avgPressure = hasPressure ? pressureSamples.reduce((a,h)=>a+h.pressure,0)/pressureSamples.length : null;
  const avgWindSpeed = hasWind ? windSamples.reduce((a,h)=>a+h.windSpeed,0)/windSamples.length : null;
  const dominantWindDir = hasWind ? windSamples[Math.floor(windSamples.length/2)].windDirectionText : null;
  const totalPrecip = hasPrecip ? precipSamples.reduce((a,h)=>a+h.precipitation,0) : null;
  const avgCloud = hasCloud ? cloudSamples.reduce((a,h)=>a+h.cloudCover,0)/cloudSamples.length : null;
  const representativeTimeIso = forecastsInSlot.length ? forecastsInSlot[Math.floor(forecastsInSlot.length/2)].time : targetDateStr + 'T' + String(hoursConfig.start+3).padStart(2,'0') + ':00';
  // 1. Temperatuurfactor & Fysiologische Efficiëntie E_temp
  // Onderscheid geverifieerde gemeten watertemperatuur vs. modelschatting vs. 2m-luchttemperatuur
  const hasMeasured = Boolean(
    thermalAnalysis?.hasMeasuredWaterTemp &&
    typeof thermalAnalysis.measuredWaterTemp === 'number' &&
    !isNaN(thermalAnalysis.measuredWaterTemp)
  );
  const hasEstimated =
    typeof thermalAnalysis?.estimatedWaterTemp === 'number' &&
    !isNaN(thermalAnalysis.estimatedWaterTemp);

  let effectiveTemp: number | null = null;
  let tempSource: 'gemeten' | 'geschat' | 'onbekend' = 'onbekend';
  if (hasMeasured) { effectiveTemp = thermalAnalysis!.measuredWaterTemp!; tempSource = 'gemeten'; }
  else if (hasEstimated) { effectiveTemp = thermalAnalysis!.estimatedWaterTemp!; tempSource = 'geschat'; }
  const hasKnownWaterTemp = effectiveTemp !== null;
  const thermalResult = hasKnownWaterTemp ? calculateThermalEfficiency(effectiveTemp!, profile) : null;
  const thermalEff = thermalResult?.efficiency ?? 0.5; // interne placeholder; nooit als score tonen wanneer onbekend
  const thermalEvidenceDetail = getSpeciesThermalEvidenceContextText(species);
  let thermalScoreBandDetail = '';
  if (tempSource === 'geschat' && thermalAnalysis?.estimatedRange) {
    const [rangeA, rangeB] = thermalAnalysis.estimatedRange;
    if (Number.isFinite(rangeA) && Number.isFinite(rangeB)) {
      const rangeMin = Math.min(rangeA, rangeB);
      const rangeMax = Math.max(rangeA, rangeB);
      const sampleTemperatures = [rangeMin, rangeMax];
      if (profile.thermalOptimum >= rangeMin && profile.thermalOptimum <= rangeMax) {
        sampleTemperatures.push(profile.thermalOptimum);
      }
      if (effectiveTemp !== null) sampleTemperatures.push(effectiveTemp);
      const possibleScores = sampleTemperatures.map((sampleTemp) => {
        const efficiency = calculateThermalEfficiency(sampleTemp, profile).efficiency;
        return Math.round(Math.max(1, Math.min(10, 1 + 9 * Math.pow(efficiency, 0.85))) * 10) / 10;
      });
      const scoreMin = Math.min(...possibleScores);
      const scoreMax = Math.max(...possibleScores);
      thermalScoreBandDetail = ` Indicatieve thermische scoreband op basis van de geschatte watertemperatuurband (${rangeMin.toFixed(1)}–${rangeMax.toFixed(1)} °C): ${scoreMin.toFixed(1)}–${scoreMax.toFixed(1)}/10. Dit is alleen de doorwerking van watertemperatuuronzekerheid, geen statistisch betrouwbaarheidsinterval; onzekerheid in de voorlopige soortcurve is niet inbegrepen.`;
    }
  }
  const tempDetailText = (!hasKnownWaterTemp
    ? 'Onbekend: gemeten of voldoende onderbouwde geschatte watertemperatuur ontbreekt. Luchttemperatuur wordt niet als vervanging gebruikt.'
    : tempSource === 'gemeten'
      ? thermalResult!.description + ' (Gebaseerd op gemeten watertemperatuur).'
      : thermalResult!.description + ' (Gebaseerd op geschatte watertemperatuur via thermische traagheid).') + ` ${thermalScoreBandDetail} ${thermalEvidenceDetail}`;
  const temperatureFactor: FactorBreakdown = { score: hasKnownWaterTemp ? Math.round((thermalEff*4-2)*10)/10 : 0, impact: hasKnownWaterTemp ? thermalResult!.impact : 'neutraal', title: 'Thermische activiteitspotentie', detail: tempDetailText, dataAvailable: hasKnownWaterTemp };
  // 2. Luchtdrukfactor & Trend: alleen context, geen automatische biologische bonus/malus.
  // Een betrouwbare soortspecifieke relatie tussen absolute luchtdruk/korte druktrend
  // en vangstactiviteit is onvoldoende vastgesteld.
  const pressureTrend = findPressureTrend(representativeTimeIso, allForecasts);
  const pressImpact: 'positief' | 'neutraal' | 'negatief' = 'neutraal';
  const pressDetail = !hasPressure ? 'Onbekend: onvoldoende geldige luchtdrukmetingen in dit tijdvak.' : pressureTrend.known && pressureTrend.deltaHpa !== null ? `Luchtdruk ${Math.round(avgPressure!)} hPa; ${pressureTrend.trendDescription}. Druktrend wordt getoond als weerscontext, maar krijgt geen automatische biologische bonus of aftrek.` : `Luchtdruk ${Math.round(avgPressure!)} hPa. ${pressureTrend.trendDescription}; geen biologische bonus of aftrek toegepast.`;

  const pressureFactor: FactorBreakdown = {
    score: 0,
    impact: pressImpact,
    title: 'Luchtdruk & Trend',
    detail: pressDetail,
    dataAvailable: hasPressure,
  };

  // 3. Wind, seizoen, tijdstip, bewolking en neerslag blijven context.
  // De bestaande profielvoorkeuren en vaste modulatoren zijn niet voldoende
  // soortspecifiek en empirisch gevalideerd om de thermische activiteitspotentie te wijzigen.
  let windDetail = '';
  if (!hasWind || avgWindSpeed === null || dominantWindDir === null) {
    windDetail = 'Onbekend: onvoldoende geldige windsnelheid en windrichting; geen windaanname toegepast.';
  } else {
    windDetail = `Wind (${dominantWindDir}, ${Math.round(avgWindSpeed)} km/u). Het praktische effect hangt af van stekorientatie, oever, wateroppervlak en vismethode; er wordt geen soortspecifieke windvoorkeur of biologische scorecorrectie toegepast.`;
    const directionSequence = windSamples.reduce<string[]>((directions, sample) => {
      const direction = sample.windDirectionText.trim();
      if (directions[directions.length - 1] !== direction) directions.push(direction);
      return directions;
    }, []);
    if (directionSequence.length > 1) windDetail += ` De wind draait binnen dit tijdvak: ${directionSequence.join(' → ')}; de windrichting is dus niet de hele periode gelijk.`;
  }
  const windFactor: FactorBreakdown = { score: 0, impact: 'neutraal', title: 'Wind & Oppervlakte', detail: windDetail, dataAvailable: hasWind };

  // Seizoen blijft context; geen gevalideerde zelfstandige seizoenscorrectie.
  const seasonFactor: FactorBreakdown = {
    score: 0,
    impact: 'neutraal',
    title: 'Seizoensritme',
    detail: `Seizoen ${season} wordt als context getoond. Er wordt geen zelfstandige seizoensbonus of -aftrek toegepast.`,
    dataAvailable: true,
  };

  // Tijdvakcontext komt uit de expliciet geclassificeerde literatuur, niet uit
  // oude profielvoorkeuren. Alleen direct voedingsritmebewijs mag een mogelijke
  // voedingsvoorkeur onderbouwen; beweging/habitat wordt niet als voeding vertaald.
  // Alle huidige bronnen zijn niet-goedgekeurd en blijven daarom beschrijvend.
  const timeDetail = `${getSpeciesDielTimeContextText(species)} ${getSolarTransitionContext(slot, solarTimes)}`;
  const timeOfDayFactor: FactorBreakdown = {
    score: 0,
    impact: 'neutraal',
    title: 'Tijdstip & Licht',
    detail: timeDetail,
    dataAvailable: true,
  };

  // Bewolking en neerslag zijn lokale context. De huidige profielvoorkeuren
  // zijn niet gevalideerd als kwantitatieve activiteitseffecten.
  let precipDetail = '';
  if (!hasPrecip && !hasCloud) {
    precipDetail = 'Onbekend: geen voldoende geldige neerslag- of bewolkingsgegevens.';
  } else {
    const contextParts: string[] = [];
    if (hasPrecip) {
      contextParts.push(`neerslag ${totalPrecip!.toFixed(1)} mm`);
    }
    if (hasCloud) {
      contextParts.push(`bewolking ${Math.round(avgCloud!)}%`);
    }
    precipDetail = `${contextParts.join(', ')}. Dit blijft weerscontext; zonder gevalideerde soort- en watertypegebonden relatie wordt geen biologische bonus of aftrek toegepast.`;
  }

  const precipitationFactor: FactorBreakdown = {
    score: 0,
    impact: 'neutraal',
    title: 'Bewolking & Neerslag',
    detail: precipDetail,
    dataAvailable: hasPrecip || hasCloud,
  };

  // --- THERMISCHE ACTIVITEITSPOTENTIE ---
  // Alleen de soortspecifieke thermische respons beïnvloedt de huidige score.
  // Andere factoren blijven uitlegbare context totdat hun effect afzonderlijk
  // met passende soort-, levensstadium- en watertypegegevens is gevalideerd.
  const metabolicCeiling = Math.pow(thermalEff, 0.85);
  const rawActivityScore = 1.0 + 9.0 * metabolicCeiling;
  const activityScore = Math.round(clamp(rawActivityScore, 1.0, 10.0) * 10) / 10;

  // 7. Persoonlijke sessies analyseren
  const similarSessions = getSimilarSessions(historicalSessions, historicalCatches, species, slot);

  const relevantCount = similarSessions.length;
  const confirmedCatches = similarSessions.filter((s) => s.outcome === 'catch').length;
  const skunks = similarSessions.filter((s) => s.outcome === 'skunk_confirmed').length;
  const catchRate =
    relevantCount >= 5 ? Math.round((confirmedCatches / relevantCount) * 100) : null;

  let expNote = '';
  if (relevantCount === 0) {
    expNote = 'Nog geen afgeronde eigen sessies die in dit tijdvak zijn gestart (ingedeeld op starttijd).';
  } else if (relevantCount < 5) {
    expNote = `${relevantCount} eigen sessie(s) gestart in dit tijdvak (${confirmedCatches} met vangst; ingedeeld op starttijd). Onvoldoende gegevens (< 5) voor een statistisch verantwoorde kansschatting.`;
  } else {
    expNote = `${relevantCount} vergelijkbare sessies gestart in dit tijdvak: ${confirmedCatches} met vangst, ${skunks} bevestigde nulvangst (${catchRate}% vangstsucces; ingedeeld op starttijd).`;
  }

  // Positieve en negatieve factoren
  const positiveFactors: string[] = [];
  const neutralFactors: string[] = [];
  const negativeFactors: string[] = [];

  const allFactors = [
    temperatureFactor,
    pressureFactor,
    windFactor,
    seasonFactor,
    timeOfDayFactor,
    precipitationFactor,
  ];

  for (const f of allFactors) {
    if (f.dataAvailable === false) neutralFactors.push(`${f.title}: ${f.detail}`);
    else if (f.impact === 'positief') positiveFactors.push(`${f.title}: ${f.detail}`);
    else if (f.impact === 'negatief') negativeFactors.push(`${f.title}: ${f.detail}`);
    else neutralFactors.push(`${f.title}: ${f.detail}`);
  }

  // Conclusie
  let conclusion = '';
  if (!hasKnownWaterTemp) { conclusion = 'Thermische activiteitspotentie niet betrouwbaar te bepalen: gemeten of voldoende onderbouwde geschatte watertemperatuur ontbreekt. Luchttemperatuur wordt niet als vervanging gebruikt.'; }
  else if (activityScore >= 8.5) {
    conclusion = `Hoge thermische activiteitspotentie (${activityScore}/10) voor ${species} volgens het voorlopige temperatuurresponsmodel. Licht en overige weersomstandigheden zijn afzonderlijke context en verhogen deze score niet.`;
  } else if (activityScore >= 6.8) {
    conclusion = `Hoge thermische activiteitspotentie (${activityScore}/10) voor ${species} volgens het voorlopige temperatuurresponsmodel.`;
  } else if (activityScore >= 4.8) {
    conclusion = `Gemiddelde thermische activiteitspotentie (${activityScore}/10) volgens de voorlopige soortspecifieke temperatuurcurve. ${
      thermalEff < 0.5 ? 'De curve schat een lagere relatieve respons dan rond het profieloptimum.' : 'De curve schat een gematigde respons; overige omstandigheden worden afzonderlijk als context getoond.'
    }`;
  } else {
    conclusion = `Lage thermische activiteitspotentie (${activityScore}/10) volgens de voorlopige soortspecifieke temperatuurcurve. ${
      thermalEff < 0.4
        ? `Watertemperatuur (${effectiveTemp!.toFixed(1)} °C) ligt onder de voorlopige profielgrens; de curve schat een lage relatieve thermische respons. Dit stelt geen winterrust of volledige inactiviteit vast.`
        : 'De curve schat een relatief lage respons ten opzichte van het voorlopige profieloptimum.'
    }`;
  }

  return {
    slot,
    timeRange: hoursConfig.rangeLabel,
    activityScore,
    activityScoreAvailable: hasKnownWaterTemp,
    isPast,
    remainingHours,
    temperatureFactor,
    pressureFactor,
    windFactor,
    seasonFactor,
    timeOfDayFactor,
    precipitationFactor,
    personalExperience: {
      relevantSessions: relevantCount,
      confirmedCatches,
      skunks,
      catchRatePercent: catchRate,
      note: expNote,
    },
    positiveFactors,
    neutralFactors,
    negativeFactors,
    conclusion,
  };
}

export interface PrognosisOptions {
  sessionDurationHours?: number;
  locationId?: string;
  location?: FishingLocation;
  technique?: string;
  presenceObservation?: PresenceObservationType;
  observations?: PresenceObservation[];
  prebaitOptions?: PrebaitProgramOptions;
  catches?: CatchItem[];
  waterTemperatureCalibration?: { appliedCorrectionC: number; sampleCount: number; season: 'winter' | 'lente' | 'zomer' | 'herfst' };
  historicalWaterTemperatures?: HistoricalWaterTemperatureObservation[];
  /** Lokale zonsopkomst/-ondergang uit dezelfde Open-Meteo-dagprognose; alleen kwalitatieve context. */
  dailySolarTimes?: Array<{ date: string; sunrise: string; sunset: string }>;
  /** Laat duur onbekend in coachcontext; de bestaande algemene prognose behoudt zijn historische fallback. */
  allowUnknownSessionDuration?: boolean;
}

/**
 * Geeft de geregistreerde sessieduur in uren terug.
 * Ontbrekende of ongeldige duur blijft onbekend (null) en wordt niet als 3 uur ingevuld.
 */
export function getSessionDurationHours(session: FishingSession): number | null {
  if (typeof session.durationMinutes === 'number' && Number.isFinite(session.durationMinutes) && session.durationMinutes > 0) {
    return session.durationMinutes / 60;
  }
  if (session.legacyImportQuality?.startTimeKnown === false ||
      session.legacyImportQuality?.endTimeKnown === false) return null;
  if (session.startTime && session.endTime) {
    const diffMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    const diffMins = diffMs / 60000;
    if (Number.isFinite(diffMins) && diffMins > 0 && diffMins < 10080) {
      return diffMins / 60;
    }
  }
  return null;
}

/**
 * Berekent de volledige dagprognose met strikte scheiding van:
 * 1. Thermische activiteitspotentie (1.0 - 10.0, voorlopige relatieve temperatuurrespons)
 * 2. Persoonlijke vangstkans (P(vangst >= 1) voor sessie van opgegeven duur en methode)
 * 3. Beste toekomstige vistijd (uitsluitend niet-verstreken tijdvakken)
 */
export function calculateDayPrognosis(
  dateStr: string,
  forecasts: WeatherHourlyForecast[],
  species: FishSpecies | 'Algemeen',
  historicalSessions: FishingSession[],
  weatherUpdatedAt?: string,
  userWaterTemp?: number | null,
  currentDateRef?: Date,
  options?: PrognosisOptions
): DayPrognosis {
  const rawDuration = options?.sessionDurationHours;
  const sessionDuration: number | null =
    typeof rawDuration === 'number' && !isNaN(rawDuration) && rawDuration > 0
      ? Math.min(24, Math.max(0.25, rawDuration))
      : options?.allowUnknownSessionDuration ? null : 3;
  const locationId = options?.locationId;
  const location = options?.location;
  const presenceObs = options?.presenceObservation ?? 'onbekend';

  const slotReferenceDate = currentDateRef ?? new Date(`${dateStr}T12:00:00.000Z`);

  // Thermische analyse van het viswater (waterdiepte per stek en actuele meting doorgeven)
  // Als currentDateRef optioneel is weggelaten, geldt targetDateStr zelf als de referentie.
  const thermalAnalysis = analyzeWaterThermalDevelopment(dateStr, forecasts, {
    location,
    userMeasuredWaterTemp: userWaterTemp,
    historicalSessions,
    currentDateRef,
    historicalWaterTemperatures: options?.historicalWaterTemperatures,
  });

  // Pas alleen een gevalideerde, lokale seizoensbias toe op een schatting.
  // Een echte actuele meting wordt nooit gecorrigeerd.
  const temperatureCalibration = options?.waterTemperatureCalibration;
  if (
    temperatureCalibration &&
    !thermalAnalysis.hasMeasuredWaterTemp &&
    thermalAnalysis.trendConfidence !== 'Onvoldoende gegevens' &&
    typeof thermalAnalysis.estimatedWaterTemp === 'number'
  ) {
    const correction = temperatureCalibration.appliedCorrectionC;
    thermalAnalysis.estimatedWaterTemp = Math.round((thermalAnalysis.estimatedWaterTemp - correction) * 10) / 10;
    if (thermalAnalysis.estimatedRange) {
      thermalAnalysis.estimatedRange = [
        Math.round((thermalAnalysis.estimatedRange[0] - correction) * 10) / 10,
        Math.round((thermalAnalysis.estimatedRange[1] - correction) * 10) / 10,
      ];
    }
    thermalAnalysis.calibration = temperatureCalibration;
    thermalAnalysis.prognosisImpactNote += ` Lokale seizoenskalibratie toegepast: ${correction > 0 ? '-' : '+'}${Math.abs(correction).toFixed(1)} °C op basis van ${temperatureCalibration.sampleCount} eerdere metingen.`;
  }

  const date = new Date(`${dateStr}T12:00:00.000Z`);
  const actualSpecies = species === 'Algemeen' ? 'Overig' : species;
  const profile = SPECIES_PROFILES[actualSpecies];

  // Filter forecasts voor deze datum (YYYY-MM-DD)
  const dayForecasts = forecasts.filter((h) => h.time.startsWith(dateStr));

  // Verdeel over 4 tijdvakken
  const slots: TimeSlot[] = ['Nacht', 'Ochtend', 'Middag', 'Avond'];
  const timeSlotAnalyses: Record<TimeSlot, TimeSlotAnalysis> = {} as any;

  for (const slot of slots) {
    const hoursConfig = TIME_SLOT_HOURS[slot];
    const slotForecasts = dayForecasts.filter((h) => {
      const hour = parseInt(h.time.slice(11, 13), 10);
      return hour >= hoursConfig.start && hour < hoursConfig.end;
    });

    timeSlotAnalyses[slot] = analyzeTimeSlot(
      slot,
      slotForecasts,
      forecasts,
      actualSpecies,
      profile,
      date,
      historicalSessions,
      options?.catches ?? [],
      slotReferenceDate,
      userWaterTemp,
      presenceObs,
      thermalAnalysis,
      (() => {
        const dailySolar = options?.dailySolarTimes?.find((item) => item.date === dateStr);
        return dailySolar && typeof location?.latitude === 'number'
          ? calculateCivilTwilightTimes(dateStr, location.latitude, dailySolar.sunrise, dailySolar.sunset)
          : null;
      })()
    );
  }

  // Beste toekomstige tijdvak
  const futureOrActiveSlots = slots.filter((slot) => !timeSlotAnalyses[slot].isPast);

  let bestSlot: TimeSlot | 'Geen toekomstig tijdvak meer vandaag' | 'Geen betekenisvol onderscheid' = 'Geen toekomstig tijdvak meer vandaag';
  let alternativeSlots: TimeSlot[] = [];

  if (futureOrActiveSlots.length > 0) {
    const sortedFuture = [...futureOrActiveSlots].sort(
      (a, b) => timeSlotAnalyses[b].activityScore - timeSlotAnalyses[a].activityScore
    );
    const availableScores = sortedFuture
      .filter((slot) => timeSlotAnalyses[slot].activityScoreAvailable !== false)
      .map((slot) => timeSlotAnalyses[slot].activityScore);
    const hasMeaningfulDifference = availableScores.length > 1 &&
      Math.max(...availableScores) - Math.min(...availableScores) >= 0.1;
    if (sortedFuture.length === 1 && availableScores.length === 1) {
      bestSlot = sortedFuture[0];
    } else if (hasMeaningfulDifference) {
      bestSlot = sortedFuture[0];
      alternativeSlots = sortedFuture.slice(1);
    } else {
      bestSlot = 'Geen betekenisvol onderscheid';
      alternativeSlots = [];
    }
  }

  const allSlotScores = slots.map((s) => timeSlotAnalyses[s].activityScore);
  const dayScoreAvailable = slots.every(slot => timeSlotAnalyses[slot].activityScoreAvailable !== false);
  const dayScore = dayScoreAvailable ? Math.round((allSlotScores.reduce((sum,v)=>sum+v,0)/allSlotScores.length)*10)/10 : 5.0;

  let advice: 'Gunstig' | 'Gemiddeld' | 'Ongunstig' = 'Gemiddeld';
  if (dayScoreAvailable && dayScore >= 7.0) advice = 'Gunstig';
  else if (dayScoreAvailable && dayScore < 4.5) advice = 'Ongunstig';

  // --- STATISTISCHE VANGSTKANS BEREKENING (SECTIE 4) ---
  // Strikte scheiding van:
  // 1. Historisch vangstpercentage: succesvolle geldige sessies / alle geldige sessies voor doelsoort (en evt. stek)
  // 2. Vangsttempo lambda: totaal aantal gevangen doelvis-exemplaren / totale geldige visduur in uren (inclusief confirmed blanks in noemer)
  // 3. Geschatte vangkans: Poisson-kans op >= 1 vis binnen de geplande duur: P(>= 1) = 1 - exp(-lambda * t)

  // Alleen voltooide sessies met bevestigde uitkomst ('catch' of 'skunk_confirmed').
  // Actieve sessies, onbekende uitkomsten en benchmarks worden strikt uitgesloten!
  const rawComparableSessions = getComparableSessions(historicalSessions, species, locationId);
  const catchIndex: Map<string, CatchItem[]> = options?.catches ? getCatchSessionIndex(options.catches) : new Map<string, CatchItem[]>();
  const hasKnownTargetCatch = (session: FishingSession) =>
    (catchIndex.get(session.id) ?? []).some((item) =>
      (species === 'Algemeen' || (item.species === species && item.legacyImportQuality?.speciesKnown !== false))
    );
  // Een generieke sessie-uitkomst 'catch' is alleen een doelsoortsucces wanneer
  // een vangstrecord van die doelsoort aanwezig is. Anders blijft de uitkomst onbekend.
  const comparableSessions = rawComparableSessions.filter((session) =>
    session.outcome === 'skunk_confirmed' || (session.outcome === 'catch' && hasKnownTargetCatch(session))
  );

  const sessionCount = comparableSessions.length;
  const successfulSessionsCount = comparableSessions.filter((session) => session.outcome === 'catch').length;
  const historicalSuccessRate =
    sessionCount > 0 ? Math.round((successfulSessionsCount / sessionCount) * 100) : null;

  const historicalCatchRate: HistoricalCatchRateInfo = {
    successfulSessions: successfulSessionsCount,
    totalSessions: sessionCount,
    percentage: historicalSuccessRate,
    label:
      sessionCount > 0
        ? `${successfulSessionsCount} van ${sessionCount} geldige sessies (${historicalSuccessRate}%)`
        : 'Geen eerdere geldige sessies voor deze selectie',
  };

  // Base rate weerspiegelt de historische basisfrequentie van de geselecteerde scope (null indien 0 sessies, nooit 100%!)
  const baseRate = historicalSuccessRate;

  let catchChance: number | null = null;
  let confidence: 'Onvoldoende gegevens' | 'Zeer laag' | 'Laag' | 'Matig' | 'Redelijk' | 'Gemiddeld' | 'Hoog' =
    'Onvoldoende gegevens';
  let uncertaintyInterval: [number, number] | null = null;
  let avgDurationMinutes: number | undefined = undefined;
  let expectedCatches: number | null = null;
  let hourlyCatchRate: number | null = null;

  const uncertaintyNotes: string[] = [];

  // Sessies zonder werkelijk bekende duur mogen niet als blootstelling meetellen.
  const durationSessions = comparableSessions.filter((session) => getSessionDurationHours(session) !== null);
  const poissonSessions = durationSessions.filter((session) =>
    session.outcome === 'skunk_confirmed' ||
    (catchIndex.get(session.id) ?? []).some((item) =>
      (species === 'Algemeen' || (item.species === species && item.legacyImportQuality?.speciesKnown !== false)) &&
      item.legacyImportQuality?.countKnown !== false && Number.isFinite(item.count) && item.count > 0
    )
  );

  // Minimaal vijf vergelijkbare sessies en vijf sessies met bekende werkelijke duur
  // én bruikbare vangstaantallen zijn nodig voor het Poisson-blootstellingsmodel.
  if (sessionCount >= 5) {
    uncertaintyInterval = calculateWilsonInterval(successfulSessionsCount, sessionCount);

    if (poissonSessions.length >= 5) {
      const totalDurationHours = poissonSessions.reduce(
        (acc, s) => acc + (getSessionDurationHours(s) ?? 0),
        0
      );
      const avgDurationHours = totalDurationHours / poissonSessions.length;
      avgDurationMinutes = Math.round(avgDurationHours * 60);

      let totalTargetCatches = 0;
      for (const session of poissonSessions) {
        if (session.outcome === 'skunk_confirmed') continue;
        const sessionCatches = (catchIndex.get(session.id) ?? []).filter((item) =>
          (species === 'Algemeen' || (item.species === species && item.legacyImportQuality?.speciesKnown !== false)) &&
          item.legacyImportQuality?.countKnown !== false && Number.isFinite(item.count) && item.count > 0
        );
        totalTargetCatches += sessionCatches.reduce((sum, item) => sum + item.count, 0);
      }

      const rawLambdaPerHour = totalDurationHours > 0 ? totalTargetCatches / totalDurationHours : 0;
      hourlyCatchRate = Math.round(rawLambdaPerHour * 100) / 100;

      // Catch chance stays a personal empirical baseline until a biological coupling is validated.
      if (sessionDuration !== null) {
        let durationAdjusted = rawLambdaPerHour > 0 ? 1 - Math.exp(-rawLambdaPerHour * sessionDuration) : 0;
        durationAdjusted = clamp(durationAdjusted, 0, 0.95);
        expectedCatches = Math.round(rawLambdaPerHour * sessionDuration * 10) / 10;
        catchChance = Math.round(durationAdjusted * 100);
      } else {
        uncertaintyNotes.push('De gewenste sessieduur is onbekend; vangstkans en verwacht aantal vangsten worden daarom niet voor een fictieve duur berekend.');
      }

      if (poissonSessions.length >= 30) confidence = 'Hoog';
      else if (poissonSessions.length >= 18) confidence = 'Redelijk';
      else if (poissonSessions.length >= 10) confidence = 'Matig';
      else confidence = 'Laag';

      uncertaintyNotes.push(
        `Het Wilson-betrouwbaarheidsinterval [${uncertaintyInterval[0]}% – ${uncertaintyInterval[1]}%] kwantificeert de binomiale steekproefvariantie van het historische sessiesucces bij N=${sessionCount}. Dit is géén betrouwbaarheidsinterval rond de Poisson-duurkans.`
      );
      uncertaintyNotes.push(
        `Poisson-blootstellingsmodel gebruikt ${poissonSessions.length} sessies met bekende duur en bruikbare vangstaantallen (totale geregistreerde visduur: ${totalDurationHours.toFixed(1)} uur, vangsttempo: ${hourlyCatchRate}/uur).`
      );
      uncertaintyNotes.push(
        `De persoonlijke vangstkans is een historische Poisson-baseline. Het steekproeflabel is gebaseerd op ${poissonSessions.length} bruikbare sessies en is geen statistische betrouwbaarheidsmaat voor de voorspelde kans. Thermische activiteit, voeding en habitat worden niet als numerieke vangstcorrectie toegepast omdat deze koppeling nog niet empirisch is gevalideerd.`
      );
    } else {
      uncertaintyNotes.push(
        `Er zijn ${sessionCount} vergelijkbare sessies, maar slechts ${poissonSessions.length} hebben zowel een bekende duur als bruikbare vangstaantallen. Minimaal 5 zulke sessies zijn nodig voor een blootstellingsschatting; vangsttempo en vangstkans blijven daarom onbekend.`
      );
    }
  } else {
    uncertaintyNotes.push(
      `Er zijn ${sessionCount} vergelijkbare eigen sessies in de database voor deze selectie (minimaal 5 vereist). Een vangsttempo en vangstkans worden niet berekend bij onvoldoende gegevens om schijnnauwkeurigheid te voorkomen.`
    );
  }

  const hasKnownThermalInput = (thermalAnalysis.hasMeasuredWaterTemp && typeof thermalAnalysis.measuredWaterTemp === 'number') || (typeof thermalAnalysis.estimatedWaterTemp === 'number' && Number.isFinite(thermalAnalysis.estimatedWaterTemp));
  const weatherFields = [
    {name:'luchttemperatuur',count:dayForecasts.filter(h=>Number.isFinite(h.temperature)&&h.temperature>=-30&&h.temperature<=55).length},
    {name:'luchtdruk',count:dayForecasts.filter(h=>Number.isFinite(h.pressure)&&h.pressure>=850&&h.pressure<=1100).length},
    {name:'wind',count:dayForecasts.filter(h=>Number.isFinite(h.windSpeed)&&h.windSpeed>=0&&h.windSpeed<=200&&Number.isFinite(h.windDirection)&&h.windDirection>=0&&h.windDirection<=360).length},
    {name:'neerslag',count:dayForecasts.filter(h=>Number.isFinite(h.precipitation)&&h.precipitation>=0&&h.precipitation<=300).length},
    {name:'bewolking',count:dayForecasts.filter(h=>Number.isFinite(h.cloudCover)&&h.cloudCover>=0&&h.cloudCover<=100).length},
  ];
  const validHours=Math.min(...weatherFields.map(f=>f.count));
  const missingFields=weatherFields.filter(f=>f.count<12).map(f=>f.name);
  const weatherDataQuality={status:validHours>=18&&missingFields.length===0?'Volledig' as const:validHours>=6?'Gedeeltelijk' as const:'Onvoldoende' as const,validHours,expectedHours:24,coveragePercent:Math.round(validHours/24*100),missingFields};
  const dataQualityReport = createDataQualityReport([
    {
      name: 'Watertemperatuur',
      value: thermalAnalysis.hasMeasuredWaterTemp ? thermalAnalysis.measuredWaterTemp : thermalAnalysis.estimatedWaterTemp,
      status: thermalAnalysis.hasMeasuredWaterTemp ? 'userReported' : hasKnownThermalInput ? 'modelled' : 'unknown',
      source: thermalAnalysis.hasMeasuredWaterTemp ? 'Gebruikersmeting' : thermalAnalysis.waterTemperatureStatus ?? 'onbekend',
      observedAt: thermalAnalysis.anchorMeasurementTimestamp ?? undefined,
      explanation: 'Een modelschatting blijft onderscheiden van een directe gebruikersmeting.',
    },
    {
      name: 'Weersverwachting',
      value: validHours,
      status: validHours > 0 ? 'forecast' : 'unknown',
      source: 'Open-Meteo',
      observedAt: weatherUpdatedAt,
      explanation: `${validHours} van 24 verwachte uurwaarden per kernveld zijn beschikbaar.`,
    },
    {
      name: 'Vergelijkbare sessiehistorie',
      value: sessionCount,
      status: sessionCount > 0 ? 'userReported' : 'unknown',
      source: 'Eigen sessielogboek',
      explanation: 'Alleen sessies met bekende doelsoortuitkomst worden voor persoonlijke analyse geselecteerd.',
    },
  ]);
  const temperatureQualityUsable = dataQualityReport.results.find((item) => item.name === 'Watertemperatuur')?.usable === true;
  const forecastQualityUsable = dataQualityReport.results.find((item) => item.name === 'Weersverwachting')?.usable === true;
  if ((!temperatureQualityUsable || !forecastQualityUsable || weatherDataQuality.status !== 'Volledig') && catchChance !== null) {
    catchChance = null;
    expectedCatches = null;
    hourlyCatchRate = null;
    confidence = 'Onvoldoende gegevens';
    uncertaintyInterval = null;
    uncertaintyNotes.push('Persoonlijke vangstkans niet getoond: de centrale datakwaliteitscontrole markeert de thermische of weersinvoer als onbruikbaar of onvolledig.');
  }
  // Provenance
  let provenance: 'Algemene biologische regels' | 'Eigen waarnemingen' | 'Gecombineerd (model + eigen data)' | 'Algemene aannames' =
    'Algemene biologische regels';
  if (sessionCount >= 5) {
    provenance = 'Gecombineerd (model + eigen data)';
  }

  // Datum & dagnaam
  const todayRef = currentDateRef ?? new Date();
  const todayStr = getAmsterdamDateKey(todayRef) ?? '';
  const tomorrowStr = todayStr ? addCalendarDays(todayStr, 1) ?? '' : '';

  let dayName = '';
  if (dateStr === todayStr) {
    dayName = 'Vandaag';
  } else if (dateStr === tomorrowStr) {
    dayName = 'Morgen';
  } else {
    dayName = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' }).format(date);
    dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  }

  // Samenvatting
  let summaryRationale = '';
  if (!dayScoreAvailable) {
    summaryRationale = 'De beste vistijd is niet betrouwbaar te bepalen: de thermische basisgegevens ontbreken voor één of meer tijdvakken.';
  } else if (bestSlot === 'Geen betekenisvol onderscheid') {
    summaryRationale = 'De beschikbare tijdvakken verschillen volgens de huidige prognose niet betekenisvol in thermische activiteitspotentie. Er is daarom geen onderbouwde beste vistijd; kies een moment dat praktisch past.';
  } else if (bestSlot === 'Geen toekomstig tijdvak meer vandaag') {
    summaryRationale = 'Alle tijdvakken voor vandaag zijn inmiddels verstreken. Bekijk de prognose voor morgen.';
  } else {
    const bestSlotAnalysis = timeSlotAnalyses[bestSlot];
    summaryRationale = `Beste toekomstige vistijd is ${bestSlot} (${bestSlotAnalysis.activityScore}/10). ${bestSlotAnalysis.conclusion}`;
  }

  // Onzekerheden
  if (!thermalAnalysis.hasMeasuredWaterTemp || thermalAnalysis.measuredWaterTemp === null) {
    if (thermalAnalysis.estimatedWaterTemp !== null) {
      uncertaintyNotes.push(
        `Watertemperatuur is niet gemeten; de thermische component gebruikt een geschatte watertemperatuur (~${thermalAnalysis.estimatedWaterTemp} °C) op basis van thermische analyse en waterdiepte. Dit is een voorlopige temperatuurrespons, geen directe meting of voorspelling van activiteit, foerageren of winterrust.`
      );
    } else {
      uncertaintyNotes.push(
        'Watertemperatuur is niet gemeten of verantwoord geschat; de thermische activiteitspotentie is niet beschikbaar. Luchttemperatuur wordt niet als vervanging voor watertemperatuur gebruikt.'
      );
    }
  }
  const midDaySample = dayForecasts[Math.floor(dayForecasts.length / 2)];
  const presTrend = findPressureTrend(midDaySample?.time || `${dateStr}T12:00`, forecasts);
  if (!presTrend.known) {
    uncertaintyNotes.push('Luchtdruktrend over de voorafgaande 12-24 uur is niet beschikbaar in de weerdataset.');
  }

  // Aanwezigheidsnotitie
  let presenceInfo: { observation: PresenceObservationType; note: string } | undefined = undefined;
  if (presenceObs !== 'onbekend') {
    let obsNote = '';
    switch (presenceObs) {
      case 'vis_springen_rollen':
        obsNote = 'Vis zien springen/rollen bevestigt dat vis fysiek aanwezig is op de stek, maar garandeert geen aasopname. De waarneming wordt als context getoond en niet als numerieke bonus toegepast.';
        break;
      case 'aasbellen_voedselactiviteit':
        obsNote = 'Aasbellen en bodemwoelingen duiden op actieve voedselzoektocht in de bodemlaag.';
        break;
      case 'aanbeten':
        obsNote = 'Recente aanbeten of lijnzwemmers tonen aan dat vis actief in de buurt van de aasaanbieding foerageert.';
        break;
      case 'recente_vangst_stek':
        obsNote = 'Recente vangst op deze stek bevestigt actuele bezetting van de waterzone.';
        break;
      case 'geen_waarnemingen':
        obsNote = 'Geen activiteit waargenomen aan de oppervlakte. Dit is nadrukkelijk GEEN bewijs van afwezigheid (vis foerageert vaak diep of geruisloos).';
        break;
      default:
        obsNote = 'Geen viswaarnemingen gerapporteerd.';
    }
    presenceInfo = {
      observation: presenceObs,
      note: obsNote,
    };
    uncertaintyNotes.push(
      'Viswaarnemingen worden als context geregistreerd; er wordt geen numerieke aanwezigheidsbonus toegepast zolang het effect niet empirisch is gevalideerd.'
    );
  }

  // Tactische hengelpositionering & visbeweging (volledig gescheiden van vangstkans/activiteit)
  const positioningAdvice = analyzeRodPositioning(dateStr, forecasts, species, {
    location,
    userWaterTemp,
    thermalAnalysis,
    historicalSessions,
    historicalCatches: options?.catches ?? [],
    targetSlot: bestSlot !== 'Geen toekomstig tijdvak meer vandaag' && bestSlot !== 'Geen betekenisvol onderscheid' ? (bestSlot as TimeSlot) : undefined,
  });

  // Dagwaarden voor de tactische deelmodules; ontbrekende waarden blijven onbekend.
  const validWindForecasts = dayForecasts.filter(h =>
    Number.isFinite(h.windSpeed) && h.windSpeed >= 0 && h.windSpeed <= 200 &&
    Number.isFinite(h.windDirection) && h.windDirection >= 0 && h.windDirection < 360
  );
  const hasDayWindData = validWindForecasts.length >= 6;
  const avgWindSpeed = hasDayWindData
    ? Math.round((validWindForecasts.reduce((sum, h) => sum + h.windSpeed, 0) / validWindForecasts.length) * 10) / 10
    : null;

  let avgWindDeg: number | undefined;
  if (hasDayWindData) {
    const sinMean = validWindForecasts.reduce((sum, h) => sum + Math.sin(h.windDirection * Math.PI / 180), 0) / validWindForecasts.length;
    const cosMean = validWindForecasts.reduce((sum, h) => sum + Math.cos(h.windDirection * Math.PI / 180), 0) / validWindForecasts.length;
    if (Math.hypot(sinMean, cosMean) > 1e-6) {
      avgWindDeg = (Math.atan2(sinMean, cosMean) * 180 / Math.PI + 360) % 360;
    }
  }
  const compassPoints = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
  const windDirText = avgWindDeg === undefined
    ? (hasDayWindData ? 'Wisselend' : 'Onbekend')
    : compassPoints[Math.round(avgWindDeg / 45) % 8];

  const effectiveWaterTempForModules =
    thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null
      ? thermalAnalysis.measuredWaterTemp
      : typeof thermalAnalysis.estimatedWaterTemp === 'number' && Number.isFinite(thermalAnalysis.estimatedWaterTemp)
        ? thermalAnalysis.estimatedWaterTemp
        : null;
  const hasThermalDataForModules = effectiveWaterTempForModules !== null;
  const validCloudForecasts = dayForecasts.filter(h => Number.isFinite(h.cloudCover) && h.cloudCover >= 0 && h.cloudCover <= 100);
  const hasDayCloudData = validCloudForecasts.length >= 6;
  const avgCloudCover = hasDayCloudData
    ? validCloudForecasts.reduce((sum, h) => sum + h.cloudCover, 0) / validCloudForecasts.length
    : undefined;
  const seasonNL = date.getMonth() === 11 || date.getMonth() <= 1 ? 'Winter' : date.getMonth() >= 2 && date.getMonth() <= 4 ? 'Voorjaar' : date.getMonth() >= 5 && date.getMonth() <= 7 ? 'Zomer' : 'Herfst';
  const isColdWind = effectiveWaterTempForModules !== null && (
    effectiveWaterTempForModules < 8 ||
    (effectiveWaterTempForModules < 10 && (seasonNL === 'Winter' || seasonNL === 'Voorjaar'))
  );

  // Module 2: wind ten opzichte van de oever. Zonder bekende thermische basis,
  // geldige windrichting of geregistreerd watertype wordt geen oeverrelatie verzonnen.
  const bankWindAnalysis = hasDayWindData && avgWindDeg !== undefined &&
    hasThermalDataForModules && Boolean(location?.waterType) && avgWindSpeed !== null
    ? analyzeBankWind(location, avgWindDeg, avgWindSpeed, {
        effectiveWaterTemp: effectiveWaterTempForModules!,
        season: seasonNL,
        isColdWind,
        isCoolingPeriod: thermalAnalysis.trend === 'Waarschijnlijke afkoeling',
        isWarmingPeriod: thermalAnalysis.trend === 'Waarschijnlijke opwarming',
        waterType: location?.waterType,
      })
    : undefined;

  const presTrendType: 'stijgend' | 'dalend' | 'stabiel' | undefined =
    presTrend.known && presTrend.deltaHpa !== null
      ? presTrend.deltaHpa < -2.5
        ? 'dalend'
        : presTrend.deltaHpa > 2.5
        ? 'stijgend'
        : 'stabiel'
      : undefined;

  // Module 3: visbeweging & habitatmodel. Geen standaardtijdvak of standaardweer invullen.
  const habitatAnalysis = analyzeHabitatMovement(species, dateStr, {
    location,
    bankWind: bankWindAnalysis,
    thermalAnalysis,
    targetSlot: bestSlot !== 'Geen toekomstig tijdvak meer vandaag' ? (bestSlot as TimeSlot) : undefined,
    observations: options?.observations,
    sessionObservations: presenceObs !== 'onbekend' ? [presenceObs] : [],
    historicalSessions,
    avgWindSpeedKmH: avgWindSpeed ?? undefined,
    windDirText: hasDayWindData ? windDirText : undefined,
    pressureTrend: presTrendType,
    cloudCoverPercent: avgCloudCover,
  });

  // Ontbrekende context verlaagt de zekerheid, maar overschrijft geen directe
  // gebruikerswaarnemingen of de voorzichtige lokale zoekhypothese uit de engines.
  if (!hasDayWindData || !hasThermalDataForModules || !hasDayCloudData || !presTrend.known || !location?.waterType) {
    const limitations = [
      ...(!hasDayWindData ? ['Dagwind ontbreekt of heeft onvoldoende geldige uurmetingen.'] : []),
      ...(!hasThermalDataForModules ? ['Geen gemeten of verantwoord geschatte watertemperatuur; thermische duiding blijft onbekend.'] : []),
      ...(!hasDayCloudData ? ['Bewolkingsgegevens ontbreken; licht-/zoncontext is onbekend.'] : []),
      ...(!presTrend.known ? ['Luchtdruktrend onbekend; er wordt geen trend verondersteld.'] : []),
      ...(!location?.waterType ? ['Watertype onbekend; stromend of stilstaand water wordt niet aangenomen.'] : []),
    ];
    positioningAdvice.confidenceLevel = 'Laag';
    positioningAdvice.missingInformation.push(...limitations);
    habitatAnalysis.confidenceLevel = 'Laag';
    habitatAnalysis.missingInformation.push(...limitations);
  }

  // Module 1: Gestructureerd Voorvoerprogramma
  const prebaitPlan = supportsPrebaitPlanning(species)
    ? calculatePrebaitPlan(
        dateStr,
        species,
        thermalAnalysis,
        {
          availableDaysBefore: 2,
          sessionDurationHours: sessionDuration ?? undefined,
          userWaterTemp,
          ...options?.prebaitOptions,
          technique: options?.prebaitOptions?.technique ?? options?.technique,
          planningDate: options?.prebaitOptions?.planningDate ?? (currentDateRef ?? new Date()).toISOString().slice(0, 10),
        },
        historicalSessions,
        location,
        bankWindAnalysis,
        bestSlot !== 'Geen toekomstig tijdvak meer vandaag' && bestSlot !== 'Geen betekenisvol onderscheid' ? (bestSlot as TimeSlot) : 'Ochtend',
        options?.catches ?? []
      ) ?? undefined
    : undefined;

  return {
    date: dateStr,
    dayName,
    species,
    activityScore: dayScore,
    activityScoreAvailable: dayScoreAvailable,
    weatherDataQuality,
    dataQualityReport,
    advice,
    bestTimeSlot: bestSlot,
    alternativeTimeSlots: alternativeSlots,
    summaryRationale,
    personalCatchChance: catchChance,
    personalCatchConfidence: confidence,
    catchUncertaintyInterval: uncertaintyInterval,
    relevantSessionCount: sessionCount,
    poissonSessionCount: poissonSessions.length,
    averageRelevantSessionDurationMin: avgDurationMinutes,
    plannedDurationHours: sessionDuration,
    expectedCatches,
    hourlyCatchRate,
    baseRate,
    historicalCatchRate,
    provenance,
    weatherUpdatedAt,
    timeSlots: timeSlotAnalyses,
    uncertaintyNotes,
    waterTemperatureInfo: {
      measured: Boolean(thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null),
      temp:
        thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null
          ? thermalAnalysis.measuredWaterTemp
          : null,
      note:
        thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null
          ? `Gemeten watertemperatuur: ${thermalAnalysis.measuredWaterTemp} °C (directe stekmeting voor actuele situatie).`
          : thermalAnalysis.estimatedWaterTemp !== null
          ? `Watertemperatuur niet gemeten; modelschatting is ~${thermalAnalysis.estimatedWaterTemp} °C (bereik [${thermalAnalysis.estimatedRange?.[0]}–${thermalAnalysis.estimatedRange?.[1]} °C], trend: ${thermalAnalysis.trend.toLowerCase()}).`
          : 'Geen watertemperatuur gemeten of verantwoord geschat; luchttemperatuur wordt niet als vervanging gebruikt.',
    },
    pressureTrendInfo: {
      known: presTrend.known,
      deltaHpa: presTrend.deltaHpa,
      note: presTrend.trendDescription,
    },
    presenceInfo,
    thermalAnalysis,
    positioningAdvice,
    bankWindAnalysis,
    habitatAnalysis,
    prebaitPlan,
  };
}

export interface PendingPrognosisSnapshot {
  prognosis: DayPrognosis;
  /** Exact moment at which this forecast was calculated; never replace it at persistence time. */
  forecastTimestamp?: string;
  /** 0 is the explicit storage sentinel for an unknown duration. */
  durationHours: number;
  durationKnown?: boolean;
  locationName?: string;
  chosenSlot?: TimeSlot;
  targetWindowStart?: string;
  targetWindowEnd?: string | null;
  conditions?: WeatherSnapshot;
  weatherInput?: WeatherHourlyForecast[];
  inputContext?: PrognosisInputContext;
  runKind?: import('../types').PrognosisRunKind;
  inputFingerprint?: string;
  supersedesSnapshotId?: string;
}

/**
 * Slaat een onveranderlijke (immutable) voorspellingsmomentopname op in Dexie voor latere empirische evaluatie.
 * Voorkomt dubbele snapshots door datum, tijdvak, soort, locatie, sessieduur en techniek te vergelijken.
 */
export async function savePrognosisSnapshot(
  prognosis: DayPrognosis,
  durationHours: number,
  locationId?: string,
  locationName?: string,
  technique?: string,
  chosenSlot?: TimeSlot,
  conditions?: WeatherSnapshot,
  metadata?: {
    runKind?: import('../types').PrognosisRunKind;
    weatherInput?: WeatherHourlyForecast[];
    inputContext?: PrognosisInputContext;
    inputFingerprint?: string;
    supersedesSnapshotId?: string;
    forecastTimestamp?: string;
    targetWindowStart?: string;
    targetWindowEnd?: string | null;
  }
): Promise<PrognosisSnapshot> {
  const targetSlot = prognosis.activityScoreAvailable === false ? undefined :
    chosenSlot ||
    (prognosis.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag' && prognosis.bestTimeSlot !== 'Geen betekenisvol onderscheid'
      ? (prognosis.bestTimeSlot as TimeSlot)
      : undefined);

  // Controleer of er al een onveranderlijke, nog niet-gekoppelde momentopname bestaat
  // voor exact deze doeldatum, tijdvak, vissoort en locatie om duplicaten te voorkomen
  const existingList = metadata?.runKind
    ? []
    : await db.prognosisSnapshots.toArray();
  const existing = existingList.find(
    (s) =>
      s.targetDate === prognosis.date &&
      s.targetSlot === targetSlot &&
      s.targetSpecies === prognosis.species &&
      (locationId ? s.locationId === locationId : true) &&
      s.durationHours === durationHours &&
      s.technique === technique &&
      !s.linkedSessionId
  );

  if (existing) {
    // Behoud de reeds opgeslagen momentopname ongewijzigd (evaluatie-integriteit & immutability)
    return existing;
  }

  const id = `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const snapshot: PrognosisSnapshot = {
    id,
    forecastTimestamp: metadata?.forecastTimestamp ?? metadata?.inputContext?.calculatedAt ?? new Date().toISOString(),
    targetDate: prognosis.date,
    targetSlot,
    targetSpecies: prognosis.species,
    locationId,
    locationName,
    durationHours,
    durationKnown: metadata?.runKind ? durationHours > 0 : undefined,
    targetWindowStart: metadata?.targetWindowStart,
    targetWindowEnd: metadata?.targetWindowEnd,
    runKind: metadata?.runKind,
    inputFingerprint: metadata?.inputFingerprint,
    supersedesSnapshotId: metadata?.supersedesSnapshotId,
    prognosisData: prognosis,
    weatherInput: metadata?.weatherInput,
    inputContext: metadata?.inputContext,
    technique,
    predictedActivityScore: prognosis.activityScoreAvailable === false ? null : prognosis.activityScore,
    activityScoreAvailable: prognosis.activityScoreAvailable !== false,
    weatherDataQuality: prognosis.weatherDataQuality,
    predictedCatchChance: prognosis.personalCatchChance, // null indien N < 5, NOOIT gefabriceerd!
    predictedUncertaintyInterval: prognosis.catchUncertaintyInterval,
    predictedConfidence: prognosis.personalCatchConfidence,
    predictedConditions: conditions,
    // Alleen een voorafgaande modelschatting kan achteraf onafhankelijk worden gevalideerd.
    predictedWaterTemperature:
      prognosis.thermalAnalysis && !prognosis.thermalAnalysis.hasMeasuredWaterTemp &&
      typeof prognosis.thermalAnalysis.estimatedWaterTemp === 'number'
        ? prognosis.thermalAnalysis.estimatedWaterTemp
        : null,
    predictedWaterTemperatureRange:
      prognosis.thermalAnalysis && !prognosis.thermalAnalysis.hasMeasuredWaterTemp
        ? prognosis.thermalAnalysis.estimatedRange ?? null
        : null,
    predictedWaterTemperatureStatus: prognosis.thermalAnalysis?.waterTemperatureStatus,
    predictedWaterTemperatureUncertaintyC: prognosis.thermalAnalysis?.uncertaintyC ?? null,
    predictedWaterTemperatureAnchorTimestamp: prognosis.thermalAnalysis?.anchorMeasurementTimestamp ?? null,
    predictedWaterTemperatureHistoricalBaselineC: prognosis.thermalAnalysis?.historicalWaterTemperatureBaselineC ?? null,
    predictedWaterTemperatureHistoricalSamples: prognosis.thermalAnalysis?.historicalWaterTemperatureSamples ?? 0,
    predictedWaterTemperatureHistoricalSource: prognosis.thermalAnalysis?.historicalWaterTemperatureSource ?? null,
    predictedWaterTemperatureWeatherCoverage: prognosis.thermalAnalysis?.weatherCoverageRatio,
    modelVersion: PROGNOSIS_MODEL_VERSION,
    engineVersions: { ...PROGNOSIS_ENGINE_VERSIONS },
    source: `Vislogboek ${PROGNOSIS_MODEL_VERSION}`,
    createdAt: new Date().toISOString(),
  };

  await db.prognosisSnapshots.put(snapshot);
  return snapshot;
}

/**
 * Slaat een gekozen prognose en de nieuwe actieve sessie atomair op. Totdat deze
 * functie bij het definitief opslaan wordt aangeroepen, wordt niets in IndexedDB geschreven.
 */
export async function saveSessionWithPrognosisSnapshot(
  session: FishingSession,
  pending: PendingPrognosisSnapshot,
  rods?: import('../types').SessionRod[]
): Promise<FishingSession> {
  if (!session.id || !session.startTime || session.outcome !== 'active') {
    throw new Error('Een prognosesnapshot kan alleen samen met een nieuwe actieve sessie worden opgeslagen.');
  }

  const forecastTimestamp = pending.forecastTimestamp ?? pending.inputContext?.calculatedAt;
  const forecastMs = forecastTimestamp ? Date.parse(forecastTimestamp) : NaN;
  const sessionStartMs = Date.parse(session.startTime);
  if (!Number.isFinite(forecastMs) || !Number.isFinite(sessionStartMs) || forecastMs >= sessionStartMs) {
    throw new Error('De prognosesnapshot moet een geldig berekeningstijdstip vóór de daadwerkelijke sessiestart hebben. De sessie is niet gestart.');
  }

  return db.transaction('rw', db.sessions, db.prognosisSnapshots, db.presenceObservations, db.sessionRods, async () => {
    const snapshot = await savePrognosisSnapshot(
      pending.prognosis,
      pending.durationHours,
      session.locationId,
      pending.locationName,
      session.technique,
      pending.chosenSlot,
      pending.conditions,
      {
        runKind: pending.runKind ?? 'session_start',
        weatherInput: pending.weatherInput,
        inputContext: pending.inputContext,
        inputFingerprint: pending.inputFingerprint,
        supersedesSnapshotId: pending.supersedesSnapshotId,
        forecastTimestamp,
      }
    );
    const linkedSession: FishingSession = { ...session, snapshotId: snapshot.id };
    await db.prognosisSnapshots.update(snapshot.id, { linkedSessionId: session.id });
    await db.sessions.put(linkedSession);
    await syncSessionPresenceObservations(linkedSession);
    if (rods !== undefined && rods.length > 0) {
      await db.sessionRods.bulkPut(rods.map((rod) => ({ ...rod, sessionId: session.id })));
    }
    return linkedSession;
  });
}

/**
 * Bereidt een onveranderlijke prognosesnapshot voor bij de start van een live actieve sessie.
 * Schrijft nog niet naar IndexedDB; de sessie en snapshot worden samen atomair opgeslagen.
 * Sluit historische of achteraf ingevoerde sessies strikt uit (geen achteraf invullen).
 */
export async function createLiveSnapshotForSessionStart(
  location: FishingLocation,
  species: FishSpecies | 'Algemeen',
  durationHours?: number,
  technique?: string,
  weatherSnap?: WeatherSnapshot,
  userWaterTemp?: number | null
): Promise<PendingPrognosisSnapshot | null> {
  try {
    const lat = location.latitude ?? 51.961;
    const lon = location.longitude ?? 5.228;
    const weather = await getForecast(lat, lon, false);
    const [allSessions, allCatches, allSnapshots, allLocations] = await Promise.all([
      db.sessions.toArray(),
      db.catches.toArray(),
      db.prognosisSnapshots.toArray(),
      db.locations.toArray(),
    ]);
    const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
    const waterTemperatureCalibration = getWaterTemperatureCalibration(allSnapshots, location.id, todayStr);
    const historicalWaterTemperatures = collectHistoricalWaterTemperatureObservations(
      allSessions,
      allSnapshots,
      allLocations
    );
    const historyFeatures = createPrognosisHistoryFeatureSnapshot(allSessions, allCatches);
    const forecastTimestamp = new Date().toISOString();
    const inputContext: PrognosisInputContext = {
      calculatedAt: forecastTimestamp,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
      targetDate: todayStr,
      targetSpecies: species,
      sessionDurationHours: durationHours ?? null,
      technique: technique ?? null,
      manualWaterTemperatureInput: createManualWaterTemperatureInput(userWaterTemp, forecastTimestamp),
      waterTemperatureCalibration,
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        waterType: location.waterType,
        waterDepth: location.waterDepth,
        waterFacingDirection: location.waterFacingDirection,
        habitatFeatures: location.habitatFeatures,
      },
      historicalSessionIds: historyFeatures.historicalSessionFeatures!.map((item) => item.id),
      catchRecordIds: historyFeatures.historicalCatchFeatures!.map((item) => item.id),
      observationIds: [],
      ...historyFeatures,
      presenceObservation: 'onbekend',
      historicalWaterTemperatureSamples: historicalWaterTemperatures,
      historyFingerprint: createPrognosisHistoryFingerprint(allSessions, allCatches, [], historicalWaterTemperatures),
      historySummary: {
        sessionCount: historyFeatures.historicalSessionFeatures!.length,
        catchRecordCount: historyFeatures.historicalCatchFeatures!.length,
        observationCount: 0,
        historicalWaterTemperatureSampleCount: historicalWaterTemperatures.length,
      },
      weatherFetchedAt: weather.fetchedAt,
    };
    const prog = calculateDayPrognosis(
      todayStr,
      weather.hourly,
      species,
      allSessions,
      weather.fetchedAt,
      userWaterTemp ?? null,
      new Date(),
      {
        sessionDurationHours: durationHours,
        allowUnknownSessionDuration: true,
        locationId: location.id,
        location,
        catches: allCatches,
        historicalWaterTemperatures,
        waterTemperatureCalibration,
      }
    );

    const chosenSlot =
      prog.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag' && prog.bestTimeSlot !== 'Geen betekenisvol onderscheid'
        ? (prog.bestTimeSlot as TimeSlot)
        : undefined;

    // Nog niets naar IndexedDB schrijven: de sessie en deze snapshot worden samen
    // door saveSessionWithPrognosisSnapshot in één transactie opgeslagen.
    return {
      prognosis: prog,
      forecastTimestamp,
      durationHours: durationHours ?? 0,
      durationKnown: typeof durationHours === 'number' && Number.isFinite(durationHours) && durationHours > 0,
      locationName: location.name,
      chosenSlot,
      conditions: weatherSnap,
      weatherInput: weather.hourly,
      inputContext,
      inputFingerprint: createPrognosisInputFingerprint({ inputContext, weather: weather.hourly, technique, userWaterTemp }),
      runKind: 'session_start',
    };
  } catch (err) {
    console.error('Fout bij automatisch genereren van live sessie-snapshot:', err);
    return null;
  }
}