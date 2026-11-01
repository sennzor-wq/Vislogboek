
export type SignalDirection =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'unknown';

export type SignalTopic =
  | 'temperature'
  | 'weather'
  | 'pressure'
  | 'wind'
  | 'season'
  | 'timeOfDay'
  | 'habitat'
  | 'fishPresence'
  | 'feeding'
  | 'other';

export interface ModelSignal {
  id: string;
  topic: SignalTopic;
  direction: SignalDirection;
  description: string;

  /**
   * Herkomst van het signaal:
   * measured = gemeten
   * forecast = voorspeld
   * modelled = modelschatting
   * userReported = gebruikerswaarneming
   * unknown = onbekend
   */
  provenance:
    | 'measured'
    | 'forecast'
    | 'modelled'
    | 'userReported'
    | 'unknown';

  /**
   * Optionele bronverwijzing of toelichting.
   */
  source?: string;
}

export type ConsistencyStatus =
  | 'consistent'
  | 'conflicting'
  | 'insufficient'
  | 'neutral';

export interface TopicConsistency {
  topic: SignalTopic;
  status: ConsistencyStatus;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  unknownCount: number;
  explanation: string;
}

export interface ModelConsistencyReport {
  overallStatus: ConsistencyStatus;
  totalSignals: number;
  conflictingTopics: SignalTopic[];
  topics: TopicConsistency[];
  warnings: string[];
}

/**
 * Beoordeelt of signalen binnen hetzelfde onderwerp elkaar tegenspreken.
 *
 * Deze functie:
 * - berekent geen vangstkans;
 * - kent geen gewichten toe;
 * - bepaalt niet welk signaal gelijk heeft;
 * - verwijdert geen signalen.
 *
 * Het resultaat is bedoeld om onzekerheid zichtbaar te maken.
 */
export function assessTopicConsistency(
  topic: SignalTopic,
  signals: ModelSignal[]
): TopicConsistency {
  const relevant = signals.filter(
    (signal) => signal.topic === topic
  );

  const positiveCount = relevant.filter(
    (signal) => signal.direction === 'positive'
  ).length;

  const negativeCount = relevant.filter(
    (signal) => signal.direction === 'negative'
  ).length;

  const neutralCount = relevant.filter(
    (signal) => signal.direction === 'neutral'
  ).length;

  const unknownCount = relevant.filter(
    (signal) => signal.direction === 'unknown'
  ).length;

  let status: ConsistencyStatus;
  let explanation: string;

  if (relevant.length === 0) {
    status = 'insufficient';
    explanation = 'Er zijn geen signalen beschikbaar voor dit onderwerp.';
  } else if (positiveCount > 0 && negativeCount > 0) {
    status = 'conflicting';
    explanation =
      'Er zijn zowel positieve als negatieve signalen. De uitkomst is niet eenduidig.';
  } else if (positiveCount > 0 || negativeCount > 0) {
    status = 'consistent';
    explanation =
      'De beschikbare richtinggevende signalen spreken elkaar binnen dit onderwerp niet tegen.';
  } else if (unknownCount === relevant.length) {
    status = 'insufficient';
    explanation =
      'De beschikbare signalen hebben geen bekende richting.';
  } else {
    status = 'neutral';
    explanation =
      'De beschikbare signalen zijn neutraal of geven geen duidelijke richting.';
  }

  return {
    topic,
    status,
    positiveCount,
    negativeCount,
    neutralCount,
    unknownCount,
    explanation,
  };
}

/**
 * Maakt een rapport over alle onderwerpen waarvoor signalen bestaan.
 */
export function createModelConsistencyReport(
  signals: ModelSignal[]
): ModelConsistencyReport {
  const topics = Array.from(
    new Set(signals.map((signal) => signal.topic))
  );

  const topicReports = topics.map((topic) =>
    assessTopicConsistency(topic, signals)
  );

  const conflictingTopics = topicReports
    .filter((report) => report.status === 'conflicting')
    .map((report) => report.topic);

  const warnings: string[] = [];

  if (signals.length === 0) {
    warnings.push('Er zijn geen modelsignalen beschikbaar.');
  }

  if (conflictingTopics.length > 0) {
    warnings.push(
      'Tegenstrijdige signalen gevonden. Trek geen eenduidige conclusie zonder verdere beoordeling.'
    );
  }

  if (
    signals.some((signal) => signal.provenance === 'unknown')
  ) {
    warnings.push(
      'Een of meer signalen hebben een onbekende gegevensherkomst.'
    );
  }

  const hasConflict = conflictingTopics.length > 0;
  const hasUsableDirection = signals.some(
    (signal) =>
      signal.direction === 'positive' ||
      signal.direction === 'negative'
  );

  let overallStatus: ConsistencyStatus;

  if (signals.length === 0 || !hasUsableDirection) {
    overallStatus = 'insufficient';
  } else if (hasConflict) {
    overallStatus = 'conflicting';
  } else {
    overallStatus = 'consistent';
  }

  return {
    overallStatus,
    totalSignals: signals.length,
    conflictingTopics,
    topics: topicReports,
    warnings,
  };
}
