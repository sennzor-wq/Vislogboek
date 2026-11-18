import {
  FishingLocation,
  CompassDirection,
  COMPASS_DIRECTIONS,
  BankWindRelation,
  BankWindAnalysis,
} from '../types';

export const COMPASS_DEGREES_MAP: Record<CompassDirection, number> = {
  Noord: 0,
  Noordoost: 45,
  Oost: 90,
  Zuidoost: 135,
  Zuid: 180,
  Zuidwest: 225,
  West: 270,
  Noordwest: 315,
};

export const DEGREES_TO_COMPASS_MAP: Array<{ min: number; max: number; dir: CompassDirection }> = [
  { min: 337.5, max: 360, dir: 'Noord' },
  { min: 0, max: 22.5, dir: 'Noord' },
  { min: 22.5, max: 67.5, dir: 'Noordoost' },
  { min: 67.5, max: 112.5, dir: 'Oost' },
  { min: 112.5, max: 157.5, dir: 'Zuidoost' },
  { min: 157.5, max: 202.5, dir: 'Zuid' },
  { min: 202.5, max: 247.5, dir: 'Zuidwest' },
  { min: 247.5, max: 292.5, dir: 'West' },
  { min: 292.5, max: 337.5, dir: 'Noordwest' },
];

export function getCompassFromDegrees(degrees: number): CompassDirection {
  const norm = ((degrees % 360) + 360) % 360;
  for (const item of DEGREES_TO_COMPASS_MAP) {
    if (item.min > item.max) {
      if (norm >= item.min || norm < item.max) return item.dir;
    } else if (norm >= item.min && norm < item.max) {
      return item.dir;
    }
  }
  return 'Noord';
}

export interface BankWindCalculationContext {
  effectiveWaterTemp: number;
  season: 'Voorjaar' | 'Zomer' | 'Herfst' | 'Winter';
  isColdWind: boolean;
  isCoolingPeriod?: boolean;
  isWarmingPeriod?: boolean;
  waterType?: string;
}

/**
 * Berekent exact hoe de actuele wind zich verhoudt tot de oever van de gekozen visstek.
 * Maakt strikt onderscheid tussen windherkomst (waaruit hij komt), blaasrichting (+180°),
 * en de daadwerkelijke oeveroriëntatie (kijkrichting naar het water vanaf de oever).
 */
export function analyzeBankWind(
  location: FishingLocation | undefined,
  windDirectionDegrees: number,
  windSpeedKmH: number,
  context: BankWindCalculationContext
): BankWindAnalysis {
  const windOriginDeg = ((windDirectionDegrees % 360) + 360) % 360;
  const windOriginDir = getCompassFromDegrees(windOriginDeg);

  const windDestDeg = (windOriginDeg + 180) % 360;
  const windDestDir = getCompassFromDegrees(windDestDeg);

  const { waterType } = context;
  const isFlowingWater = waterType === 'Rivier' || waterType === 'Kanaal';

  const missingInformation: string[] = [];
  const fieldChecklist: string[] = [
    `Controleer de feitelijke kabbel op het water (bomenrijen, rietkragen of dijken kunnen de ${windOriginDir.toLowerCase()}enwind lokaal afbuigen).`,
    `Kijk of er schuimkragen of troebeling tegen jouw oever slaan (aanlandige branding) of dat het water vlak onder de kant spiegelglad blijft (luwte).`,
    `Peil het talud voor jouw vispositie: zoek de rand waar het ondiepe oeverplateau afloopt naar dieper water.`,
  ];

  // Als de visser de waterFacingDirection nog niet heeft vastgelegd
  if (!location?.waterFacingDirection) {
    missingInformation.push(
      'De richting van het water vanaf deze oeverstek is nog niet eenmalig ingesteld. Een GPS-punt alleen markeert de coördinaten, maar definieert niet aan welke zijde van het water je staat.'
    );
    missingInformation.push(
      'Kies hieronder eenmalig de kijkrichting naar het water (bijv. "West" als je naar het westen over het water kijkt) om de automatische aanlandig/aflandig berekening te activeren.'
    );

    return {
      isConfigured: false,
      waterFacingDirection: null,
      waterFacingDegrees: null,
      windOriginDirection: windOriginDir,
      windOriginDegrees: windOriginDeg,
      windDestinationDirection: windDestDir,
      windDestinationDegrees: windDestDeg,
      windSpeedKmH,
      relation: 'Onbekende oeveroriëntatie',
      relativeAngleDegrees: undefined,
      bankAssessment: {
        isFavorable: false,
        statusLabel: 'Oeverpositie niet geconfigureerd',
        explanation: `Wind komt uit het ${windOriginDir} (${windOriginDeg}°) en blaast richting het ${windDestDir} (${windDestDeg}°). Om te bepalen of deze wind op jouw oever botst of van je af waait, moet de oeverkijkrichting bekend zijn.`,
        waveAction: 'Afhankelijk van jouw gekozen stekzijde: windwaartse oevers vangen branding, lijwaartse oevers liggen in de luwte.',
        driftCurrent: 'Oppervlaktedrift beweegt richting het ' + windDestDir + '.',
      },
      rodPlacementAdvice: {
        primaryPosition: 'Plaatsing afhankelijk van gekozen oever ter plaatse (geen schijnzekerheid)',
        rationale:
          'Zonder bekende oeveroriëntatie forceert het model geen gefingeerde werprichting. Beoordeel ter plekke of je met de rug in de wind wilt zitten of op de windkant.',
        castingDirectionAdvice: `Scenario 1 (Luwe oever / wind in de rug): Werp met de wind mee richting ${windDestDir.toLowerCase()} het open water op.\nScenario 2 (Windkant / wind in het gezicht): Vis kort onder de kant op het oevertalud waar de branding opbotst.`,
      },
      missingInformation,
      fieldChecklist,
    };
  }

  // Oeveroriëntatie IS bekend!
  const waterFacingDir = location.waterFacingDirection;
  const waterFacingDeg = COMPASS_DEGREES_MAP[waterFacingDir];

  // Hoek tussen windherkomst en oeverkijkrichting:
  // 0° = wind komt recht uit het water op de oever (recht aanlandig / kopwind)
  // 180° = wind komt van achteren over de oever het water op (recht aflandig / rugwind)
  const angleDiff = Math.abs(((((windOriginDeg - waterFacingDeg + 180) % 360) + 360) % 360) - 180);
  const relativeAngle = Math.round(angleDiff);

  let relation: BankWindRelation;
  if (relativeAngle <= 30) {
    relation = 'Recht aanlandig (kopwind op de oever)';
  } else if (relativeAngle <= 65) {
    relation = 'Schuin aanlandig (schuin op de oever)';
  } else if (relativeAngle <= 115) {
    relation = 'Zijwind (dwars langs de oever)';
  } else if (relativeAngle <= 150) {
    relation = 'Schuin aflandig (schuin van achteren)';
  } else {
    relation = 'Recht aflandig (rugwind / beschutte luwte)';
  }

  // Fysieke wind-/oeverrelatie beschrijven; geen vislocatie uit wind afleiden.
  let isFavorable = false;
  let statusLabel = '';
  let explanation = '';
  let waveAction = '';
  let driftCurrent = '';
  let primaryPosition = '';
  let rationale = '';
  let castingDirectionAdvice = '';

  const isAanlandig = relation.includes('aanlandig');
  const isAflandig = relation.includes('aflandig');

  if (isFlowingWater) {
    statusLabel = 'Stromend water — lokale stroming is leidend';
    explanation = `Op ${waterType?.toLowerCase() || 'stromend water'} bepalen lokale stroomnaden en luwtes de waterbeweging; oppervlaktewind is slechts aanvullende context.`;
    waveAction = `Wind ${windSpeedKmH} km/u; controleer de feitelijke golfslag op de gekozen oever.`;
    driftCurrent = 'De hoofdstroming kan domineren over windgedreven oppervlaktedrift; lokale stroming is niet gemeten.';
    primaryPosition = 'Kies een veilige oeverpositie en positioneer de hengels ten opzichte van de lokaal vastgestelde doelzone.';
    rationale = 'Windrichting helpt bij lijncontrole; de doelzone volgt uit lokale stroming, habitat en waarnemingen.';
    castingDirectionAdvice = 'Stem de werphoek af op de lokaal vastgestelde stroomnaad of luwte en corrigeer voor lijnbocht door de wind.';
  } else if (isAanlandig) {
    statusLabel = 'Aanlandige wind — oppervlaktewerking mogelijk';
    explanation = `Wind uit het ${windOriginDir} (${windSpeedKmH} km/u) staat op jouw oever. Dit kan golfslag en oppervlaktedrift veroorzaken, maar toont niet aan dat vis of meer voedsel zich op deze plek bevindt.`;
    waveAction = 'Controleer de feitelijke golfslag, schuimvorming en troebeling ter plaatse; deze worden niet uit windsnelheid alleen afgeleid.';
    driftCurrent = `Oppervlaktedrift kan richting jouw oever lopen (${windDestDir}); de stroming nabij de bodem is niet vastgesteld.`;
    primaryPosition = 'Kies een veilige, bereikbare positie en houd rekening met golfslag; gebruik de habitat-/waarnemingsanalyse voor de doelzone.';
    rationale = 'Aanlandige wind is relevant voor presentatie en lijncontrole, niet als zelfstandig bewijs voor een gunstige vislocatie.';
    castingDirectionAdvice = 'Werp naar de reeds gekozen doelzone en pas hoek en lijncontrole aan de wind aan; vis niet automatisch kort onder de kant.';
  } else if (isAflandig) {
    statusLabel = 'Aflandige wind — rugwind en oeverluwte';
    explanation = `Wind uit het ${windOriginDir} (${windSpeedKmH} km/u) waait van jouw oever af. Dit kan de werpafstand en het comfort beïnvloeden; het zegt niet waar vis zich ophoudt.`;
    waveAction = 'Controleer ter plaatse waar het wateroppervlak rustig of juist beweeglijk is.';
    driftCurrent = `Oppervlaktedrift kan van jouw oever af richting ${windDestDir} lopen; de bodemstroming is onbekend.`;
    primaryPosition = 'Kies de oeverpositie op bereikbaarheid en comfort; houd de gekozen doelzone onafhankelijk van de wind aan.';
    rationale = 'Rugwind kan de presentatie vergemakkelijken, maar is geen aanwijzing voor een vislocatie.';
    castingDirectionAdvice = 'Gebruik de rugwind voor een gecontroleerde worp naar de gekozen doelzone; vergroot de afstand niet zonder reden.';
  } else {
    statusLabel = 'Zijwind — let op laterale lijnbocht';
    explanation = `De wind (${windOriginDir} richting ${windDestDir}, ${windSpeedKmH} km/u) staat schuin of dwars op jouw oever. Dit kan de lijn en montage zijwaarts verplaatsen.`;
    waveAction = 'Controleer de richting en sterkte van de feitelijke golfslag langs de oever.';
    driftCurrent = 'Laterale oppervlaktedrift is mogelijk; de lokale bodemstroming is niet vastgesteld.';
    primaryPosition = 'Kies een stabiele hengelpositie en houd ruimte voor lijnbocht; de doelzone volgt uit habitat en waarnemingen.';
    rationale = 'Zijwind vraagt om aanpassing van werphoek en lijncontrole, niet om een automatische zoekzone achter obstakels.';
    castingDirectionAdvice = 'Corrigeer de werphoek voor zijwaartse lijnbocht en presenteer op de gekozen doelzone.';
  }

  return {
    isConfigured: true,
    waterFacingDirection: waterFacingDir,
    waterFacingDegrees: waterFacingDeg,
    windOriginDirection: windOriginDir,
    windOriginDegrees: windOriginDeg,
    windDestinationDirection: windDestDir,
    windDestinationDegrees: windDestDeg,
    windSpeedKmH,
    relation,
    relativeAngleDegrees: relativeAngle,
    bankAssessment: {
      isFavorable,
      statusLabel,
      explanation,
      waveAction,
      driftCurrent,
    },
    rodPlacementAdvice: {
      primaryPosition,
      rationale,
      castingDirectionAdvice,
    },
    missingInformation,
    fieldChecklist,
  };
}
