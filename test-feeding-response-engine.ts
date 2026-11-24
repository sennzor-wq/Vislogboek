import { ALL_SPECIES } from './src/types';
import { assessSpeciesFeedingActivity } from './src/services/feedingResponseEngine';

for (const species of ALL_SPECIES) {
  const result = assessSpeciesFeedingActivity(species);
  if (result.score !== null) {
    throw new Error(`${species}: feeding score must remain null until a quantitative response is validated.`);
  }
  if (species === 'Overig') {
    if (result.status !== 'not_applicable' || result.evidenceLevel !== 'none') {
      throw new Error('Overig must not receive a fabricated species-specific feeding result.');
    }
  } else if (result.status !== 'insufficient_evidence') {
    throw new Error(`${species}: missing quantitative response must be explicit.`);
  }
  for (const [name, response] of Object.entries(result.responses)) {
    if (response.predictionEligible) {
      throw new Error(`${species} ${name}: registry presence must not silently approve prediction use.`);
    }
    if (new Set(response.sourceIds).size !== response.sourceIds.length) {
      throw new Error(`${species} ${name}: duplicate source IDs must be removed.`);
    }
    if (response.sourceCount !== response.sourceIds.length) {
      throw new Error(`${species} ${name}: source count must match its source IDs.`);
    }
  }
}

const asp = assessSpeciesFeedingActivity('Roofblei');
if (asp.responses.intensity.sourceCount !== 0 ||
    asp.responses.rhythm.sourceCount !== 0 ||
    asp.responses.incidence.sourceCount === 0 ||
    asp.responses.diet.sourceCount === 0 ||
    asp.responses.preySelection.sourceCount === 0) {
  throw new Error('Asp stomach fullness, diet and prey selection must remain separate from direct intensity and rhythm.');
}

const catfish = assessSpeciesFeedingActivity('Meerval');
if (!catfish.responses.rhythm.sourceIds.includes('european-catfish-nocturnal-feeding-rhythm-lab-1995')) {
  throw new Error('Catfish nocturnal self-feeding study must remain visible as feeding-rhythm evidence.');
}
if (catfish.responses.rhythm.predictionEligible) {
  throw new Error('Controlled catfish self-feeding evidence must not silently become a universal field night bonus.');
}

const pike = assessSpeciesFeedingActivity('Snoek');
if (!pike.responses.rhythm.sourceIds.includes('pike-juvenile-feeding-rhythm-first-year-1998')) {
  throw new Error('Juvenile pike feeding rhythm must remain visible without adult generalisation.');
}

console.log('Species feeding response output tests passed.');
