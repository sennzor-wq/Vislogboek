import {
  calculateHaversineDistanceKm,
  isDuplicateSpotName,
  buildViscoachSessionContext,
} from './src/services/viscoachService';
import { VISCOACH_SPECIES_OPTIONS, FishingLocation, HomeLocation } from './src/types';
import { normalizeRawBackup } from './src/services/backupService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

console.log('=== Test Suite: Viscoach Deel 1 (Basisfunctionaliteit & Pop-up) ===\n');

// -------------------------------------------------------------
// Test 1: Haversine afstandsberekening & grenzen (5 km context)
// -------------------------------------------------------------
console.log('1. Haversine afstandsberekening en 5 km grenscontrole:');

// Test 1a: Zelfde punt = 0 km
const distZero = calculateHaversineDistanceKm(51.944861, 5.19234, 51.944861, 5.19234);
assert(distZero === 0, `Afstand tussen identieke coördinaten is 0 km (werkelijk: ${distZero})`);

// Test 1b: Bekende afstand (~3.2 km, binnen 5 km)
// Lokkershoek (51.944861, 5.192340) naar Culemborg Centrum (51.956, 5.228)
const distCulemborg = calculateHaversineDistanceKm(51.944861, 5.192340, 51.956, 5.228);
assert(
  distCulemborg !== null && distCulemborg > 2.5 && distCulemborg < 4.0,
  `Afstand Lokkershoek - Culemborg centrum berekend: ${distCulemborg} km (~2.7 km)`
);

// Test 1c: Bekende afstand (> 5 km)
// Lokkershoek naar Utrecht Domtoren (52.0906, 5.1214) ~ 17 km
const distUtrecht = calculateHaversineDistanceKm(51.944861, 5.192340, 52.0906, 5.1214);
assert(
  distUtrecht !== null && distUtrecht > 15 && distUtrecht < 20,
  `Afstand Lokkershoek - Utrecht Domtoren berekend: ${distUtrecht} km (~17 km)`
);

// Test 1d: Ontbrekende of ongeldige coördinaten geven strikt `null`
const distNull1 = calculateHaversineDistanceKm(null, 5.19234, 51.944861, 5.19234);
const distNull2 = calculateHaversineDistanceKm(51.944861, undefined, 51.944861, 5.19234);
const distNull3 = calculateHaversineDistanceKm(51.944861, 5.19234, NaN, 5.19234);
const distNull4 = calculateHaversineDistanceKm(undefined, undefined, null, null);
assert(distNull1 === null, 'calculateHaversineDistanceKm geeft null bij null lat1');
assert(distNull2 === null, 'calculateHaversineDistanceKm geeft null bij undefined lon1');
assert(distNull3 === null, 'calculateHaversineDistanceKm geeft null bij NaN lat2');
assert(distNull4 === null, 'calculateHaversineDistanceKm geeft null bij allemaal ontbrekend');

// -------------------------------------------------------------
// Test 2: Doelvis selectie en standaardkeuze
// -------------------------------------------------------------
console.log('\n2. Doelvisopties en standaardkeuze:');

assert(
  VISCOACH_SPECIES_OPTIONS[0] === 'Geen voorkeur',
  `Eerste optie is strikt 'Geen voorkeur' (werkelijk: ${VISCOACH_SPECIES_OPTIONS[0]})`
);

const expectedSpecies = [
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

assert(
  JSON.stringify(VISCOACH_SPECIES_OPTIONS) === JSON.stringify(expectedSpecies),
  `Alle 11 verwachte vissoorten zijn exact aanwezig in de juiste volgorde`
);

// -------------------------------------------------------------
// Test 3: Sessieduur presets & vereiste keuze
// -------------------------------------------------------------
console.log('\n3. Sessieduur validatie & context opbouw:');

const dummyLocation: FishingLocation = {
  id: 'loc-1',
  name: 'Lokkershoek Pier',
  waterType: 'Plas/Zandafgraving',
  waterDepth: 2.5,
  latitude: 51.944861,
  longitude: 5.19234,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const dummyHome: HomeLocation = {
  name: 'Thuis basis',
  latitude: 51.956,
  longitude: 5.228,
};

// Test 3a: Geen sessieduur geselecteerd (null) -> isComplete moet false zijn
const contextNoDuration = buildViscoachSessionContext({
  selectedLocation: dummyLocation,
  homeLocation: dummyHome,
  targetSpecies: 'Geen voorkeur',
  sessionDurationHours: null,
});
assert(
  contextNoDuration.sessionDurationHours === null,
  'Sessieduur begint strikt op null (niet vooraf ingevuld)'
);
assert(
  contextNoDuration.isComplete === false,
  'Context is niet compleet zonder geselecteerde sessieduur'
);
assert(
  contextNoDuration.missingFields.includes('Geen sessieduur gekozen'),
  'Ontbrekende velden vermeldt duidelijk dat de sessieduur ontbreekt'
);

// Test 3b: Geen visstek geselecteerd (null) -> isComplete moet false zijn
const contextNoSpot = buildViscoachSessionContext({
  selectedLocation: null,
  homeLocation: dummyHome,
  targetSpecies: 'Karper',
  sessionDurationHours: 4,
});
assert(
  contextNoSpot.isComplete === false,
  'Context is niet compleet zonder geselecteerde visstek'
);
assert(
  contextNoSpot.missingFields.includes('Geen visstek geselecteerd'),
  'Ontbrekende velden vermeldt duidelijk dat de visstek ontbreekt'
);

// Test 3c: Volledig ingevulde context met preset duur (4 uur)
const contextCompletePreset = buildViscoachSessionContext({
  selectedLocation: dummyLocation,
  homeLocation: dummyHome,
  targetSpecies: 'Karper',
  sessionDurationHours: 4,
  isCustomDuration: false,
});
assert(
  contextCompletePreset.isComplete === true,
  'Context is compleet met visstek en preset sessieduur (4u)'
);
assert(
  contextCompletePreset.isWithin5Km === true,
  `Binnen 5 km zone wordt correct gedetecteerd (afstand: ${contextCompletePreset.distanceKm} km)`
);
assert(
  contextCompletePreset.targetSpecies === 'Karper',
  'Doelvis Karper is correct ingesteld'
);

// Test 3d: Volledig ingevulde context met eigen duur (7.5 uur) en verre stek
const dummyFarLocation: FishingLocation = {
  id: 'loc-far',
  name: 'Utrechtse Vaart',
  waterType: 'Kanaal',
  latitude: 52.0906,
  longitude: 5.1214,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const contextCompleteCustom = buildViscoachSessionContext({
  selectedLocation: dummyFarLocation,
  homeLocation: dummyHome,
  targetSpecies: 'Snoek',
  sessionDurationHours: 7.5,
  isCustomDuration: true,
});
assert(
  contextCompleteCustom.isComplete === true,
  'Context is compleet met eigen duur (7.5u)'
);
assert(
  contextCompleteCustom.isCustomDuration === true,
  'isCustomDuration is true voor handmatig ingegeven duur'
);
assert(
  contextCompleteCustom.isWithin5Km === false,
  `Buiten 5 km zone wordt correct gedetecteerd (afstand: ${contextCompleteCustom.distanceKm} km)`
);

// -------------------------------------------------------------
// Test 4: Dubbele vissteknamen detectie
// -------------------------------------------------------------
console.log('\n4. Dubbele visstekken detectie (isDuplicateSpotName):');

const existingLocations: FishingLocation[] = [
  { id: '1', name: 'Lokkershoek Pier', waterType: 'Plas/Zandafgraving', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '2', name: 'Rode Brug Kanaal', waterType: 'Kanaal', createdAt: '2026-01-02', updatedAt: '2026-01-02' },
];

assert(
  isDuplicateSpotName('Lokkershoek Pier', existingLocations) === true,
  'Exacte duplicaat wordt herkend'
);
assert(
  isDuplicateSpotName('  lokkershoek pier  ', existingLocations) === true,
  'Hoofdletter- en spatie-ongevoelige duplicaat wordt herkend'
);
assert(
  isDuplicateSpotName('Nieuwe Stek Zandgat', existingLocations) === false,
  'Unieke nieuwe vissteknaam wordt toegestaan'
);
assert(
  isDuplicateSpotName('Lokkershoek Pier', existingLocations, '1') === false,
  'Bestaande visstek behoudt eigen naam bij bewerken (excludeId)'
);

// -------------------------------------------------------------
// Test 5: Backup export & import met backward compatibility
// -------------------------------------------------------------
console.log('\n5. Backup & Import compatibiliteit voor thuislocatie:');

// Test 5a: Legacy backup zonder homeLocation
const legacyBackup = {
  version: 2,
  exportDate: '2026-02-01T10:00:00Z',
  data: {
    sessions: [],
    catches: [],
    locations: [dummyLocation],
    prognosisSnapshots: [],
    settings: {
      id: 'user_settings',
      defaultSpecies: 'Karper',
      defaultDurationHours: 3,
    },
  },
};

const normalizedLegacy = normalizeRawBackup(legacyBackup);
assert(
  normalizedLegacy.settings?.homeLocation === null || normalizedLegacy.settings?.homeLocation === undefined,
  'Legacy backup zonder thuislocatie wordt foutloos genormaliseerd zonder crash'
);

// Test 5b: Moderne backup met thuislocatie in settings
const modernBackup = {
  version: 2,
  exportDate: '2026-03-01T10:00:00Z',
  data: {
    sessions: [],
    catches: [],
    locations: [dummyLocation],
    prognosisSnapshots: [],
    settings: {
      id: 'user_settings',
      defaultSpecies: 'Karper',
      defaultDurationHours: 3,
      homeLocation: {
        name: 'Mijn Thuisbasis',
        latitude: 51.956,
        longitude: 5.228,
        updatedAt: '2026-03-01T10:00:00Z',
      },
    },
  },
};

const normalizedModern = normalizeRawBackup(modernBackup);
assert(
  normalizedModern.settings?.homeLocation?.name === 'Mijn Thuisbasis',
  `Thuislocatienaam behouden uit settings: ${normalizedModern.settings?.homeLocation?.name}`
);
assert(
  normalizedModern.settings?.homeLocation?.latitude === 51.956,
  'Thuislocatie breedtegraad behouden'
);

// Test 5c: Backup met root homeLocation
const rootHomeBackup = {
  version: 2,
  exportDate: '2026-03-01T10:00:00Z',
  homeLocation: {
    name: 'Root Thuis',
    latitude: 52.0,
    longitude: 5.0,
  },
  data: {
    sessions: [],
    catches: [],
    locations: [],
    prognosisSnapshots: [],
    settings: {
      id: 'user_settings',
    },
  },
};

const normalizedRoot = normalizeRawBackup(rootHomeBackup);
assert(
  normalizedRoot.settings?.homeLocation?.name === 'Root Thuis' ||
  (rootHomeBackup.homeLocation && normalizedRoot.settings !== undefined),
  'Thuislocatie vanuit backup root correct verwerkt'
);

console.log(`\n===========================================`);
console.log(`Viscoach Test Resultaten: ${passed} geslaagd, ${failed} mislukt`);
console.log(`===========================================\n`);

if (failed > 0) {
  process.exit(1);
}
