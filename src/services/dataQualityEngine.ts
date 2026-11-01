
import type { DataStatus } from './researchRegistry';

/**
 * Data Quality Engine
 *
 * Beoordeelt de herkomst en volledigheid van gegevens.
 * Dit bestand verandert geen prognoses en berekent geen vangstkansen.
 */

export type DataQualityLevel =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export interface DataQualityInput {
  name: string;
  value: number | string | null | undefined;
  status: DataStatus;
  source?: string;
  observedAt?: string;
  explanation?: string;
}

export interface DataQualityResult {
  name: string;
  level: DataQualityLevel;
  status: DataStatus;
  usable: boolean;
  explanation: string;
  source?: string;
  observedAt?: string;
}

export interface DataQualityReport {
  overall: DataQualityLevel;
  total: number;
  usable: number;
  missing: number;
  results: DataQualityResult[];
}

/**
 * Controleert of een waarde daadwerkelijk aanwezig is.
 * Nul is een geldige waarde en wordt dus niet als ontbrekend gezien.
 */
function hasValue(
  value: DataQualityInput['value']
): boolean {
  return value !== null &&
    value !== undefined &&
    value !== '';
}

/**
 * Controleert of een datum geldig is.
 */
function isValidDate(value?: string): boolean {
  if (!value) return false;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

/**
 * Beoordeelt één gegevenswaarde.
 *
 * Let op:
 * - 'measured' betekent dat de waarde als meting is aangeleverd.
 * - Deze functie kan niet controleren of de meting in werkelijkheid correct is.
 * - Een voorspelling of modelschatting wordt nooit automatisch een meting.
 */
export function assessDataQuality(
  input: DataQualityInput
): DataQualityResult {
  if (!hasValue(input.value)) {
    return {
      name: input.name,
      level: 'unknown',
      status: input.status,
      usable: false,
      explanation: 'Gegeven ontbreekt; niet gebruiken als numerieke invoer.',
      source: input.source,
      observedAt: input.observedAt,
    };
  }

  if (input.status === 'unknown') {
    return {
      name: input.name,
      level: 'low',
      status: input.status,
      usable: false,
      explanation: 'Herkomst onbekend; eerst controleren.',
      source: input.source,
      observedAt: input.observedAt,
    };
  }

  if (input.status === 'measured') {
    return {
      name: input.name,
      level: 'high',
      status: input.status,
      usable: true,
      explanation:
        'Aangeleverd als meting. De meetmethode en meetkwaliteit zijn niet onafhankelijk gecontroleerd.',
      source: input.source,
      observedAt: input.observedAt,
    };
  }

  if (input.status === 'forecast') {
    return {
      name: input.name,
      level: 'medium',
      status: input.status,
      usable: true,
      explanation:
        'Weersverwachting of andere voorspelde waarde. Houd rekening met voorspellingsonzekerheid.',
      source: input.source,
      observedAt: input.observedAt,
    };
  }

  if (input.status === 'modelled') {
    return {
      name: input.name,
      level: 'low',
      status: input.status,
      usable: true,
      explanation:
        'Door een model geschatte waarde. Gebruik deze niet alsof het een directe meting is.',
      source: input.source,
      observedAt: input.observedAt,
    };
  }

  if (input.status === 'userReported') {
    return {
      name: input.name,
      level: 'medium',
      status: input.status,
      usable: true,
      explanation:
        'Door de gebruiker ingevoerd of waargenomen. Nauwkeurigheid hangt af van de invoer.',
      source: input.source,
      observedAt: input.observedAt,
    };
  }

  return {
    name: input.name,
    level: 'unknown',
    status: input.status,
    usable: false,
    explanation: 'Status niet herkend; gegeven niet automatisch gebruiken.',
    source: input.source,
    observedAt: input.observedAt,
  };
}

/**
 * Beoordeelt meerdere gegevens tegelijk.
 *
 * De rapportage is een kwaliteitsindicatie, geen wetenschappelijke
 * beoordeling van de juistheid van de waarden.
 */
export function createDataQualityReport(
  inputs: DataQualityInput[]
): DataQualityReport {
  const results = inputs.map(assessDataQuality);

  const total = results.length;
  const usable = results.filter((item) => item.usable).length;
  const missing = results.filter(
    (item) => item.level === 'unknown'
  ).length;

  let overall: DataQualityLevel = 'unknown';

  if (total > 0) {
    const highCount = results.filter(
      (item) => item.level === 'high'
    ).length;

    const lowCount = results.filter(
      (item) => item.level === 'low'
    ).length;

    if (missing === total || usable === 0) {
      overall = 'unknown';
    } else if (lowCount > 0 || missing > 0) {
      overall = 'low';
    } else if (highCount === total) {
      overall = 'high';
    } else {
      overall = 'medium';
    }
  }

  return {
    overall,
    total,
    usable,
    missing,
    results,
  };
}
