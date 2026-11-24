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
  | 'aanbeten'                     // Verouderde legacywaarde; nieuwe aanbeten horen in bitesCount
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
  relativeHumidity?: number;       // % relatieve luchtvochtigheid, indien beschikbaar
  dewPoint?: number;               // °C dauwpunt, indien beschikbaar
  shortwaveRadiation?: number;     // W/m² inkomende kortgolvige straling, indien beschikbaar
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

export interface WaterTemperatureWeatherContext {
  source: 'open-meteo' | 'gecached';
  weatherTimestamp: string;
  retrievedAt: string;
  offsetMinutes: number;
  airTemperatureC: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  cloudCoverPercent: number;
  pressureHpa: number;
  precipitationMm: number;
  relativeHumidityPercent?: number;
  dewPointC?: number;
  shortwaveRadiationWm2?: number;
}

export interface WaterTemperatureMeasurement {
  id: string;
  locationId?: string;
  temperatureC: number;
  measuredAt: string | null;
  recordedAt: string;
  measurementSource: 'manual' | 'imported' | 'unknown';
  measurementMethod: 'thermometer' | 'probe' | 'other' | 'unknown';
  measurementDepthM?: number;
  weatherContext?: WaterTemperatureWeatherContext | null;
  weatherContextStatus?: 'matched' | 'unavailable';
}

export interface FishingLocation {
  waterFacingDirection?: CompassDirection;
  habitatFeatures?: string[];
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  waterDepth?: number;            // meters
  waterType?: 'Kanaal' | 'Rivier' | 'Polder' | 'Plas/Zandafgraving' | 'Stadswater' | 'Haven' | 'Overig' | 'Onbekend';
  notes?: string;
  isBenchmark?: boolean;          // Beschermde benchmarkstek
  createdAt: string;
  updatedAt: string;
}

export type TimestampEntryMode = 'automatic' | 'user_adjusted';

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
  /** Herkomst van het tijdstip; ontbrekend bij oudere/onbekende records. Geen onafhankelijke verificatie. */
  timestampEntryMode?: TimestampEntryMode;
  rod?: string;
  bait?: string;
  technique?: string;
  notes?: string;
  photoUrl?: string;              // Base64 data URL
  /** Kwaliteitsvlaggen voor legacy-import; false betekent dat de waarde niet uit de bron bekend was. */
  legacyImportQuality?: {
    speciesKnown: boolean;
    countKnown: boolean;
    timestampKnown: boolean;
  };
  createdAt: string;
}

export interface FishingSession {
  prebaited?: boolean;
  prebaitDays?: number;
  prebaitAmountGrams?: number;
  prebaitFeedType?: string;
  id: string;
  locationId?: string;
  locationName?: string;
  startTime: string;              // ISO
  endTime?: string | null;        // ISO (indien gestopt)
  durationMinutes?: number;       // Berekend, correct over middernacht
  plannedDurationHours?: number | null; // Vooraf opgegeven duur; wordt niet als werkelijke inspanning gebruikt
  plannedEndTime?: string | null;       // Optionele geplande eindtijd, los van de werkelijke eindtijd
  outcome: SessionOutcome;
  targetSpecies?: FishSpecies[];
  rodCount?: number;
  /** Optioneel aantal deelnemers; rodCount blijft het totale aantal hengels van de sessie. */
  participantCount?: number;
  rodTypes?: string;
  technique?: string;
  baitAndFeed?: string;
  bitesCount?: number;            // aanbeten
  missedCount?: number;           // gemiste vissen
  waterDepth?: number;
  waterTemperature?: number | null; // Gemeten watertemperatuur in °C (optioneel, nooit 0 indien onbekend)
  waterTemperatureMeasuredAt?: string; // Exact meetmoment; ontbrekend betekent niet bruikbaar voor temperatuurvalidatie
  waterTemperatureMeasurementSource?: 'manual' | 'imported' | 'unknown';
  waterTemperatureMeasurementMethod?: 'thermometer' | 'probe' | 'other' | 'unknown';
  waterTemperatureMeasurementDepthM?: number;
  /** Separate physical observations; legacy scalar fields above remain a latest-measurement summary. */
  waterTemperatureMeasurements?: WaterTemperatureMeasurement[];
  baitDirection?: CompassDirection | null; // Richting van aasaanbieding (optioneel, nooit verplicht)
  notes?: string;
  weatherSnapshot?: WeatherSnapshot;
  photoUrls?: string[];
  presenceObservations?: PresenceObservationType[];
  snapshotId?: string;            // Gekoppelde voorspellingsmomentopname
  isBenchmark?: boolean;          // Beschermde benchmark!
  createdAt: string;
  updatedAt: string;
  /** Kwaliteitsvlaggen voor legacy-import; false betekent dat de waarde niet uit de bron bekend was. */
  legacyImportQuality?: {
    startDateKnown: boolean;
    startTimeKnown: boolean;
    endTimeKnown: boolean;
    durationKnown: boolean;
    targetSpeciesKnown: boolean;
    weatherSnapshotKnown: boolean;
  };
}

/** Een werkelijk actief tijdvak van één hengel. Een lege eindtijd betekent dat de interval nog loopt. */
export interface RodActiveInterval {
  id: string;
  startTime: string;
  endTime?: string | null;
}

/** Gebeurtenis die aan één hengel binnen een sessie is gekoppeld. */
export interface SessionRodEvent {
  id: string;
  timestamp: string;
  /** Automatisch bij toevoegen, of door gebruiker aangepast; ontbrekend bij oudere records. */
  timestampEntryMode?: TimestampEntryMode;
  type: 'bite' | 'missed' | 'catch' | 'other';
  notes?: string;
}

/** Optionele details van één hengel; de sessie blijft de primaire observatie-eenheid. */
export interface SessionRod {
  id: string;
  sessionId: string;
  rodNumber: number;
  positionZone?: string;
  technique?: string;
  baitPresentation?: string;
  activeIntervals: RodActiveInterval[];
  events?: SessionRodEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface RodEffortSummary {
  /** Er bestaan hengel-detailrecords; dit zegt niets over vastgelegde inzet. */
  hasDetailData: boolean;
  /** Er is ten minste één intervalrecord, ook als dit onvolledig of ongeldig is. */
  hasRecordedIntervals: boolean;
  recordedIntervalCount: number;
  rodsWithoutIntervalsCount: number;
  /** Intervallen die geheel of gedeeltelijk buiten de sessiegrenzen vallen. */
  outOfSessionIntervalCount: number;
  /** Alleen uit volledige, parseerbare en positieve intervallen berekende uren. */
  totalRodHours: number;
  activeRodCount: number;
  incompleteIntervalCount: number;
  perRodHours: Record<string, number>;
}

/** Beschrijvende hengelblootstelling per lokaal tijdvak; geen vangstkans of modelinput. */
export interface TimeSlotExposureSlice {
  rodHours: number;
  activeRodCount: number;
  intervalCount: number;
}

export interface TimeSlotExposureSummary {
  slots: Record<TimeSlot, TimeSlotExposureSlice>;
  hasRecordedIntervals: boolean;
  recordedIntervalCount: number;
  rodsWithoutIntervalsCount: number;
  incompleteIntervalCount: number;
  outOfSessionIntervalCount: number;
  totalRodHours: number;
}


/** Separately reported literature evidence for a feeding response; not a catch probability. */
export type FeedingEvidenceLevel = 'direct_candidate' | 'proxy_only' | 'context_only' | 'none';

export interface FeedingResponseEvidenceSummary {
  evidenceLevel: FeedingEvidenceLevel;
  sourceCount: number;
  sourceIds: string[];
  predictionEligible: boolean;
  note: string;
}

export interface FeedingActivityAssessment {
  /** Dagbrede voorlopige voedings-/foerageerrespons (1–10); geen vangstkans. */
  score: number | null;
  status: 'provisional' | 'insufficient_evidence' | 'not_applicable';
  driverCoveragePercent: number;
  coverageLevel: 'Laag' | 'Matig' | 'Redelijk' | 'Hoog';
  missingDrivers: string[];
  evidenceLevel: FeedingEvidenceLevel;
  responses: {
    intensity: FeedingResponseEvidenceSummary;
    incidence: FeedingResponseEvidenceSummary;
    rhythm: FeedingResponseEvidenceSummary;
    foraging: FeedingResponseEvidenceSummary;
    diet: FeedingResponseEvidenceSummary;
    preySelection: FeedingResponseEvidenceSummary;
  };
  explanation: string;
}

export interface FactorBreakdown {
  score: number;       // Relatieve invloed op de activiteitsindex
  impact: 'positief' | 'neutraal' | 'negatief';
  title: string;
  detail: string;
  dataAvailable?: boolean; // false = onbekend, niet hetzelfde als neutraal
}

export interface WeatherDataQuality {
  status: 'Volledig' | 'Gedeeltelijk' | 'Onvoldoende';
  validHours: number;
  expectedHours: number;
  coveragePercent: number;
  missingFields: string[];
}

export interface TimeSlotAnalysis {
  slot: TimeSlot;
  timeRange: string;              // bijv. "06:00 – 12:00"
  activityScore: number;          // 1.0–10.0 geïntegreerde fysiologische + voedings-/foerageerprognose-index
  activityScoreAvailable?: boolean;
  physiologicalResponseScore: number | null;
  feedingResponseScore: number | null;
  scoreConfidencePercent: number;
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
  /** Separate evidence/status output; never folded into physiological activity or catch chance. */
  feedingActivity?: FeedingActivityAssessment;
  dataQualityReport?: import('../services/dataQualityEngine').DataQualityReport;
  date: string;                   // YYYY-MM-DD
  dayName: string;                // "Vandaag", "Morgen", "Woensdag 28 okt"
  species: FishSpecies | 'Algemeen';
  activityScore: number;          // 1.0–10.0 geïntegreerde prognose-index (geen vangstkans)
  activityScoreAvailable?: boolean;
  physiologicalResponseScore?: number | null;
  integratedScoreConfidencePercent?: number;
  weatherDataQuality?: WeatherDataQuality;
  advice: 'Gunstig' | 'Gemiddeld' | 'Ongunstig';
  bestTimeSlot: TimeSlot | 'Geen toekomstig tijdvak meer vandaag' | 'Geen betekenisvol onderscheid';
  alternativeTimeSlots: TimeSlot[];
  summaryRationale: string;
  personalCatchChance: number | null; // % kans op >= 1 vangst van doelsoort tijdens sessie
  personalCatchConfidence: 'Onvoldoende gegevens' | 'Zeer laag' | 'Laag' | 'Matig' | 'Redelijk' | 'Gemiddeld' | 'Hoog';
  catchUncertaintyInterval?: [number, number] | null; // 95% Wilson-interval bijv. [38, 96]%
  relevantSessionCount: number;
  poissonSessionCount?: number; // Sessies met bekende duur en bruikbare vangstaantallen voor de Poisson-rate
  averageRelevantSessionDurationMin?: number;
  plannedDurationHours?: number | null; // null wanneer de gebruiker geen eindtijd/duur heeft opgegeven
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
  bankWindAnalysis?: BankWindAnalysis;
  habitatAnalysis?: HabitatMovementAnalysis;
  prebaitPlan?: PrebaitProgramPlan;
}

export interface RodPositioningAdvice {
  recommendedZone: string;          // bijv. "Aanlandige oeverzone (windkant)", "Luwe oeverzone (beschut)", "Diepere rustzone / overgangszone"
  rationale: string;               // Fysische / biologische toelichting gebaseerd op wind, temperatuur, diepte en seizoen
  alternativeOption: string;       // Alternatief tactisch plan (bijv. luwte, dieper gat)
  confidenceLevel: 'Laag' | 'Matig' | 'Redelijk'; // Betrouwbaarheid van het advies (rekening houdend met ontbrekende oevergeometrie)
  windContext: {
    directionText: string;
    speedKmH: number | null;
    gustsKmH?: number;
    isStrongWind: boolean;
    /** Expliciete windclassificatie; optioneel voor oudere opgeslagen prognoses. */
    isCalmWind?: boolean;
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
    solarRadiationIndication: 'Sterk (zonnig)' | 'Matig (half bewolkt)' | 'Gering (zwaarbewolkt/mist)' | 'Onvoldoende gegevens';
    solarRadiationAvailable?: boolean;
    humidityAvailable?: boolean;
    dewPointAvailable?: boolean;
    evaporationPotential?: 'hoog' | 'matig' | 'laag' | 'onbekend';
    historicalTemperatureSamples?: number;
    windMixingInfluence: 'Sterke menging' | 'Matige menging' | 'Rustig' | 'Onvoldoende gegevens';
    depthKnown: boolean;
    waterDepthMeters?: number;
  };
  prognosisImpactNote: string;          // Nuchtere, niet-overdreven invloed op de visprognose
  calibration?: {
    appliedCorrectionC: number;
    sampleCount: number;
    season: 'winter' | 'lente' | 'zomer' | 'herfst';
  };
  /** Herkomst van de watertemperatuur; een schatting wordt nooit als meting gepresenteerd. */
  waterTemperatureStatus?: 'measured' | 'estimated_from_measurement' | 'estimated_from_history' | 'estimated_from_weather' | 'unknown';
  /** Exact instant for which this thermal state was calculated; null for a day-wide legacy call. */
  targetTimestamp?: string | null;
  forecastAsOf?: string | null;
  anchorMeasurementTimestamp?: string | null;
  anchorAgeHours?: number | null;
  weatherCoverageRatio?: number;
  uncertaintyC?: number | null;
  historicalWaterTemperatureBaselineC?: number | null;
  historicalWaterTemperatureSamples?: number;
  historicalWaterTemperatureMeasurementDepthM?: number | null;
  historicalWaterTemperatureSource?: 'same_location' | 'nearby_same_type' | null;
}

export type PrognosisRunKind = 'plan' | 'session_start' | 'session_update' | 'manual';

export type CoachAdviceTrigger =
  | 'session_start'
  | 'weather_update'
  | 'catch_recorded'
  | 'observation_recorded'
  | 'session_changed'
  | 'manual_reanalysis'
  | 'app_resume';

export type CoachAdviceResponse = 'pending' | 'accepted' | 'adapted' | 'ignored';

export interface PlannedFishingSession {
  id: string;
  locationId: string;
  targetSpecies: FishSpecies | 'Algemeen';
  plannedStartTime: string;
  plannedEndTime?: string | null;
  status: 'planned' | 'started' | 'cancelled' | 'overdue';
  planSnapshotId?: string;
  startedSessionId?: string;
  startedSessionDeletedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** De vertaling van een prognose naar het concrete advies dat de gebruiker heeft gezien. */
export interface CoachAdviceRecord {
  id: string;
  sessionId: string;
  prognosisSnapshotId: string;
  previousAdviceId?: string;
  createdAt: string;
  trigger: CoachAdviceTrigger;
  summary: string;
  /** Praktisch advies: wanneer en waar vissen, rekening houdend met omstandigheden en soort. */
  advice?: string;
  /** Tactiek: hoe de hengel, aas, voer en positionering uit te voeren. */
  tactics?: string;
  /** Samengestelde compatibiliteitstekst voor oudere opgeslagen records en clients. */
  recommendation: string;
  rationale: string;
  changedFactors: string[];
  confidence?: string;
  response?: CoachAdviceResponse;
  responseAt?: string;
  executedTactic?: string;
  executedAt?: string;
  coachVersion: string;
  engineVersions?: Record<string, string>;
}

export interface ManualWaterTemperatureInput {
  temperatureC: number;
  /** Moment waarop de waarde in deze prognoserun is vastgelegd; niet het fysieke meetmoment. */
  recordedAt: string;
  /** null betekent dat de gebruiker geen exact meetmoment heeft opgegeven. */
  measurementTimestamp: string | null;
  measurementSource: 'manual';
  measurementMethod: 'thermometer' | 'probe' | 'other' | 'unknown' | null;
  measurementDepthM: number | null;
  weatherContext?: WaterTemperatureWeatherContext;
}

export interface PrognosisInputContext {
  calculatedAt: string;
  /** Afzonderlijke registratie van de handmatige actuele invoer; null wanneer niet opgegeven. */
  manualWaterTemperatureInput?: ManualWaterTemperatureInput | null;
  timezone: string;
  targetDate: string;
  /** Canonieke absolute ISO-grenzen van een geplande sessie; optioneel voor legacy snapshots. */
  targetWindowStart?: string;
  targetWindowEnd?: string | null;
  /** Expliciet tijdvak van de gekozen sessiestart voor reproduceerbare coach-tactiek. */
  targetTimeSlot?: TimeSlot | null;
  targetSpecies: FishSpecies | 'Algemeen';
  sessionDurationHours: number | null;
  technique?: string | null;
  location: {
    id: string;
    latitude?: number;
    longitude?: number;
    waterType?: string;
    waterDepth?: number;
    waterFacingDirection?: CompassDirection | null;
    habitatFeatures?: string[];
  };
  historicalSessionIds: string[];
  catchRecordIds: string[];
  observationIds: string[];
  /**
   * Whitelisted, immutable model inputs. Personal notes, photos and free-text
   * fields are deliberately excluded so a snapshot can be replayed without
   * copying unrelated personal content.
   */
  historicalSessionFeatures?: Array<Pick<FishingSession,
    | 'id' | 'locationId' | 'startTime' | 'endTime' | 'durationMinutes'
    | 'outcome' | 'targetSpecies' | 'isBenchmark' | 'legacyImportQuality'
    | 'technique' | 'baitDirection' | 'prebaited' | 'baitAndFeed' | 'waterDepth'
    | 'waterTemperature' | 'waterTemperatureMeasuredAt'
    | 'waterTemperatureMeasurementSource' | 'waterTemperatureMeasurementMethod'
    | 'waterTemperatureMeasurementDepthM'
  >>;
  historicalCatchFeatures?: Array<Pick<CatchItem,
    | 'id' | 'sessionId' | 'locationId' | 'species' | 'count' | 'weightKg'
    | 'lengthCm' | 'timestamp' | 'timestampEntryMode' | 'bait' | 'technique' | 'legacyImportQuality'
  >>;
  historicalObservationFeatures?: Array<Pick<PresenceObservation,
    'id' | 'locationId' | 'sessionId' | 'observationType' | 'timestamp'
  >>;
  historyFeatureSchemaVersion?: 1 | 2;
  /** Exacte lokale biascorrectie die bij deze prognoserun is gebruikt. */
  waterTemperatureCalibration?: {
    appliedCorrectionC: number;
    sampleCount: number;
    season: 'winter' | 'lente' | 'zomer' | 'herfst';
  } | null;
  presenceObservation?: string | null;
  historicalWaterTemperatureSamples: Array<{
    locationId: string;
    temperatureC: number;
    timestamp: string;
    waterType?: string;
    waterDepth?: number;
    latitude?: number;
    longitude?: number;
    isBenchmark?: boolean;
    measurementSource?: 'manual' | 'imported' | 'unknown';
    measurementMethod?: 'thermometer' | 'probe' | 'other' | 'unknown';
    measurementDepthM?: number;
    recordedAt?: string;
    recordId?: string;
    recordType?: 'session' | 'snapshot';
    measurementId?: string;
    weatherContext?: WaterTemperatureWeatherContext;
  }>;
  historyFingerprint?: string;
  historySummary: {
    sessionCount: number;
    catchRecordCount: number;
    observationCount: number;
    historicalWaterTemperatureSampleCount: number;
  };
  weatherFetchedAt?: string;
}

export interface PrognosisSnapshot {
  id: string;
  runKind?: PrognosisRunKind;
  inputFingerprint?: string;
  inputContext?: PrognosisInputContext;
  supersedesSnapshotId?: string;
  /** Volledige uitvoer van de bestaande engine; geen tweede prognoseobject. */
  prognosisData?: DayPrognosis;
  /** Exacte uurlijkse weersinvoer die bij deze run aan de bestaande engine is doorgegeven. */
  weatherInput?: WeatherHourlyForecast[];
  forecastTimestamp: string;       // ISO van voorspellingstijdstip
  targetDate: string;              // YYYY-MM-DD
  targetSlot?: TimeSlot;
  targetSpecies: FishSpecies | 'Algemeen';
  locationId?: string;
  locationName?: string;
  durationHours: number; // 0 betekent expliciet onbekend; nooit als sessieduur interpreteren
  durationKnown?: boolean;
  targetWindowStart?: string;
  targetWindowEnd?: string | null;
  technique?: string;
  predictedActivityScore: number | null;  // null indien ontbrekende gegevens de index onbetrouwbaar maken
  activityScoreAvailable?: boolean;
  weatherDataQuality?: WeatherDataQuality;
  // 1.0 - 10.0
  predictedCatchChance: number | null; // %
  predictedUncertaintyInterval?: [number, number] | null;
  predictedConfidence?: string;
  predictedConditions?: WeatherSnapshot;
  // Onafhankelijke, soortneutrale temperatuurvalidatie. Alleen een vooraf voorspelde schatting telt mee.
  predictedWaterTemperature?: number | null;
  predictedWaterTemperatureRange?: [number, number] | null;
  predictedWaterTemperatureStatus?: 'measured' | 'estimated_from_measurement' | 'estimated_from_history' | 'estimated_from_weather' | 'unknown';
  predictedWaterTemperatureUncertaintyC?: number | null;
  predictedWaterTemperatureAnchorTimestamp?: string | null;
  predictedWaterTemperatureHistoricalBaselineC?: number | null;
  predictedWaterTemperatureHistoricalSamples?: number;
  predictedWaterTemperatureHistoricalSource?: 'same_location' | 'nearby_same_type' | null;
  predictedWaterTemperatureWeatherCoverage?: number;
  actualWaterTemperature?: number | null;
  actualWaterTemperatureTimestamp?: string;
  actualWaterTemperatureMeasurementSource?: 'manual' | 'imported' | 'unknown';
  actualWaterTemperatureMeasurementMethod?: 'thermometer' | 'probe' | 'other' | 'unknown';
  actualWaterTemperatureMeasurementDepthM?: number;
  source: string;
  modelVersion: string;            // bijv. 'v2.2'
  /** Versies van alle bestaande engines die deze prognose hebben beïnvloed. */
  engineVersions?: Record<string, string>;
  linkedSessionId?: string;
  actualOutcome?: SessionOutcome;
  actualTargetCatchesCount?: number;
  evaluationNotes?: string;
  createdAt: string;
}

export interface WeatherHourlyForecast {
  time: string;                   // Absolute ISO timestamp (UTC); legacy Amsterdam wall times are normalized on cache read
  temperature: number;            // °C luchttemperatuur
  relativeHumidity?: number;      // % relatieve luchtvochtigheid (forecast)
  dewPoint?: number;              // °C dauwpunt (forecast)
  shortwaveRadiation?: number;    // W/m² inkomende kortgolvige straling (forecast)
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
  homeLocation?: HomeLocation | null;
}


/** Windrelatie ten opzichte van de oever waar de visser staat. */
export type BankWindRelation =
  | 'Onbekende oeveroriëntatie'
  | 'Recht aanlandig (kopwind op de oever)'
  | 'Schuin aanlandig (schuin op de oever)'
  | 'Zijwind (dwars langs de oever)'
  | 'Schuin aflandig (schuin van achteren)'
  | 'Recht aflandig (rugwind / beschutte luwte)';

export interface BankWindAnalysis {
  isConfigured: boolean;
  waterFacingDirection: CompassDirection | null;
  waterFacingDegrees: number | null;
  windOriginDirection: CompassDirection;
  windOriginDegrees: number;
  windDestinationDirection: CompassDirection;
  windDestinationDegrees: number;
  windSpeedKmH: number;
  relation: BankWindRelation;
  relativeAngleDegrees?: number;
  bankAssessment: {
    isFavorable: boolean;
    statusLabel: string;
    explanation: string;
    waveAction: string;
    driftCurrent: string;
  };
  rodPlacementAdvice: {
    primaryPosition: string;
    rationale: string;
    castingDirectionAdvice: string;
  };
  missingInformation: string[];
  fieldChecklist: string[];
}

export type HabitatType =
  | 'Foerageerzone'
  | 'Holding / rustzone'
  | 'Overgangszone'
  | 'Doorgang / transitie'
  | 'Ondiepe opwarmzone'
  | 'Structuurzone'
  | 'Open water'
  | 'Onbekend';

export interface HabitatZone {
  name: string;
  habitatType: HabitatType | string;
  description: string;
  depthProfileNote: string;
  structureNote: string;
  whyLikely: string;
}

export interface FishMovementHypothesis {
  likelyDirection: string;
  migrationalTrigger: string;
  timeOfDayDynamic: string;
  transitRoute: string;
  windInfluence: string;
  seasonalPattern: string;
}

export interface HabitatMovementAnalysis {
  primaryZone: HabitatZone;
  alternativeZone: HabitatZone;
  movementHypothesis: FishMovementHypothesis;
  environmentalInfluence: {
    temperatureImpact: string;
    windAndWaveImpact: string;
    pressureTrendImpact: string;
    lightAndSolarImpact: string;
  };
  confidenceLevel: 'Laag' | 'Matig' | 'Redelijk';
  dataProvenance: {
    measuredDataPoints: string[];
    userObservations: string[];
    modelInferences: string[];
  };
  missingInformation: string[];
}

export type PrebaitSuitability =
  | 'Zeer zinvol'
  | 'Matig zinvol'
  | 'Beperkt / voorzichtig'
  | 'Niet aanbevolen (instant vissen aanbevolen)';

export interface PrebaitFeedingMoment {
  dayOffset: number;
  date: string;
  dayLabel: string;
  suggestedTime: string;
  feedType: string;
  amountGrams: number;
  amountDisplay: string;
  purpose: string;
}

export interface PrebaitProgramOptions {
  availableDaysBefore?: number;
  preferredFeedType?: string;
  sessionDurationHours?: number;
  userWaterTemp?: number | null;
  technique?: string;
  planningDate?: string;
}

export interface PrebaitProgramPlan {
  suitability: PrebaitSuitability;
  suitabilityScore: number;
  shouldPrebait: boolean;
  recommendedDaysBefore: number;
  totalAmountGrams: number;
  campaignSummary: string;
  biologicalRationale: string;
  temperatureFactorExplanation: string;
  moments: PrebaitFeedingMoment[];
  sessionDayGuidance: {
    feedDuringSession: boolean;
    recommendedAmountGrams: number;
    amountDisplay: string;
    advice: string;
  };
  feedCompositionAdvice: {
    recommendedMix: string;
    digestibilityNote: string;
    particleSizeNote: string;
  };
  confidenceLevel: 'Laag' | 'Matig' | 'Redelijk';
  missingInformation: string[];
  methodFeederGuidance?: string;
  personalEvidence?: {
    hasSufficientData: boolean;
    totalRelevantSessions: number;
    relevantPrebaitedSessionsCount: number;
    catchRateWithPrebait: number | null;
    catchRateWithoutPrebait: number | null;
    summaryNote: string;
  };
}

export interface HomeLocation {
  name: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt?: string;
}

export type ViscoachTargetSpecies = 'Geen voorkeur' | FishSpecies;

export const VISCOACH_SPECIES_OPTIONS: ViscoachTargetSpecies[] = [
  'Geen voorkeur',
  'Karper',
  'Brasem',
  'Zeelt',
  'Voorn',
  'Snoek',
  'Snoekbaars',
  'Baars',
  'Roofblei',
  'Meerval',
  'Overig',
];

export interface ViscoachSessionContext {
  selectedLocationId: string | null;
  selectedLocation: FishingLocation | null;
  homeLocation: HomeLocation | null;
  distanceKm: number | null;
  isWithin5Km: boolean | null;
  targetSpecies: ViscoachTargetSpecies;
  sessionDurationHours: number | null;
  isCustomDuration: boolean;
  isComplete: boolean;
  missingFields: string[];
  createdAt: string;
}
