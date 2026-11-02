import { RESEARCH_REGISTRY, getResearchByTopic, getResearchBySpecies, isApprovedPredictionKnowledge } from './src/services/researchRegistry';

const thermalEntries = getResearchByTopic('watertemperatuur');
if (thermalEntries.length !== 1) throw new Error('Expected exactly one reviewed water-temperature evidence entry.');
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

const carpEvidence = getResearchBySpecies('Karper');
if (!carpEvidence.some((item) => item.id === 'common-carp-temperature-feeding-rhythm-2012')) {
  throw new Error('Carp-specific feeding-rhythm evidence must be discoverable by species.');
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
