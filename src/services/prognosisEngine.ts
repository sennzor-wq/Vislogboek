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
} from '../types';
import { SPECIES_PROFILES, SpeciesProfile, calculateThermalEfficiency } from './fishProfiles';
import { BENCHMARK_SESSION_ID, db } from '../db/db';
import { analyzeWaterThermalDevelopment } from './waterThermalEngine';
import { getWaterTemperatureCalibration } from './evaluationEngine';
import { analyzeRodPositioning } from './rodPositioningEngine';
import { getForecast } from './weatherService';
import { analyzeBankWind } from './bankWindEngine';
import { analyzeHabitatMovement } from './habitatMovementEngine';
import { calculatePrebaitPlan } from './prebaitEngine';
import { PrebaitProgramOptions, PresenceObservation } from '../types';

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

// Eén prognoseronde gebruikt dezelfde forecast-array voor alle dagen en tijdvakken.
// Valide luchtdrukmetingen daarom één keer voorbereiden en hergebruiken.
const pressureForecastCache = new WeakMap<WeatherHourlyForecast[], WeatherHourlyForecast[]>();
const similarSessionCache = new WeakMap<FishingSession[], Map<string, FishingSession[]>>();
const completedSessionCache = new WeakMap<FishingSession[], FishingSession[]>();
const comparableSessionCache = new WeakMap<FishingSession[], Map<string, FishingSession[]>>();
const catchSessionIndexCache = new WeakMap<CatchItem[], Map<string, CatchItem[]>>();

function getSimilarSessions(
  sessions: FishingSession[],
  species: FishSpecies,
  slot: TimeSlot
): FishingSession[] {
  let byKey = similarSessionCache.get(sessions);
  if (!byKey) {
    byKey = new Map<string, FishingSession[]>();
    similarSessionCache.set(sessions, byKey);
  }
  const key = `${species}|${slot}`;
  const cached = byKey.get(key);
  if (cached) return cached;

  const hours = TIME_SLOT_HOURS[slot];
  const filtered = sessions.filter((session) => {
    if (session.outcome === 'active' || session.outcome === 'unknown' || session.isBenchmark) return false;
    const matchedSpecies =
      session.targetSpecies?.includes(species) || (!session.targetSpecies || session.targetSpecies.length === 0);
    if (!matchedSpecies) return false;
    const hour = new Date(session.startTime).getHours();
    return hour >= hours.start && hour < hours.end;
  });
  byKey.set(key, filtered);
  return filtered;
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
  currentDateRef: Date,
  userWaterTemp?: number | null,
  presenceObs?: PresenceObservationType,
  thermalAnalysis?: WaterThermalAnalysis
): TimeSlotAnalysis {
  const hoursConfig = TIME_SLOT_HOURS[slot];
  const month = date.getMonth() + 1;
  const season = getSeason(month);

  // Controleer of dit tijdvak reeds volledig verstreken is
  const targetDateStr = date.toISOString().slice(0, 10);
  const curDateStr = currentDateRef.toISOString().slice(0, 10);
  const curHour = currentDateRef.getHours();

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
  const tempDetailText = !hasKnownWaterTemp ? 'Onbekend: gemeten of voldoende onderbouwde geschatte watertemperatuur ontbreekt. Luchttemperatuur wordt niet als vervanging gebruikt.' : tempSource === 'gemeten' ? thermalResult!.description + ' (Gebaseerd op gemeten watertemperatuur).' : thermalResult!.description + ' (Gebaseerd op geschatte watertemperatuur via thermische traagheid).';
  const temperatureFactor: FactorBreakdown = { score: hasKnownWaterTemp ? Math.round((thermalEff*4-2)*10)/10 : 0, impact: hasKnownWaterTemp ? thermalResult!.impact : 'neutraal', title: 'Temperatuur & Metabolisme', detail: tempDetailText, dataAvailable: hasKnownWaterTemp };
  // 2. Luchtdrukfactor & Trend: alleen context, geen automatische biologische bonus/malus.
  // Een betrouwbare soortspecifieke relatie tussen absolute luchtdruk/korte druktrend
  // en vangstactiviteit is onvoldoende vastgesteld.
  const pressureTrend = findPressureTrend(representativeTimeIso, allForecasts);
  const pressureModulator = 1.0;
  const pressImpact: 'positief' | 'neutraal' | 'negatief' = 'neutraal';
  const pressDetail = !hasPressure ? 'Onbekend: onvoldoende geldige luchtdrukmetingen in dit tijdvak.' : pressureTrend.known && pressureTrend.deltaHpa !== null ? `Luchtdruk ${Math.round(avgPressure!)} hPa; ${pressureTrend.trendDescription}. Druktrend wordt getoond als weerscontext, maar krijgt geen automatische biologische bonus of aftrek.` : `Luchtdruk ${Math.round(avgPressure!)} hPa. ${pressureTrend.trendDescription}; geen biologische bonus of aftrek toegepast.`;

  const pressureFactor: FactorBreakdown = {
    score: 0,
    impact: pressImpact,
    title: 'Luchtdruk & Trend',
    detail: pressDetail,
    dataAvailable: hasPressure,
  };

  // 3. Windfactor: kleine contextuele correctie. Windrichting is geen vaste
  // soortspecifieke voorspeller; harde wind is vooral relevant voor presentatie
  // en beetregistratie.
  let windModulator = 1.0;
  let windImpact: 'positief' | 'neutraal' | 'negatief' = 'neutraal';
  let windDetail = '';

  if (!hasWind || avgWindSpeed === null || dominantWindDir === null) { windDetail = 'Onbekend: onvoldoende geldige windsnelheid en windrichting; geen windaanname toegepast.'; }
  else if (avgWindSpeed > profile.disruptiveWindThresholdKmH) { windModulator=0.96; windImpact='negatief'; windDetail=`Harde wind (${dominantWindDir}, ${Math.round(avgWindSpeed)} km/u) kan aasaanbieding, lijncontrole en beetregistratie bemoeilijken. Dit is primair een praktische factor, geen bewezen afname van biologische activiteit.`; }
  else if (avgWindSpeed >= 9 && avgWindSpeed <= 22) { windModulator=1.01; windDetail=`Matige wind (${dominantWindDir}, ${Math.round(avgWindSpeed)} km/u) kan lokaal golfslag en verplaatsing van oppervlaktevoedsel veroorzaken; het effect hangt af van stek en oever.`; }
  else if (avgWindSpeed < 4) { windDetail=`Weinig wind (${Math.round(avgWindSpeed)} km/u). Dit zegt op zichzelf niet dat vis minder actief is; let vooral op zichtbaarheid, verstoring en waargenomen visactiviteit.`; }
  else { windDetail=`Wind (${dominantWindDir}, ${Math.round(avgWindSpeed)} km/u); geen sterke generieke biologische invloed aangenomen.`; }
  if (hasWind) {
    const directionSequence = windSamples.reduce<string[]>((directions, sample) => {
      const direction = sample.windDirectionText.trim();
      if (directions[directions.length - 1] !== direction) directions.push(direction);
      return directions;
    }, []);
    if (directionSequence.length > 1) {
      windDetail += ` De wind draait binnen dit tijdvak: ${directionSequence.join(' → ')}; de windrichting is dus niet de hele periode gelijk.`;
    }
    if (profile.preferredWindDirections.includes(dominantWindDir!)) {
      windDetail += ` De representatieve windrichting ${dominantWindDir} sluit aan bij de voorkeur van ${species}; dit is contextuele informatie en geen extra scorebonus.`;
    }
  }
  const windFactor: FactorBreakdown = {
    score: Math.round((windModulator - 1.0) * 1000) / 10,
    impact: windImpact,
    title: 'Wind & Oppervlakte',
    detail: windDetail,
    dataAvailable: hasWind,
  };

  // 4. Seizoensfactor (gedempt om dubbeltelling met temperatuur te voorkomen)
  const seasonRaw = profile.seasonalWeights[season];
  const seasonModulator = 0.92 + (seasonRaw / 10) * 0.16;
  const seasonImpact: 'positief' | 'neutraal' | 'negatief' =
    seasonRaw >= 8.5 ? 'positief' : seasonRaw <= 3.5 ? 'negatief' : 'neutraal';

  const seasonFactor: FactorBreakdown = {
    score: Math.round((seasonModulator - 1.0) * 10 * 10) / 10,
    impact: seasonImpact,
    title: 'Seizoensritme',
    detail: `Seizoen ${season} heeft een biologische achtergrondfactor van ${seasonRaw}/10 voor ${species}.`,
  };

  // 5. Tijdstip & Schemering
  let timeModulator = 1.0;
  let timeImpact: 'positief' | 'neutraal' | 'negatief' = 'neutraal';
  let timeDetail = '';

  const isPreferredSlot = profile.preferredSlots.includes(slot);
  if (isPreferredSlot) {
    timeModulator = 1.08;
    timeImpact = 'positief';
    timeDetail = `${slot} sluit aan bij het natuurlijke foerageerpatroon van ${species}.`;
  } else {
    timeModulator = 0.94;
    timeImpact = 'neutraal';
    timeDetail = `${slot} is gemiddeld genomen een rustiger dagdeel voor ${species}.`;
  }

  if (profile.crepuscularBonus && (slot === 'Ochtend' || slot === 'Avond')) {
    timeModulator = Math.min(1.15, timeModulator * 1.06);
    timeDetail += ' Schemering biedt natuurlijk lichtvoordeel.';
  }

  const timeOfDayFactor: FactorBreakdown = {
    score: Math.round((timeModulator - 1.0) * 10 * 10) / 10,
    impact: timeImpact,
    title: 'Tijdstip & Licht',
    detail: timeDetail,
  };

  // 6. Bewolking & Neerslag (geen dubbele telling van regen en bewolking)
  let precipModulator = 1.0;
  let precipImpact: 'positief' | 'neutraal' | 'negatief' = 'neutraal';
  let precipDetail = '';

  if (!hasPrecip && !hasCloud) { precipDetail = 'Onbekend: geen voldoende geldige neerslag- of bewolkingsgegevens.'; }
  else if (hasPrecip && totalPrecip! >= 7.0) {
    precipModulator = 0.92;
    precipImpact = 'negatief';
    precipDetail = `Langdurige zware neerslag (${totalPrecip!.toFixed(1)} mm) kan water vertroebelen en beïnvloedt techniek.`;
  } else if (hasPrecip && totalPrecip! > 0.2 && totalPrecip! < 4.0) {
    precipModulator = profile.rainPreference === 'licht_positief' ? 1.05 : 1.0;
    precipImpact = profile.rainPreference === 'licht_positief' ? 'positief' : 'neutraal';
    precipDetail = `Lichte regen (${totalPrecip!.toFixed(1)} mm) breekt het wateroppervlak en stimuleert activiteit.`;
  } else if (hasCloud && avgCloud! >= 70) {
    precipModulator = 1.03;
    precipImpact = 'positief';
    precipDetail = `Zwaarbewolkt (${Math.round(avgCloud!)}%); diffuus licht vermindert argwaan.`;
    if (profile.cloudPreference === 'bewolkt') {
      precipDetail += ` Gedempt licht sluit gunstig aan bij ${species}.`;
    }
  } else if (hasCloud && avgCloud! >= 30 && avgCloud! < 70) {
    precipModulator = profile.cloudPreference === 'wisselend' ? 1.02 : 1.0;
    precipImpact = 'neutraal';
    precipDetail = `Wisselende bewolking (${Math.round(avgCloud!)}%); dynamisch lichtbeeld${profile.cloudPreference === 'wisselend' ? ` past goed bij de zichtjacht van ${species}` : ''}.`;
  } else {
    precipModulator = 1.0;
    precipImpact = 'neutraal';
    precipDetail = 'Geen duidelijke neerslag- of bewolkingsinvloed vastgesteld op basis van de beschikbare waarden.';
  }

  const precipitationFactor: FactorBreakdown = {
    score: hasPrecip || hasCloud ? Math.round((precipModulator - 1.0) * 10 * 10) / 10 : 0,
    impact: hasPrecip || hasCloud ? precipImpact : 'neutraal',
    title: 'Bewolking & Neerslag',
    detail: precipDetail,
    dataAvailable: hasPrecip || hasCloud,
  };

  // --- NON-LINEAIR BEGRENSD MODEL VOOR BIOLOGISCHE ACTIVITEITSINDEX ---
  // Temperatuur fungeert als snelheidsbepalende fysiologische factor (rate-limiting biological constraint).
  // Bij lage temperatuur is de stofwisseling fundamenteel geremd; gunstig weer kan dit niet onbeperkt compenseren.
  // Luchtdruk is neutraal gehouden; wind, seizoen en neerslag zijn bewust gedempt.
  const knownComponents = [{weight:0.50,value:1.0}, ...(hasWind?[{weight:0.10,value:windModulator}]:[]), {weight:0.15,value:seasonModulator}, {weight:0.20,value:timeModulator}, ...(hasPrecip||hasCloud?[{weight:0.05,value:precipModulator}]:[])];
  const knownWeight = knownComponents.reduce((sum,item)=>sum+item.weight,0);
  const envModulator = knownComponents.reduce((sum,item)=>sum+item.weight*item.value,0)/knownWeight;

  // Power scale on thermal efficiency: E_temp^0.85
  const metabolicCeiling = Math.pow(thermalEff, 0.85);
  const rawActivityScore = 1.0 + 9.0 * metabolicCeiling * envModulator;
  const activityScore = Math.round(clamp(rawActivityScore, 1.0, 10.0) * 10) / 10;

  // 7. Persoonlijke sessies analyseren
  const similarSessions = getSimilarSessions(historicalSessions, species, slot);

  const relevantCount = similarSessions.length;
  const confirmedCatches = similarSessions.filter((s) => s.outcome === 'catch').length;
  const skunks = similarSessions.filter((s) => s.outcome === 'skunk_confirmed').length;
  const catchRate =
    relevantCount >= 5 ? Math.round((confirmedCatches / relevantCount) * 100) : null;

  let expNote = '';
  if (relevantCount === 0) {
    expNote = 'Nog geen eigen sessies geregistreerd in dit specifieke tijdvak.';
  } else if (relevantCount < 5) {
    expNote = `${relevantCount} eigen sessie(s) in dit tijdvak (${confirmedCatches} met vangst). Onvoldoende gegevens (< 5) voor een statistisch verantwoorde kansschatting.`;
  } else {
    expNote = `${relevantCount} vergelijkbare sessies: ${confirmedCatches} met vangst, ${skunks} bevestigde nulvangst (${catchRate}% vangstsucces).`;
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
  if (!hasKnownWaterTemp) { conclusion = 'Activiteitsindex niet betrouwbaar te bepalen: gemeten of geschatte watertemperatuur ontbreekt. Luchttemperatuur wordt niet als vervanging gebruikt.'; }
  else if (activityScore >= 8.5) {
    conclusion = `Zeer gunstige biologische omstandigheden (${activityScore}/10) voor ${species}. Optimale samenkomst van watertemperatuur, licht en weersomstandigheden.`;
  } else if (activityScore >= 6.8) {
    conclusion = `Gunstige omstandigheden (${activityScore}/10). Voldoende biologische stimulans voor ${species}.`;
  } else if (activityScore >= 4.8) {
    conclusion = `Gemiddelde biologische activiteit (${activityScore}/10). ${
      thermalEff < 0.5 ? 'De relatief lage temperatuur tempert de stofwisseling.' : 'Enkele omstandigheden dempen het potentieel.'
    }`;
  } else {
    conclusion = `Lage biologische activiteit (${activityScore}/10). ${
      thermalEff < 0.4
        ? `Lage watertemperatuur (${effectiveTemp!.toFixed(1)} °C) dwingt ${species} tot een inactieve winterstand (winterrust wordt fysiologisch gestuurd door watertemperatuur, niet direct door koude luchttemperatuur).`
        : 'Voorwaarden zijn momenteel biologisch ongunstig.'
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
}

/**
 * Converteert de sessieduur naar uren met correcte afhandeling van durationMinutes,
 * middernachtverschillen en veilige fallback bij onvolledige invoer.
 */
export function getSessionDurationHours(session: FishingSession): number {
  if (typeof session.durationMinutes === 'number' && session.durationMinutes > 0) {
    return session.durationMinutes / 60;
  }
  if (session.startTime && session.endTime) {
    const diffMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    const diffMins = diffMs / 60000;
    if (diffMins > 0 && diffMins < 10080) {
      return diffMins / 60;
    }
  }
  return 3; // Standaard veilige duur (3 uur) bij onvolledige registratie
}

/**
 * Berekent de volledige dagprognose met strikte scheiding van:
 * 1. Biologische activiteitsindex (1.0 - 10.0, relatieve indicatie)
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
  const sessionDuration =
    typeof rawDuration === 'number' && !isNaN(rawDuration) && rawDuration > 0
      ? Math.min(24, Math.max(0.25, rawDuration))
      : 3;
  const locationId = options?.locationId;
  const location = options?.location;
  const presenceObs = options?.presenceObservation ?? 'onbekend';

  const slotReferenceDate = currentDateRef ?? new Date(`${dateStr}T12:00:00`);

  // Thermische analyse van het viswater (waterdiepte per stek en actuele meting doorgeven)
  // Als currentDateRef optioneel is weggelaten, geldt targetDateStr zelf als de referentie.
  const thermalAnalysis = analyzeWaterThermalDevelopment(dateStr, forecasts, {
    location,
    userMeasuredWaterTemp: userWaterTemp,
    historicalSessions,
    currentDateRef,
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

  const date = new Date(dateStr);
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
      slotReferenceDate,
      userWaterTemp,
      presenceObs,
      thermalAnalysis
    );
  }

  // Beste toekomstige tijdvak
  const futureOrActiveSlots = slots.filter((slot) => !timeSlotAnalyses[slot].isPast);

  let bestSlot: TimeSlot | 'Geen toekomstig tijdvak meer vandaag' = 'Geen toekomstig tijdvak meer vandaag';
  let alternativeSlots: TimeSlot[] = [];

  if (futureOrActiveSlots.length > 0) {
    const sortedFuture = [...futureOrActiveSlots].sort(
      (a, b) => timeSlotAnalyses[b].activityScore - timeSlotAnalyses[a].activityScore
    );
    bestSlot = sortedFuture[0];
    alternativeSlots = sortedFuture.slice(1);
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
  const comparableSessions = getComparableSessions(historicalSessions, species, locationId);

  const sessionCount = comparableSessions.length;
  const successfulSessionsCount = comparableSessions.filter((s) => s.outcome === 'catch').length;
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

  // Minimum 5 vergelijkbare sessies vereist om schijnnauwkeurigheid te voorkomen
  if (sessionCount >= 5) {
    // 95% Wilson Score Interval op de binomiale proportie van historische basissessies
    uncertaintyInterval = calculateWilsonInterval(successfulSessionsCount, sessionCount);

    // Totale visduur in uren over alle geldige sessies (bevestigde blanks tellen volledig mee in de noemer!)
    const totalDurationHours = comparableSessions.reduce(
      (acc, s) => acc + getSessionDurationHours(s),
      0
    );
    const avgDurationHours = sessionCount > 0 ? totalDurationHours / sessionCount : 3;
    avgDurationMinutes = Math.round(avgDurationHours * 60);

    // Totaal aantal gevangen exemplaren van de doelsoort
    let totalTargetCatches = 0;
    for (const s of comparableSessions) {
      if (s.outcome === 'skunk_confirmed') {
        // Nulvangst: 0 vissen, maar visduur telt volledig mee in noemer
        continue;
      }
      if (options?.catches && options.catches.length > 0) {
        const catchIndex = getCatchSessionIndex(options.catches);
        const sessionCatches = (catchIndex.get(s.id) ?? []).filter(
          (catchItem) => species === 'Algemeen' || catchItem.species === species
        );
        const count = sessionCatches.reduce((acc, catchItem) => acc + (catchItem.count || 1), 0);
        // Indien sessie 'catch' is maar er zijn geen specifieke catch items ingevoerd, reken minimaal 1
        totalTargetCatches += count > 0 ? count : 1;
      } else {
        // Geen losse CatchItem records meegegeven; sessie heeft bevestigde uitkomst 'catch'
        totalTargetCatches += 1;
      }
    }

    // Directe berekening van vangsttempo lambda:
    // lambda = totaal aantal gevangen exemplaren van de doelsoort / totale geldige visduur in uren
    const rawLambdaPerHour = totalDurationHours > 0 ? totalTargetCatches / totalDurationHours : 0;
    hourlyCatchRate = Math.round(rawLambdaPerHour * 100) / 100;

    // Activiteitsmodulatie conform biologisch model (+/- 12%)
    const actFactor = 0.88 + (dayScore / 10) * 0.24;
    const effectiveLambda = rawLambdaPerHour * actFactor;

    // Duurcorrectie via Poisson exposure model:
    // P(>= 1 vangst in duur t) = 1 - exp(-lambda_eff * t)
    // Vangsttempo lambda blijft constant; cumulatieve kans en verwachte vangstopbrengst stijgen met t
    let durationAdjusted = effectiveLambda > 0 ? 1 - Math.exp(-effectiveLambda * sessionDuration) : 0;
    durationAdjusted = clamp(durationAdjusted, 0, 0.95);

    // Bereken verwacht aantal vangsten over de geplande sessieduur: E[N] = lambda_eff * t
    expectedCatches = Math.round(effectiveLambda * sessionDuration * 10) / 10;

    // Viswaarneming invloed (+5% als vis daadwerkelijk is waargenomen)
    // Behandeld als onbevestigde modelaanname (nog niet empirisch gevalideerd)
    let appliedPresenceBonus = false;
    if (
      ['vis_springen_rollen', 'aasbellen_voedselactiviteit', 'aanbeten', 'recente_vangst_stek'].includes(
        presenceObs
      )
    ) {
      if (durationAdjusted > 0) {
        durationAdjusted = clamp(durationAdjusted + 0.05, 0, 0.95);
        appliedPresenceBonus = true;
      }
    }

    catchChance = Math.round(durationAdjusted * 100);

    // Betrouwbaarheidslabel
    if (sessionCount >= 30) confidence = 'Hoog';
    else if (sessionCount >= 18) confidence = 'Redelijk';
    else if (sessionCount >= 10) confidence = 'Matig';
    else confidence = 'Laag';

    uncertaintyNotes.push(
      `Het Wilson-betrouwbaarheidsinterval [${uncertaintyInterval[0]}% – ${uncertaintyInterval[1]}%] kwantificeert de binomiale steekproefvariantie van het historische sessiesucces bij N=${sessionCount}. Dit is géén betrouwbaarheidsinterval rond de Poisson-duurkans, maar toont de bandbreedte van het basissessie-succes.`
    );

    uncertaintyNotes.push(
      `Sessieduur van ${sessionDuration} uur verwerkt via Poisson-blootstellingsmodel (totale historische visduur: ${totalDurationHours.toFixed(1)} uur, vangsttempo: ${hourlyCatchRate}/uur). Cumulatieve kans stijgt niet-lineair conform P = 1 - exp(-λ × t).`
    );

    if (appliedPresenceBonus) {
      uncertaintyNotes.push(
        'De aanwezigheidsbonus (+5%) is een onbevestigde heuristische modelaanname op basis van een lokale waarneming op de stek. Deze aanname is nog niet empirisch gevalideerd.'
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
  if ((!hasKnownThermalInput || weatherDataQuality.status!=='Volledig') && catchChance!==null) { catchChance=null; expectedCatches=null; hourlyCatchRate=null; confidence='Onvoldoende gegevens'; uncertaintyInterval=null; uncertaintyNotes.push('Persoonlijke vangstkans niet getoond: essentiële thermische of weersgegevens ontbreken of zijn onvolledig.'); }
  // Provenance
  let provenance: 'Algemene biologische regels' | 'Eigen waarnemingen' | 'Gecombineerd (model + eigen data)' | 'Algemene aannames' =
    'Algemene biologische regels';
  if (sessionCount >= 5) {
    provenance = 'Gecombineerd (model + eigen data)';
  }

  // Datum & dagnaam
  const todayRef = currentDateRef ?? new Date();
  const todayStr = todayRef.toISOString().slice(0, 10);
  const tomorrow = new Date(todayRef);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

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
  if (!dayScoreAvailable) { summaryRationale='De beste vistijd is niet betrouwbaar te bepalen: de thermische basisgegevens ontbreken voor één of meer tijdvakken.'; }
  else if (bestSlot !== 'Geen toekomstig tijdvak meer vandaag') {
    const bestSlotAnalysis = timeSlotAnalyses[bestSlot];
    summaryRationale = `Beste toekomstige vistijd is ${bestSlot} (${bestSlotAnalysis.activityScore}/10). ${bestSlotAnalysis.conclusion}`;
  } else {
    summaryRationale = 'Alle tijdvakken voor vandaag zijn inmiddels verstreken. Bekijk de prognose voor morgen.';
  }

  // Onzekerheden
  if (!thermalAnalysis.hasMeasuredWaterTemp || thermalAnalysis.measuredWaterTemp === null) {
    if (thermalAnalysis.estimatedWaterTemp !== null) {
      uncertaintyNotes.push(
        `Watertemperatuur is niet gemeten; de biologische prognose gebruikt een geschatte watertemperatuur (~${thermalAnalysis.estimatedWaterTemp} °C) op basis van thermische analyse en waterdiepte. Karperactiviteit wordt gestuurd door watertemperatuur en raakt niet automatisch in winterrust door een tijdelijke daling van de luchttemperatuur.`
      );
    } else {
      uncertaintyNotes.push(
        'Watertemperatuur is niet gemeten; de berekening gebruikt de luchttemperatuur met verhoogde thermische onzekerheid.'
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
        obsNote = 'Vis zien springen/rollen bevestigt dat vis fysiek aanwezig is op de stek. Dit verhoogt de lokale aanwezigheidskans, maar garandeert geen aasopname.';
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
  }

  // Tactische hengelpositionering & visbeweging (volledig gescheiden van vangstkans/activiteit)
  const positioningAdvice = analyzeRodPositioning(dateStr, forecasts, species, {
    location,
    userWaterTemp,
    thermalAnalysis,
    historicalSessions,
    targetSlot: bestSlot !== 'Geen toekomstig tijdvak meer vandaag' ? (bestSlot as TimeSlot) : undefined,
  });

  // Dagwaarden voor de tactische deelmodules; beschikbaarheid blijft apart geregistreerd.
  const validWindForecasts = dayForecasts.filter(h => Number.isFinite(h.windSpeed) && h.windSpeed >= 0 && h.windSpeed <= 200 && Number.isFinite(h.windDirection) && h.windDirection >= 0 && h.windDirection <= 360);
  const hasDayWindData = validWindForecasts.length >= 6;
  const avgWindSpeed = hasDayWindData ? Math.round((validWindForecasts.reduce((sum,h)=>sum+h.windSpeed,0)/validWindForecasts.length)*10)/10 : 12;
  const avgWindDeg = hasDayWindData ? Math.round(validWindForecasts.reduce((sum,h)=>sum+h.windDirection,0)/validWindForecasts.length) : 225;
  const windDirText = hasDayWindData ? validWindForecasts[Math.floor(validWindForecasts.length/2)].windDirectionText : 'Onbekend';
  const effectiveWaterTempForModules = thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null ? thermalAnalysis.measuredWaterTemp : thermalAnalysis.estimatedWaterTemp ?? 14;
  const hasThermalDataForModules = (thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null) || (typeof thermalAnalysis.estimatedWaterTemp === 'number' && Number.isFinite(thermalAnalysis.estimatedWaterTemp));
  const hasDayCloudData = dayForecasts.filter(h => Number.isFinite(h.cloudCover) && h.cloudCover >= 0 && h.cloudCover <= 100).length >= 6;
  const seasonNL = date.getMonth() === 11 || date.getMonth() <= 1 ? 'Winter' : date.getMonth() >= 2 && date.getMonth() <= 4 ? 'Voorjaar' : date.getMonth() >= 5 && date.getMonth() <= 7 ? 'Zomer' : 'Herfst';
  const isColdWind = effectiveWaterTempForModules < 8 || (effectiveWaterTempForModules < 10 && (seasonNL === 'Winter' || seasonNL === 'Voorjaar'));

  // Module 2: Wind ten opzichte van de oever
  const bankWindAnalysis = hasDayWindData && hasThermalDataForModules
    ? analyzeBankWind(location, avgWindDeg, avgWindSpeed, {
        effectiveWaterTemp: effectiveWaterTempForModules,
        season: seasonNL,
        isColdWind,
        isCoolingPeriod: thermalAnalysis.trend === 'Waarschijnlijke afkoeling',
        isWarmingPeriod: thermalAnalysis.trend === 'Waarschijnlijke opwarming',
        waterType: location?.waterType,
      })
    : undefined;

  const presTrendType: 'stijgend' | 'dalend' | 'stabiel' =
    presTrend.known && presTrend.deltaHpa !== null
      ? presTrend.deltaHpa < -2.5
        ? 'dalend'
        : presTrend.deltaHpa > 2.5
        ? 'stijgend'
        : 'stabiel'
      : 'stabiel';

  // Module 3: Visbeweging & Habitatmodel
  const habitatAnalysis = analyzeHabitatMovement(species, dateStr, {
    location,
    bankWind: bankWindAnalysis,
    thermalAnalysis,
    targetSlot: bestSlot !== 'Geen toekomstig tijdvak meer vandaag' ? (bestSlot as TimeSlot) : 'Ochtend',
    observations: options?.observations,
    sessionObservations: presenceObs !== 'onbekend' ? [presenceObs] : [],
    historicalSessions,
    avgWindSpeedKmH: avgWindSpeed,
    windDirText,
    pressureTrend: presTrendType,
    cloudCoverPercent: dayForecasts[0]?.cloudCover ?? 50,
  });

  // Tactische deelmodules hebben legacy numerieke invoer nodig. Als daarvoor een interne
  // placeholder nodig was, wordt hun uitvoer nadrukkelijk gedegradeerd en niet als zeker advies gepresenteerd.
  if (!hasDayWindData || !hasThermalDataForModules || !hasDayCloudData || !presTrend.known) {
    const limitations = [
      ...(!hasDayWindData ? ['Dagwind ontbreekt of heeft onvoldoende geldige uurmetingen; er wordt geen windgestuurd stekadvies gegeven.'] : []),
      ...(!hasThermalDataForModules ? ['Geen gemeten of verantwoord geschatte watertemperatuur; thermische tactische aannames zijn niet betrouwbaar.'] : []),
      ...(!hasDayCloudData ? ['Bewolkingsgegevens ontbreken; licht-/zoncontext is niet betrouwbaar.'] : []),
      ...(!presTrend.known ? ['Luchtdruktrend onbekend; er wordt geen trend verondersteld.'] : []),
    ];
    positioningAdvice.confidenceLevel = 'Laag';
    positioningAdvice.missingInformation.push(...limitations);
    if (!hasDayWindData || !hasThermalDataForModules) {
      positioningAdvice.recommendedZone = 'Niet betrouwbaar te bepalen met de beschikbare weergegevens';
      positioningAdvice.rationale = 'Er ontbreken wind- en/of thermische gegevens. Daarom geeft Vislogboek hier bewust geen weersgestuurd positioneringsadvies. Gebruik directe viswaarnemingen en de lokaal bekende stekstructuur.';
      positioningAdvice.alternativeOption = 'Controleer ter plaatse wind, golfslag, diepteverloop en zichtbare visactiviteit voordat je een positie kiest.';
      positioningAdvice.windContext.directionText = 'Onbekend';
      positioningAdvice.windContext.speedKmH = null;
      positioningAdvice.windContext.gustsKmH = undefined;
      positioningAdvice.windContext.intraSessionNote = 'Windgegevens ontbreken; geen windtrend beschikbaar.';
      positioningAdvice.thermalContext.waterTempNote = hasThermalDataForModules ? positioningAdvice.thermalContext.waterTempNote : 'Onbekend: geen gemeten of verantwoord geschatte watertemperatuur.';
      positioningAdvice.windCastingGuidance = undefined;
    }
    habitatAnalysis.confidenceLevel = 'Laag';
    habitatAnalysis.missingInformation.push(...limitations);
    if (!hasDayWindData || !hasThermalDataForModules) {
      habitatAnalysis.primaryZone.name = 'Algemene zoekzone — weerscontext onbekend';
      habitatAnalysis.primaryZone.description = 'Er zijn onvoldoende betrouwbare wind- en/of thermische gegevens om een weersgestuurde primaire zone te kiezen.';
      habitatAnalysis.primaryZone.whyLikely = 'Gebruik alleen directe viswaarnemingen en lokaal bekende habitatkenmerken; dit is geen weersgestuurde voorspelling.';
      habitatAnalysis.alternativeZone.name = 'Alternatieve lokale structuurzone';
      habitatAnalysis.alternativeZone.description = 'Controleer ter plaatse taluds, diepteovergangen, dekking en zichtbare activiteit.';
      habitatAnalysis.movementHypothesis.likelyDirection = 'Onbekend — onvoldoende weergegevens';
      habitatAnalysis.movementHypothesis.windInfluence = 'Onbekend: onvoldoende geldige windgegevens om windgestuurde visverplaatsing te beoordelen.';
      habitatAnalysis.environmentalInfluence.temperatureImpact = 'Onbekend: watertemperatuur ontbreekt.';
      habitatAnalysis.environmentalInfluence.windAndWaveImpact = 'Onbekend: onvoldoende geldige windgegevens.';
    }
    if (!hasDayCloudData) habitatAnalysis.environmentalInfluence.lightAndSolarImpact = 'Onbekend: onvoldoende geldige bewolkingsgegevens.';
  }

  // Module 1: Gestructureerd Voorvoerprogramma
  const prebaitPlan = calculatePrebaitPlan(
    dateStr,
    species,
    thermalAnalysis,
    options?.prebaitOptions || {
      availableDaysBefore: 2,
      sessionDurationHours: sessionDuration,
      userWaterTemp,
    },
    historicalSessions,
    location,
    bankWindAnalysis,
    bestSlot !== 'Geen toekomstig tijdvak meer vandaag' ? (bestSlot as TimeSlot) : 'Ochtend'
  );

  return {
    date: dateStr,
    dayName,
    species,
    activityScore: dayScore,
    activityScoreAvailable: dayScoreAvailable,
    weatherDataQuality,
    advice,
    bestTimeSlot: bestSlot,
    alternativeTimeSlots: alternativeSlots,
    summaryRationale,
    personalCatchChance: catchChance,
    personalCatchConfidence: confidence,
    catchUncertaintyInterval: uncertaintyInterval,
    relevantSessionCount: sessionCount,
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

/**
 * Slaat een onveranderlijke (immutable) voorspellingsmomentopname op in Dexie voor latere empirische evaluatie.
 * Voorkomt dubbele snapshots door te controleren of er al een onveranderlijke momentopname voor dit tijdvak bestaat.
 */
export async function savePrognosisSnapshot(
  prognosis: DayPrognosis,
  durationHours: number,
  locationId?: string,
  locationName?: string,
  technique?: string,
  chosenSlot?: TimeSlot,
  conditions?: WeatherSnapshot
): Promise<PrognosisSnapshot> {
  const targetSlot = prognosis.activityScoreAvailable === false ? undefined :
    chosenSlot ||
    (prognosis.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag'
      ? (prognosis.bestTimeSlot as TimeSlot)
      : 'Ochtend');

  // Controleer of er al een onveranderlijke, nog niet-gekoppelde momentopname bestaat
  // voor exact deze doeldatum, tijdvak, vissoort en locatie om duplicaten te voorkomen
  const existingList = await db.prognosisSnapshots.toArray();
  const existing = existingList.find(
    (s) =>
      s.targetDate === prognosis.date &&
      s.targetSlot === targetSlot &&
      s.targetSpecies === prognosis.species &&
      (locationId ? s.locationId === locationId : true) &&
      !s.linkedSessionId
  );

  if (existing) {
    // Behoud de reeds opgeslagen momentopname ongewijzigd (evaluatie-integriteit & immutability)
    return existing;
  }

  const id = `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const snapshot: PrognosisSnapshot = {
    id,
    forecastTimestamp: new Date().toISOString(),
    targetDate: prognosis.date,
    targetSlot,
    targetSpecies: prognosis.species,
    locationId,
    locationName,
    durationHours,
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
    modelVersion: 'v2.3-water-temperature-learning',
    source: 'Vislogboek v2.2 Prognose-Engine',
    createdAt: new Date().toISOString(),
  };

  await db.prognosisSnapshots.put(snapshot);
  return snapshot;
}

/**
 * Genereert en bewaart automatisch een onveranderlijke voorspellingsmomentopname
 * bij de start van een live actieve vissessie.
 * Sluit historische of achteraf ingevoerde sessies strikt uit (geen achteraf invullen).
 */
export async function createLiveSnapshotForSessionStart(
  location: FishingLocation,
  species: FishSpecies | 'Algemeen',
  durationHours = 3,
  technique?: string,
  weatherSnap?: WeatherSnapshot
): Promise<PrognosisSnapshot | null> {
  try {
    const lat = location.latitude ?? 51.961;
    const lon = location.longitude ?? 5.228;
    const weather = await getForecast(lat, lon, false);
    const allSessions = await db.sessions.toArray();
    const allCatches = await db.catches.toArray();
    const allSnapshots = await db.prognosisSnapshots.toArray();
    const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
    const waterTemperatureCalibration = getWaterTemperatureCalibration(allSnapshots, location.id, todayStr);

    const prog = calculateDayPrognosis(
      todayStr,
      weather.hourly,
      species,
      allSessions,
      weather.fetchedAt,
      null,
      new Date(),
      {
        sessionDurationHours: durationHours,
        locationId: location.id,
        location,
        catches: allCatches,
        waterTemperatureCalibration,
      }
    );

    const chosenSlot =
      prog.bestTimeSlot !== 'Geen toekomstig tijdvak meer vandaag'
        ? (prog.bestTimeSlot as TimeSlot)
        : undefined;

    return await savePrognosisSnapshot(
      prog,
      durationHours,
      location.id,
      location.name,
      technique,
      chosenSlot,
      weatherSnap
    );
  } catch (err) {
    console.error('Fout bij automatisch genereren van live sessie-snapshot:', err);
    return null;
  }
}