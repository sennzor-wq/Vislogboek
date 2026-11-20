import { RESEARCH_REGISTRY, getResearchByTopic, getResearchBySpecies, getResearchByOutcome, isApprovedPredictionKnowledge, ResearchOutcome } from './src/services/researchRegistry';
import { SPECIES_PROFILES } from './src/services/fishProfiles';

const thermalEntries = getResearchByTopic('watertemperatuur');
if (thermalEntries.length !== 3) throw new Error('Expected the three reviewed water-temperature evidence entries.');
const entry = thermalEntries[0];
if (!entry.sourceReferences.some((source) => source.includes('10.1029/2023RG000816'))) {
  throw new Error('The lake thermal modelling review DOI must be retained.');
}
if (entry.approvedForPrediction || isApprovedPredictionKnowledge(entry)) {
  throw new Error('A general lake thermal review must not silently approve a direct prediction rule.');
}
if (entry.limitations.length < 3) {
  throw new Error('The thermal evidence entry must retain its applicability limitations.');
}
if (!RESEARCH_REGISTRY.includes(entry)) {
  throw new Error('The reviewed entry must be present in the central registry.');
}
console.log('Research registry tests passed.');

const lakeCalibrationEvidence = getResearchByTopic('watertemperatuur-modelkalibratie').find(
  (item) => item.id === 'lake-temperature-models-multi-lake-calibration-2025'
);
if (!lakeCalibrationEvidence ||
    lakeCalibrationEvidence.approvedForPrediction ||
    isApprovedPredictionKnowledge(lakeCalibrationEvidence) ||
    !lakeCalibrationEvidence.limitations.some((item) => item.includes('73 meren') || item.includes('Nederlandse stek')) ||
    !lakeCalibrationEvidence.sourceReferences.some((source) => source.includes('10.5194/hess-29-1183-2025'))) {
  throw new Error('Multi-lake model calibration evidence must be discoverable, scoped and non-approved for prediction.');
}


const carpEvidence = getResearchBySpecies('Karper');
if (!carpEvidence.some((item) => item.id === 'common-carp-temperature-feeding-rhythm-2012')) {
  throw new Error('Carp-specific feeding-rhythm evidence must be discoverable by species.');
}
const carpWildRiver = RESEARCH_REGISTRY.find((item) => item.id === 'common-carp-wild-river-diel-feeding-1992');
if (
  !carpWildRiver ||
  !carpWildRiver.species.includes('Karper') ||
  !carpWildRiver.measuredOutcomes?.includes('feeding_rhythm') ||
  !carpWildRiver.measuredOutcomes?.includes('feeding_intensity') ||
  carpWildRiver.approvedForPrediction ||
  !carpWildRiver.summary.includes('zonsopkomst') ||
  !carpWildRiver.limitations.some((item) => item.includes('Illinois')) ||
  !carpWildRiver.sourceReferences.some((source) => source.includes('10.1139/f92-157'))
) {
  throw new Error('Wild-river carp feeding evidence must retain its measured outcome, source scope and non-approved status.');
}



const adultAydatRation = RESEARCH_REGISTRY.find((item) => item.id === 'adult-roach-perch-lake-aydat-daily-consumption-1994');
if (
  !adultAydatRation ||
  !['Baars', 'Voorn'].every((species) => adultAydatRation.species.includes(species as any)) ||
  !adultAydatRation.measuredOutcomes?.includes('feeding_intensity') ||
  !adultAydatRation.measuredOutcomes?.includes('diet_composition') ||
  adultAydatRation.approvedForPrediction ||
  !adultAydatRation.summary.includes('Eggers-model') ||
  !adultAydatRation.limitations.some((item) => item.includes('één eutroof Frans meer')) ||
  !adultAydatRation.limitations.some((item) => item.includes('niet als zuivere temperatuurcausaliteit')) ||
  !adultAydatRation.sourceReferences.some((source) => source.includes('10.1007/BF00877183'))
) {
  throw new Error('Jamet adult roach/perch field-ration evidence must remain model-qualified and non-approved.');
}
if (
  !SPECIES_PROFILES.Baars.scientificReferences.some((source) => source.includes('10.1007/BF00877183')) ||
  !SPECIES_PROFILES.Voorn.scientificReferences.some((source) => source.includes('10.1007/BF00877183'))
) {
  throw new Error('Jamet adult field-ration source must be linked to perch and roach profiles.');
}
const larvalPercidRation = RESEARCH_REGISTRY.find((item) => item.id === 'larval-perch-pikeperch-field-daily-ration-worischka-mehner-1998');
if (
  !larvalPercidRation ||
  !['Baars', 'Snoekbaars'].every((species) => larvalPercidRation.species.includes(species as any)) ||
  !larvalPercidRation.measuredOutcomes?.includes('feeding_intensity') ||
  larvalPercidRation.approvedForPrediction ||
  !larvalPercidRation.summary.includes('elk uur bemonsteren') ||
  !larvalPercidRation.limitations.some((item) => item.includes('larvale vissen')) ||
  !larvalPercidRation.limitations.some((item) => item.includes('41–72%')) ||
  !larvalPercidRation.sourceReferences.some((source) => source.includes('10.1111/j.1095-8649.1998.tb00462.x'))
) {
  throw new Error('Worischka & Mehner larval perch/pikeperch field-ration evidence must remain scoped and non-approved.');
}
if (
  !SPECIES_PROFILES.Baars.scientificReferences.some((source) => source.includes('10.1111/j.1095-8649.1998.tb00462.x')) ||
  !SPECIES_PROFILES.Snoekbaars.scientificReferences.some((source) => source.includes('10.1111/j.1095-8649.1998.tb00462.x'))
) {
  throw new Error('The larval percid field-ration source must be linked to both species profiles.');
}
const adultPerchRation = RESEARCH_REGISTRY.find((item) => item.id === 'adult-perch-loch-leven-daily-ration-1977');
if (
  !adultPerchRation ||
  !adultPerchRation.species.includes('Baars') ||
  !adultPerchRation.measuredOutcomes?.includes('feeding_intensity') ||
  !adultPerchRation.measuredOutcomes?.includes('feeding_rhythm') ||
  adultPerchRation.approvedForPrediction ||
  !adultPerchRation.summary.includes('volwassen baars') ||
  !adultPerchRation.limitations.some((item) => item.includes('minimale schattingen')) ||
  !adultPerchRation.sourceReferences.some((source) => source.includes('10.1111/j.1095-8649.1977.tb04098.x'))
) {
  throw new Error('Adult perch field-ration evidence must retain its adult scope, minimum-estimate caveat and non-approved status.');
}
if (!SPECIES_PROFILES.Baars.scientificReferences.some((source) => source.includes('10.1111/j.1095-8649.1977.tb04098.x'))) {
  throw new Error('The perch profile must link the adult field-ration source.');
}
const breamEvidence = getResearchBySpecies('Brasem');
const growthStudy = breamEvidence.find((item) => item.id === 'freshwater-fish-temperature-growth-four-species-tien-2024');
if (!growthStudy || growthStudy.approvedForPrediction) {
  throw new Error('The Dutch lake growth study must be available as non-approved biological evidence.');
}
if (!growthStudy.limitations.some((item) => item.includes('acute activiteit'))) {
  throw new Error('Growth evidence must explicitly be distinguished from acute activity.');
}
const tenchEvidence = getResearchBySpecies('Zeelt');
if (!tenchEvidence.some((item) => item.id === 'tench-temperature-feeding-efficiency-2026' && !item.approvedForPrediction)) {
  throw new Error('Tench feeding evidence must remain contextual and non-approved for prediction.');
}
console.log('Species biology evidence tests passed.');

if (!SPECIES_PROFILES.Karper.scientificReferences.some((source) => source.includes('10.1016/S1006-8104(12)60039-7'))) {
  throw new Error('The carp profile must link its species-specific feeding-rhythm study.');
}
for (const [species, doi] of [
  ['Karper', '10.1111/j.1095-8649.1985.tb03196.x'],
  ['Karper', '10.1111/j.1095-8649.2002.tb01717.x'],
  ['Brasem', '10.1111/j.1095-8649.2002.tb01717.x'],
  ['Voorn', '10.1111/j.1095-8649.2002.tb01717.x'],
] as const) {
  if (!SPECIES_PROFILES[species].scientificReferences.some((source) => source.includes(doi))) {
    throw new Error(`The ${species} profile must link field-ration evidence ${doi}.`);
  }
}
if (!SPECIES_PROFILES.Brasem.scientificReferences.some((source) => source.includes('10.1111/jfb.15745'))) {
  throw new Error('The bream profile must link the Dutch lake growth study with its scope limitation.');
}
if (!SPECIES_PROFILES.Zeelt.scientificReferences.some((source) => source.includes('10.1007/s10530-026-03767-w'))) {
  throw new Error('The tench profile must link the limited experimental feeding study.');
}
console.log('Species profile source-link tests passed.');


const coveredSpecies = ['Karper', 'Brasem', 'Snoek', 'Baars', 'Voorn', 'Zeelt', 'Snoekbaars', 'Meerval', 'Roofblei'];
for (const species of coveredSpecies) {
  const entries = RESEARCH_REGISTRY.filter((item) => item.species.includes(species));
  if (entries.length === 0) {
    throw new Error(`The central research registry must contain species-linked evidence for ${species}.`);
  }
  if (entries.some((item) => item.approvedForPrediction)) {
    throw new Error(`Evidence for ${species} must not silently activate a prediction rule.`);
  }
}
if (RESEARCH_REGISTRY.some((item) => item.species.includes('Overig'))) {
  throw new Error('The generic Overig fallback must not be presented as a biological species.');
}
const sharedPikeEvidence = getResearchBySpecies('Snoekbaars').find((item) => item.id === 'northern-pike-lowland-river-movement-habitat-2025');
if (!sharedPikeEvidence || !sharedPikeEvidence.species.includes('Snoek')) {
  throw new Error('The lowland-river telemetry study must be linked to both pike and pikeperch.');
}
console.log('All concrete species have registered, non-approved biological evidence.');
const directFeedingEvidenceBySpecies: Record<string, string> = {
  Karper: 'common-carp-diel-grazing-food-type-2009',
  Brasem: 'bream-roach-in-situ-diel-zooplankton-feeding-2004',
  Snoek: 'northern-pike-field-seasonal-feeding-diet-2025',
  Baars: 'perch-field-diel-feeding-seasonal-diet-1986',
  Voorn: 'roach-autumnal-diel-feeding-shift-2008',
  Zeelt: 'tench-field-diel-seasonal-feeding-2018',
  Snoekbaars: 'pikeperch-winter-spring-feeding-temperature-2020',
  Meerval: 'wels-catfish-seasonal-diet-feeding-2025',
  Roofblei: 'asp-pikeperch-ontogenetic-diet-two-reservoirs-2018',
};
for (const [species, id] of Object.entries(directFeedingEvidenceBySpecies)) {
  const evidence = RESEARCH_REGISTRY.find((item) => item.id === id);
  if (!evidence || !evidence.species.includes(species)) {
    throw new Error(`Direct feeding/diet evidence must be linked to ${species}.`);
  }
  if (evidence.approvedForPrediction || evidence.sourceReferences.length === 0 || evidence.limitations.length === 0) {
    throw new Error(`Feeding evidence for ${species} must retain source limitations and remain non-approved.`);
  }
}
const welsSeasonalField = RESEARCH_REGISTRY.find((item) => item.id === 'wels-catfish-seasonal-diet-feeding-2025');
if (
  !welsSeasonalField ||
  !welsSeasonalField.species.includes('Meerval') ||
  !welsSeasonalField.measuredOutcomes?.includes('feeding_intensity') ||
  welsSeasonalField.approvedForPrediction ||
  !welsSeasonalField.limitations.some((item) => item.includes('winter n=7')) ||
  !welsSeasonalField.limitations.some((item) => item.includes('geen gerapporteerde watertemperatuurreeks')) ||
  !welsSeasonalField.limitations.some((item) => item.includes('geen diel-/tijdvaklabels')) ||
  !welsSeasonalField.sourceReferences.some((source) => source.includes('10.1155/anu/4619857'))
) {
  throw new Error('Wels catfish 2025 stomach-fullness evidence must preserve seasonal sample imbalance and lack of temperature/diel labels.');
}
const pikeFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'northern-pike-field-seasonal-feeding-diet-2025');
if (!pikeFeeding?.summary.includes('niet statistisch significant')) {
  throw new Error('The pike evidence must preserve the non-significant seasonal/temperature result.');
}
const pikeFunctionalResponse = RESEARCH_REGISTRY.find((item) => item.id === 'northern-pike-functional-response-temperature-browning-2026');
if (
  !pikeFunctionalResponse ||
  !pikeFunctionalResponse.species.includes('Snoek') ||
  !pikeFunctionalResponse.measuredOutcomes?.includes('feeding_intensity') ||
  pikeFunctionalResponse.approvedForPrediction ||
  !pikeFunctionalResponse.summary.includes('0+-snoek') ||
  !pikeFunctionalResponse.limitations.some((item) => item.includes('volwassen snoek')) ||
  !pikeFunctionalResponse.limitations.some((item) => item.includes('experimentele vijvers')) ||
  !pikeFunctionalResponse.limitations.some((item) => item.includes('geen gekoppelde voedingsmetingen')) ||
  !pikeFunctionalResponse.sourceReferences.some((source) => source.includes('10.1111/1365-2656.70233')) ||
  !pikeFunctionalResponse.sourceReferences.some((source) => source.includes('10.5061/dryad.kkwh70sjc'))
) {
  throw new Error('The 2026 pike functional-response dataset must remain direct, scoped and non-approved evidence.');
}
const catfishFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'wels-catfish-seasonal-diet-feeding-2025');
if (!catfishFeeding?.sourceReferences.some((source) => source.includes('Aquaculture Nutrition'))) {
  throw new Error('The catfish feeding study must retain its verified journal metadata.');
}

const carpFieldRation = RESEARCH_REGISTRY.find((item) => item.id === 'common-carp-in-situ-daily-consumption-gastric-evacuation-1985');
const cyprinidFieldRation = RESEARCH_REGISTRY.find((item) => item.id === 'cyprinid-in-situ-daily-ration-lake-balaton-2002');
if (
  !carpFieldRation ||
  !carpFieldRation.species.includes('Karper') ||
  !carpFieldRation.measuredOutcomes?.includes('feeding_intensity') ||
  carpFieldRation.approvedForPrediction ||
  !carpFieldRation.summary.includes('niet statistisch significant') ||
  !carpFieldRation.limitations.some((item) => item.includes('lediging')) ||
  !carpFieldRation.sourceReferences.some((source) => source.includes('10.1111/j.1095-8649.1985.tb03196.x'))
) {
  throw new Error('The 1985 carp field-ration estimate must remain scoped, method-qualified and non-approved.');
}
if (
  !cyprinidFieldRation ||
  !['Karper', 'Brasem', 'Voorn'].every((species) => cyprinidFieldRation.species.includes(species as any)) ||
  !cyprinidFieldRation.measuredOutcomes?.includes('feeding_intensity') ||
  cyprinidFieldRation.approvedForPrediction ||
  !cyprinidFieldRation.summary.includes('één rantsoenwaarneming') ||
  !cyprinidFieldRation.limitations.some((item) => item.includes('brasem')) ||
  !cyprinidFieldRation.sourceReferences.some((source) => source.includes('10.1111/j.1095-8649.2002.tb01717.x'))
) {
  throw new Error('The Lake Balaton cyprinid ration estimates must retain their species scope, model limits and non-approved status.');
}
console.log('Direct feeding evidence coverage and non-activation tests passed.');
const profileFeedingSourceChecks: Record<string, string> = {
  Karper: '10.1111/j.1095-8649.2009.02236.x',
  Brasem: 'In situ diel patterns of zooplankton consumption',
  Snoek: '10.1111/1365-2656.70233',
  Baars: 'annzool.net/PDF/anzf23/anz23-049-056.pdf',
  Voorn: '10.1111/j.1095-8649.2008.02020.x',
  Zeelt: '10.1134/S003294521804001X',
  Snoekbaars: '10.1111/are.14401',
  Meerval: '10.1155/anu/4619857',
  Roofblei: '10.1111/eff.12414',
};
for (const [species, reference] of Object.entries(profileFeedingSourceChecks)) {
  if (!SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES].scientificReferences.some((source) => source.includes(reference))) {
    throw new Error(`The ${species} profile must link its reviewed feeding/diet evidence.`);
  }
}
console.log('All species profiles link their feeding evidence sources.');



// Measured outcomes are explicit study classifications, not inferred from topic wording.
const outcomeExpectations: Array<[string, string, string]> = [
  ['Karper', 'common-carp-temperature-feeding-rhythm-2012', 'feeding_intensity'],
  ['Brasem', 'bream-roach-in-situ-diel-zooplankton-feeding-2004', 'feeding_intensity'],
  ['Snoek', 'northern-pike-field-seasonal-feeding-diet-2025', 'diet_composition'],
  ['Snoek', 'northern-pike-functional-response-temperature-browning-2026', 'feeding_intensity'],
  ['Baars', 'perch-field-diel-feeding-seasonal-diet-1986', 'feeding_rhythm'],
  ['Baars', 'adult-perch-loch-leven-daily-ration-1977', 'feeding_intensity'],
  ['Baars', 'larval-perch-pikeperch-field-daily-ration-worischka-mehner-1998', 'feeding_intensity'],
  ['Baars', 'adult-roach-perch-lake-aydat-daily-consumption-1994', 'feeding_intensity'],
  ['Voorn', 'adult-roach-perch-lake-aydat-daily-consumption-1994', 'feeding_intensity'],
  ['Baars', 'adult-roach-perch-lake-aydat-daily-consumption-1994', 'diet_composition'],
  ['Voorn', 'adult-roach-perch-lake-aydat-daily-consumption-1994', 'diet_composition'],
  ['Snoekbaars', 'larval-perch-pikeperch-field-daily-ration-worischka-mehner-1998', 'feeding_intensity'],
  ['Voorn', 'roach-autumnal-diel-feeding-shift-2008', 'feeding_rhythm'],
  ['Zeelt', 'tench-field-diel-seasonal-feeding-2018', 'feeding_intensity'],
  ['Snoekbaars', 'pikeperch-winter-spring-feeding-temperature-2020', 'feeding_physiology'],
  ['Meerval', 'wels-catfish-seasonal-diet-feeding-2025', 'diet_composition'],
  ['Roofblei', 'asp-pikeperch-ontogenetic-diet-two-reservoirs-2018', 'prey_selection'],
];
for (const [species, id, outcome] of outcomeExpectations) {
  const matches = getResearchByOutcome(species, outcome as ResearchOutcome);
  if (!matches.some((item) => item.id === id)) {
    throw new Error(`The measured outcome ${outcome} must be explicitly discoverable for ${species}.`);
  }
  if (matches.some((item) => item.approvedForPrediction)) {
    throw new Error(`Outcome classification must not approve prediction factors for ${species}.`);
  }
}
const aspFeedingIntensity = getResearchByOutcome('Roofblei', 'feeding_intensity');
if (aspFeedingIntensity.length !== 0) {
  throw new Error('Asp diet/prey-selection evidence must not be misclassified as measured feeding intensity.');
}
const aspDiet = getResearchByOutcome('Roofblei', 'diet_composition');
if (!aspDiet.some((item) => item.id === 'asp-pikeperch-ontogenetic-diet-two-reservoirs-2018')) {
  throw new Error('Asp ontogenetic diet evidence must remain discoverable as diet composition.');
}
const growthOnly = getResearchByOutcome('Brasem', 'growth');
if (!growthOnly.some((item) => item.id === 'freshwater-fish-temperature-growth-four-species-tien-2024')) {
  throw new Error('Growth evidence must remain separately classified from feeding intensity.');
}
console.log('Measured biological outcome classification tests passed.');


const metabolicEvidenceExpectations: Array<[string, string]> = [
  ['Karper', 'common-carp-acute-temperature-metabolism-1983'],
  ['Snoek', 'northern-pike-metabolic-rate-temperature-1982'],
  ['Baars', 'european-perch-aerobic-scope-size-temperature-2020'],
  ['Brasem', 'roach-bream-metabolic-rate-temperature-2006'],
  ['Voorn', 'roach-bream-metabolic-rate-temperature-2006'],
  ['Snoekbaars', 'adult-pikeperch-aerobic-scope-temperature-2012'],
];
for (const [species, id] of metabolicEvidenceExpectations) {
  const entry = getResearchByOutcome(species, 'metabolic_rate').find((item) => item.id === id);
  if (!entry || entry.approvedForPrediction || entry.limitations.length === 0 || entry.sourceReferences.length === 0) {
    throw new Error(`Thermal metabolic evidence for ${species} must be discoverable, limited and non-approved.`);
  }
}
for (const species of ['Baars', 'Snoekbaars']) {
  if (!getResearchByOutcome(species, 'aerobic_scope').some((item) => !item.approvedForPrediction)) {
    throw new Error(`Aerobic-scope evidence must remain separate and non-approved for ${species}.`);
  }
}
if (getResearchByOutcome('Baars', 'feeding_intensity').some((item) => item.id === 'european-perch-aerobic-scope-size-temperature-2020')) {
  throw new Error('Aerobic-scope evidence must not be misclassified as feeding intensity.');
}
if (getResearchByOutcome('Snoekbaars', 'feeding_intensity').some((item) => item.id === 'adult-pikeperch-aerobic-scope-temperature-2012')) {
  throw new Error('Metabolic-scope evidence must not be misclassified as feeding intensity.');
}
console.log('Thermal physiology evidence classification tests passed.');


const thermalProfileSourceChecks: Record<string, string[]> = {
  Karper: ['10.1086/physzool.56.3.30152604'],
  Snoek: ['10.1016/0300-9629(82)90424-8'],
  Baars: ['10.1111/jfb.14435'],
  Brasem: ['10.1163/157075606775904713'],
  Voorn: ['10.1046/j.1095-8649.2003.00048.x', '10.1163/157075606775904713'],
  Snoekbaars: ['10.1016/j.aquaculture.2011.10.024'],
};
for (const [species, references] of Object.entries(thermalProfileSourceChecks)) {
  const profile = SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES];
  for (const reference of references) {
    if (!profile.scientificReferences.some((source) => source.includes(reference))) {
      throw new Error(`The ${species} profile must link thermal physiology source ${reference}.`);
    }
  }
}
console.log('Species thermal physiology profile source links passed.');


// Daily movement evidence must remain separate from measured feeding evidence.
const pikeDirectFeeding = getResearchByOutcome('Snoek', 'feeding_intensity').find((item) => item.id === 'northern-pike-heart-rate-feeding-day-1991');
if (!pikeDirectFeeding || pikeDirectFeeding.approvedForPrediction || pikeDirectFeeding.measuredOutcomes?.includes('feeding_rhythm')) {
  throw new Error('Pike heart-rate telemetry supports feeding-intensity context, not a quantified diel feeding-rhythm factor.');
}
const pikeDielFeeding = getResearchByOutcome('Snoek', 'feeding_rhythm').find((item) => item.id === 'pike-juvenile-feeding-rhythm-first-year-1998');
if (!pikeDielFeeding || pikeDielFeeding.approvedForPrediction || !pikeDielFeeding.limitations.some((item) => item.includes('jonger dan één jaar'))) {
  throw new Error('Pike diel feeding evidence must retain its juvenile-only scope and remain non-approved.');
}
const pikeMovement = getResearchByOutcome('Snoek', 'locomotor_activity').find((item) => item.id === 'northern-pike-diel-movement-lac-ste-anne-1980');
const pikeDuskMovement = getResearchByOutcome('Snoek', 'locomotor_activity').find((item) => item.id === 'pike-dusk-habitat-change-visibility-2012');
if (!pikeDuskMovement || pikeDuskMovement.measuredOutcomes?.includes('feeding_rhythm')) {
  throw new Error('Pike dusk habitat-change evidence must remain movement/habitat context, not feeding rhythm.');
}
if (!pikeMovement || pikeMovement.measuredOutcomes?.includes('feeding_rhythm')) {
  throw new Error('Pike movement evidence must not be misclassified as feeding rhythm.');
}
const zanderFeedingRhythm = getResearchByOutcome('Snoekbaars', 'feeding_rhythm').find((item) => item.id === 'pikeperch-lake-ladoga-daily-feeding-rhythm-1982');
if (!zanderFeedingRhythm || zanderFeedingRhythm.approvedForPrediction || !zanderFeedingRhythm.summary.includes('vroege ochtend')) {
  throw new Error('Pikeperch feeding rhythm must retain its seasonal morning/evening variation and remain non-approved.');
}
const zanderMovement = getResearchByOutcome('Snoekbaars', 'locomotor_activity');
if (!zanderMovement.some((item) => item.id === 'pikeperch-diel-activity-dusk-drainage-canal-2005') ||
    !zanderMovement.some((item) => item.id === 'pikeperch-diel-distribution-elbe-river-2008') ||
    zanderMovement.some((item) => item.measuredOutcomes?.includes('feeding_rhythm'))) {
  throw new Error('Pikeperch dusk movement and night habitat evidence must remain locomotor/habitat context, not feeding rhythm.');
}
const aspMovement = getResearchByOutcome('Roofblei', 'locomotor_activity').find((item) => item.id === 'asp-annual-diel-activity-northern-population-2022');
if (!aspMovement || aspMovement.approvedForPrediction || aspMovement.measuredOutcomes?.includes('feeding_rhythm')) {
  throw new Error('Asp diel telemetry must remain non-approved locomotor evidence, not a direct feeding rhythm.');
}
for (const [species, refs] of Object.entries({
  Snoek: ['10.1111/j.1095-8649.1991.tb04366.x', '10.1139/f80-187'],
  Snoekbaars: ['10.1007/s10750-004-6823-6', '10.1007/s10750-008-9503-0'],
  Roofblei: ['10.1007/s10641-022-01298-6'],
})) {
  for (const ref of refs) {
    if (!SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES].scientificReferences.some((source) => source.includes(ref))) {
      throw new Error(`The ${species} profile must link its reviewed diel-behaviour source ${ref}.`);
    }
  }
}
console.log('Diel behaviour evidence and measured-outcome separation tests passed.');


for (const [species, source] of Object.entries({
  Snoek: ['10.1111/j.1095-8649.2012.03284.x', 'Feeding rhythm and gastric emptying in the pike'],
  Snoekbaars: ['Daily feeding rhythm of pike-perch'],
})) {
  for (const reference of source) {
    if (!SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES].scientificReferences.some((item) => item.includes(reference))) {
      throw new Error(`The ${species} profile must link its newly reviewed daily-behaviour source ${reference}.`);
    }
  }
}


// Daypart explanations are tested through the diel-evidence service, not profile hints.

const roachDielFeeding = RESEARCH_REGISTRY.find(
  (item) => item.id === 'roach-diel-diet-and-habitat-shifts-2002-2004'
);
const roachDielMovement = RESEARCH_REGISTRY.find(
  (item) => item.id === 'roach-diel-movement-clear-turbid-lakes-2004'
);
const roachAgeFeeding = RESEARCH_REGISTRY.find(
  (item) => item.id === 'roach-diel-feeding-cycle-lake-aydat-1990'
);
const breamRoachFeeding = RESEARCH_REGISTRY.find(
  (item) => item.id === 'bream-roach-in-situ-diel-zooplankton-feeding-2004'
);
if (!roachDielFeeding ||
    !roachDielFeeding.measuredOutcomes?.includes('feeding_rhythm') ||
    !roachDielFeeding.measuredOutcomes?.includes('feeding_intensity') ||
    roachDielFeeding.measuredOutcomes.includes('locomotor_activity') ||
    roachDielFeeding.approvedForPrediction ||
    !roachDielFeeding.sourceReferences.some((source) => source.includes('10.1111/j.1095-8649.2002.tb02415.x'))) {
  throw new Error('Haertel & Eckmann roach diet/feeding evidence must be direct feeding evidence, not movement telemetry.');
}
if (!roachDielMovement ||
    !roachDielMovement.measuredOutcomes?.includes('locomotor_activity') ||
    !roachDielMovement.measuredOutcomes?.includes('habitat_use') ||
    roachDielMovement.measuredOutcomes.includes('feeding_rhythm') ||
    roachDielMovement.approvedForPrediction ||
    !roachDielMovement.sourceReferences.some((source) => source.includes('10.1111/j.0022-1112.2004.00436.x'))) {
  throw new Error('Jacobsen roach radio telemetry must remain movement/habitat evidence only.');
}
if (!roachAgeFeeding?.summary.includes('253 blankvoorns') ||
    !roachAgeFeeding.summary.includes('98–240 mm') ||
    !roachAgeFeeding.summary.includes('14:00')) {
  throw new Error('Jamet roach feeding evidence must preserve its sample, size and age-specific time scope.');
}
if (!breamRoachFeeding?.summary.includes('110–170 mm') ||
    !breamRoachFeeding.limitations.some((item) => item.includes('lengteklasse')) ||
    breamRoachFeeding.approvedForPrediction) {
  throw new Error('Vašek & Kubečka bream/roach feeding evidence must retain its size-class and seasonal limits.');
}
for (const reference of ['10.1111/j.1095-8649.2002.tb02415.x','10.1111/j.0022-1112.2004.00436.x','10.1127/archiv-hydrobiol/118/1990/371']) {
  if (!SPECIES_PROFILES.Voorn.scientificReferences.some((source) => source.includes(reference))) {
    throw new Error('The roach profile must link reviewed diel source ' + reference + '.');
  }
}

const catfishDiel = RESEARCH_REGISTRY.find(
  (item) => item.id === 'european-catfish-diel-feeding-self-feeder-1995'
);
if (!catfishDiel ||
    !catfishDiel.species.includes('Meerval') ||
    !catfishDiel.measuredOutcomes?.includes('feeding_rhythm') ||
    !catfishDiel.measuredOutcomes?.includes('feeding_intensity') ||
    catfishDiel.approvedForPrediction ||
    !catfishDiel.limitations.some((item) => item.includes('Levensfase')) ||
    !catfishDiel.limitations.some((item) => item.includes('Sociale context')) ||
    !catfishDiel.sourceReferences.some((source) => source.includes('10.1016/0031-9384(95)00109-V'))) {
  throw new Error('Catfish controlled nocturnal feeding evidence must retain its source, social/life-stage limitations and non-approved status.');
}
const catfishLegacyMovement = RESEARCH_REGISTRY.find(
  (item) => item.id === 'european-catfish-feeding-and-activity-rhythms-1995-2012'
);
if (!catfishLegacyMovement ||
    catfishLegacyMovement.measuredOutcomes?.length !== 1 ||
    !catfishLegacyMovement.measuredOutcomes.includes('locomotor_activity') ||
    catfishLegacyMovement.sourceReferences.some((source) => source.includes('10.1016/0031-9384(95)00109-V'))) {
  throw new Error('Catfish EMG telemetry must remain movement-only; Boujard feeding evidence must be separately registered.');
}
const catfishAdultTelemetry = RESEARCH_REGISTRY.find(
  (item) => item.id === 'adult-catfish-diel-activity-reservoir-2025'
);
if (!catfishAdultTelemetry ||
    !catfishAdultTelemetry.measuredOutcomes?.includes('locomotor_activity') ||
    !catfishAdultTelemetry.measuredOutcomes?.includes('habitat_use') ||
    catfishAdultTelemetry.measuredOutcomes.includes('feeding_rhythm') ||
    catfishAdultTelemetry.approvedForPrediction ||
    !catfishAdultTelemetry.sourceReferences.some((source) => source.includes('10.1111/eff.12817'))) {
  throw new Error('Adult catfish reservoir telemetry must be source-linked movement/depth evidence, not feeding evidence.');
}
const catfishNorthernFringe = RESEARCH_REGISTRY.find(
  (item) => item.id === 'adult-catfish-northern-fringe-seasonal-diel-movement-2024'
);
if (!catfishNorthernFringe ||
    !catfishNorthernFringe.measuredOutcomes?.includes('locomotor_activity') ||
    !catfishNorthernFringe.measuredOutcomes?.includes('habitat_use') ||
    catfishNorthernFringe.measuredOutcomes.includes('feeding_rhythm') ||
    catfishNorthernFringe.approvedForPrediction ||
    !catfishNorthernFringe.summary.includes('15 loggers') ||
    !catfishNorthernFringe.limitations.some((item) => item.includes('geen directe meting van voedselopname')) ||
    !catfishNorthernFringe.sourceReferences.some((source) => source.includes('10.3390/fishes9070280'))) {
  throw new Error('Northern-fringe catfish telemetry must remain seasonally scoped movement/habitat evidence, not direct feeding evidence.');
}
for (const reference of ['10.1016/0031-9384(95)00109-V', '10.1111/j.1095-8649.2012.03436.x', '10.1111/eff.12817', '10.3390/fishes9070280']) {
  if (!SPECIES_PROFILES.Meerval.scientificReferences.some((source) => source.includes(reference))) {
    throw new Error('The catfish profile must link the reviewed source ' + reference + '.');
  }
}

const juvenileCyprinidEvidence = RESEARCH_REGISTRY.find(
  (item) => item.id === 'juvenile-cyprinid-night-feeding-bavarian-lakes-1979'
);
if (!juvenileCyprinidEvidence ||
    !juvenileCyprinidEvidence.species.includes('Brasem') ||
    !juvenileCyprinidEvidence.species.includes('Voorn') ||
    !juvenileCyprinidEvidence.measuredOutcomes?.includes('feeding_rhythm') ||
    juvenileCyprinidEvidence.approvedForPrediction ||
    !juvenileCyprinidEvidence.sourceReferences.some((source) => source.includes('10.1007/BF00545241'))) {
  throw new Error('Bohl juvenile night-feeding evidence must be registered for bream/roach, source-linked and non-approved.');
}
if (SPECIES_PROFILES.Voorn.dutchName !== 'Blankvoorn (Rutilus rutilus)' ||
    SPECIES_PROFILES.Voorn.scientificName !== 'Rutilus rutilus') {
  throw new Error('The Voorn profile label must accurately identify blankvoorn without conflating rudd.');
}

if (!SPECIES_PROFILES.Baars.scientificReferences.some((source) => source.includes('10.3389/fenvs.2021.670125'))) {
  throw new Error('The perch profile must link the verified juvenile Lake Constance feeding study with its scope limits.');
}

const tenchField = RESEARCH_REGISTRY.find((item) => item.id === 'tench-field-diel-seasonal-feeding-2018');
if (!tenchField ||
    !tenchField.summary.includes('66 maag-/darmkanalen') ||
    !tenchField.summary.includes('iedere drie uur') ||
    !tenchField.limitations.some((item) => item.includes('3–7+ jaar')) ||
    !tenchField.limitations.some((item) => item.includes('vertaalde samenvattingen')) ||
    tenchField.approvedForPrediction) {
  throw new Error('The tench field study must retain its sample, three-hour sampling, age and translation limitations.');
}

const carpDiel = RESEARCH_REGISTRY.find((item) => item.id === 'common-carp-temperature-feeding-rhythm-2012');
if (!carpDiel ||
    !carpDiel.summary.includes('Cyprinus carpio haematopterus') ||
    !carpDiel.summary.includes('630–850 g') ||
    !carpDiel.summary.includes('61–91 g') ||
    !carpDiel.limitations.some((item) => item.includes('gepubliceerde abstract')) ||
    !carpDiel.limitations.some((item) => item.includes('hengelvangbaarheid')) ||
    carpDiel.approvedForPrediction) {
  throw new Error('Carp diel-feeding evidence must retain its subspecies, size classes, abstract-only verification and no-catchability limitation.');
}


// Source-audit regression: one canonical registry entry per pikeperch drainage-canal telemetry study.
const pikeperchCanalRecords = RESEARCH_REGISTRY.filter((item) =>
  item.id.includes('pikeperch-diel-activity-') &&
  item.sourceReferences.some((source) => source.includes('10.1007/s10750-004-6823-6'))
);
if (pikeperchCanalRecords.length !== 1 ||
    pikeperchCanalRecords[0].id !== 'pikeperch-diel-activity-dusk-drainage-canal-2005' ||
    pikeperchCanalRecords[0].measuredOutcomes?.includes('feeding_rhythm') ||
    pikeperchCanalRecords[0].approvedForPrediction) {
  throw new Error('The single pikeperch drainage-canal study record must remain movement-only and non-approved.');
}

const pikeWildFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'northern-pike-heart-rate-feeding-day-1991');
if (!pikeWildFeeding ||
    !pikeWildFeeding.summary.includes('overdag gevangen') ||
    !pikeWildFeeding.summary.includes('middag en nacht') ||
    pikeWildFeeding.measuredOutcomes?.includes('feeding_rhythm') ||
    pikeWildFeeding.approvedForPrediction) {
  throw new Error('Wild pike feeding capture time must remain distinct from later digestion metabolism.');
}

const roachAutumnShift = RESEARCH_REGISTRY.find((item) => item.id === 'roach-autumnal-diel-feeding-shift-2008');
if (!roachAutumnShift ||
    !roachAutumnShift.summary.includes('20 naar 10 °C') ||
    !roachAutumnShift.summary.includes('circa 5 °C') ||
    !roachAutumnShift.limitations.some((item) => item.includes('predatierisico')) ||
    roachAutumnShift.approvedForPrediction) {
  throw new Error('The roach autumnal day-to-twilight shift must retain its boreal/light/predation scope and remain non-approved.');
}

const adultCyprinidPlankton = RESEARCH_REGISTRY.find((item) => item.id === 'bream-roach-in-situ-diel-zooplankton-feeding-2004');
if (!adultCyprinidPlankton ||
    !adultCyprinidPlankton.summary.includes('microcrustaceeën') ||
    !adultCyprinidPlankton.summary.includes('lengteklasse') ||
    !adultCyprinidPlankton.limitations.some((item) => item.includes('aasopname')) ||
    adultCyprinidPlankton.approvedForPrediction) {
  throw new Error('Bream/roach daytime plankton-feeding evidence must retain its prey and transferability limits.');
}


// Full-text scope checks for the two independent pikeperch telemetry studies.
const pikeperchCanalTelemetry = RESEARCH_REGISTRY.find((item) => item.id === 'pikeperch-diel-activity-dusk-drainage-canal-2005');
if (!pikeperchCanalTelemetry ||
    !pikeperchCanalTelemetry.summary.includes('9 succesvol gevolgd') ||
    !pikeperchCanalTelemetry.summary.includes('twee uur') ||
    !pikeperchCanalTelemetry.limitations.some((item) => item.includes('minimale afstand')) ||
    pikeperchCanalTelemetry.measuredOutcomes?.includes('feeding_rhythm') ||
    pikeperchCanalTelemetry.approvedForPrediction) {
  throw new Error('Poulet et al. pikeperch telemetry must retain sample, two-hour tracking, movement-only and underestimation limits.');
}

const pikeperchElbeTelemetry = RESEARCH_REGISTRY.find((item) => item.id === 'pikeperch-diel-distribution-elbe-river-2008');
if (!pikeperchElbeTelemetry ||
    !pikeperchElbeTelemetry.summary.includes('8 volwassen') ||
    !pikeperchElbeTelemetry.summary.includes('47 volledige') ||
    !pikeperchElbeTelemetry.limitations.some((item) => item.includes('waarschijnlijk als rust')) ||
    pikeperchElbeTelemetry.measuredOutcomes?.includes('feeding_rhythm') ||
    pikeperchElbeTelemetry.approvedForPrediction) {
  throw new Error('Elbe pikeperch telemetry must retain its sample/observation scope and night-rest interpretation, not feeding rhythm.');
}


const perchScope = RESEARCH_REGISTRY.find((item) => item.id === 'european-perch-aerobic-scope-size-temperature-2020');
if (!perchScope || perchScope.approvedForPrediction || !perchScope.summary.includes('120 Europese baarzen') || !perchScope.summary.includes('onder 40 g') || !perchScope.limitations.some((item) => item.includes('37 vissen'))) {
  throw new Error('The full perch paper scope, size dependence and separate preferred-temperature sample must remain explicit and non-approved.');
}
const pikeperchScope = RESEARCH_REGISTRY.find((item) => item.id === 'adult-pikeperch-aerobic-scope-temperature-2012');
if (!pikeperchScope || pikeperchScope.approvedForPrediction || !pikeperchScope.summary.includes('70 volwassen') || !pikeperchScope.summary.includes('geen statistisch significant verschil') || !pikeperchScope.limitations.some((item) => item.includes('slechts drie complete metingen'))) {
  throw new Error('The full pikeperch paper scope, broad plateau and small 28 C sample must remain explicit and non-approved.');
}
console.log('Primary perch and pikeperch thermal-study scope tests passed.');

// Pressure and turbidity evidence remains contextual and never activates a forecast factor.
const perchPressureMovement = RESEARCH_REGISTRY.find((item) => item.id === 'eurasian-perch-pressure-variability-movement-three-lakes-2020');
if (!perchPressureMovement ||
    !perchPressureMovement.species.includes('Baars') ||
    !perchPressureMovement.measuredOutcomes?.includes('locomotor_activity') ||
    perchPressureMovement.measuredOutcomes.includes('feeding_intensity') ||
    perchPressureMovement.approvedForPrediction ||
    !perchPressureMovement.summary.includes('54 Europese baarzen') ||
    !perchPressureMovement.summary.includes('twee van de drie meren') ||
    !perchPressureMovement.limitations.some((item) => item.includes('geen voedselopname'))) {
  throw new Error('Perch pressure evidence must remain limited, lake-specific movement evidence, not feeding or a pressure bonus.');
}
const yellowPerchPressureProxy = RESEARCH_REGISTRY.find((item) => item.id === 'yellow-perch-barometric-pressure-feeding-lab-2014');
if (!yellowPerchPressureProxy ||
    yellowPerchPressureProxy.species.includes('Baars') ||
    !yellowPerchPressureProxy.species.some((species) => species.includes('Perca flavescens')) ||
    !yellowPerchPressureProxy.measuredOutcomes?.includes('feeding_intensity') ||
    yellowPerchPressureProxy.approvedForPrediction ||
    !yellowPerchPressureProxy.limitations.some((item) => item.includes('niet de Europese baars'))) {
  throw new Error('North American yellow perch pressure-feeding evidence must remain an explicitly separate taxonomic proxy.');
}
if (getResearchByOutcome('Baars', 'feeding_intensity').some((item) => item.id === 'yellow-perch-barometric-pressure-feeding-lab-2014')) {
  throw new Error('The yellow perch proxy must not be returned as direct European perch feeding evidence.');
}
const turbidityReview = RESEARCH_REGISTRY.find((item) => item.id === 'freshwater-fish-turbidity-predator-prey-review-2024');
if (!turbidityReview ||
    turbidityReview.species.length !== 0 ||
    Boolean(turbidityReview.measuredOutcomes?.length) ||
    turbidityReview.approvedForPrediction ||
    !turbidityReview.summary.includes('281 peer-reviewed studies') ||
    !turbidityReview.limitations.some((item) => item.includes('geen universele'))) {
  throw new Error('Freshwater turbidity review must remain general, mixed-direction context without a universal threshold.');
}
if (!SPECIES_PROFILES.Baars.scientificReferences.some((source) => source.includes('diva2:1446518'))) {
  throw new Error('The perch profile must link its reviewed abiotic movement thesis with its movement-only scope.');
}
console.log('Pressure and turbidity evidence scope tests passed.');


// Angling catch-rate and vulnerability are separate measured outcomes, not feeding proxies.
const perchCatchRate = RESEARCH_REGISTRY.find((item) => item.id === 'perch-recreational-angling-catch-rates-21-lakes-2013');
if (!perchCatchRate ||
    !perchCatchRate.measuredOutcomes?.includes('angler_catch_rate') ||
    perchCatchRate.measuredOutcomes.includes('angler_vulnerability') ||
    perchCatchRate.approvedForPrediction ||
    !perchCatchRate.summary.includes('21 meren') ||
    !perchCatchRate.limitations.some((item) => item.includes('visserervaring'))) {
  throw new Error('Perch angling diaries must remain a distinct catch-rate outcome, not individual vulnerability or feeding evidence.');
}
if (getResearchByOutcome('Baars', 'angler_catch_rate').every((item) => item.id !== 'perch-recreational-angling-catch-rates-21-lakes-2013')) {
  throw new Error('Perch catch-rate evidence must be discoverable by species and measured outcome.');
}
const pikeWildLureShyness = RESEARCH_REGISTRY.find((item) => item.id === 'northern-pike-wild-lure-shyness-protected-areas-2025');
if (!pikeWildLureShyness ||
    !pikeWildLureShyness.measuredOutcomes?.includes('angler_vulnerability') ||
    pikeWildLureShyness.approvedForPrediction ||
    !pikeWildLureShyness.summary.includes('drie paren') ||
    !pikeWildLureShyness.limitations.some((item) => item.includes('kustsnoek'))) {
  throw new Error('Wild coastal pike lure-shyness evidence must retain its protected-area design and transferability limits.');
}
const pikeCaptureLearning = RESEARCH_REGISTRY.find((item) => item.id === 'northern-pike-capture-probability-bait-learning-unexploited-2026');
if (!pikeCaptureLearning ||
    !pikeCaptureLearning.measuredOutcomes?.includes('angler_vulnerability') ||
    pikeCaptureLearning.approvedForPrediction ||
    !pikeCaptureLearning.summary.includes('22.213 worpen') ||
    !pikeCaptureLearning.summary.includes('43,2%') ||
    !pikeCaptureLearning.limitations.some((item) => item.includes('geen universele individuele vangstkans'))) {
  throw new Error('The 2026 pike capture study must retain effort, size-conditioned population estimate and non-transferability limits.');
}
if (getResearchByOutcome('Snoek', 'angler_vulnerability').filter((item) => item.id.startsWith('northern-pike-')).length !== 2) {
  throw new Error('Both independent pike vulnerability studies must be discoverable without activating them in the prognosis.');
}
console.log('Angling catch-rate and vulnerability evidence tests passed.');


// Asp stomach vacuity is feeding incidence, not feeding intensity or diel rhythm.
const aspFeedingIncidence = RESEARCH_REGISTRY.find((item) => item.id === 'asp-seasonal-feeding-incidence-danube-2010');
if (!aspFeedingIncidence ||
    !aspFeedingIncidence.species.includes('Roofblei') ||
    !aspFeedingIncidence.measuredOutcomes?.includes('feeding_incidence') ||
    !aspFeedingIncidence.measuredOutcomes?.includes('diet_composition') ||
    aspFeedingIncidence.measuredOutcomes.includes('feeding_intensity') ||
    aspFeedingIncidence.measuredOutcomes.includes('feeding_rhythm') ||
    aspFeedingIncidence.approvedForPrediction ||
    !aspFeedingIncidence.summary.includes('198 roofbleien') ||
    !aspFeedingIncidence.summary.includes('94,1%') ||
    !aspFeedingIncidence.limitations.some((item) => item.includes('aandeel lege magen'))) {
  throw new Error('Asp seasonal stomach vacuity must remain a limited feeding-incidence measure, not feeding intensity or diel rhythm.');
}
if (getResearchByOutcome('Roofblei', 'feeding_incidence').every((item) => item.id !== 'asp-seasonal-feeding-incidence-danube-2010')) {
  throw new Error('Asp feeding-incidence evidence must be discoverable by species and measured outcome.');
}
console.log('Asp feeding-incidence evidence scope tests passed.');


// Field bream feeding rhythms, seasonal pikeperch feeding intensity and
// laboratory catfish rhythms must retain their distinct evidence scopes.
const breamDielFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'bream-in-situ-diel-zooplankton-consumption-2004');
if (!breamDielFeeding ||
    !breamDielFeeding.measuredOutcomes?.includes('feeding_intensity') ||
    !breamDielFeeding.measuredOutcomes?.includes('feeding_rhythm') ||
    breamDielFeeding.approvedForPrediction ||
    !breamDielFeeding.summary.includes('in-situ') ||
    !breamDielFeeding.limitations.some((item) => item.includes('microcrustaceeën'))) {
  throw new Error('Bream diel feeding evidence must retain its in-situ zooplankton context and transferability limits.');
}
if (getResearchByOutcome('Brasem', 'feeding_rhythm').every((item) => item.id !== 'bream-in-situ-diel-zooplankton-consumption-2004')) {
  throw new Error('Bream in-situ diel feeding evidence must be discoverable by species and outcome.');
}
const pikeperchFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'pikeperch-feeding-intensity-size-gonad-season-2012');
if (!pikeperchFeeding ||
    !pikeperchFeeding.measuredOutcomes?.includes('feeding_intensity') ||
    !pikeperchFeeding.measuredOutcomes?.includes('diet_composition') ||
    pikeperchFeeding.approvedForPrediction ||
    !pikeperchFeeding.summary.includes('19 cm') ||
    !pikeperchFeeding.limitations.some((item) => item.includes('voortplantingscyclus'))) {
  throw new Error('Pikeperch seasonal feeding evidence must retain size and reproductive context.');
}
if (getResearchByOutcome('Snoekbaars', 'feeding_intensity').every((item) => item.id !== 'pikeperch-feeding-intensity-size-gonad-season-2012')) {
  throw new Error('Pikeperch feeding-intensity evidence must be discoverable by species and outcome.');
}
const catfishDielFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'wels-catfish-diel-feeding-rhythm-self-feeders-1995');
if (!catfishDielFeeding ||
    !catfishDielFeeding.measuredOutcomes?.includes('feeding_rhythm') ||
    catfishDielFeeding.measuredOutcomes.includes('feeding_intensity') ||
    catfishDielFeeding.approvedForPrediction ||
    !catfishDielFeeding.summary.includes('laboratoriumstudie') ||
    !catfishDielFeeding.limitations.some((item) => item.includes('geen veldmeting'))) {
  throw new Error('Catfish diel feeding evidence must remain laboratory rhythm evidence, not field intensity or angling catchability.');
}
if (getResearchByOutcome('Meerval', 'feeding_rhythm').every((item) => item.id !== 'wels-catfish-diel-feeding-rhythm-self-feeders-1995')) {
  throw new Error('Catfish diel rhythm evidence must be discoverable by species and outcome.');
}
console.log('Bream, pikeperch and catfish feeding evidence scope tests passed.');


// Bibliografische herstelcontrole van oudere profielreferenties.
const breamFilterFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'bream-planktivorous-filter-feeding-prey-size-1985');
if (!breamFilterFeeding || !breamFilterFeeding.measuredOutcomes?.includes('prey_selection') || breamFilterFeeding.measuredOutcomes.includes('feeding_intensity') || breamFilterFeeding.approvedForPrediction) {
  throw new Error('Lammens bream evidence must remain prey-selection/filter-feeding context, not feeding intensity.');
}
const cyprinidMusselEfficiency = RESEARCH_REGISTRY.find((item) => item.id === 'cyprinid-zebra-mussel-feeding-efficiency-morphology-1996');
if (!cyprinidMusselEfficiency || !cyprinidMusselEfficiency.species.includes('Brasem') || !cyprinidMusselEfficiency.species.includes('Voorn') || !cyprinidMusselEfficiency.measuredOutcomes?.includes('feeding_physiology') || cyprinidMusselEfficiency.measuredOutcomes.includes('feeding_rhythm') || cyprinidMusselEfficiency.approvedForPrediction) {
  throw new Error('Nagelkerke/Sibbing feeding-efficiency evidence must not be classified as a diel feeding rhythm.');
}
const casselmanPike = RESEARCH_REGISTRY.find((item) => item.id === 'northern-pike-environment-growth-survival-activity-1978');
if (!casselmanPike || !casselmanPike.measuredOutcomes?.includes('locomotor_activity') || casselmanPike.measuredOutcomes.includes('feeding_intensity') || casselmanPike.approvedForPrediction) {
  throw new Error('Casselman pike evidence must remain growth/laboratory locomotor activity, not field feeding intensity.');
}
const goldspinkRoach = RESEARCH_REGISTRY.find((item) => item.id === 'roach-population-growth-production-tjeukemeer-1979');
if (!goldspinkRoach || !goldspinkRoach.measuredOutcomes?.includes('growth') || goldspinkRoach.measuredOutcomes.includes('feeding_intensity') || goldspinkRoach.approvedForPrediction) {
  throw new Error('Goldspink roach evidence must remain population growth/production, not daily feeding.');
}
const neophitouTench = RESEARCH_REGISTRY.find((item) => item.id === 'tench-growth-maturity-spawning-lake-pamvotis-1993');
if (!neophitouTench || !neophitouTench.measuredOutcomes?.includes('growth') || neophitouTench.measuredOutcomes.includes('feeding_rhythm') || neophitouTench.approvedForPrediction) {
  throw new Error('Neophitou tench evidence must remain growth/maturity context, not daily feeding rhythm.');
}
const pikeperchReproduction = RESEARCH_REGISTRY.find((item) => item.id === 'pikeperch-reproduction-biology-review-2003');
const catfishEnvironmentReview = RESEARCH_REGISTRY.find((item) => item.id === 'european-catfish-environmental-biology-review-2009');
if (!pikeperchReproduction || pikeperchReproduction.measuredOutcomes?.length || pikeperchReproduction.approvedForPrediction || !catfishEnvironmentReview || catfishEnvironmentReview.measuredOutcomes?.length || catfishEnvironmentReview.approvedForPrediction) {
  throw new Error('Reproduction/environment reviews must remain background sources without inferred measured daily outcomes.');
}
for (const [species, ref] of Object.entries({
  Brasem: '10.1007/BF00002913',
  Snoek: 'Effects of environmental factors on growth, survival, activity',
  Voorn: '10.1111/j.1095-8649.1979.tb03632.x',
  Zeelt: 'Some biological data on tench',
  Snoekbaars: '10.1034/j.1600-0633.2003.00005.x',
  Meerval: '10.1111/j.1467-2979.2008.00321.x',
})) {
  if (!SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES].scientificReferences.some((source) => source.includes(ref))) {
    throw new Error('The ' + species + ' profile must link its bibliographically corrected reference ' + ref + '.');
  }
}
console.log('Legacy profile bibliography verification and measured-outcome separation tests passed.');


// Wind, pressure, turbidity and oxygen evidence must retain their measured response boundaries.
const perchAbioticMovement = RESEARCH_REGISTRY.find((item) => item.id === 'perch-fine-scale-abiotic-movement-lake-2018');
if (!perchAbioticMovement || !perchAbioticMovement.measuredOutcomes?.includes('locomotor_activity') || perchAbioticMovement.measuredOutcomes.includes('feeding_intensity') || perchAbioticMovement.approvedForPrediction || !perchAbioticMovement.summary.includes('16 volwassen')) {
  throw new Error('Perch wind/pressure telemetry must remain movement-only, scoped and non-approved.');
}
const breamTurbidityActivity = RESEARCH_REGISTRY.find((item) => item.id === 'bream-activity-turbidity-shallow-lake-2019');
if (!breamTurbidityActivity || !breamTurbidityActivity.measuredOutcomes?.includes('locomotor_activity') || breamTurbidityActivity.measuredOutcomes.includes('feeding_intensity') || breamTurbidityActivity.approvedForPrediction || !breamTurbidityActivity.summary.includes('448 benthivore brasems') || !breamTurbidityActivity.limitations.some((item) => item.includes('geen directe meting van voedselopname'))) {
  throw new Error('Bream turbidity evidence must remain a field activity proxy, not direct feeding intensity.');
}
const carpHypoxiaFeeding = RESEARCH_REGISTRY.find((item) => item.id === 'common-carp-chronic-hypoxia-food-intake-2012');
if (!carpHypoxiaFeeding || !carpHypoxiaFeeding.measuredOutcomes?.includes('feeding_intensity') || carpHypoxiaFeeding.approvedForPrediction || !carpHypoxiaFeeding.summary.includes('79% lager') || !carpHypoxiaFeeding.limitations.some((item) => item.includes('zeer ernstige hypoxie'))) {
  throw new Error('Carp hypoxia evidence must preserve its direct food-intake outcome and severe laboratory limits.');
}
for (const [species, ref] of Object.entries({
  Baars: '10.1111/eff.12393',
  Brasem: '10.4081/jlimnol.2019.1883',
  Karper: '10.1242/jeb.066183',
})) {
  if (!SPECIES_PROFILES[species as keyof typeof SPECIES_PROFILES].scientificReferences.some((source) => source.includes(ref))) {
    throw new Error('The ' + species + ' profile must link its abiotic/oxygen evidence ' + ref + '.');
  }
}
console.log('Abiotic movement, turbidity and dissolved-oxygen evidence scope tests passed.');
