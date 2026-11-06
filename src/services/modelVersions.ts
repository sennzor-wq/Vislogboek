/**
 * Expliciete versieregistratie van de bestaande prognose-engines.
 *
 * Verhoog de versie van een onderdeel wanneer de bijbehorende berekeningslogica
 * of betekenisvolle modelparameters wijzigen. Dit is provenance, geen tweede engine.
 */
export const PROGNOSIS_MODEL_VERSION = 'v2.4-water-thermal-history';

export const PROGNOSIS_ENGINE_VERSIONS: Record<string, string> = {
  prognosis: '1.0.0',
  speciesProfiles: '1.0.0',
  waterThermal: '1.0.0',
  waterTemperatureCalibration: '1.0.0',
  bankWind: '1.0.0',
  habitatMovement: '1.0.0',
  rodPositioning: '1.0.0',
  prebait: '1.0.0',
  dataQuality: '1.0.0',
};
