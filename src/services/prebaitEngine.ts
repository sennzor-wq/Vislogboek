import {
  FishSpecies,
  FishingLocation,
  FishingSession,
  TimeSlot,
  WaterThermalAnalysis,
  BankWindAnalysis,
  PrebaitSuitability,
  PrebaitFeedingMoment,
  PrebaitProgramOptions,
  PrebaitProgramPlan,
} from '../types';
import { assessDataQuality } from './dataQualityEngine';

const PREBAIT_SPECIES: FishSpecies[] = ['Karper', 'Zeelt', 'Brasem'];

export function supportsPrebaitPlanning(species: FishSpecies | 'Algemeen'): species is 'Karper' | 'Zeelt' | 'Brasem' {
  return PREBAIT_SPECIES.includes(species as FishSpecies);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.floor((b - a) / 86400000)) : 0;
}

function getSpeciesFeed(species: 'Karper' | 'Zeelt' | 'Brasem', temp: number): {
  amountFactor: number;
  mix: string;
  digestibility: string;
  particleSize: string;
} {
  if (species === 'Brasem') {
    return {
      amountFactor: 0.65,
      mix: 'Fijne basisvoer-mix, kleine pellets (2-4 mm), beperkte hoeveelheid maïs of casters; houd het voer compact.',
      digestibility: 'Gebruik een licht verteerbare, niet te vette mix en bouw de hoeveelheid voorzichtig op.',
      particleSize: 'Voornamelijk fijne deeltjes; beperk grote boilies en grove partikels.',
    };
  }
  if (species === 'Zeelt') {
    return {
      amountFactor: 0.55,
      mix: 'Fijne pellets, hennep en een beperkte hoeveelheid maïs of wormen; voer geconcentreerd bij de presentatie.',
      digestibility: 'Een bescheiden, gevarieerde portie is verstandiger dan een groot voedertapijt.',
      particleSize: 'Kleine tot middelgrote deeltjes, afgestemd op de lokale witvisdruk.',
    };
  }
  return {
    amountFactor: 1,
    mix: 'Een mix van passende pellets, maïs/hennep en eventueel verkruimelde of kleine boilies. Stem de grove fractie af op witvisdruk en bodem.',
    digestibility: 'Bij kou licht verteerbaar en beperkt voeren; bij warmer water kan het aandeel voedzamere partikels geleidelijk omhoog.',
    particleSize: 'Combineer kleine attractieve deeltjes met een beperkte grove fractie; grote boilies zijn geen standaardvereiste.',
  };
}

/**
 * Conservatieve tactische voerplanner. Hoeveelheden zijn startindicaties, geen
 * universele biologische normen. Gemeten temperatuur gaat vóór een modelschatting.
 */
export function calculatePrebaitPlan(
  targetDateStr: string,
  species: FishSpecies | 'Algemeen',
  thermalAnalysis: WaterThermalAnalysis,
  options: PrebaitProgramOptions = {},
  historicalSessions: FishingSession[] = [],
  location?: FishingLocation,
  _bankWind?: BankWindAnalysis,
  _targetSlot: TimeSlot = 'Ochtend'
): PrebaitProgramPlan | null {
  if (!supportsPrebaitPlanning(species)) return null;

  const {
    availableDaysBefore = 2,
    preferredFeedType,
    sessionDurationHours = 3,
    technique,
  } = options;
  const targetDate = new Date(`${targetDateStr}T12:00:00`);
  const measured = thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null &&
    Number.isFinite(thermalAnalysis.measuredWaterTemp);
  const estimated = typeof thermalAnalysis.estimatedWaterTemp === 'number' &&
    Number.isFinite(thermalAnalysis.estimatedWaterTemp) &&
    thermalAnalysis.estimatedWaterTemp >= 0 && thermalAnalysis.estimatedWaterTemp <= 35;
  const effectiveWaterTemp = measured
    ? thermalAnalysis.measuredWaterTemp as number
    : estimated ? thermalAnalysis.estimatedWaterTemp as number : null;
  const thermalQuality = assessDataQuality({
    name: 'Watertemperatuur',
    value: effectiveWaterTemp,
    status: measured ? 'measured' : estimated ? 'modelled' : 'unknown',
    explanation: measured ? 'Gemeten op de stek.' : estimated ? 'Modelschatting; geen directe meting.' : 'Geen geldige temperatuur beschikbaar.',
  });
  const waterTypeQuality = assessDataQuality({
    name: 'Watertype',
    value: location?.waterType,
    status: location?.waterType && location.waterType !== 'Onbekend' ? 'userReported' : 'unknown',
    explanation: 'Gebruikersregistratie van het watertype.',
  });
  const depthQuality = assessDataQuality({
    name: 'Waterdiepte',
    value: location?.waterDepth,
    status: typeof location?.waterDepth === 'number' && location.waterDepth > 0 ? 'userReported' : 'unknown',
    explanation: 'Optionele gebruikersregistratie van de diepte.',
  });
  const isMethodFeeder = /method\s*feeder/i.test(technique ?? '');
  const isFlowingWater = location?.waterType === 'Rivier' || location?.waterType === 'Kanaal';
  const hasLocationContext = waterTypeQuality.usable;
  const missingInformation: string[] = [];

  if (!thermalQuality.usable) {
    missingInformation.push('Watertemperatuur ontbreekt: zonder gemeten of verantwoord geschatte watertemperatuur geeft de Voerplanner geen hoeveelheden of voertiming.');
  } else if (!measured) {
    missingInformation.push('De watertemperatuur is een modelschatting en geen meting. Behandel de hoeveelheden als extra voorzichtige startindicatie en controleer de temperatuur aan de stek.');
  }
  if (!hasLocationContext) {
    missingInformation.push('Watertype ontbreekt; stroming, bodem en natuurlijke voedselbeschikbaarheid kunnen de passende hoeveelheid beïnvloeden.');
  }
  if (typeof location?.waterDepth !== 'number' || !Number.isFinite(location.waterDepth) || location.waterDepth <= 0) {
    missingInformation.push('Waterdiepte ontbreekt; diepteverschillen en thermische gelaagdheid zijn niet meegenomen.');
  }
  missingInformation.push('Bodemzachtheid, natuurlijke voedselbeschikbaarheid en witvisdruk zijn niet gemeten. Pas de hoeveelheid ter plaatse aan en voer niet automatisch de volledige richtlijn.');

  const feed = getSpeciesFeed(species, effectiveWaterTemp ?? 0);
  let suitability: PrebaitSuitability = 'Beperkt / voorzichtig';
  let suitabilityScore = 4;
  let maxBiologicalDays = 1;
  let amountPerDayGrams = 0;
  let campaignSummary = '';
  let biologicalRationale = '';
  let temperatureFactorExplanation = '';
  let feedDuringSession = true;
  let sessionAmountGrams = 0;
  let sessionAdvice = '';
  let recommendedMix = feed.mix;
  let digestibilityNote = feed.digestibility;
  let particleSizeNote = feed.particleSize;

  if (effectiveWaterTemp === null) {
    suitability = 'Niet aanbevolen (instant vissen aanbevolen)';
    suitabilityScore = 0;
    maxBiologicalDays = 0;
    campaignSummary = 'Geen voerhoeveelheid plannen: watertemperatuur is onbekend.';
    biologicalRationale = 'De app vult ontbrekende watertemperatuur niet meer stilzwijgend aan met een standaardwaarde. Gebruik directe waarnemingen en een kleine instant presentatie totdat de temperatuur bekend is.';
    temperatureFactorExplanation = 'Onbekend: er is geen bruikbare gemeten of geschatte watertemperatuur.';
    feedDuringSession = false;
    sessionAdvice = 'Geen bulkvoeradvies. Kies ter plaatse een kleine, doelgerichte presentatie en beoordeel activiteit en aanbeten.';
  } else if (effectiveWaterTemp < 6) {
    suitability = 'Niet aanbevolen (instant vissen aanbevolen)';
    suitabilityScore = 1;
    maxBiologicalDays = 0;
    campaignSummary = 'Niet voorvoeren. Kies voor een puur instant tactiek met minimaal haakaas.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C is de voedselopname van karperachtigen doorgaans sterk vertraagd. Dat betekent zeer terughoudend voeren, niet dat de stofwisseling letterlijk stilstaat.`;
    biologicalRationale = 'Een voerbed kan de weinige actieve vissen onnodig verzadigen. Richt je op directe signalen en een kleine presentatie. Bij method feeder blijft een kleine korf rond het haakaas een instant aanbieding; dat is geen reden om vooraf een voerbed aan te leggen.';
    feedDuringSession = false;
    sessionAdvice = isMethodFeeder
      ? 'Geen extra bijvoer of voerbed. Method feeder kan als instant presentatie: vul de korf minimaal en werp gericht bij het haakaas.'
      : 'Niet bijvoeren. Gebruik een kleine single hookbait of micro-PVA-presentatie vlak bij de haak.';
    recommendedMix = 'Geen voorvoermengsel. Alleen minimaal haakaas; bij method feeder een kleine, compacte korfvulling als onderdeel van de presentatie.';
    digestibilityNote = 'Bij zeer koud water is terughoudendheid belangrijker dan een zwaar of voedzaam voerprogramma.';
    particleSizeNote = 'Minimale hoeveelheid en kleine presentatie; geen grove voerplek opbouwen.';
  } else if (effectiveWaterTemp < 10) {
    suitability = 'Beperkt / voorzichtig';
    suitabilityScore = 4;
    maxBiologicalDays = 1;
    amountPerDayGrams = 100;
    campaignSummary = 'Maximaal één dag vooraf een kleine, compacte portie. Voorvoeren is optioneel, niet noodzakelijk.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C zijn voedselopname en vertering doorgaans lager. Houd de hoeveelheid beperkt en laat visactiviteit leidend zijn.`;
    biologicalRationale = 'Een kleine hoeveelheid kan een herkenningspunt geven, maar een grote voerplek is niet gerechtvaardigd door de beschikbare informatie.';
    feedDuringSession = true;
    sessionAmountGrams = isMethodFeeder ? 60 : 30;
    sessionAdvice = isMethodFeeder
      ? 'Method feeder: kleine korfvulling per worp, alleen opnieuw werpen op basis van beet/activiteit; geen extra voerbed.'
      : 'Alleen een kleine aanvulling na duidelijke visactiviteit of een aanbeet.';
  } else if (effectiveWaterTemp < 16) {
    suitability = 'Matig zinvol';
    suitabilityScore = 6;
    maxBiologicalDays = 2;
    amountPerDayGrams = 250;
    campaignSummary = 'Een bescheiden campagne van één tot twee dagen kan zinvol zijn; bouw rustig op.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C neemt de voedselopname doorgaans toe ten opzichte van koud water, maar voerhoeveelheden blijven afhankelijk van visdruk en natuurlijk voedsel.`;
    biologicalRationale = 'Een beperkte hoeveelheid op dezelfde zone kan gewenning ondersteunen. Twee dagen vooraf is een bovengrens voor dit standaardadvies, geen verplicht schema.';
    feedDuringSession = true;
    sessionAmountGrams = isMethodFeeder ? 100 : 100;
    sessionAdvice = isMethodFeeder
      ? 'Method feeder: kleine compacte korfvullingen als instant voer; voorvoeren vooraf kan daarnaast, maar tel het niet op als een tweede grote voerbeurt.'
      : 'Begin met een kleine portie en voer alleen bij wanneer aanbeten of vangsten daar aanleiding toe geven.';
  } else if (effectiveWaterTemp <= 22) {
    suitability = 'Zeer zinvol';
    suitabilityScore = 8;
    maxBiologicalDays = 3;
    amountPerDayGrams = isFlowingWater ? 600 : 450;
    campaignSummary = 'Voorvoeren kan zinvol zijn: gebruik een beheerste campagne van één tot drie dagen.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C is de voedselopname doorgaans hoger dan in koud water. Er bestaat geen universele optimale temperatuur of vaste voerhoeveelheid voor elke stek.`;
    biologicalRationale = 'Een herhaalde, bescheiden voerplek kan vis laten terugkeren. Verhoog de hoeveelheid alleen wanneer activiteit, bodem en visbezetting dat ondersteunen.';
    feedDuringSession = true;
    sessionAmountGrams = isMethodFeeder ? 120 : 150;
    sessionAdvice = isMethodFeeder
      ? 'Method feeder blijft instant: vul de korf compact en houd de totale losse voerhoeveelheid tijdens de sessie in verhouding tot activiteit en vooraf gevoerd voer.'
      : 'Start beperkt en vul na een vangst of duidelijke activiteit gericht aan.';
  } else {
    suitability = 'Beperkt / voorzichtig';
    suitabilityScore = 4;
    maxBiologicalDays = 1;
    amountPerDayGrams = 200;
    campaignSummary = 'Bij warm water voorzichtig voeren; zuurstof en visactiviteit zijn leidend.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C kunnen zuurstofbeschikbaarheid en lokale omstandigheden belangrijker worden dan een standaard voerhoeveelheid.`;
    biologicalRationale = 'Voorkom grote voerbedden zonder zichtbare activiteit. Beperk voeren en controleer lokale omstandigheden.';
    feedDuringSession = true;
    sessionAmountGrams = isMethodFeeder ? 80 : 60;
    sessionAdvice = isMethodFeeder
      ? 'Gebruik een kleine method-feederkorf en beoordeel activiteit; voorkom overmatig voeren.'
      : 'Voer alleen kleine hoeveelheden wanneer visactiviteit dat ondersteunt.';
  }

  // Brasem en zeelt krijgen een eigen, lagere startdosering dan karper.
  amountPerDayGrams = Math.round(amountPerDayGrams * feed.amountFactor / 25) * 25;
  if (preferredFeedType?.trim() && effectiveWaterTemp !== null && effectiveWaterTemp >= 6) {
    recommendedMix = `${preferredFeedType.trim()} (gebruik kleine hoeveelheden en stem samenstelling af op ${species.toLowerCase()})`;
  }

  const planningDate = options.planningDate ?? toDateStr(new Date(targetDate.getTime() - Math.max(0, availableDaysBefore) * 86400000));
  const daysUntilSession = daysBetween(planningDate, targetDateStr);
  const requestedDays = Math.max(0, Math.min(3, Math.floor(availableDaysBefore)));
  const effectiveDays = effectiveWaterTemp !== null && suitabilityScore >= 4 && hasLocationContext
    ? Math.min(requestedDays, maxBiologicalDays, daysUntilSession)
    : 0;
  const moments: PrebaitFeedingMoment[] = [];
  let totalCampaignGrams = 0;

  for (let dayOffset = -effectiveDays; dayOffset < 0; dayOffset++) {
    const momentDate = new Date(targetDate);
    momentDate.setUTCDate(momentDate.getUTCDate() + dayOffset);
    const amountGrams = Math.round((amountPerDayGrams * (dayOffset === -1 ? 1 : 0.8)) / 25) * 25;
    totalCampaignGrams += amountGrams;
    moments.push({
      dayOffset,
      date: toDateStr(momentDate),
      dayLabel: dayOffset === -1 ? '1 dag vooraf' : `${Math.abs(dayOffset)} dagen vooraf`,
      suggestedTime: effectiveWaterTemp !== null && effectiveWaterTemp >= 22 ? 'Avond of vroege ochtend' : 'Bij voorkeur een vast moment, bijvoorbeeld avond',
      feedType: recommendedMix,
      amountGrams,
      amountDisplay: `circa ${amountGrams} gram`,
      purpose: dayOffset === -1
        ? 'Laatste kleine voerbeurt; houd voldoende tijd tussen voeren en vissen.'
        : 'Voorzichtige eerste voerbeurt om de stek herkenbaar te maken.',
    });
  }

  // Method feeder is instant voer rond het haakaas. Het is geen aparte voorvoerbeurt
  // en wordt daarom niet dubbel bij het totale voorvoergewicht opgeteld.
  const duration = Number.isFinite(sessionDurationHours) ? Math.max(0.25, Math.min(24, sessionDurationHours)) : 3;
  const sessionAmount = feedDuringSession && hasLocationContext
    ? Math.round((sessionAmountGrams * duration / 3) / 10) * 10
    : 0;
  moments.push({
    dayOffset: 0,
    date: targetDateStr,
    dayLabel: 'Visdag zelf',
    suggestedTime: 'Tijdens de sessie',
    feedType: isMethodFeeder ? 'Instant method-feederkorf rond het haakaas' : recommendedMix,
    amountGrams: sessionAmount,
    amountDisplay: sessionAmount > 0 ? `circa ${sessionAmount} gram` : 'Geen extra voer',
    purpose: isMethodFeeder
      ? 'Instant presentatie: kleine korfvulling bij iedere gerichte worp. Dit is geen vooraf aangelegde voerplek.'
      : feedDuringSession
      ? 'Beperkt aanvullen op basis van daadwerkelijke visactiviteit.'
      : 'Geen bijvoer; houd de presentatie minimaal en instant.',
  });
  totalCampaignGrams += sessionAmount;

  // Persoonlijke vergelijking uitsluitend binnen dezelfde doelsoort en stek.
  let personalEvidence: PrebaitProgramPlan['personalEvidence'];
  const relevantSessions = historicalSessions.filter((s) => {
    if ((s.outcome !== 'catch' && s.outcome !== 'skunk_confirmed') || s.isBenchmark) return false;
    if (!location?.id || s.locationId !== location.id) return false;
    if (!s.targetSpecies?.includes(species)) return false;
    return true;
  });
  const prebaitedSessions = relevantSessions.filter((s) =>
    s.prebaited === true || Boolean(s.baitAndFeed?.toLowerCase().includes('voorvoer'))
  );
  const nonPrebaitedSessions = relevantSessions.filter((s) =>
    s.prebaited === false || (s.prebaited === undefined && !s.baitAndFeed?.toLowerCase().includes('voorvoer'))
  );
  const hasSufficientData = relevantSessions.length >= 5 &&
    prebaitedSessions.length >= 2 && nonPrebaitedSessions.length >= 2;

  if (hasSufficientData) {
    const prebaitCatches = prebaitedSessions.filter((s) => s.outcome === 'catch').length;
    const nonPrebaitCatches = nonPrebaitedSessions.filter((s) => s.outcome === 'catch').length;
    const ratePrebait = Math.round(prebaitCatches / prebaitedSessions.length * 100);
    const rateNonPrebait = Math.round(nonPrebaitCatches / nonPrebaitedSessions.length * 100);
    personalEvidence = {
      hasSufficientData: true,
      totalRelevantSessions: relevantSessions.length,
      relevantPrebaitedSessionsCount: prebaitedSessions.length,
      catchRateWithPrebait: ratePrebait,
      catchRateWithoutPrebait: rateNonPrebait,
      summaryNote: `Vergelijking op dezelfde stek en doelsoort (N=${relevantSessions.length}): met voorvoeren ${prebaitCatches}/${prebaitedSessions.length} vangstsessies (${ratePrebait}%), zonder voorvoeren ${nonPrebaitCatches}/${nonPrebaitedSessions.length} (${rateNonPrebait}%). Dit is een beschrijvende vergelijking, geen bewijs dat voorvoeren de vangst veroorzaakte.`,
    };
  } else {
    personalEvidence = {
      hasSufficientData: false,
      totalRelevantSessions: relevantSessions.length,
      relevantPrebaitedSessionsCount: prebaitedSessions.length,
      catchRateWithPrebait: null,
      catchRateWithoutPrebait: null,
      summaryNote: location?.id
        ? `Nog onvoldoende vergelijkbare sessies op deze stek voor ${species.toLowerCase()}. Persoonlijke voorvoerpercentages worden pas getoond bij minimaal 5 sessies, waaronder ten minste 2 met en 2 zonder voorvoeren.`
        : 'Persoonlijke voorvoerhistorie niet gebruikt: er is geen specifieke stek geselecteerd.',
    };
  }

  if (!hasLocationContext && effectiveWaterTemp !== null && effectiveWaterTemp >= 6) {
    campaignSummary = 'Geen concrete hoeveelheid of voertiming: kies eerst een stek met bekend watertype.';
    biologicalRationale = 'Zonder een bruikbare watercontext geeft de planner geen voerhoeveelheden. Gebruik directe waarnemingen en de lokale stekstructuur.';
    sessionAdvice = 'Geen concrete hoeveelheid. Leg eerst de stek en het watertype vast.';
  }
  const confidenceLevel: PrebaitProgramPlan['confidenceLevel'] =
    thermalQuality.level === 'high' && waterTypeQuality.level === 'high' && depthQuality.level === 'high' ? 'Redelijk' :
    thermalQuality.usable && waterTypeQuality.usable ? 'Matig' : 'Laag';

  return {
    suitability,
    suitabilityScore,
    shouldPrebait: effectiveDays > 0,
    recommendedDaysBefore: effectiveDays,
    totalAmountGrams: totalCampaignGrams,
    campaignSummary,
    biologicalRationale,
    temperatureFactorExplanation,
    moments,
    sessionDayGuidance: {
      feedDuringSession: feedDuringSession && hasLocationContext,
      recommendedAmountGrams: sessionAmount,
      amountDisplay: sessionAmount > 0 ? `circa ${sessionAmount} gram` : 'Geen extra voer',
      advice: sessionAdvice,
    },
    feedCompositionAdvice: { recommendedMix, digestibilityNote, particleSizeNote },
    confidenceLevel,
    missingInformation,
    personalEvidence,
    methodFeederGuidance: isMethodFeeder
      ? 'Method feeder is instant vissen: het voer zit in of om de korf bij het haakaas. Voorvoeren vooraf blijft mogelijk als de temperatuur en omstandigheden dat toelaten; houd de korfvulling en eventuele vooraf gevoerde hoeveelheid als twee afzonderlijke zaken bij.'
      : undefined,
  };
}
