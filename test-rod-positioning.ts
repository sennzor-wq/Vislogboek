import { analyzeRodPositioning, getDirectionMeta } from './src/services/rodPositioningEngine';
import { calculateDayPrognosis } from './src/services/prognosisEngine';
import { normalizeRawBackup } from './src/services/backupService';
import {
  WeatherHourlyForecast,
  FishingLocation,
  FishingSession,
  CatchItem,
  WaterThermalAnalysis,
  DayPrognosis,
} from './src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${msg}`);
    failed++;
  }
}

console.log('=== TEST SUITE: HENGELPOSITIONERING & VISBEWEGING v2.2 ===\n');

// Mock data generator for weather
function createHourlyForecasts(
  dateStr: string,
  baseTemp: number,
  windSpeed: number,
  windDir: string,
  cloudCover = 50,
  speedEndDelta = 0,
  dirEnd?: string
): WeatherHourlyForecast[] {
  const dirDegreesMap: Record<string, number> = {
    N: 0, NO: 45, O: 90, ZO: 135, Z: 180, ZW: 225, W: 270, NW: 315
  };
  const forecasts: WeatherHourlyForecast[] = [];
  for (let h = 0; h < 24; h++) {
    const hourStr = h < 10 ? `0${h}` : `${h}`;
    const dynamicSpeed = windSpeed + (h / 23) * speedEndDelta;
    const dynamicDir = dirEnd && h >= 12 ? dirEnd : windDir;
    forecasts.push({
      time: `${dateStr}T${hourStr}:00:00`,
      temperature: baseTemp + Math.sin((h / 24) * Math.PI) * 4,
      pressure: 1018,
      windSpeed: Math.round(dynamicSpeed * 10) / 10,
      windDirection: dirDegreesMap[dynamicDir] ?? 225,
      windDirectionText: dynamicDir,
      precipitation: 0,
      precipitationProbability: 10,
      cloudCover,
      weatherCode: 1,
    });
  }
  return forecasts;
}

const mockThermalAnalysis = (trend: any, temp: number): WaterThermalAnalysis => ({
  trend,
  trendConfidence: 'Matig',
  hasMeasuredWaterTemp: false,
  measuredWaterTemp: null,
  estimatedWaterTemp: temp,
  estimatedRange: [temp - 1, temp + 1],
  surfaceVsBulkNote: 'Oppervlaktelaag reageert sneller dan bulk.',
  inertiaFactor: 'Gemiddeld',
  summaryRationale: 'Gematigde ontwikkeling.',
  dataPointsAvailable: {
    past24hAvailable: true,
    past72hAvailable: true,
    solarRadiationIndication: 'Matig (half bewolkt)',
    windMixingInfluence: 'Matige menging',
    depthKnown: true,
    waterDepthMeters: 2.5,
  },
  prognosisImpactNote: 'Normale thermische invloed.',
});

const makeKnownCarpCatches = (sessions: FishingSession[]): CatchItem[] =>
  sessions.filter((session) => session.outcome === 'catch').map((session, index) => ({
    id: `known-carp-catch-${session.id}`,
    sessionId: session.id,
    species: 'Karper',
    count: 1,
    timestamp: session.startTime,
    createdAt: session.startTime,
  }));

// --- TESTGROEP 1: Onafhankelijkheid van Vangstprognose & Activiteitsindex ---
console.log('--- TESTGROEP 1: Onafhankelijkheid van Vangstprognose & Activiteitsindex ---');

const baseLoc: FishingLocation = {
  id: 'spot-test-1',
  name: 'Testplas Zandgat',
  waterDepth: 3.0,
  waterType: 'Plas/Zandafgraving',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const histSessions: FishingSession[] = [
  {
    id: 's1',
    locationId: 'spot-test-1',
    startTime: '2026-06-01T08:00:00Z',
    endTime: '2026-06-01T12:00:00Z',
    durationMinutes: 240,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    createdAt: '2026-06-01T12:00:00Z',
    updatedAt: '2026-06-01T12:00:00Z',
  },
  {
    id: 's2',
    locationId: 'spot-test-1',
    startTime: '2026-06-02T08:00:00Z',
    endTime: '2026-06-02T12:00:00Z',
    durationMinutes: 240,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    createdAt: '2026-06-02T12:00:00Z',
    updatedAt: '2026-06-02T12:00:00Z',
  },
  {
    id: 's3',
    locationId: 'spot-test-1',
    startTime: '2026-06-03T08:00:00Z',
    endTime: '2026-06-03T12:00:00Z',
    durationMinutes: 240,
    outcome: 'skunk_confirmed',
    targetSpecies: ['Karper'],
    createdAt: '2026-06-03T12:00:00Z',
    updatedAt: '2026-06-03T12:00:00Z',
  },
  {
    id: 's4',
    locationId: 'spot-test-1',
    startTime: '2026-06-04T08:00:00Z',
    endTime: '2026-06-04T12:00:00Z',
    durationMinutes: 240,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    createdAt: '2026-06-04T12:00:00Z',
    updatedAt: '2026-06-04T12:00:00Z',
  },
  {
    id: 's5',
    locationId: 'spot-test-1',
    startTime: '2026-06-05T08:00:00Z',
    endTime: '2026-06-05T12:00:00Z',
    durationMinutes: 240,
    outcome: 'catch',
    targetSpecies: ['Karper'],
    createdAt: '2026-06-05T12:00:00Z',
    updatedAt: '2026-06-05T12:00:00Z',
  },
];

const fc1 = [
  ...createHourlyForecasts('2026-07-12', 21, 16, 'ZW'),
  ...createHourlyForecasts('2026-07-13', 21, 16, 'ZW'),
  ...createHourlyForecasts('2026-07-14', 21, 16, 'ZW'),
  ...createHourlyForecasts('2026-07-15', 21, 16, 'ZW'),
];
const histCatches: CatchItem[] = ['s1', 's2', 's4', 's5'].map((sessionId, index) => ({
  id: `hist-catch-${index}`,
  sessionId,
  species: 'Karper',
  count: 1,
  timestamp: `2026-06-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
  createdAt: `2026-06-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
}));
const prog1 = calculateDayPrognosis('2026-07-15', fc1, 'Karper', histSessions, undefined, null, new Date('2026-07-15T05:00:00Z'), {
  sessionDurationHours: 4,
  locationId: 'spot-test-1',
  location: baseLoc,
  catches: histCatches,
});

assert(prog1.positioningAdvice !== undefined, '1.1 Positioning advice is aanwezig in DayPrognosis');
assert(prog1.positioningAdvice?.windContext.isCalmWind === false, '1.1a Matige wind wordt expliciet onderscheiden van kalme wind voor de VisCoach-tactiek');
assert(typeof prog1.activityScore === 'number' && prog1.activityScore >= 1.0 && prog1.activityScore <= 10.0, '1.2 Activiteitsindex blijft geldig numeriek');
assert(prog1.personalCatchChance !== null && prog1.personalCatchChance > 0, '1.3 Persoonlijke Poisson-vangstkans is correct berekend');
assert(prog1.expectedCatches !== null, '1.4 Verwachte vangsten is berekend conform Poisson exposure');

// --- TESTGROEP 2: Fysische & Biologische Regels per Scenario ---
console.log('\n--- TESTGROEP 2: Fysische & Biologische Regels per Scenario ---');

// Scenario 2.1: Koud water / Winter met koude wind
const fcWinter = createHourlyForecasts('2026-01-15', 3, 18, 'NO');
const thermalWinter = mockThermalAnalysis('Waarschijnlijke afkoeling', 4.5);
const adviceWinter = analyzeRodPositioning('2026-01-15', fcWinter, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalWinter,
  historicalSessions: [],
});

assert(
  adviceWinter.recommendedZone.includes('Diepere rustzone') || adviceWinter.recommendedZone.includes('luwe oever'),
  `2.1 Winter/koud water adviseert diepere rustzone of luwte (gekregen: "${adviceWinter.recommendedZone}")`
);
assert(
  adviceWinter.rationale.includes('energie') || adviceWinter.rationale.includes('koude wind'),
  '2.2 Rationale vermeldt afkoeling / energiebesparing in koud water'
);
assert(adviceWinter.alternativeOption.length > 10, '2.3 Tactisch alternatief is aanwezig');

// Scenario 2.2: Voorjaar met stijgende temperatuur (Geen verzonnen windrichting voor oever!)
const fcSpring = createHourlyForecasts('2026-04-15', 16, 12, 'Z');
const thermalSpring = mockThermalAnalysis('Waarschijnlijke opwarming', 12.0);
const adviceSpring = analyzeRodPositioning('2026-04-15', fcSpring, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalSpring,
  historicalSessions: [],
});

assert(
  adviceSpring.recommendedZone.includes('Ondiepe, zonovergoten') || adviceSpring.recommendedZone.includes('baai'),
  `2.4 Voorjaar met opwarming adviseert ondiepe zon-zone of luwe baai (gekregen: "${adviceSpring.recommendedZone}")`
);
assert(
  !adviceSpring.recommendedZone.toLowerCase().includes('noord-') && !adviceSpring.recommendedZone.toLowerCase().includes('oostelijke'),
  '2.5 Geen ongegronde kompasrichting (zoals noord/oost) toegedicht aan oevercontour zonder geometriedata'
);

// Scenario 2.3: Zomer met actieve milde wind (>=12 km/u)
const fcSummerWind = createHourlyForecasts('2026-07-20', 22, 17, 'ZW');
const thermalSummer = mockThermalAnalysis('Ongeveer stabiel', 19.5);
const adviceSummerWind = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});

assert(
  adviceSummerWind.recommendedZone.includes('Aanlandige oeverzone') && adviceSummerWind.recommendedZone.includes('zoekzone'),
  `2.6 Zomer met bries behandelt windkant als mogelijke zoekzone, niet als dogma (gekregen: "${adviceSummerWind.recommendedZone}")`
);
assert(
  adviceSummerWind.rationale.includes('retourstroom') || adviceSummerWind.rationale.includes('tegengestelde richting'),
  '2.7 Rationale maakt onderscheid tussen oppervlaktedrift en onderstroom nabij de bodem'
);

// Scenario 2.4: Stromend water (Rivier / Kanaal)
const riverLoc: FishingLocation = {
  ...baseLoc,
  waterType: 'Rivier',
};
const adviceRiver = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: riverLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});

assert(
  adviceRiver.recommendedZone.includes('Stroomnaden') || adviceRiver.recommendedZone.includes('taluds'),
  `2.8 Stromend water prioriteert stroomnaden/taluds boven winddrift (gekregen: "${adviceRiver.recommendedZone}")`
);
assert(
  adviceRiver.rationale.includes('ondergeschikt') || adviceRiver.rationale.includes('dicteren stroming'),
  '2.9 Rationale verklaart dat winddrift ondergeschikt is aan stroming en vaargeul'
);

// --- TESTGROEP 3: Ontbrekende Informatie & Modelbeperkingen ---
console.log('\n--- TESTGROEP 3: Ontbrekende Informatie & Modelbeperkingen ---');

assert(
  adviceSummerWind.missingInformation.some((m) => m.includes('oeverlijnoriëntatie') || m.includes('GPS is een enkel punt')),
  '3.1 Ontbrekende oeverlijnoriëntatie / meergeometrie wordt expliciet gerapporteerd'
);
assert(
  adviceSummerWind.missingInformation.some((m) => m.includes('microklimaten') || m.includes('bomenrijen') || m.includes('rietkragen')),
  '3.2 Microklimaat / windafbuiging door begroeiing wordt expliciet gerapporteerd'
);

// --- TESTGROEP 4: Persoonlijk Leerprofiel & Sessiedrempels ---
console.log('\n--- TESTGROEP 4: Persoonlijk Leerprofiel & Sessiedrempels ---');

// 4.1 Minder dan 11 voltooide sessies op de stek
const fewSessions: FishingSession[] = [];
for (let i = 0; i < 8; i++) {
  fewSessions.push({
    id: `few-${i}`,
    locationId: 'spot-test-1',
    startTime: `2026-05-0${i + 1}T10:00:00Z`,
    outcome: i % 2 === 0 ? 'catch' : 'skunk_confirmed',
    targetSpecies: ['Karper'],
    baitDirection: 'Zuidwest',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  });
}

const adviceFew = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: fewSessions,
  historicalCatches: makeKnownCarpCatches(fewSessions),
});

assert(
  adviceFew.personalEvidence !== undefined && adviceFew.personalEvidence.hasSufficientData === false,
  '4.1 Bij N=8 (<11) is hasSufficientData false'
);
assert(
  !!adviceFew.personalEvidence?.summaryNote.includes('8 van de minimaal 11'),
  `4.2 Summary note noemt eerlijk aantal en drempel`
);

// 4.2 Minimaal 11 voltooide sessies, maar < 6 met geregistreerde richting
const elevenFewDir: FishingSession[] = [];
for (let i = 0; i < 12; i++) {
  elevenFewDir.push({
    id: `elev-${i}`,
    locationId: 'spot-test-1',
    startTime: `2026-05-${i < 9 ? '0' + (i + 1) : i + 1}T10:00:00Z`,
    outcome: i % 3 === 0 ? 'catch' : 'skunk_confirmed',
    targetSpecies: ['Karper'],
    baitDirection: i < 3 ? 'West' : undefined,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  });
}

const adviceElevenFewDir = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: elevenFewDir,
  historicalCatches: makeKnownCarpCatches(elevenFewDir),
});

assert(
  adviceElevenFewDir.personalEvidence?.hasSufficientData === false,
  '4.3 Bij 12 sessies maar slechts 3 richtingen (<6) is hasSufficientData false'
);
assert(
  !!adviceElevenFewDir.personalEvidence?.summaryNote.includes('slechts 3 met een geregistreerde'),
  '4.4 Summary note meldt specifiek dat richtingsregistraties ontbreken'
);

// 4.3 Minimaal 11 voltooide sessies én >= 6 met richting (Succesvol empirisch profiel)
const elevenWithDir: FishingSession[] = [];
for (let i = 0; i < 14; i++) {
  const dir = i < 7 ? 'Zuidwest' : 'Noordoost';
  const outcome = i < 5 ? 'catch' : (i < 7 ? 'skunk_confirmed' : 'skunk_confirmed');
  elevenWithDir.push({
    id: `full-${i}`,
    locationId: 'spot-test-1',
    startTime: `2026-05-${i < 9 ? '0' + (i + 1) : i + 1}T10:00:00Z`,
    outcome,
    targetSpecies: ['Karper'],
    baitDirection: dir,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  });
}

const adviceFull = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: elevenWithDir,
  historicalCatches: makeKnownCarpCatches(elevenWithDir),
});

assert(
  adviceFull.personalEvidence?.hasSufficientData === true,
  '4.5 Bij 14 voltooide sessies en 14 richtingen is hasSufficientData true'
);
assert(
  adviceFull.personalEvidence?.favoriteDirection === 'Zuidwest',
  `4.6 Favoriete richting is correct Zuidwest (5 vangsten uit 7) (werkelijk: ${adviceFull.personalEvidence?.favoriteDirection})`
);
assert(
  !!adviceFull.personalEvidence?.summaryNote.includes('geen wetenschappelijk bewijs') &&
  !!adviceFull.personalEvidence?.summaryNote.includes('hooguit licht nuanceren'),
  '4.7 Nuancenote benadrukt dat dit geen wetenschappelijk bewijs is en het advies hooguit licht nuanceert'
);

// 4.4 Onvoltooide of onbekende sessies tellen NIET mee
const mixedSessions: FishingSession[] = [
  ...elevenWithDir.slice(0, 9), // 9 voltooide sessies
  {
    id: 'unknown-1',
    locationId: 'spot-test-1',
    startTime: '2026-06-01T10:00:00Z',
    outcome: 'unknown',
    baitDirection: 'Zuidwest',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'active-1',
    locationId: 'spot-test-1',
    startTime: '2026-06-02T10:00:00Z',
    outcome: 'active',
    baitDirection: 'Zuidwest',
    createdAt: '2026-06-02T10:00:00Z',
    updatedAt: '2026-06-02T10:00:00Z',
  },
];

const adviceMixed = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: mixedSessions,
  historicalCatches: makeKnownCarpCatches(mixedSessions),
});

assert(
  adviceMixed.personalEvidence?.totalCompletedSessionsOnSpot === 9,
  `4.8 Onbekende en actieve sessies worden uitgesloten van voltooide teller (werkelijk: ${adviceMixed.personalEvidence?.totalCompletedSessionsOnSpot})`
);
assert(
  adviceMixed.personalEvidence?.hasSufficientData === false,
  '4.9 hasSufficientData blijft false omdat 9 < 11'
);

// --- TESTGROEP 5: Normalisatie & Back-up Compatibiliteit ---
console.log('\n--- TESTGROEP 5: Normalisatie & Back-up Compatibiliteit ---');

const rawOldBackup = {
  version: 2,
  spots: [
    { id: 'sp-1', name: 'Oude Stek' }
  ],
  sessions: [
    {
      id: 'sess-old-1',
      date: '2026-09-10',
      start_time: '10:00',
      end_time: '14:00',
      spot_id: 'sp-1',
      status: 'completed',
      catches: []
    },
    {
      id: 'sess-new-1',
      date: '2026-09-11',
      start_time: '10:00',
      end_time: '14:00',
      spot_id: 'sp-1',
      status: 'completed',
      bait_direction: 'Zuidwest',
      catches: []
    }
  ]
};

const normalized = normalizeRawBackup(rawOldBackup);
assert(normalized.sessions.length === 2, '5.1 Beide sessies genormaliseerd');
assert(normalized.sessions[0].baitDirection === undefined, '5.2 Oude sessie zonder richting blijft veilig undefined');
assert(normalized.sessions[1].baitDirection === 'Zuidwest', '5.3 Nieuwe sessie met bait_direction wordt correct overgenomen');

// --- TESTGROEP 6: Windkrachtvariatie & Intra-sessie Dynamiek ---
console.log('\n--- TESTGROEP 6: Windkrachtvariatie & Intra-sessie Dynamiek ---');

// Weinig wind (<= 10 km/u) in warme zomer
const fcCalm = createHourlyForecasts('2026-07-22', 24, 7, 'O');
const adviceCalm = analyzeRodPositioning('2026-07-22', fcCalm, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 22.5),
  historicalSessions: [],
});
assert(
  adviceCalm.recommendedZone.includes('Zuurstofrijke overgangszones') || adviceCalm.recommendedZone.includes('dieper water'),
  `6.1 Weinig wind bij warm water adviseert zuurstofrijke/diepere zones (gekregen: "${adviceCalm.recommendedZone}")`
);
assert(
  adviceCalm.rationale.includes('weinig wind betekent niet automatisch stilstaand water') || adviceCalm.rationale.includes('thermische circulatie'),
  '6.2 Rationale nuanceert dat weinig wind geen stilstaand water garandeert'
);

// Aantrekkende wind (+10 km/u versnelling tijdens sessie)
const fcAccelerating = createHourlyForecasts('2026-07-22', 21, 10, 'ZW', 60, 10);
const adviceAccelerating = analyzeRodPositioning('2026-07-22', fcAccelerating, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Waarschijnlijke opwarming', 20.0),
  historicalSessions: [],
});
assert(adviceAccelerating.windContext.windTrend === 'Aantrekkend', '6.3 Windtrend correct herkend als Aantrekkend');
assert(
  adviceAccelerating.windContext.intraSessionNote !== undefined &&
  adviceAccelerating.windContext.intraSessionNote.includes('trekt aan'),
  '6.4 Intra-sessie notitie meldt aantrekkende wind en toenemende watermenging'
);

// Draaiende wind (ZW naar NW)
const fcTurning = createHourlyForecasts('2026-07-22', 20, 15, 'ZW', 60, 0, 'NW');
const adviceTurning = analyzeRodPositioning('2026-07-22', fcTurning, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 19.0),
  historicalSessions: [],
});
assert(adviceTurning.windContext.windTrend === 'Draaiend', '6.5 Draaiende wind correct gedetecteerd');
assert(
  adviceTurning.windContext.intraSessionNote !== undefined &&
  adviceTurning.windContext.intraSessionNote.includes('draait van'),
  '6.6 Intra-sessie notitie meldt verschuiving van oppervlaktewaterbeweging'
);

// --- TESTGROEP 7: Gevoeligheidsanalyse rond Drempelwaarden (Geen Cliff-effects) ---
console.log('\n--- TESTGROEP 7: Gevoeligheidsanalyse rond Drempelwaarden (Geen Cliff-effects) ---');

// Grens ~7 °C bij koud weer
const fcNearCold = createHourlyForecasts('2026-11-15', 6, 15, 'O');
const thermal69 = mockThermalAnalysis('Waarschijnlijke afkoeling', 6.9);
const advice69 = analyzeRodPositioning('2026-11-15', fcNearCold, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermal69,
  historicalSessions: [],
});
const thermal71 = mockThermalAnalysis('Waarschijnlijke afkoeling', 7.1);
const advice71 = analyzeRodPositioning('2026-11-15', fcNearCold, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermal71,
  historicalSessions: [],
});

assert(
  advice69.recommendedZone === advice71.recommendedZone,
  `7.1 Geen abrupte sprong tussen 6.9 °C en 7.1 °C bij koude wind/afkoeling (beide: "${advice69.recommendedZone}")`
);

// Grens ~10 km/u wind in zomer
const fc99 = createHourlyForecasts('2026-07-15', 23, 9.9, 'ZW');
const fc101 = createHourlyForecasts('2026-07-15', 23, 10.5, 'ZW');
const advice99 = analyzeRodPositioning('2026-07-15', fc99, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 21.5),
  historicalSessions: [],
});
const advice101 = analyzeRodPositioning('2026-07-15', fc101, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 21.5),
  historicalSessions: [],
});
assert(advice99.recommendedZone.length > 0 && advice101.recommendedZone.length > 0, '7.2 Beide adviezen rond 10 km/u leveren stabiele aanbevelingen');

// --- TESTGROEP 8: Ontbrekende Data & Robuustheid ---
console.log('\n--- TESTGROEP 8: Ontbrekende Data & Robuustheid ---');

const adviceEmpty = analyzeRodPositioning('2026-07-15', [], 'Karper', {
  location: undefined,
  thermalAnalysis: mockThermalAnalysis('Onvoldoende gegevens', 15),
  historicalSessions: [],
});
assert(adviceEmpty.recommendedZone.length > 0, '8.1 Lege weersvoorspelling crasht niet en levert fallback advies');
assert(adviceEmpty.missingInformation.length >= 3, '8.2 Ontbrekende datapunten worden eerlijk en compleet opgesomd');
assert(adviceEmpty.personalEvidence === undefined, '8.3 Zonder locatieId blijft personalEvidence veilig undefined');

// --- TESTGROEP 9: Prognose Invariantie Controle ---
console.log('\n--- TESTGROEP 9: Prognose Invariantie Controle ---');

const progBefore = calculateDayPrognosis('2026-07-15', fc1, 'Karper', histSessions, undefined, null, new Date('2026-07-15T05:00:00Z'), {
  sessionDurationHours: 4,
  locationId: 'spot-test-1',
  location: baseLoc,
  catches: histCatches,
});

assert(progBefore.activityScore === prog1.activityScore, '9.1 Activiteitsscore is strikt identiek');
assert(progBefore.personalCatchChance === prog1.personalCatchChance, '9.2 Persoonlijke vangstkans is strikt identiek');
assert(progBefore.expectedCatches === prog1.expectedCatches, '9.3 Verwachte vangstopbrengst is strikt identiek');
assert(progBefore.hourlyCatchRate === prog1.hourlyCatchRate, '9.4 Vangsttempo per uur is strikt identiek');
assert(progBefore.advice === prog1.advice, '9.5 Algemeen advieslabel is strikt identiek');

// --- TESTGROEP 10: Soortspecifieke Zoekhypothesen in Hengelpositionering ---
console.log('\n--- TESTGROEP 10: Soortspecifieke Zoekhypothesen in Hengelpositionering ---');

// 10.1 Roofblei
const adviceAspRiver = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Roofblei', {
  location: riverLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});
assert(
  adviceAspRiver.recommendedZone.includes('Stroomnaden') && adviceAspRiver.recommendedZone.includes('oppervlaktezones'),
  `10.1 Roofblei op rivier adviseert stroomnaden en turbulente oppervlaktezones ("${adviceAspRiver.recommendedZone}")`
);

const adviceAspStill = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Roofblei', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});
assert(
  adviceAspStill.recommendedZone.includes('Bovenste waterlaag') || adviceAspStill.recommendedZone.includes('open water'),
  `10.2 Roofblei op plas adviseert bovenste waterlaag en open water ("${adviceAspStill.recommendedZone}")`
);

// 10.2 Snoek
const fcPikeAutumn = createHourlyForecasts('2026-10-15', 15, 10, 'ZW');
const advicePikeAutumn = analyzeRodPositioning('2026-10-15', fcPikeAutumn, 'Snoek', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});
assert(
  advicePikeAutumn.recommendedZone.includes('Hinderlaagstructuren') || advicePikeAutumn.recommendedZone.includes('vegetatieranden'),
  `10.3 Snoek in actieve periode adviseert hinderlaagstructuren en vegetatieranden ("${advicePikeAutumn.recommendedZone}")`
);

const advicePikeWinter = analyzeRodPositioning('2026-01-15', fcWinter, 'Snoek', {
  location: baseLoc,
  thermalAnalysis: thermalWinter,
  historicalSessions: [],
});
assert(
  advicePikeWinter.recommendedZone.includes('Diepere taluds') || advicePikeWinter.recommendedZone.includes('prooivis'),
  `10.4 Snoek in de winter volgt prooivis naar diepere taluds ("${advicePikeWinter.recommendedZone}")`
);

// 10.3 Snoekbaars (Dag vs. Nacht)
const adviceZanderDay = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Snoekbaars', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
  targetSlot: 'Middag',
});
assert(
  adviceZanderDay.recommendedZone.includes('Diepere taluds') || adviceZanderDay.recommendedZone.includes('schaduwrijke'),
  `10.5 Snoekbaars overdag mijdt fel licht en adviseert diepere/schaduwrijke zones ("${adviceZanderDay.recommendedZone}")`
);

const adviceZanderNight = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Snoekbaars', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
  targetSlot: 'Nacht',
});
assert(
  adviceZanderNight.recommendedZone.includes('Ondiepere taludranden') || adviceZanderNight.recommendedZone.includes('nachtjacht'),
  `10.6 Snoekbaars 's nachts adviseert ondiepere taludranden ("${adviceZanderNight.recommendedZone}")`
);

// 10.4 Zeelt
const adviceTenchSummer = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Zeelt', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});
assert(
  adviceTenchSummer.recommendedZone.includes('Begroeide oeverzones') || adviceTenchSummer.recommendedZone.includes('waterplanten'),
  `10.7 Zeelt in de zomer zoekt begroeiing en luwe zachte bodem ("${adviceTenchSummer.recommendedZone}")`
);

const fcTenchCold = createHourlyForecasts('2026-11-20', 6, 15, 'NO');
const adviceTenchCold = analyzeRodPositioning('2026-11-20', fcTenchCold, 'Zeelt', {
  location: baseLoc,
  thermalAnalysis: thermalWinter,
  historicalSessions: [],
});
assert(
  adviceTenchCold.recommendedZone.includes('slibzones') || adviceTenchCold.recommendedZone.includes('winterrust'),
  `10.8 Zeelt in koud water adviseert diepe slibzones voor winterpassiviteit ("${adviceTenchCold.recommendedZone}")`
);

// 10.5 Baars
const advicePerch = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Baars', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});
assert(
  advicePerch.recommendedZone.includes('Harde bodemstructuren') || advicePerch.recommendedZone.includes('kleinbroed'),
  `10.9 Baars adviseert harde bodemstructuren en plekken bij kleinbroed ("${advicePerch.recommendedZone}")`
);

// 10.6 Meerval
const adviceCatfishWarm = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Meerval', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 22),
  historicalSessions: [],
});
assert(
  adviceCatfishWarm.recommendedZone.includes('Diepe bodemkuilen') || adviceCatfishWarm.recommendedZone.includes('nachts'),
  `10.10 Meerval in warm water adviseert diepe kuilen overdag en stroomranden 's nachts ("${adviceCatfishWarm.recommendedZone}")`
);

// 10.7 Voorn
const adviceRoach = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Voorn', {
  location: baseLoc,
  thermalAnalysis: thermalSummer,
  historicalSessions: [],
});
assert(
  adviceRoach.recommendedZone.includes('Overgangszones') || adviceRoach.recommendedZone.includes('midden- en onderlaag'),
  `10.11 Voorn adviseert overgangszones in de midden- en onderlaag ("${adviceRoach.recommendedZone}")`
);

// --- TESTGROEP 11: Geactiveerde Profielparameters in Prognose-Engine ---
console.log('\n--- TESTGROEP 11: Geactiveerde Profielparameters in Prognose-Engine ---');

// 11.1 Windrichtingvoorkeur
const carpProg = calculateDayPrognosis('2026-07-15', fc1, 'Karper', []);
const carpWindSlot = carpProg.timeSlots.Middag.windFactor;
assert(
  carpWindSlot.detail.includes('Wind (ZW,') &&
    carpWindSlot.detail.includes('geen soortspecifieke windvoorkeur') &&
    !carpWindSlot.detail.includes('profielnotitie'),
  '11.1 Wind wordt feitelijk getoond zonder ongevalideerde soortvoorkeur'
);

// 11.2 Bewolkingsvoorkeur
const pikeOvercastForecast = createHourlyForecasts('2026-10-20', 12, 14, 'ZW', 85);
const pikeProg = calculateDayPrognosis('2026-10-20', pikeOvercastForecast, 'Snoek', []);
const pikePrecipSlot = pikeProg.timeSlots.Middag.precipitationFactor;
assert(
  pikePrecipSlot.detail.includes('bewolking 85%') &&
    !pikePrecipSlot.detail.includes('profielvoorkeur'),
  '11.2 Bewolking blijft feitelijke context zonder ongevalideerde soortvoorkeur'
);

assert(
  pikePrecipSlot.score === 0 && pikePrecipSlot.impact === 'neutraal',
  '11.3 Bewolking blijft context en geeft geen ongevalideerde activiteitsscorebonus'
);
assert(
  pikeProg.timeSlots.Middag.seasonFactor.score === 0 &&
  pikeProg.timeSlots.Middag.seasonFactor.impact === 'neutraal',
  '11.4 Seizoen blijft neutrale context zonder zelfstandige scorecorrectie'
);
assert(
  pikeProg.timeSlots.Middag.timeOfDayFactor.score === 0 &&
  pikeProg.timeSlots.Middag.timeOfDayFactor.impact === 'neutraal',
  '11.5 Tijdvakcontext blijft neutraal en beïnvloedt de numerieke score niet'
);
assert(
  pikeProg.timeSlots.Middag.windFactor.score === 0 &&
  pikeProg.timeSlots.Middag.windFactor.impact === 'neutraal',
  '11.6 Wind blijft context en geeft geen ongevalideerde biologische scorecorrectie'
);

// --- TESTGROEP 12: Windrichtinginterpretatie (Herkomst vs Blaasrichting) ---
console.log('\n--- TESTGROEP 12: Windrichtinginterpretatie (Herkomst vs Blaasrichting) ---');

// 12.1 Noordoostenwind (NO -> ZW)
const fcNO = createHourlyForecasts('2026-05-10', 15, 14, 'NO');
const adviceNO = analyzeRodPositioning('2026-05-10', fcNO, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 14),
  historicalSessions: [],
});
const wcgNO = adviceNO.windCastingGuidance!;
assert(wcgNO !== undefined, '12.1 windCastingGuidance is aanwezig bij NO-wind');
assert((wcgNO.windOrigin.shortText === 'NO' || wcgNO.windOrigin.short === 'NO') && wcgNO.windOrigin.degrees === 45, '12.2 NO-wind herkomst is NO (45°)');
assert((wcgNO.windDestination.shortText === 'ZW' || wcgNO.windDestination.short === 'ZW') && wcgNO.windDestination.degrees === 225, '12.3 NO-wind blaast naar ZW (225°)');
assert(
  wcgNO.googleMapsVisual.mapFlowDescription.includes('rechtsboven') && wcgNO.googleMapsVisual.mapFlowDescription.includes('linksonder'),
  '12.4 Google Maps stroomlijn voor NO-wind beschrijft rechtsboven naar linksonder'
);

// 12.2 Zuidwestenwind (ZW -> NO)
const fcZW = createHourlyForecasts('2026-07-15', 22, 16, 'ZW');
const adviceZW = analyzeRodPositioning('2026-07-15', fcZW, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 20),
  historicalSessions: [],
});
const wcgZW = adviceZW.windCastingGuidance!;
assert((wcgZW.windOrigin.shortText === 'ZW' || wcgZW.windOrigin.short === 'ZW') && wcgZW.windOrigin.degrees === 225, '12.5 ZW-wind herkomst is ZW (225°)');
assert((wcgZW.windDestination.shortText === 'NO' || wcgZW.windDestination.short === 'NO') && wcgZW.windDestination.degrees === 45, '12.6 ZW-wind blaast naar NO (45°)');

// 12.3 Oostenwind (O -> W)
const fcO = createHourlyForecasts('2026-06-10', 18, 12, 'O');
const adviceO = analyzeRodPositioning('2026-06-10', fcO, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 17),
  historicalSessions: [],
});
const wcgO = adviceO.windCastingGuidance!;
assert(
  (wcgO.windOrigin.shortText === 'O' || wcgO.windOrigin.short === 'O') &&
  (wcgO.windDestination.shortText === 'W' || wcgO.windDestination.short === 'W'),
  '12.7 Oostenwind blaast naar het westen (W)'
);

// 12.4 Noordenwind (N -> Z)
const fcN = createHourlyForecasts('2026-06-10', 18, 12, 'N');
const adviceN = analyzeRodPositioning('2026-06-10', fcN, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 17),
  historicalSessions: [],
});
const wcgN = adviceN.windCastingGuidance!;
assert(
  (wcgN.windOrigin.shortText === 'N' || wcgN.windOrigin.short === 'N') &&
  (wcgN.windDestination.shortText === 'Z' || wcgN.windDestination.short === 'Z'),
  '12.8 Noordenwind blaast naar het zuiden (Z)'
);

// --- TESTGROEP 13: Strikt 4-ledig Onderscheid ---
console.log('\n--- TESTGROEP 13: Strikt 4-ledig Onderscheid ---');

assert(typeof wcgNO.windOrigin.label === 'string' && wcgNO.windOrigin.label.length > 0, '13.1 Niveau 1: windOrigin (herkomst) is gedefinieerd');
assert(typeof wcgNO.windDestination.label === 'string' && wcgNO.windDestination.label.length > 0, '13.2 Niveau 2: windDestination (blaasrichting) is gedefinieerd');
assert(wcgNO.banksContext.potentialWindwardBank.toLowerCase().includes('zuidwest'), '13.3 Niveau 3: potentialWindwardBank bevindt zich aan de zuidwestelijke oever');
assert(typeof wcgNO.castingAdvice.summary === 'string' && wcgNO.castingAdvice.summary.length > 0, '13.4 Niveau 4: werprichtingadvies is gedefinieerd');
assert(wcgNO.windOrigin.shortText !== wcgNO.windDestination.shortText, '13.5 Herkomst en blaasrichting zijn tegenpolen (180° verschil)');

// --- TESTGROEP 14: Voorkomen van Schijnzekerheid bij Onbekende Oeverlijn ---
console.log('\n--- TESTGROEP 14: Voorkomen van Schijnzekerheid bij Onbekende Oeverlijn ---');

assert(
  wcgNO.castingAdvice.isCastingDirectionDefinite === false,
  '14.1 Zonder empirische stekdata of oevercontour wordt GEEN definitieve kompaswerprichting geforceerd'
);
assert(
  wcgNO.castingAdvice.recommendedDirection === null,
  '14.2 recommendedDirection is null ter voorkoming van schijnzekerheid'
);
assert(
  wcgNO.castingAdvice.summary.toLowerCase().includes('afhankelijk van'),
  '14.3 Adviessamenvatting vermeldt expliciet dat werprichting afhangt van de gekozen oever'
);
assert(
  wcgNO.castingAdvice.scenarioGuidance.standingLeewardBank.length > 15,
  '14.4 Scenario voor vissen op luwe oever (wind in de rug) is beschikbaar'
);
assert(
  wcgNO.castingAdvice.scenarioGuidance.standingWindwardBank.length > 15,
  '14.5 Scenario voor vissen op aanlandige oever (wind op de kant) is beschikbaar'
);
assert(
  Array.isArray(wcgNO.onSiteChecklist) && wcgNO.onSiteChecklist.length === 4,
  '14.6 On-site checklist bevat exact 4 praktische veldcontroles'
);

// --- TESTGROEP 15: Concreet Werpadvies bij Voldoende Empirische Stekhistorie ---
console.log('\n--- TESTGROEP 15: Concreet Werpadvies bij Voldoende Empirische Stekhistorie ---');

// Genereer 12 sessies op spot-test-1, waarvan 9 sessies een vangst hadden met werprichting Zuidwest
const richSessions: FishingSession[] = [];
for (let i = 1; i <= 12; i++) {
  richSessions.push({
    id: `hist-s-${i}`,
    locationId: 'spot-test-1',
    startTime: `2026-05-${i < 10 ? '0' + i : i}T08:00:00Z`,
    endTime: `2026-05-${i < 10 ? '0' + i : i}T12:00:00Z`,
    durationMinutes: 240,
    outcome: i <= 9 ? 'catch' : 'skunk_confirmed',
    targetSpecies: ['Karper'],
    baitDirection: i <= 9 ? 'Zuidwest' : 'Noordoost',
    createdAt: `2026-05-${i < 10 ? '0' + i : i}T12:00:00Z`,
    updatedAt: `2026-05-${i < 10 ? '0' + i : i}T12:00:00Z`,
  });
}

const fcRich = createHourlyForecasts('2026-07-20', 22, 16, 'ZW');
const adviceRich = analyzeRodPositioning('2026-07-20', fcRich, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 20),
  historicalSessions: richSessions,
  historicalCatches: makeKnownCarpCatches(richSessions),
});
const wcgRich = adviceRich.windCastingGuidance!;

assert(
  wcgRich.castingAdvice.isCastingDirectionDefinite === true,
  '15.1 Met >=11 sessies en een duidelijke favoriete richting wordt wél een concreet werpadvies gegeven'
);
assert(
  wcgRich.castingAdvice.recommendedDirection === 'Zuidwest',
  '15.2 Aanbevolen werprichting komt overeen met historische favoriet (Zuidwest)'
);
assert(
  wcgRich.castingAdvice.reason.includes('historisch succes'),
  '15.3 Reden vermeldt expliciet de historische vangstsuccessen op de stek'
);

// --- TESTGROEP 16: Biologische Beoordeling Windkant in Koude vs Warme Situaties ---
console.log('\n--- TESTGROEP 16: Biologische Beoordeling Windkant in Koude vs Warme Situaties ---');

// 16.1 Winter / Koud water: Windkant is ONgunstig (snelle afkoeling, koud water stuwt op)
const fcColdWinter = createHourlyForecasts('2026-01-20', 2, 18, 'NO');
const thermalColdWinter = mockThermalAnalysis('Waarschijnlijke afkoeling', 4.0);
const adviceCold = analyzeRodPositioning('2026-01-20', fcColdWinter, 'Karper', {
  location: baseLoc,
  thermalAnalysis: thermalColdWinter,
  historicalSessions: [],
});
const wcgCold = adviceCold.windCastingGuidance!;

assert(
  wcgCold.banksContext.isWindwardFavorable === false,
  '16.1 Koud water (<8°C) met afkoeling: windkant is NIET automatisch gunstig (isWindwardFavorable === false)'
);
assert(
  wcgCold.banksContext.windwardAssessment.toLowerCase().includes('afkoeling') || wcgCold.banksContext.windwardAssessment.toLowerCase().includes('kille golfslag'),
  '16.2 Beoordeling windkant in de winter waarschuwt voor snelle afkoeling door koude branding'
);

// 16.2 Zomer / Milde bries: Windkant is GUNSTIG
const adviceWarm = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 20),
  historicalSessions: [],
});
const wcgWarm = adviceWarm.windCastingGuidance!;

assert(
  wcgWarm.banksContext.isWindwardFavorable === true,
  '16.3 Zomer met matige bries (>=12 km/u): windkant is biologisch gunstig (voedsel- en warmtestuwing)'
);
assert(
  wcgWarm.banksContext.windwardAssessment.toLowerCase().includes('zoöplankton') || wcgWarm.banksContext.windwardAssessment.toLowerCase().includes('warmte'),
  '16.4 Beoordeling windkant in de zomer licht ophoping van warmte en natuurlijk voedsel toe'
);

// --- TESTGROEP 17: Google Maps Kompasgids & Stekcoördinaten ---
console.log('\n--- TESTGROEP 17: Google Maps Kompasgids & Stekcoördinaten ---');

// 17.1 Stek met GPS-coördinaten (bijv. Lokkershoek)
const lokkershoekLoc: FishingLocation = {
  ...baseLoc,
  name: 'Lokkershoek',
  latitude: 51.6521,
  longitude: 5.2891,
};
const adviceLokkershoek = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: lokkershoekLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 20),
  historicalSessions: [],
});
const wcgLokkershoek = adviceLokkershoek.windCastingGuidance!;

assert(
  (wcgLokkershoek.googleMapsVisual.spotGpsText?.includes('51.6521') || wcgLokkershoek.googleMapsVisual.coordinatesText?.includes('51.6521')) ?? false,
  '17.1 Stek met coördinaten toont breedte- en lengtegraad in de kompasgids'
);
assert(
  wcgLokkershoek.googleMapsVisual.compassRule.includes('Noord = Boven') && wcgLokkershoek.googleMapsVisual.compassRule.includes('Oost = Rechts'),
  '17.2 Kompasregel verklaart Noord=Boven, Oost=Rechts, Zuid=Onder, West=Links conform standaard kaartweergave'
);

// 17.2 Stek zonder GPS-coördinaten
const noGpsLoc: FishingLocation = {
  ...baseLoc,
  name: 'Onbekende Kolk',
  latitude: undefined,
  longitude: undefined,
};
const adviceNoGps = analyzeRodPositioning('2026-07-20', fcSummerWind, 'Karper', {
  location: noGpsLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 20),
  historicalSessions: [],
});
assert(
  (adviceNoGps.windCastingGuidance!.googleMapsVisual.spotGpsText?.includes('niet vastgelegd') ||
   adviceNoGps.windCastingGuidance!.googleMapsVisual.coordinatesText?.includes('niet vastgelegd')) ?? false,
  '17.3 Stek zonder GPS meldt netjes dat coördinaten niet zijn vastgelegd'
);

// --- TESTGROEP 18: Ontbrekende gegevens en circulaire windrichting ---
console.log('\n--- TESTGROEP 18: Ontbrekende gegevens en circulaire windrichting ---');

const missingContextAdvice = analyzeRodPositioning('2026-07-20', [], 'Karper', {
  location: { ...baseLoc, waterType: undefined, waterDepth: undefined },
  thermalAnalysis: {
    ...mockThermalAnalysis('Onvoldoende gegevens', 20),
    estimatedWaterTemp: null,
    measuredWaterTemp: null,
    hasMeasuredWaterTemp: false,
  },
  historicalSessions: [],
});
assert(
  missingContextAdvice.windContext.speedKmH === null &&
  missingContextAdvice.windContext.directionText === 'Onbekend' &&
  missingContextAdvice.windContext.isCalmWind === undefined,
  '18.1 Lege weersdata blijft onbekend en wordt niet vervangen door standaardwind'
);
assert(
  missingContextAdvice.thermalContext.waterTempNote === 'Geen watertemperatuur bekend' &&
  !missingContextAdvice.rationale.includes('14.0'),
  '18.2 Luchttemperatuur wordt niet als watertemperatuur gebruikt en 14°C wordt niet ingevuld'
);
assert(
  missingContextAdvice.windCastingGuidance === undefined &&
  missingContextAdvice.missingInformation.some((m) => m.toLowerCase().includes('watertype')),
  '18.3 Zonder wind, thermische basis en watertype wordt geen concreet kompasadvies verzonnen'
);
assert(
  getDirectionMeta('Onbekend') === null,
  '18.3a Een onbekende windrichting wordt niet stilzwijgend als zuidwest geïnterpreteerd'
);

const aroundNorthForecast = createHourlyForecasts('2026-07-20', 20, 8, 'N').map((hour, index) => ({
  ...hour,
  windDirection: index % 2 === 0 ? 359 : 1,
  windDirectionText: 'N',
}));
const aroundNorthAdvice = analyzeRodPositioning('2026-07-20', aroundNorthForecast, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 20),
  historicalSessions: [],
});
assert(
  aroundNorthAdvice.windCastingGuidance?.windOrigin.degrees === 0,
  '18.4 Windrichtingen 359° en 1° krijgen correct een circulair gemiddelde rond 0° (noord)'
);

const warmAirColdWaterAdvice = analyzeRodPositioning(
  '2026-07-20',
  createHourlyForecasts('2026-07-20', 30, 8, 'N'),
  'Karper',
  {
    location: baseLoc,
    thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 6),
    historicalSessions: [],
  }
);
assert(
  warmAirColdWaterAdvice.rationale.includes('6.0 °C') &&
  warmAirColdWaterAdvice.recommendedZone.toLowerCase().includes('rustzone'),
  '18.5 Warme lucht overschrijft geen koud gemeten water in de soortspecifieke positioneringshypothese'
);

const opposingWindForecast = createHourlyForecasts('2026-07-20', 20, 10, 'O').map((hour, index) => ({
  ...hour,
  windDirection: index % 2 === 0 ? 90 : 270,
  windDirectionText: index % 2 === 0 ? 'O' : 'W',
}));
const opposingWindAdvice = analyzeRodPositioning('2026-07-20', opposingWindForecast, 'Karper', {
  location: baseLoc,
  thermalAnalysis: mockThermalAnalysis('Ongeveer stabiel', 20),
  historicalSessions: [],
});
assert(
  opposingWindAdvice.windContext.directionText === 'Wisselend' &&
  opposingWindAdvice.windCastingGuidance === undefined &&
  !opposingWindAdvice.recommendedZone.startsWith('Algemene zoekzone'),
  '18.6 Wisselende tegengestelde wind houdt soortadvies bruikbaar maar forceert geen gemiddelde kompasrichting'
);

console.log('\n======================================================');
console.log(`TESTRESULTAAT: ${passed} GESLAAGD, ${failed} MISLUKT`);
console.log('======================================================');

if (failed > 0) process.exit(1);

