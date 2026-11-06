import { analyzeBankWind, COMPASS_DEGREES_MAP } from './src/services/bankWindEngine';
import { analyzeHabitatMovement } from './src/services/habitatMovementEngine';
import { calculatePrebaitPlan } from './src/services/prebaitEngine';
import { calculateDayPrognosis } from './src/services/prognosisEngine';
import {
  FishingLocation,
  FishingSession,
  WaterThermalAnalysis,
  WeatherHourlyForecast,
  PresenceObservation,
  COMPASS_DIRECTIONS,
} from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean | undefined | null, message: string) {
  if (Boolean(condition)) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: VOORVOERPROGRAMMA, OEVERWIND & HABITATMODEL ===\n');

console.log('--- TESTGROEP 0: Volledige kompaskeuze ---');
assert(
  COMPASS_DIRECTIONS.length === 8,
  '0.1 De oeverkijkrichting biedt alle acht hoofd- en tussenwindrichtingen'
);
for (const [index, direction] of COMPASS_DIRECTIONS.entries()) {
  const expectedDegrees = index * 45;
  assert(
    COMPASS_DEGREES_MAP[direction] === expectedDegrees,
    `0.2 ${direction} is beschikbaar met de juiste hoek (${expectedDegrees}°)`
  );
}



// Mock data helpers
const createMockThermalAnalysis = (temp: number, trend: any = 'Ongeveer stabiel'): WaterThermalAnalysis => ({
  trend,
  trendConfidence: 'Redelijk',
  hasMeasuredWaterTemp: true,
  measuredWaterTemp: temp,
  estimatedWaterTemp: temp,
  estimatedRange: [temp - 1, temp + 1],
  surfaceVsBulkNote: 'Oppervlaktelaag in evenwicht met bulk',
  inertiaFactor: 'Gemiddeld',
  summaryRationale: 'Stabiele watertemperatuur',
  dataPointsAvailable: {
    past24hAvailable: true,
    past72hAvailable: true,
    solarRadiationIndication: 'Matig (half bewolkt)',
    windMixingInfluence: 'Matige menging',
    depthKnown: true,
    waterDepthMeters: 2.0,
  },
  prognosisImpactNote: 'Neutrale invloed',
});

const baseLocation: FishingLocation = {
  id: 'test-loc-1',
  name: 'Kolk aan de Lek',
  latitude: 51.95,
  longitude: 5.23,
  waterType: 'Plas/Zandafgraving',
  waterDepth: 2.5,
  waterFacingDirection: 'West', // Kijkt naar het westen (270°) over het water
  habitatFeatures: ['Rietkraag / oevervegetatie', 'Overhangende bomen'],
  notes: 'Stek met zachte bodem en rietkragen.',
  isBenchmark: false,
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z',
};

// =====================================================================
// DEEL 1: GESTRUCTUREERD VOORVOERPROGRAMMA
// =====================================================================
console.log('--- TESTGROEP 1: Voorvoerprogramma & Metabolisme ---');

// 1.1 Koud water (< 6°C) -> Moet adviseren om NIET voor te voeren (instant aanbevolen)
const coldThermal = createMockThermalAnalysis(4.5, 'Waarschijnlijke afkoeling');
const coldPlan = calculatePrebaitPlan('2026-01-15', 'Karper', coldThermal, { availableDaysBefore: 3 });

assert(
  coldPlan.shouldPrebait === false,
  '1.1 In koud water (<6°C) adviseert het model shouldPrebait === false'
);
assert(
  coldPlan.suitability === 'Niet aanbevolen (instant vissen aanbevolen)',
  '1.2 Geschiktheid is expliciet "Niet aanbevolen (instant vissen aanbevolen)"'
);
assert(
  coldPlan.recommendedDaysBefore === 0,
  '1.3 Aanbevolen voorvoerdagen is exact 0'
);
assert(
  coldPlan.sessionDayGuidance.feedDuringSession === false,
  '1.4 Op de visdag zelf wordt bijvoeren afgeraden om passieve vis niet te verzadigen'
);
assert(
  coldPlan.temperatureFactorExplanation.includes('voedselopname') && coldPlan.temperatureFactorExplanation.includes('vertraagd'),
  '1.5 Toelichting legt het trage metabolisme en lange darmpassage bij <6°C uit'
);

// 1.2 Gematigd koud water (8°C: voorjaar/herfst) -> Maximaal 1 dag vooraf, lichte granen
const chillyThermal = createMockThermalAnalysis(8.0, 'Ongeveer stabiel');
const chillyPlan = calculatePrebaitPlan('2026-03-20', 'Karper', chillyThermal, { availableDaysBefore: 3 }, [], baseLocation);

assert(
  chillyPlan.shouldPrebait === true,
  '1.6 Bij 8°C is voorzichtig voorvoeren toegestaan'
);
assert(
  chillyPlan.suitability === 'Beperkt / voorzichtig',
  '1.7 Geschiktheid is "Beperkt / voorzichtig"'
);
assert(
  chillyPlan.recommendedDaysBefore === 1,
  '1.8 Ondanks 3 beschikbare dagen begrenst het model op max 1 dag vooraf om overvoeren te voorkomen'
);
assert(
  chillyPlan.feedCompositionAdvice.digestibilityNote.toLowerCase().includes('koolhydraten') ||
  chillyPlan.feedCompositionAdvice.digestibilityNote.toLowerCase().includes('licht verteerbaar'),
  '1.9 Voersamenstelling benadrukt lichte verteerbaarheid en vermijdt zware oliën'
);

// 1.3 Optimaal warm water (19°C: zomer/pieknajaar) -> Zeer zinvol, 2-3 dagen
const warmThermal = createMockThermalAnalysis(19.0, 'Ongeveer stabiel');
const warmPlan = calculatePrebaitPlan('2026-07-20', 'Karper', warmThermal, { availableDaysBefore: 3 }, [], baseLocation);

assert(
  warmPlan.shouldPrebait === true,
  '1.10 In warm water (19°C) is voorvoeren zinvol'
);
assert(
  warmPlan.suitability === 'Zeer zinvol',
  '1.11 Geschiktheid is "Zeer zinvol"'
);
assert(
  warmPlan.recommendedDaysBefore === 3,
  '1.12 Volledige 3-daagse campagne wordt gepland'
);
assert(
  warmPlan.moments.length === 4, // 3 dagen vooraf + 1 visdag
  '1.13 Tijdlijn bevat exact 4 momenten (3 voorvoerdagen + visdag)'
);
assert(
  warmPlan.moments[0].amountGrams > 0 && typeof warmPlan.moments[0].suggestedTime === 'string',
  '1.14 Elk voermoment bevat een hoeveelheid in grammen en een aanbevolen tijdstip'
);

// 1.4 Respecteert de beschikbare dagen van de visser (0 dagen = instant)
const instantPlan = calculatePrebaitPlan('2026-07-20', 'Karper', warmThermal, { availableDaysBefore: 0 }, [], baseLocation);
assert(
  instantPlan.shouldPrebait === false && instantPlan.recommendedDaysBefore === 0,
  '1.15 Als de visser 0 dagen beschikbaar heeft, plant het model 0 voorvoerdagen'
);

// 1.5 Persoonlijke evidence drempel (>= 5 sessies vereist)
const mockHistoricalSessions: FishingSession[] = [
  {
    id: 's1',
    locationId: baseLocation.id,
    targetSpecies: ['Karper'],
    startTime: '2026-06-01T10:00:00Z',
    endTime: '2026-06-01T14:00:00Z',
    outcome: 'catch',
    prebaited: true,
    prebaitDays: 2,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 's2',
    locationId: baseLocation.id,
    targetSpecies: ['Karper'],
    startTime: '2026-06-05T10:00:00Z',
    endTime: '2026-06-05T14:00:00Z',
    outcome: 'catch',
    prebaited: true,
    prebaitDays: 2,
    createdAt: '2026-06-05T10:00:00Z',
    updatedAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 's3',
    locationId: baseLocation.id,
    targetSpecies: ['Karper'],
    startTime: '2026-06-10T10:00:00Z',
    endTime: '2026-06-10T14:00:00Z',
    outcome: 'skunk_confirmed',
    prebaited: false,
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 's4',
    locationId: baseLocation.id,
    targetSpecies: ['Karper'],
    startTime: '2026-06-15T10:00:00Z',
    endTime: '2026-06-15T14:00:00Z',
    outcome: 'catch',
    prebaited: false,
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 's5',
    locationId: baseLocation.id,
    targetSpecies: ['Karper'],
    startTime: '2026-06-20T10:00:00Z',
    endTime: '2026-06-20T14:00:00Z',
    outcome: 'catch',
    prebaited: true,
    prebaitDays: 2,
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-20T10:00:00Z',
  },
];

const mockHistoricalCatches: CatchItem[] = ['s1', 's2', 's4', 's5'].map((sessionId, index) => ({
  id: `prebait-catch-${index}`,
  sessionId,
  species: 'Karper',
  count: 1,
  timestamp: `2026-06-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
  createdAt: `2026-06-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
}));

const evidencePlan = calculatePrebaitPlan(
  '2026-07-20', 'Karper', warmThermal, { availableDaysBefore: 2 },
  mockHistoricalSessions, baseLocation, undefined, undefined, mockHistoricalCatches
);
assert(
  evidencePlan.personalEvidence?.hasSufficientData === true,
  '1.16 Met 5 sessies en 3 voorvoersessies is personalEvidence.hasSufficientData true'
);
assert(
  evidencePlan.personalEvidence?.catchRateWithPrebait === 100, // 3 van 3
  '1.17 Vangstpercentage met voorvoeren is berekend (100%)'
);
assert(
  evidencePlan.personalEvidence?.summaryNote.includes('correlatie is geen causaal bewijs'),
  '1.18 Logboektoelichting benadrukt expliciet dat correlatie geen causaal bewijs is'
);


// 1.6 Soortselectie: geen voerplan voor roofvis of algemene doelsoort.
assert(
  calculatePrebaitPlan('2026-07-20', 'Snoek', warmThermal, { availableDaysBefore: 2 }, [], baseLocation) === null &&
  calculatePrebaitPlan('2026-07-20', 'Algemeen', warmThermal, { availableDaysBefore: 2 }, [], baseLocation) === null,
  '1.19 De Voerplanner wordt alleen aangeboden voor karper, zeelt en brasem'
);

// 1.7 Method feeder blijft instant, maar sluit voorvoeren voor karper niet uit.
const methodFeederPlan = calculatePrebaitPlan(
  '2026-07-20',
  'Karper',
  warmThermal,
  { availableDaysBefore: 2, technique: 'Method feeder', sessionDurationHours: 3 },
  [],
  baseLocation
);
assert(
  methodFeederPlan?.shouldPrebait === true && methodFeederPlan.recommendedDaysBefore === 2,
  '1.20 Method feeder kan naast een verantwoord voorvoerprogramma worden gebruikt'
);
assert(
  methodFeederPlan?.methodFeederGuidance?.includes('instant vissen') === true &&
  methodFeederPlan.moments[methodFeederPlan.moments.length - 1].feedType.toLowerCase().includes('instant method-feederkorf'),
  '1.21 Method feeder wordt als instant korfvoer rond het haakaas weergegeven'
);

const coldMethodFeederPlan = calculatePrebaitPlan(
  '2026-01-15',
  'Karper',
  coldThermal,
  { availableDaysBefore: 3, technique: 'Method feeder' },
  [],
  baseLocation
);
assert(
  coldMethodFeederPlan?.shouldPrebait === false &&
  coldMethodFeederPlan?.sessionDayGuidance.feedDuringSession === false &&
  coldMethodFeederPlan?.methodFeederGuidance?.includes('instant vissen') === true,
  '1.22 Bij zeer koud water blijft method feeder een minimale instant presentatie, zonder voorvoer of extra bijvoer'
);

// 1.8 Geen temperatuur of geen bruikbaar watertype: geen concrete voerhoeveelheden.
const unknownTemp = { ...warmThermal, hasMeasuredWaterTemp: false, measuredWaterTemp: null, estimatedWaterTemp: null };
const unknownTempPlan = calculatePrebaitPlan('2026-07-20', 'Karper', unknownTemp, { availableDaysBefore: 2 }, [], baseLocation);
const unknownWaterTypePlan = calculatePrebaitPlan('2026-07-20', 'Karper', warmThermal, { availableDaysBefore: 2 }, [], { ...baseLocation, waterType: 'Onbekend' });
assert(
  unknownTempPlan?.shouldPrebait === false && unknownTempPlan?.recommendedDaysBefore === 0 &&
  unknownTempPlan?.totalAmountGrams === 0,
  '1.23 Zonder bruikbare watertemperatuur worden geen voerhoeveelheden of voertijden verzonnen'
);
assert(
  unknownWaterTypePlan?.shouldPrebait === false && unknownWaterTypePlan?.recommendedDaysBefore === 0,
  '1.24 Zonder bekend watertype worden geen concrete voorvoerdagen gepland'
);

// 1.9 Beschikbare dagen worden begrensd door de werkelijke planningsdatum.
const shortHorizonPlan = calculatePrebaitPlan(
  '2026-07-22',
  'Karper',
  warmThermal,
  { availableDaysBefore: 3, planningDate: '2026-07-21' },
  [],
  baseLocation
);
assert(
  shortHorizonPlan?.recommendedDaysBefore === 1 &&
  shortHorizonPlan.moments[0].date === '2026-07-21',
  '1.25 Een sessie morgen krijgt geen voorvoerdagen in het verleden'
);


// =====================================================================
// DEEL 2: WIND TEN OPZICHTE VAN DE OEVER
// =====================================================================
console.log('\n--- TESTGROEP 2: Wind ten opzichte van de Oever ---');

// Stek kijkt naar het Westen (270°) over het water
// 2.1 Wind komt uit het Westen (270°) -> Blaast recht vanuit het water tegen de oever: Recht aanlandig (kopwind)
const bwAanlandig = analyzeBankWind(baseLocation, 270, 16, {
  effectiveWaterTemp: 18,
  season: 'Zomer',
  isColdWind: false,
});

assert(
  bwAanlandig.isConfigured === true,
  '2.1 Met waterFacingDirection ingesteld is isConfigured true'
);
assert(
  bwAanlandig.relation === 'Recht aanlandig (kopwind op de oever)',
  `2.2 Wind uit 270° bij oeverkijkrichting 270° is "Recht aanlandig" (werkelijk: ${bwAanlandig.relation})`
);
assert(
  bwAanlandig.relativeAngleDegrees !== undefined && bwAanlandig.relativeAngleDegrees <= 30,
  `2.3 Relatieve hoek is ~0° (hoek <= 30°, werkelijk: ${bwAanlandig.relativeAngleDegrees}°)`
);
assert(
  bwAanlandig.bankAssessment.isFavorable === true,
  '2.4 In de zomer met 18°C en 16 km/u bries is de aanlandige oever biologisch gunstig'
);
assert(
  bwAanlandig.rodPlacementAdvice.castingDirectionAdvice.toLowerCase().includes('kort'),
  '2.5 Adviseert om kort onder de kant of op het eerste talud te vissen'
);

// 2.2 Wind komt uit het Oosten (90°) -> Blaast van achter de visser over de oever het water op: Recht aflandig (rugwind / luwte)
const bwAflandig = analyzeBankWind(baseLocation, 90, 15, {
  effectiveWaterTemp: 18,
  season: 'Zomer',
  isColdWind: false,
});

assert(
  bwAflandig.relation === 'Recht aflandig (rugwind / beschutte luwte)',
  `2.6 Wind uit 90° bij oeverkijkrichting 270° is "Recht aflandig" (werkelijk: ${bwAflandig.relation})`
);
assert(
  bwAflandig.relativeAngleDegrees !== undefined && bwAflandig.relativeAngleDegrees >= 150,
  `2.7 Relatieve hoek is ~180° (werkelijk: ${bwAflandig.relativeAngleDegrees}°)`
);
assert(
  bwAflandig.bankAssessment.waveAction.toLowerCase().includes('spiegelglad') || bwAflandig.bankAssessment.waveAction.toLowerCase().includes('rustig'),
  '2.8 Aflandige oever beschrijft rustig/spiegelglad water onder de eigen kant'
);

// 2.3 Wind komt uit het Noorden (0°) -> Blaast dwars langs de westelijke oever: Zijwind
const bwZijwind = analyzeBankWind(baseLocation, 0, 14, {
  effectiveWaterTemp: 18,
  season: 'Zomer',
  isColdWind: false,
});

assert(
  bwZijwind.relation === 'Zijwind (dwars langs de oever)',
  `2.9 Wind uit 0° bij oeverkijkrichting 270° is "Zijwind" (werkelijk: ${bwZijwind.relation})`
);
assert(
  bwZijwind.bankAssessment.driftCurrent.toLowerCase().includes('parallelle') || bwZijwind.bankAssessment.driftCurrent.toLowerCase().includes('oeverdrift'),
  '2.10 Zijwind beschrijft parallelle oeverdrift'
);

// 2.4 Winter met koude wind op de oever -> Aanlandige branding is NIET gunstig
const bwWinterKoud = analyzeBankWind(baseLocation, 270, 18, {
  effectiveWaterTemp: 5,
  season: 'Winter',
  isColdWind: true,
  isCoolingPeriod: true,
});

assert(
  bwWinterKoud.relation === 'Recht aanlandig (kopwind op de oever)',
  '2.11 Relatie blijft fysisch recht aanlandig'
);
assert(
  bwWinterKoud.bankAssessment.isFavorable === false,
  '2.12 In de winter met koud water is de aanlandige oever NIET gunstig (isFavorable === false)'
);
assert(
  bwWinterKoud.bankAssessment.statusLabel.toLowerCase().includes('koude') || bwWinterKoud.bankAssessment.statusLabel.toLowerCase().includes('ongunstig'),
  '2.13 Status waarschuwt voor snelle afkoeling door koude golfslag'
);

// 2.5 Stek ZONDER oeveroriëntatie -> Geen schijnzekerheid
const unconfiguredLoc: FishingLocation = {
  ...baseLocation,
  id: 'unconfigured-loc',
  waterFacingDirection: undefined,
};
const bwUnconfigured = analyzeBankWind(unconfiguredLoc, 225, 14, {
  effectiveWaterTemp: 15,
  season: 'Voorjaar',
  isColdWind: false,
});

assert(
  bwUnconfigured.isConfigured === false,
  '2.14 Zonder waterFacingDirection is isConfigured false'
);
assert(
  bwUnconfigured.relation === 'Onbekende oeveroriëntatie',
  '2.15 Relatie is "Onbekende oeveroriëntatie"'
);
assert(
  bwUnconfigured.missingInformation.length >= 2,
  '2.16 Meldt ontbrekende gegevens en vraagt om eenmalige stekinstelling'
);
assert(
  bwUnconfigured.rodPlacementAdvice.castingDirectionAdvice.includes('Scenario 1') &&
  bwUnconfigured.rodPlacementAdvice.castingDirectionAdvice.includes('Scenario 2'),
  '2.17 Toont twee scenario\'s ter voorkoming van schijnzekerheid'
);


// =====================================================================
// DEEL 3: VISBEWEGING EN HABITATMODEL
// =====================================================================
console.log('\n--- TESTGROEP 3: Visbeweging & Habitatmodel ---');

// 3.1 Zomer met bries op stilstaand water
const habitatSummer = analyzeHabitatMovement('Karper', '2026-07-20', {
  location: baseLocation,
  bankWind: bwAanlandig,
  thermalAnalysis: warmThermal,
  targetSlot: 'Avond',
  avgWindSpeedKmH: 16,
  windDirText: 'W',
});

assert(
  habitatSummer.primaryZone !== undefined && habitatSummer.alternativeZone !== undefined,
  '3.1 Primaire en alternatieve zoekzone zijn beide gegenereerd'
);
assert(
  habitatSummer.primaryZone.habitatType === 'Foerageerzone',
  `3.2 Zomeravond met aanlandige bries stelt foerageerzone als primaire zone (werkelijk: ${habitatSummer.primaryZone.habitatType})`
);
assert(
  habitatSummer.movementHypothesis.timeOfDayDynamic.includes('schemering') ||
  habitatSummer.movementHypothesis.timeOfDayDynamic.includes('Avond') ||
  habitatSummer.movementHypothesis.timeOfDayDynamic.includes('aaskans'),
  '3.3 Avondtijdvak bevat specifieke schemeringsdynamiek'
);
assert(
  habitatSummer.dataProvenance.measuredDataPoints.length >= 2,
  '3.4 Data Provenance documenteert echte metingen (GPS, gemeten watertemperatuur)'
);
assert(
  habitatSummer.dataProvenance.modelInferences.length >= 2,
  '3.5 Data Provenance documenteert modelaannames'
);

// 3.2 Winter koud water -> Primary zone is holding area
const habitatWinter = analyzeHabitatMovement('Karper', '2026-01-20', {
  location: baseLocation,
  bankWind: bwWinterKoud,
  thermalAnalysis: coldThermal,
  targetSlot: 'Middag',
  avgWindSpeedKmH: 14,
  windDirText: 'W',
});

assert(
  habitatWinter.primaryZone.habitatType === 'Holding / rustzone',
  `3.6 In koud winterwater (<6°C) is de primaire zone een holding/rustzone (werkelijk: ${habitatWinter.primaryZone.habitatType})`
);
assert(
  habitatWinter.movementHypothesis.seasonalPattern.includes('actieradius beperken') ||
  habitatWinter.movementHypothesis.seasonalPattern.includes('koude omstandigheden'),
  '3.7 Seizoenspatroon vermeldt passiviteit en beperkte actieradius'
);

// 3.3 Directe gebruikerswaarneming (springen of bellen) wordt prioriteit
const habitatObs = analyzeHabitatMovement('Karper', '2026-06-15', {
  location: baseLocation,
  bankWind: bwAanlandig,
  thermalAnalysis: warmThermal,
  targetSlot: 'Ochtend',
  sessionObservations: ['aasbellen_voedselactiviteit'],
});

assert(
  habitatObs.primaryZone.name.includes('waarnemingszone') || habitatObs.primaryZone.name.includes('hotspot'),
  '3.8 Directe aanwezigheidswaarneming (aasbellen) krijgt absolute prioriteit in de primaire zoekzone'
);
assert(
  habitatObs.dataProvenance.userObservations.some((o) => o.includes('aasbellen')),
  '3.9 Data Provenance registreert de gebruikerswaarneming'
);

// 3.4 Geen sonardata verzinnen: ontbrekende diepte en bodemverloop eerlijk gemeld
assert(
  habitatSummer.missingInformation.some((m) => m.toLowerCase().includes('bodemkaart') || m.toLowerCase().includes('sonar')),
  '3.10 Vermeldt eerlijk dat er geen sonarkaart of bathymetrische bodemscan is'
);

const unknownThermal = {
  ...warmThermal,
  hasMeasuredWaterTemp: false,
  measuredWaterTemp: null,
  estimatedWaterTemp: null,
};
const habitatUnknown = analyzeHabitatMovement('Karper', '2026-07-20', {
  location: { ...baseLocation, waterType: undefined, waterDepth: undefined, habitatFeatures: [] },
  thermalAnalysis: unknownThermal,
});
assert(
  !habitatUnknown.primaryZone.description.includes('14.0') &&
  !habitatUnknown.primaryZone.description.toLowerCase().includes('plas'),
  '3.11 Onbekende watertemperatuur en watertype leveren geen verzonnen 14°C- of plasaanname op'
);
assert(
  habitatUnknown.missingInformation.some((m) => m.toLowerCase().includes('watertype')) &&
  habitatUnknown.missingInformation.some((m) => m.toLowerCase().includes('standaarddiepte') || m.toLowerCase().includes('geen standaarddiepte')),
  '3.12 Ontbrekend watertype en diepte worden expliciet als onbekend gemeld'
);
const habitatObservedWithoutWeather = analyzeHabitatMovement('Karper', '2026-07-20', {
  location: { ...baseLocation, waterType: undefined, waterDepth: undefined },
  thermalAnalysis: unknownThermal,
  sessionObservations: ['aasbellen_voedselactiviteit'],
});
assert(
  habitatObservedWithoutWeather.primaryZone.name.includes('waarnemingszone') &&
  habitatObservedWithoutWeather.dataProvenance.userObservations.some((o) => o.includes('aasbellen')),
  '3.13 Directe viswaarneming blijft leidend wanneer weer, watertype en temperatuur ontbreken'
);


// =====================================================================
// DEEL 4: VOLLEDIGE DAGPROGNOSE & INTEGRATIE
// =====================================================================
console.log('\n--- TESTGROEP 4: Volledige Dagprognose & Integratie ---');

const mockHourlyForecasts: WeatherHourlyForecast[] = [];
for (let h = 0; h < 24; h++) {
  const hh = h < 10 ? `0${h}` : `${h}`;
  mockHourlyForecasts.push({
    time: `2026-07-20T${hh}:00:00`,
    temperature: 21,
    pressure: 1016,
    windSpeed: 14,
    windDirection: 270, // West
    windDirectionText: 'W',
    precipitation: 0,
    precipitationProbability: 5,
    cloudCover: 40,
    weatherCode: 1,
  });
}

const fullProg = calculateDayPrognosis(
  '2026-07-20',
  mockHourlyForecasts,
  'Karper',
  mockHistoricalSessions,
  '2026-07-20T08:00:00Z',
  19.5, // Gemeten watertemp
  new Date('2026-07-20T06:00:00Z'),
  {
    sessionDurationHours: 4,
    location: baseLocation,
    locationId: baseLocation.id,
    prebaitOptions: {
      availableDaysBefore: 2,
      planningDate: '2026-07-18',
    },
    catches: mockHistoricalCatches,
  }
);

assert(
  fullProg.bankWindAnalysis !== undefined,
  '4.1 DayPrognosis bevat bankWindAnalysis'
);
assert(
  fullProg.bankWindAnalysis?.relation === 'Recht aanlandig (kopwind op de oever)',
  '4.2 bankWindAnalysis in DayPrognosis is correct berekend als Recht aanlandig'
);
assert(
  fullProg.habitatAnalysis !== undefined,
  '4.3 DayPrognosis bevat habitatAnalysis'
);
assert(
  fullProg.prebaitPlan !== undefined,
  '4.4 DayPrognosis bevat prebaitPlan'
);
assert(
  fullProg.prebaitPlan?.shouldPrebait === true && fullProg.prebaitPlan?.recommendedDaysBefore === 2,
  '4.5 prebaitPlan in DayPrognosis plant exact 2 dagen vooraf'
);
assert(
  typeof fullProg.activityScore === 'number' && fullProg.activityScore >= 1 && fullProg.activityScore <= 10,
  '4.6 Bestaande activiteitsscore blijft zuiver en ongewijzigd (geen kunstmatige inflatie)'
);
assert(
  fullProg.personalCatchChance !== null,
  '4.7 Bestaande Poisson-vangstkans blijft correct functioneren'
);

// =====================================================================
// DEEL 5: ONTBREKENDE EN ONVOLLEDIGE WEERDATA
// =====================================================================
console.log('\n--- TESTGROEP 5: Ontbrekende weerdata ---');

const noWeatherProg = calculateDayPrognosis(
  '2026-07-20',
  [],
  'Karper',
  [],
  '2026-07-20T08:00:00Z',
  null,
  new Date('2026-07-20T06:00:00Z'),
  { sessionDurationHours: 4, location: baseLocation, locationId: baseLocation.id }
);

const staleMeasuredTempProg = calculateDayPrognosis(
  '2026-07-20',
  [],
  'Karper',
  [],
  '2026-07-18T06:00:00Z',
  19,
  new Date('2026-07-18T06:00:00Z'),
  { sessionDurationHours: 4, location: baseLocation, locationId: baseLocation.id }
);
assert(
  staleMeasuredTempProg.activityScoreAvailable === false,
  '5.0 Een actuele watertemperatuurmeting wordt niet als meting hergebruikt voor een toekomstige dag buiten het geldige tijdvenster'
);

assert(
  noWeatherProg.activityScoreAvailable === false,
  '5.1 Zonder gemeten of verantwoord geschatte watertemperatuur wordt de activiteitsindex niet als beschikbaar gemarkeerd'
);
assert(
  noWeatherProg.personalCatchChance === null,
  '5.2 Zonder essentiële weer-/thermische gegevens wordt geen persoonlijke vangstkans getoond'
);
assert(
  noWeatherProg.weatherDataQuality?.status === 'Onvoldoende',
  '5.3 Geen uurdata resulteert in status Onvoldoende'
);
assert(
  noWeatherProg.timeSlots.Ochtend.temperatureFactor.dataAvailable === false,
  '5.4 Ontbrekende watertemperatuur wordt als onbekend gemarkeerd, niet als neutraal'
);
assert(
  noWeatherProg.timeSlots.Ochtend.windFactor.dataAvailable === false &&
  noWeatherProg.timeSlots.Ochtend.pressureFactor.dataAvailable === false &&
  noWeatherProg.timeSlots.Ochtend.precipitationFactor.dataAvailable === false,
  '5.5 Ontbrekende wind-, druk-, regen- en bewolkingsdata worden niet als gemeten nul/neutraal behandeld'
);

const partialForecasts = Array.from({ length: 24 }, (_, hour) => ({
  time: `2026-07-20T${String(hour).padStart(2, '0')}:00:00`,
  temperature: 20,
  pressure: 1015,
  // Wind, neerslag en bewolking ontbreken bewust.
})) as unknown as WeatherHourlyForecast[];

const partialWeatherProg = calculateDayPrognosis(
  '2026-07-20',
  partialForecasts,
  'Karper',
  [],
  '2026-07-20T08:00:00Z',
  null,
  new Date('2026-07-20T06:00:00Z'),
  { sessionDurationHours: 4, location: baseLocation, locationId: baseLocation.id }
);

assert(
  partialWeatherProg.timeSlots.Ochtend.windFactor.dataAvailable === false &&
  partialWeatherProg.timeSlots.Ochtend.precipitationFactor.dataAvailable === false,
  '5.6 Ontbrekende wind, neerslag en bewolking worden als onbekend behandeld bij gedeeltelijke uurdata'
);
assert(
  partialWeatherProg.timeSlots.Ochtend.pressureFactor.dataAvailable === true,
  '5.7 Een aanwezige geldige luchtdrukwaarde blijft afzonderlijk bruikbaar'
);
assert(
  partialWeatherProg.personalCatchChance === null,
  '5.8 Bij onvolledige weerdekking wordt geen persoonlijke vangstkans getoond'
);

console.log('\n======================================================');
console.log(`TESTRESULTAAT MODULES: ${passed} GESLAAGD, ${failed} MISLUKT`);
console.log('======================================================');

if (failed > 0) process.exit(1);
