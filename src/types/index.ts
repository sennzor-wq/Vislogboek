/**
 * Vislogboek Data Types & Schema
 * Versie 2.2 — Nederlandstalig, Offline-first, Europe/Amsterdam
 * Bevat empirische validatie, fysiologische referenties, voorspellingsmomentopnames en visaanwezigheid
 */

export type FishSpecies =
  | 'Karper'
  | 'Brasem'
  | 'Snoek'
  | 'Baars'
  | 'Voorn'
  | 'Zeelt'
  | 'Snoekbaars'
  | 'Meerval'
  | 'Roofblei'
  | 'Overig';

export const ALL_SPECIES: FishSpecies[] = [
  'Karper',
  'Brasem',
  'Snoek',
  'Baars',
  'Voorn',
  'Zeelt',
  'Snoekbaars',
  'Meerval',
  'Roofblei',
  'Overig',
];

export type SessionOutcome =
  | 'active'            // Actieve vissessie
  | 'catch'             // Vangst(en) geregistreerd
  | 'skunk_confirmed'   // Bevestigde nulvangst
  | 'unknown';          // Onbekend / niet bevestigd

export type CompassDirection =
  | 'Noord'
  | 'Noordoost'
  | 'Oost'
  | 'Zuidoost'
  | 'Zuid'
  | 'Zuidwest'
  | 'West'
  | 'Noordwest';

export const COMPASS_DIRECTIONS: CompassDirection[] = [
  'Noord',
  'Noordoost',
  'Oost',
  'Zuidoost',
  'Zuid',
  'Zuidwest',
  'West',
  'Noordwest',
];

export type TimeSlot = 'Nacht' | 'Ochtend' | 'Middag' | 'Avond';

export type PresenceObservationType =
  | 'vis_springen_rollen'          // Vis zien springen of rollen
  | 'aasbellen_voedselactiviteit'   // Bellenplakkaten / zichtbare voedselactiviteit
  | 'aanbeten'                     // Aanbeten / lijnzwemmers
  | 'recente_vangst_stek'          // Recente vangst op de stek in afgelopen 24-48u
  | 'geen_waarnemingen'            // Geen activiteit waargenomen (geen bewijs van afwezigheid)
  | 'onbekend';                    // Niet geobserveerd

export interface PresenceObservation {
  id: string;
  locationId: string;
  sessionId?: string;
  observationType: PresenceObservationType;
  timestamp: string;               // ISO
  notes?: string;
  createdAt: string;
}

export interface WeatherSnapshot {
  temperature: number;            // °C luchttemperatuur
  waterTemperature?: number | null;// °C watertemperatuur (alleen indien echt bekend, nooit verzonnen)
  pressure: number;               // hPa
  pressureTrend?: 'stijgend' | 'dalend' | 'stabiel';
  windSpeed: number;              // km/u
  windDirection: number;          // Graden 0-360
  windDirectionText?: string;     // bijv. 'ZW', 'NO'
  cloudCover: number;             // %
  precipitation: number;          // mm
  precipitationProbability?: number; // %
  weatherCode?: number;
  source: 'open-meteo' | 'open-meteo-historisch' | 'knmi-regionaal' | 'handmatig' | 'gecached' | 'onbekend';
  capturedAt: string;             // ISO
}

export interface FishingLocation {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  waterDepth?: number;            // meters
  waterType?: 'Kanaal' | 'Rivier' | 'Polder' | 'Plas/Zandafgraving' | 'Stadswater' | 'Haven' | 'Overig';
  notes?: string;
  isBenchmark?: boolean;          // Beschermde benchmarkstek
  createdAt: string;
  updatedAt: string;
}

export interface CatchItem {
  id: string;
  sessionId: string;
  locationId?: string;
  species: FishSpecies;
  count: number;                  // 1 voor individueel, of >1 voor groep
  weightKg?: number | null;       // null indien onbekend (GEEN 0!)
  isGroupWeight?: boolean;        // true als weightKg totaalgewicht is van de groep
  lengthCm?: number | null;       // optioneel
  timestamp: string;              // ISO
  rod?: string;
  bait?: string;
  technique?: string;
  notes?: string;
  photoUrl?: string;              // Base64 data URL
  createdAt: string;
}

export interface FishingSession {
  id: string;
  locationId?: string;
  locationName?: string;
  startTime: string;              // ISO
  endTime?: string | null;        // ISO (indien gestopt)
  durationMinutes?: number;       // Berekend, correct over middernacht
  outcome: SessionOutcome;
  targetSpecies?: FishSpecies[];
  rodCount?: number;
  rodTypes?: string;
  technique?: string;
  baitAndFeed?: string;
  bitesCount?: number;            // aanbeten
  missedCount?: number;           // gemiste vissen
  waterDepth?: number;
  waterTemperature?: number | null; // Gemeten watertemperatuur in °C (optioneel, nooit 0 indien onbekend)
  baitDirection?: CompassDirection | null; // Richting van aasaanbieding (optioneel, nooit verplicht)
  notes?: string;
  weatherSnapshot?: WeatherSnapshot;
  photoUrls?: string[];
  presenceObservations?: PresenceObservationType[];
  snapshotId?: string;            // Gekoppelde voorspellingsmomentopname
  isBenchmark?: boolean;          // Beschermde benchmark!
  createdAt: string;
  updatedAt: string;
}

export interface FactorBreakdown {
  score: number;       // Relatieve invloed op de activiteitsindex
  impact: 'positief' | 'neutraal' | 'negatief';
  title: string;
  detail: string;
}

export interface TimeSlotAnalysis {
  slot: TimeSlot;
  timeRange: string;              // bijv. "06:00 – 12:00"
  activityScore: number;          // 1.0 – 10.0 (Biologische activiteitsindex)
  isPast?: boolean;               // Is dit tijdvak reeds volledig verstreken?
  remainingHours?: number;        // Aantal resterende uren in dit tijdvak
  temperatureFactor: FactorBreakdown;
  pressureFactor: FactorBreakdown;
  windFactor: FactorBreakdown;
  seasonFactor: FactorBreakdown;
  timeOfDayFactor: FactorBreakdown;
  precipitationFactor: FactorBreakdown;
  personalExperience: {
    relevantSessions: number;
    confirmedCatches: number;
    skunks: number;
    catchRatePercent: number | null;
    note: string;
  };
  positiveFactors: string[];
  neutralFactors: string[];
  negativeFactors: string[];
  conclusion: string;
}

export interface HistoricalCatchRateInfo {
  successfulSessions: number;     // Aantal geldige sessies met ten minste 1 vangst van doelsoort
  totalSessions: number;          // Totaal aantal voltooide geldige sessies (vangst + confirmed skunk)
  percentage: number | null;      // percentage succesvolle sessies, null indien 0 sessies
  label: string;                  // bijv. "8 van 11 geldige sessies (73%)"
}

export interface DayPrognosis {
  date: string;                   // YYYY-MM-DD
  dayName: string;                // "Vandaag", "Morgen", "Woensdag 28 okt"
  species: FishSpecies | 'Algemeen';
  activityScore: number;          // 1.0 - 10.0 (Biologische activiteitsindex - relatieve indicatie)
  advice: 'Gunstig' | 'Gemiddeld' | 'Ongunstig';
  bestTimeSlot: TimeSlot | 'Geen toekomstig tijdvak meer vandaag';
  alternativeTimeSlots: TimeSlot[];
  summaryRationale: string;
  personalCatchChance: number | null; // % kans op >= 1 vangst van doelsoort tijdens sessie
  personalCatchConfidence: 'Onvoldoende gegevens' | 'Zeer laag' | 'Laag' | 'Matig' | 'Redelijk' | 'Gemiddeld' | 'Hoog';
  catchUncertaintyInterval?: [number, number] | null; // 95% Wilson-interval bijv. [38, 96]%
  relevantSessionCount: number;
  averageRelevantSessionDurationMin?: number;
  plannedDurationHours?: number;       // Ingestelde geplande sessieduur in uren
  expectedCatches?: number | null;     // Verwacht aantal vangsten (E[N] = lambda * t) bij voldoende data
  hourlyCatchRate?: number | null;     // Geschat vangsttempo per uur (lambda) bij voldoende data
  baseRate?: number | null;           // Algemene historische basisfrequentie van doelsoort
  historicalCatchRate?: HistoricalCatchRateInfo; // Historisch vangstpercentage van gefilterde scope
  provenance: 'Algemene biologische regels' | 'Eigen waarnemingen' | 'Gecombineerd (model + eigen data)' | 'Algemene aannames';
  weatherUpdatedAt?: string;
  timeSlots: Record<TimeSlot, TimeSlotAnalysis>;
  uncertaintyNotes?: string[];
  waterTemperatureInfo?: { measured: boolean; temp: number | null; note: string };
  pressureTrendInfo?: { known: boolean; deltaHpa: number | null; note: string };
  presenceInfo?: { observation: PresenceObservationType; note: string };
  thermalAnalysis?: WaterThermalAnalysis;
  positioningAdvice?: RodPositioningAdvice;
}

export interface RodPositioningAdvice {
  recommendedZone: string;          // bijv. "Aanlandige oeverzone (windkant)", "Luwe oeverzone (beschut)", "Diepere rustzone / overgangszone"
  rationale: string;               // Fysische / biologische toelichting gebaseerd op wind, temperatuur, diepte en seizoen
  alternativeOption: string;       // Alternatief tactisch plan (bijv. luwte, dieper gat)
  confidenceLevel: 'Laag' | 'Matig' | 'Redelijk'; // Betrouwbaarheid van het advies (rekening houdend met ontbrekende oevergeometrie)
  windContext: {
    directionText: string;
    speedKmH: number;
    gustsKmH?: number;
    isStrongWind: boolean;
    isColdWind: boolean;
    windTrend?: 'Aantrekkend' | 'Afnemend' | 'Draaiend' | 'Stabiel';
    intraSessionNote?: string;
  };
  thermalContext: {
    trend: ThermalTrend;
    season: 'Voorjaar' | 'Zomer' | 'Herfst' | 'Winter';
    waterTempNote: string;
  };
  missingInformation: string[];    // Expliciet wat ontbreekt (oeveroriëntatie, diepteverloop, bodemstructuur)
  personalEvidence?: {
    hasSufficientData: boolean;    // >= 11 voltooide sessies op dezelfde stek én >= 6 met baitDirection
    totalCompletedSessionsOnSpot: number;
    sessionsWithDirection: number;
    summaryNote: string;           // Voorzichtige kwalitatieve nuance, nooit doorslaggevend
    favoriteDirection?: CompassDirection | null;
  };
  windCastingGuidance?: WindCastingGuidance;
}

export interface WindCastingGuidance {
  windOrigin: {
    shortText: string;             // bijv. "NO"
    short?: string;                // alias voor compatibiliteit
    fullName: CompassDirection;    // bijv. "Noordoost"
    degrees: number;               // bijv. 45
    label: string;                 // bijv. "Wind komt UIT het Noordoosten (NO, ~45°)"
  };
  windDestination: {
    shortText: string;             // bijv. "ZW"
    short?: string;                // alias voor compatibiliteit
    fullName: CompassDirection;    // bijv. "Zuidwest"
    degrees: number;               // bijv. 225
    label: string;                 // bijv. "Wind waait RICHTING het Zuidwesten (ZW, ~225°)"
  };
  googleMapsVisual: {
    compassRule: string;           // "Noord is boven, Oost is rechts, Zuid is onder, West is links"
    mapFlowDescription: string;    // "Kijk je op Google Maps naar de stek (Noord = boven): de wind waait van rechtsboven (NO) diagonaal over de stek naar linksonder (ZW)."
    coordinatesText?: string;      // "51.9610° NB, 5.2280° OL"
    spotGpsText?: string;          // Formatted label voor weergave
  };
  banksContext: {
    potentialWindwardBank: string; // "Zuidwestelijke oeverzone(s) van de waterpartij (aanlandige oever waar de wind tegenaan botst)"
    potentialLeewardBank: string;  // "Noordoostelijke oeverzone(s) van de waterpartij (luwe oever, beschut onder de wind)"
    isWindwardFavorable: boolean;  // afhankelijk van seizoen, watertemperatuur, koude wind
    windwardAssessment: string;    // Waarom windkant wél of juist NIET gunstig is
  };
  castingAdvice: {
    isCastingDirectionDefinite: boolean; // false als oeverlijn onbekend is (geen schijnzekerheid)
    recommendedDirection: CompassDirection | null; // alleen concreet als data het ondersteunt
    summary: string;               // Concreet advies of duidelijke verklaring van afhankelijkheid
    reason: string;                // Reden van het advies
    scenarioGuidance: {
      standingLeewardBank: string; // Als je met je rug in de wind staat (luwte)
      standingWindwardBank: string;// Als je op de windkant staat (branding)
    };
  };
  onSiteChecklist: string[];       // Wat ter plaatse te controleren (bomenrijen, werkelijke kabbel, bodem)
}

export type ThermalTrend =
  | 'Waarschijnlijke opwarming'
  | 'Ongeveer stabiel'
  | 'Waarschijnlijke afkoeling'
  | 'Onvoldoende gegevens';

export interface WaterThermalAnalysis {
  trend: ThermalTrend;
  trendConfidence: 'Onvoldoende gegevens' | 'Laag' | 'Matig' | 'Redelijk' | 'Hoog';
  hasMeasuredWaterTemp: boolean;
  measuredWaterTemp: number | null;      // Daadwerkelijk gemeten en ingevoerd (NOOIT gefingeerd)
  estimatedWaterTemp: number | null;     // Expliciet als modelschatting aangeduid
  estimatedRange?: [number, number] | null; // bijv. [11.0, 13.5] °C
  surfaceVsBulkNote: string;            // Onderscheid tussen oppervlaktelaag en bulk watermassa
  inertiaFactor: 'Laag (snel reagerend)' | 'Gemiddeld' | 'Hoog (trage watermassa)';
  summaryRationale: string;
  dataPointsAvailable: {
    past24hAvailable: boolean;
    past72hAvailable: boolean;
    solarRadiationIndication: 'Sterk (zonnig)' | 'Matig (half bewolkt)' | 'Gering (zwaarbewolkt/mist)';
    windMixingInfluence: 'Sterke menging' | 'Matige menging' | 'Rustig';
    depthKnown: boolean;
    waterDepthMeters?: number;
  };
  prognosisImpactNote: string;          // Nuchtere, niet-overdreven invloed op de visprognose
}

export interface PrognosisSnapshot {
  id: string;
  forecastTimestamp: string;       // ISO van voorspellingstijdstip
  targetDate: string;              // YYYY-MM-DD
  targetSlot?: TimeSlot;
  targetSpecies: FishSpecies | 'Algemeen';
  locationId?: string;
  locationName?: string;
  durationHours: number;
  technique?: string;
  predictedActivityScore: number;  // 1.0 - 10.0
  predictedCatchChance: number | null; // %
  predictedUncertaintyInterval?: [number, number] | null;
  predictedConfidence?: string;
  predictedConditions?: WeatherSnapshot;
  source: string;
  modelVersion: string;            // bijv. 'v2.2'
  linkedSessionId?: string;
  actualOutcome?: SessionOutcome;
  actualTargetCatchesCount?: number;
  evaluationNotes?: string;
  createdAt: string;
}

export interface WeatherHourlyForecast {
  time: string;                   // ISO
  temperature: number;            // °C luchttemperatuur
  pressure: number;               // hPa
  windSpeed: number;              // km/u
  windDirection: number;          // deg
  windDirectionText: string;
  precipitation: number;          // mm
  precipitationProbability: number; // %
  cloudCover: number;             // %
  weatherCode: number;
}

export interface WeatherCacheEntry {
  id: string;                     // `lat_lon`
  latitude: number;
  longitude: number;
  fetchedAt: string;
  hourly: WeatherHourlyForecast[];
  dailySummary?: {
    date: string;
    tempMax: number;
    tempMin: number;
    sunrise: string;
    sunset: string;
  }[];
}

export interface AppSettings {
  id: string;
  defaultLocationName: string;
  defaultLatitude: number;
  defaultLongitude: number;
  defaultSpecies: FishSpecies | 'Algemeen';
  defaultDurationHours: number;
  theme: 'dark' | 'system';
  lastBackupDate?: string;
}
