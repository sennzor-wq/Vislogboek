import { RESEARCH_REGISTRY, getResearchByTopic, isApprovedPredictionKnowledge } from './src/services/researchRegistry';

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
