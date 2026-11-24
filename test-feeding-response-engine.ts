import { ALL_SPECIES } from './src/types';
import { assessSpeciesFeedingActivity, calculateSpeciesFeedingResponse } from './src/services/feedingResponseEngine';

for (const species of ALL_SPECIES) {
  const result = assessSpeciesFeedingActivity(species);
  if (species !== 'Overig' && (result.score !== null || result.status !== 'insufficient_evidence')) {
    throw new Error(`${species}: day-level feeding score requires explicit time-slot responses.`);
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

const provisional = calculateSpeciesFeedingResponse('Baars', 7, 'Middag');
if (!provisional || provisional.score < 1 || provisional.score > 10 || provisional.driverCoveragePercent >= 100 || provisional.missingDrivers.length !== 2) {
  throw new Error('Operational feeding response must expose a provisional score and missing-driver coverage.');
}
const perchNight = calculateSpeciesFeedingResponse('Baars', 7, 'Nacht');
if (!perchNight || perchNight.score === provisional.score) throw new Error('Diel response must change the score by time slot.');
const tenchSpring = calculateSpeciesFeedingResponse('Zeelt', 4, 'Avond');
const tenchAutumn = calculateSpeciesFeedingResponse('Zeelt', 10, 'Avond');
if (!tenchSpring || !tenchAutumn || tenchSpring.score === tenchAutumn.score) throw new Error('Seasonal phase must change the score.');
const asp = assessSpeciesFeedingActivity('Roofblei', [
  calculateSpeciesFeedingResponse('Roofblei', 7, 'Ochtend'),
  calculateSpeciesFeedingResponse('Roofblei', 7, 'Avond'),
]);
if (asp.score === null || asp.status !== 'provisional' || asp.driverCoveragePercent >= 100) throw new Error('Roofblei must receive a low-confidence proxy response.');
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

console.log('Species feeding response and provisional scoring tests passed.');
