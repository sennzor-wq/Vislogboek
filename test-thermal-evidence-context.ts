import { getSpeciesThermalEvidenceContext, getSpeciesThermalEvidenceContextText } from './src/services/thermalEvidenceService';
function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
const perch = getSpeciesThermalEvidenceContext('Baars');
assert(perch.scope === 'aerobic-scope', 'Perch must expose direct aerobic-scope evidence.');
assert(perch.aerobicScopeEvidence.some((entry) => entry.id === 'european-perch-aerobic-scope-size-temperature-2020'), 'Perch source must remain discoverable.');
assert(perch.approvedAerobicScopeEvidence.length === 0, 'Perch aerobic-scope evidence must remain non-approved.');
const pikeperch = getSpeciesThermalEvidenceContext('Snoekbaars');
assert(pikeperch.scope === 'aerobic-scope', 'Pikeperch must expose direct aerobic-scope evidence.');
assert(pikeperch.aerobicScopeEvidence.some((entry) => entry.id === 'adult-pikeperch-aerobic-scope-temperature-2012'), 'Pikeperch source must remain discoverable.');
assert(pikeperch.approvedAerobicScopeEvidence.length === 0, 'Pikeperch aerobic-scope evidence must remain non-approved.');
for (const species of ['Karper', 'Snoek', 'Brasem', 'Voorn'] as const) {
  const context = getSpeciesThermalEvidenceContext(species);
  assert(context.scope === 'metabolic-only', `${species} must not be presented as having an aerobic-scope curve.`);
  assert(context.aerobicScopeEvidence.length === 0, `${species} must not inherit aerobic-scope evidence from another species.`);
  assert(context.approvedMetabolicRateEvidence.length === 0, `${species} metabolic evidence must remain non-approved.`);
}
for (const species of ['Zeelt', 'Meerval', 'Roofblei', 'Overig'] as const) {
  assert(getSpeciesThermalEvidenceContext(species).scope === 'none', `${species} must be explicit when no comparable thermal physiology source is registered.`);
}
assert(getSpeciesThermalEvidenceContextText('Baars').includes('niet goedgekeurd voor numerieke voorspelling') && getSpeciesThermalEvidenceContextText('Baars').includes('niet gebruikt in de actieve prognose'), 'Aerobic-scope approval and inactive-profile status must be visible.');
assert(getSpeciesThermalEvidenceContextText('Karper').includes('SMR/RMR is niet hetzelfde als activiteit of voedselopname'), 'Metabolic rate must be distinguished from activity and feeding.');
assert(getSpeciesThermalEvidenceContextText('Roofblei').includes('niet soortspecifiek gevalideerd'), 'Missing species-specific curve status must be visible.');
console.log('Species thermal evidence context tests passed.');
