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

  const { effectiveWaterTemp, season, isColdWind, isCoolingPeriod, waterType } = context;
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

  // Biologische evaluatie van de oever
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
  const isZijwind = relation.includes('Zijwind');

  if (isFlowingWater) {
    isFavorable = false;
    statusLabel = 'Stromend water (oeverdrift ondergeschikt)';
    explanation = `Op ${waterType?.toLowerCase() || 'stromend water'} bepalen stroomnaden, kribvakken en het diepere vaargeultalud de vispositie veel sterker dan de oppervlaktewind.`;
    waveAction = `Lichte tot matige kabbel (${windSpeedKmH} km/u) dwars op of langs de stroomrichting.`;
    driftCurrent = 'De hoofdströming is dominant over windgedreven oppervlaktedrift.';
    primaryPosition = 'Stroomnaden, taludrand naar de vaargeul of kribkoppen.';
    rationale = 'Zoek vissen in de luwte van obstakels of stroomranden waar zij energiezuinig voedsel kunnen onderscheppen.';
    castingDirectionAdvice = `Werp schuin stroomafwaarts of positioneer het aas precies op de stroomnaad voor jouw oever.`;
  } else if (isAanlandig) {
    // Aanlandige wind: botst op de oever van de visser
    if (effectiveWaterTemp < 8 || season === 'Winter' || (effectiveWaterTemp < 10 && isColdWind) || isCoolingPeriod) {
      isFavorable = false;
      statusLabel = 'Koude aanlandige branding (fysiologisch ongunstig)';
      explanation = `De ${windOriginDir.toLowerCase()}enwind (${windSpeedKmH} km/u) blaast recht op jouw oever. Omdat het water koud is (${effectiveWaterTemp.toFixed(1)} °C) en de wind kil is, onttrekt de golfslag extra warmte aan jouw oeverwater. Karper en witvis mijden deze kille, woelige oever en trekken naar diepere rustkuilen of de luwe overkant.`;
      waveAction = `Aanhoudende kille golven slaan op jouw oever en koelen de bovenste waterlaag af.`;
      driftCurrent = 'Koud oppervlaktewater stuwt naar jouw kant; bij de bodem ontstaat een kille onderstroom van je af.';
      primaryPosition = 'Diepere kuilen buiten de directe oeverbranding, of overweeg te verkassen naar de luwe oever.';
      rationale = 'In koud water verbruikt vis te veel energie in de golfslag. Vis dieper of zoek rustiger water.';
      castingDirectionAdvice = `Als je hier blijft vissen: werp ruim voorbij de woelige oeverbranding (${waterFacingDir.toLowerCase()}) naar de diepere bodemgedeelten.`;
    } else if ((season === 'Zomer' || season === 'Herfst') && windSpeedKmH >= 11 && !isColdWind) {
      isFavorable = true;
      statusLabel = 'Gunstig foerageerfront (actieve windkant)';
      explanation = `De ${windOriginDir.toLowerCase()}enwind (${windSpeedKmH} km/u) stuwt warm oppervlaktewater, fytoplankton, zoöplankton en zwevend natuurlijk voedsel recht naar jouw oever. De branding zorgt voor troebeling en zuurstof, waardoor karper en witvis met minder argwaan vlak onder jouw kant foerageren.`;
      waveAction = `Stevige branding slaat tegen jouw oeverlijn en woelt bodemdiertjes en muggenlarven los.`;
      driftCurrent = 'Sterke oppervlaktedrift naar jouw oever toe; zwakkere bodemretourstroom naar het diepere water.';
      primaryPosition = 'Kort op het eerste oevertalud, vlak onder de eigen kant of bij rietkragen waar schuim verzamelt.';
      rationale = 'Voedselophoping en troebeling maken de aanlandige oever dé primaire aashoek in de warmere seizoenen.';
      castingDirectionAdvice = `Vis kort! Plaats één hengel op slechts enkele meters uit de eigen oeverkant in de branding, en één montage op de voet van het eerste talud richting ${waterFacingDir.toLowerCase()}.`;
    } else {
      isFavorable = false;
      statusLabel = 'Matige aanlandige bries (neutraal perspectief)';
      explanation = `Lichte bries (${windSpeedKmH} km/u) op jouw oever. Voldoende voor lichte kabbel en lichte troebeling, maar bij milde temperaturen foerageert vis gelijkmatig over taluds.`;
      waveAction = 'Rustige kabbel op de oever.';
      driftCurrent = 'Geringe drift naar de oever toe.';
      primaryPosition = 'Overgangszone tussen het ondiepe talud en de open waterbodem.';
      rationale = 'Lichte aanlandige beweging zonder extreme opstuwing; vis kan zowel onder de kant als op half open water azen.';
      castingDirectionAdvice = `Werp richting ${waterFacingDir.toLowerCase()} naar het eerste diepteverloop (ca. 15-30 meter uit de kant).`;
    }
  } else if (isAflandig) {
    // Aflandige wind: visser zit met rug in de wind; oever ligt in de luwte
    if (effectiveWaterTemp < 8 || season === 'Winter' || (effectiveWaterTemp < 10 && isColdWind) || isCoolingPeriod) {
      isFavorable = true;
      statusLabel = 'Beschutte warme luwte (gunstige rust- en aashoek)';
      explanation = `De wind waait van jouw rug af het water op. Jouw oever ligt volledig in de beschutting en luwte van de oeverrand/begroeiing. In koud water (${effectiveWaterTemp.toFixed(1)} °C) en bij koude wind is deze windstille oever aanzienlijk aangenamer en energiezuiniger voor vis dan de kille aanlandige overkant.`;
      waveAction = 'Het water onder jouw oeverkant is spiegelglad en rustig; de golfslag bouwt pas verderop naar het midden op.';
      driftCurrent = 'Lichte oppervlaktedrift van jou af; stilstaand comfortabel water onder de eigen oever.';
      primaryPosition = 'Beschutte oeverhoeken, onder overhangende bomen of op het talud direct onder de luwe oever.';
      rationale = 'Vis zoekt bij koud weer rust en vermijdt kille stroming. De luwe oever biedt thermische stabiliteit.';
      castingDirectionAdvice = `Werp met de wind in de rug comfortabel en stil uit richting ${waterFacingDir.toLowerCase()}. Je kunt ver en precies werpen zonder lijnbocht door de wind.`;
    } else if (season === 'Voorjaar' && (context.isWarmingPeriod || effectiveWaterTemp >= 12)) {
      isFavorable = true;
      statusLabel = 'Opwarmende voorjaarsluwte (zeer gunstig)';
      explanation = `In het voorjaar warmen ondiepe, zonbeschenen oeverzones zonder woelige koude golfslag het snelst op. Doordat jouw oever beschut ligt onder de wind, kan de zonnewarmte zich ophopen zonder door koude windmenging te worden verdreven.`;
      waveAction = 'Spiegelglad wateroppervlak onder de eigen kant.';
      driftCurrent = 'Minimale afkoelende watermenging; warmte blijft geconcentreerd in de toplaag.';
      primaryPosition = 'Ondiepe zonbeschenen baaien, lelievelden of rietkragen uit de wind.';
      rationale = 'Karper zoekt in het voorjaar de warmste zones van het water op voor metabolisme en vertering.';
      castingDirectionAdvice = `Vis subtiel in de luwe oeverzone of werp lichtjes richting ${waterFacingDir.toLowerCase()} naar zonbeschenen ondieptes.`;
    } else {
      isFavorable = false;
      statusLabel = 'Luwe oever (comfortabel vissen, rustig water)';
      explanation = `Jouw oever ligt beschut onder de wind. Dit vist zeer comfortabel (geen wind in de ogen, verre en accurate worpen). In de zomer kan het voedsel echter naar de overzijde gestuwd worden.`;
      waveAction = 'Rustig water onder de kant.';
      driftCurrent = 'Lichte drift van je af het open water op.';
      primaryPosition = 'Verder op het open water (waar winddrift begint) of bij vaste structuren onder de eigen kant.';
      rationale = 'Goede stek voor visuele beetindicatie en afstandsvisserij; bij heet weer kan de windkant meer zuurstof bieden.';
      castingDirectionAdvice = `Profiteer van de rugwind: werp richting ${waterFacingDir.toLowerCase()} naar overgangszones in het wijdere water.`;
    }
  } else {
    // Zijwind / dwarswind langs de oever
    isFavorable = false;
    statusLabel = 'Zijwind (dwarsstroming langs de oever)';
    explanation = `De wind blaast onder een hoek van ~${relativeAngle}° dwars langs jouw oeverlijn (${windOriginDir} $\\to$ ${windDestDir}). Hierdoor ontstaat een driftstroom evenwijdig aan de oever.`;
    waveAction = `Schuine golven kabbelen langs de oeverlijn.`;
    driftCurrent = `Parallelle oeverdrift richting het ${windDestDir.toLowerCase()}.`;
    primaryPosition = 'Plekken waar de oeverlijn knikt, uitstekende rietkragen, lelievelden of kribben die de zijdelingse drift onderbreken.';
    rationale = 'Zijdelingse drift verzamelt natuurlijk voedsel achter fysieke obstakels langs de oever.';
    castingDirectionAdvice = `Houd rekening met een lijnbocht door de zijwind. Vis bij voorkeur stroomafwaarts van eventuele oeverobstakels in de richting ${waterFacingDir.toLowerCase()}.`;
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
