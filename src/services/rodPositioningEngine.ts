import {
  WeatherHourlyForecast,
  FishingLocation,
  FishingSession,
  CatchItem,
  FishSpecies,
  TimeSlot,
  ThermalTrend,
  WaterThermalAnalysis,
  CompassDirection,
  COMPASS_DIRECTIONS,
  RodPositioningAdvice,
  WindCastingGuidance,
} from '../types';
import { getAmsterdamMonth } from '../utils/dateTime';
import { TIME_SLOT_HOURS } from './prognosisEngine';

export interface RodPositioningOptions {
  location?: FishingLocation;
  userWaterTemp?: number | null;
  thermalAnalysis: WaterThermalAnalysis;
  historicalSessions: FishingSession[];
  historicalCatches?: CatchItem[];
  targetSlot?: TimeSlot;
}

/**
 * Bepaalt het meteorologisch seizoen voor de gegeven datum.
 */
function getSeasonNL(month: number): 'Voorjaar' | 'Zomer' | 'Herfst' | 'Winter' {
  if (month === 12 || month === 1 || month === 2) return 'Winter';
  if (month >= 3 && month <= 5) return 'Voorjaar';
  if (month >= 6 && month <= 8) return 'Zomer';
  return 'Herfst';
}

/**
 * Bepaalt soortspecifieke tactische zoekhypothesen voor hengelpositionering en visgedrag.
 * Waarschuwing: dit zijn biologisch onderbouwde zoekhypothesen, geen vangstgaranties.
 */
function determineTacticalHypothesis(
  species: FishSpecies | 'Algemeen',
  context: {
    isFlowingWater: boolean;
    waterType: string;
    waterDepth?: number;
    season: 'Voorjaar' | 'Zomer' | 'Herfst' | 'Winter';
    effectiveWaterTemp: number;
    avgWindSpeed: number;
    maxWindSpeed: number | null;
    windDirText: string;
    isColdWind: boolean;
    isStrongWind: boolean;
    isCalmWind: boolean;
    isWarmConditions: boolean;
    isWarmingPeriod: boolean;
    targetSlot?: TimeSlot;
    thermalTrend: ThermalTrend;
  }
): {
  recommendedZone: string;
  rationale: string;
  alternativeOption: string;
  confidenceLevel: 'Laag' | 'Matig' | 'Redelijk';
} {
  const {
    isFlowingWater,
    waterType,
    waterDepth,
    season,
    effectiveWaterTemp,
    avgWindSpeed,
    maxWindSpeed,
    windDirText,
    isColdWind,
    isCalmWind,
    isWarmConditions,
    isWarmingPeriod,
    targetSlot,
    thermalTrend,
  } = context;

  // SOORT: ROOFBLEI (Pelagische oppervlaktejager, stromingsminnend)
  if (species === 'Roofblei') {
    if (isFlowingWater) {
      return {
        recommendedZone: 'Stroomnaden, kribkoppen en turbulente oppervlaktezones',
        rationale: `Roofblei is een uitgesproken pelagische zichtjager die jaagt in de bovenste waterlaag rond stroomversnellingen, kribkoppen en stuwen. De wind (${windDirText} ${avgWindSpeed} km/u) versterkt oppervlakteonrust, wat prooivis desoriënteert. (Zoekhypothese voor oppervlaktejacht).`,
        alternativeOption:
          'Luwere wervelzones direct achter de stroomnaad bij extreem hoge stroomsnelheid of harde wind.',
        confidenceLevel: 'Redelijk',
      };
    }
    return {
      recommendedZone: 'Bovenste waterlaag, open water en zones met actieve oppervlaktebeweging',
      rationale: `Op stilstaand water zoekt roofblei open waterzones en winderige oevers op waar winddrift of inlaten prooivis concentreren. Biedt het aas hoog in het water aan. (Zoekhypothese voor pelagische jacht).`,
      alternativeOption: 'Oeverzones met zichtbare scholen speldaas of gemaaluitlaten.',
      confidenceLevel: 'Matig',
    };
  }

  // SOORT: SNOEK (Visuele hinderlaagjager)
  if (species === 'Snoek') {
    if (effectiveWaterTemp < 7 || (effectiveWaterTemp < 9 && isColdWind)) {
      return {
        recommendedZone: 'Diepere taluds en overgangen nabij samengeschoolde prooivis',
        rationale: `In koud water (${effectiveWaterTemp.toFixed(1)} °C) trekken witvisscholen naar diepere kuilen; snoek volgt deze prooiconcentraties en jaagt vanuit diepere hinderlagen. Vermijdt energieverspilling in koude golfslag. (Zoekhypothese voor winterjacht).`,
        alternativeOption:
          'Ondiepe rietkragen op zonnige wintermiddagen waar prooivis kort opwarmt.',
        confidenceLevel: waterDepth ? 'Redelijk' : 'Matig',
      };
    }
    if (isFlowingWater) {
      return {
        recommendedZone: 'Stroomluwe kribvakken, insteekhavens en taludoverslagen',
        rationale: `Op stromend water jaagt snoek vanuit luwtes op prooivissen die door de stroomnaad worden meegevoerd, zonder zelf continu energie te verliezen in de hoofdstroom. (Zoekhypothese voor hinderlaagjacht).`,
        alternativeOption:
          'Diepe buitenbochtkuilen of basaltgaten bij verhoogde rivierafvoer.',
        confidenceLevel: 'Redelijk',
      };
    }
    return {
      recommendedZone: 'Hinderlaagstructuren: vegetatieranden, rietkragen en taludovergangen',
      rationale: `Snoek jaagt vanuit dekking (waterplanten, rietkragen, taluds). Een matige kabbel (${windDirText} ${avgWindSpeed} km/u) en gedempt licht breken de lichtinval aan het wateroppervlak, wat de camouflage van de snoek ten opzichte van prooivis sterk verbetert. (Zoekhypothese voor hinderlaagjacht).`,
      alternativeOption:
        'Open water taluds of diepere geulen wanneer oevervegetatie ontbreekt.',
      confidenceLevel: 'Matig',
    };
  }

  // SOORT: SNOEKBAARS (Lichtschuwe diepwaterrover met tapetum lucidum)
  if (species === 'Snoekbaars') {
    const isDarkSlot = targetSlot === 'Nacht' || targetSlot === 'Avond';
    if (isFlowingWater) {
      return {
        recommendedZone: 'Vaargeultaluds, stroomranden en harde bodemstructuren',
        rationale: `Snoekbaars prefereert harde zand- of grindbodems langs vaargeulen en kribkoppen. De vis jaagt op de scheidingslijn tussen harde stroming en bodemluwte. (Zoekhypothese voor dieptestructuur).`,
        alternativeOption:
          'Diepere insteekhavens of stroomafwaartse kuilen bij troebel water of hoog peil.',
        confidenceLevel: 'Redelijk',
      };
    }
    if (isDarkSlot) {
      return {
        recommendedZone: 'Ondiepere taludranden en overgangen (schemering/nachtjacht)',
        rationale: `Tijdens donkere uren trekt snoekbaars vanuit diepe kuilen naar ondiepere taluds en oeverzones om te jagen op prooivis die in het donker in het nadeel is. (Zoekhypothese voor nachtjacht).`,
        alternativeOption:
          'Overgangszone naar dieper water wanneer de maan fel schijnt of het water kristalhelder is.',
        confidenceLevel: 'Matig',
      };
    }
    return {
      recommendedZone: 'Diepere taluds, vaargeulen en schaduwrijke overgangszones',
      rationale: `Door het lichtversterkende tapetum lucidum mijdt snoekbaars overdag fel zonlicht op ondieptes. De vis zoekt overdag diepere kuilen, steile taluds of schaduwrijke plekken op. (Zoekhypothese voor lichtschuwheid).`,
      alternativeOption:
        'Brugschaduwen of diepere steilwanden indien het water zeer helder is.',
      confidenceLevel: 'Matig',
    };
  }

  // SOORT: BAARS (Scholen- en zichtjager rond harde substraten)
  if (species === 'Baars') {
    return {
      recommendedZone: 'Harde bodemstructuren, taluds en schuilplaatsen bij kleinbroed',
      rationale: `Baars jaagt in scholen rond harde substraten (basalt, steigers, mosselbanken, takken). Wisselend licht en lichte kabbel (${avgWindSpeed} km/u) stimuleren scholenjacht op geconcentreerd kleinbroed. (Zoekhypothese voor structuurjacht).`,
      alternativeOption:
        'Diepere kuilen en zandafgravingen bij aanhoudende koude of felle windstilte.',
      confidenceLevel: 'Matig',
    };
  }

  // SOORT: ZEELT (Warmteminnende planten- en modderbewoner)
  if (species === 'Zeelt') {
    if (effectiveWaterTemp < 11) {
      return {
        recommendedZone: 'Diepere beschutte slibzones (extreme winterrust)',
        rationale: `Onder ~11–12 °C schakelt zeelt over op een diepe inactieve spaarstand in zachte bodemlagen. Ruwe golfslag en stroming worden strikt gemeden. (Zoekhypothese voor winterpassiviteit).`,
        alternativeOption:
          'Diepe, luwe havenbekkens of modderkuilen met minimale waterbeweging.',
        confidenceLevel: 'Matig',
      };
    }
    return {
      recommendedZone: 'Beschutte oeverzones met begroeiing, waterplanten of zachte modderbodem',
      rationale: `Zeelt foerageert tussen waterplanten (lelievelden, rietkragen) en in zachte modderbodems op slakjes en muggenlarven. Open, woelige oeverzones met zware aanlandige golfslag worden gemeden ten gunste van beschutte, slibrijke hoeken. (Zoekhypothese voor beschutte bodemfoerage).`,
      alternativeOption:
        'De overgangsrand direct voor de begroeiing naar iets dieper water bij kabbelend water.',
      confidenceLevel: 'Matig',
    };
  }

  // SOORT: MEERVAL (Grote warmteminnende nacht- en bodemrover)
  if (species === 'Meerval') {
    if (effectiveWaterTemp < 12) {
      return {
        recommendedZone: 'Diepste, stromingsvrije overwinteringskuilen (rusttoestand)',
        rationale: `Meerval is sterk warmteminnend. Onder 12–14 °C vertraagt de stofwisseling drastisch en zoekt de vis diepe, rustige bodemholen op zonder actief te jagen. (Zoekhypothese voor koude rust).`,
        alternativeOption: 'Diepe gaten in stilstaande zijarmen of havenmondingen.',
        confidenceLevel: 'Matig',
      };
    }
    return {
      recommendedZone: 'Diepe bodemkuilen overdag; stroomranden en ondiepere platen \'s nachts',
      rationale: `Meerval rust overdag bij diepe obstakels (omgewaaide bomen, diepe kribvakken) en trekt tijdens warme nachten of broeierig weer actief naar ondiepere stroomnaden en taluds om te jagen. (Zoekhypothese voor nachtelijke roof).`,
      alternativeOption:
        'Diepe uitspoelingsgaten achter kribben of stuwen.',
      confidenceLevel: 'Matig',
    };
  }

  // SOORT: VOORN (Schoolvis in midden- en onderlaag)
  if (species === 'Voorn') {
    if (effectiveWaterTemp < 7) {
      return {
        recommendedZone: 'Diepere rusthavens en kuilen; zonnige middagen op ondieptes',
        rationale: `In de winter verzamelt voorn zich in dichte scholen in diepe, rustige havens of vaargeulen; bij een zonnige namiddag trekken ze kort naar ondiepere luwe oeverzones. (Zoekhypothese voor winterscholing).`,
        alternativeOption: 'Luwte achter rietkragen of steigers.',
        confidenceLevel: 'Matig',
      };
    }
    return {
      recommendedZone: 'Overgangszones tussen oeverkabbel en rustig water (midden- en onderlaag)',
      rationale: `Voorn benut matige kabbel voor zuurstofrijk water en aangedreven zooplankton, maar zoekt dekking tegen predatoren langs de rand van waterplanten of taluds. (Zoekhypothese voor scholenfoerage).`,
      alternativeOption: 'Bovenste waterlaag bij warm, zwoel weer in de avond.',
      confidenceLevel: 'Matig',
    };
  }

  // SOORT: KARPER & BRASEM (Bodemazers, taluds, windgedreven voedsel) en OVERIG
  if (isFlowingWater) {
    return {
      recommendedZone: 'Stroomnaden, taluds en diepere overgangszones',
      rationale: `Op stromend water (${waterType.toLowerCase()}) dicteren stroming, vaargeulen en bodemverloop de vispositie veel sterker dan de oppervlakte-winddrift. De wind (${windDirText} ${avgWindSpeed} km/u) beïnvloedt vooral de oppervlaktelaag en lijnbeheersing; nabij de bodem blijft de hoofdstroming bepalend. (Zoekhypothese voor stromend water).`,
      alternativeOption:
        'Zoek bij harde wind of hoge afvoer de luwte van kribvakken, insteekhavens of de rustige binnenbocht.',
      confidenceLevel: 'Redelijk',
    };
  }

  if (effectiveWaterTemp < 7 || (effectiveWaterTemp < 9 && isColdWind)) {
    return {
      recommendedZone: 'Diepere rustzone of luwe oever (beschut tegen koude wind)',
      rationale: `In koud water (${effectiveWaterTemp.toFixed(1)} °C) en bij koude wind (${windDirText} ${avgWindSpeed} km/u) koelt de aanlandige oever snel verder af. Vis vermijdt hier onnodig energieverlies in de golfslag en zoekt vaak stabielere diepere kuilen of de beschutte luwe oever op. (De grens van ~7–8 °C is een praktische vuistregel, geen star biologisch omslagpunt). (Zoekhypothese voor koude rust).`,
      alternativeOption:
        'Onderzoek op zonnige wintermiddagen met weinig wind een ondiepere zandplaat die door zonnestraling licht kan opwarmen.',
      confidenceLevel: waterDepth ? 'Redelijk' : 'Matig',
    };
  }

  if (season === 'Voorjaar' && (isWarmingPeriod || effectiveWaterTemp >= 11)) {
    return {
      recommendedZone: 'Ondiepe, zonovergoten oeverzone of beschutte baai uit de wind',
      rationale: `In het voorjaar warmen ondieptes en uit de wind liggende baaien het snelst op onder invloed van zon. Karper en witvis trekken naar deze opwarmende zones om voedsel te zoeken in ontwakend bodemleven. (Zoekhypothese voor voorjaarsopwarming).`,
      alternativeOption:
        'Onderzoek de aanlandige zone alleen wanneer sprake is van een aanhoudend zachte, warme wind (bijv. zuiderwind) die warm water stuwt zonder koud diep water op te wellen.',
      confidenceLevel: 'Redelijk',
    };
  }

  if ((season === 'Zomer' || season === 'Herfst') && avgWindSpeed >= 12 && !isColdWind) {
    return {
      recommendedZone: 'Aanlandige oeverzone (windkant) als mogelijke zoekzone',
      rationale: `Een aanhoudende bries (${windDirText} ${avgWindSpeed} km/u${maxWindSpeed !== null && maxWindSpeed > avgWindSpeed ? `, stoten tot ~${maxWindSpeed} km/u` : ''}) kan oppervlaktewater en zwevend voedsel richting de oever verplaatsen. Dit veroorzaakt lichte troebeling en zuurstofinbreng, wat foerageergedrag kan triggeren. Belangrijke nuance: aan de oppervlakte waait het water aanlandig, maar nabij de bodem ontstaat in dieper water vaak een compenserende retourstroom in tegengestelde richting. Behandel de windkant daarom als kansrijke zoekzone, niet als vaststaande garantie. (Zoekhypothese voor aanlandige wind).`,
      alternativeOption:
        'Luwe oeverzone direct achter een rietkraag of een dieper talud, zeker als hevige golfslag het bodemaas verplaatst of vuil de hoofdlijn belaagt.',
      confidenceLevel: 'Matig',
    };
  }

  if (season === 'Zomer' && isCalmWind && isWarmConditions) {
    return {
      recommendedZone: 'Zuurstofrijke overgangszones, dieper water of schaduwrijke overkappingen',
      rationale: `Bij weinig wind (${avgWindSpeed} km/u) en warm water (~${effectiveWaterTemp.toFixed(1)} °C) kan in ondiep, stilstaand water zuurstofafname optreden. Vis zoekt vaak beschutting in diepere kuilen, bij waterplantenvelden of onder overhangende bomen. Let op: weinig wind betekent niet automatisch stilstaand water; thermische circulatie kan nabij de bodem nog steeds voor lichte waterverplaatsing zorgen. (Zoekhypothese voor warme luwte).`,
      alternativeOption:
        'Vroeg in de ochtend of laat in de avond foerageert vis vaak kort op de ondieptes wanneer het oppervlak iets afkoelt.',
      confidenceLevel: 'Matig',
    };
  }

  // Algemene / stabiele condities
  return {
    recommendedZone: 'Aanlandige zone of diepere taluds',
    rationale: `Bij een matige wind (${windDirText} ${avgWindSpeed} km/u) en een ${thermalTrend.toLowerCase()} zijn de omstandigheden evenwichtig. Vis kan zowel langs overgangszones aan de windkant foerageren als rusten bij diepere taluds. Voorkom vastpinnen op één enkele zone. (Zoekhypothese voor overgangsperiode).`,
    alternativeOption:
      'De luwe zijde van een eiland, rietkraag of brugpeiler waar natuurlijk voedsel neerslaat.',
    confidenceLevel: 'Matig',
  };
}

export interface DirectionMeta {
  shortText: string;
  fullName: CompassDirection;
  degrees: number;
  oppositeShort: string;
  oppositeFull: CompassDirection;
  oppositeDegrees: number;
  mapFlow: string;
}

export const DIRECTION_META_MAP: Record<string, DirectionMeta> = {
  N: {
    shortText: 'N',
    fullName: 'Noord',
    degrees: 0,
    oppositeShort: 'Z',
    oppositeFull: 'Zuid',
    oppositeDegrees: 180,
    mapFlow: 'vanaf de bovenkant van de kaart (N) recht naar beneden (Z)',
  },
  NO: {
    shortText: 'NO',
    fullName: 'Noordoost',
    degrees: 45,
    oppositeShort: 'ZW',
    oppositeFull: 'Zuidwest',
    oppositeDegrees: 225,
    mapFlow: 'vanaf rechtsboven op de kaart (NO) diagonaal naar linksonder (ZW)',
  },
  O: {
    shortText: 'O',
    fullName: 'Oost',
    degrees: 90,
    oppositeShort: 'W',
    oppositeFull: 'West',
    oppositeDegrees: 270,
    mapFlow: 'vanaf de rechterkant van de kaart (O) recht naar links (W)',
  },
  ZO: {
    shortText: 'ZO',
    fullName: 'Zuidoost',
    degrees: 135,
    oppositeShort: 'NW',
    oppositeFull: 'Noordwest',
    oppositeDegrees: 315,
    mapFlow: 'vanaf rechtsonder op de kaart (ZO) diagonaal naar linksboven (NW)',
  },
  Z: {
    shortText: 'Z',
    fullName: 'Zuid',
    degrees: 180,
    oppositeShort: 'N',
    oppositeFull: 'Noord',
    oppositeDegrees: 0,
    mapFlow: 'vanaf de onderkant van de kaart (Z) recht naar boven (N)',
  },
  ZW: {
    shortText: 'ZW',
    fullName: 'Zuidwest',
    degrees: 225,
    oppositeShort: 'NO',
    oppositeFull: 'Noordoost',
    oppositeDegrees: 45,
    mapFlow: 'vanaf linksonder op de kaart (ZW) diagonaal naar rechtsboven (NO)',
  },
  W: {
    shortText: 'W',
    fullName: 'West',
    degrees: 270,
    oppositeShort: 'O',
    oppositeFull: 'Oost',
    oppositeDegrees: 90,
    mapFlow: 'vanaf de linkerkant van de kaart (W) recht naar rechts (O)',
  },
  NW: {
    shortText: 'NW',
    fullName: 'Noordwest',
    degrees: 315,
    oppositeShort: 'ZO',
    oppositeFull: 'Zuidoost',
    oppositeDegrees: 135,
    mapFlow: 'vanaf linksboven op de kaart (NW) diagonaal naar rechtsonder (ZO)',
  },
};

/**
 * Normaliseert windtekst en graden naar de 8 standaard kompasrichtingen.
 */
export function getDirectionMeta(dirText: string, degrees?: number): DirectionMeta | null {
  const clean = (dirText || '').trim().toUpperCase();
  if (DIRECTION_META_MAP[clean]) {
    return DIRECTION_META_MAP[clean];
  }

  const aliases: Record<string, string> = {
    NOORD: 'N',
    NOORDOOST: 'NO',
    OOST: 'O',
    ZUIDOOST: 'ZO',
    ZUID: 'Z',
    ZUIDWEST: 'ZW',
    WEST: 'W',
    NOORDWEST: 'NW',
    NE: 'NO',
    NNE: 'NO',
    NNO: 'NO',
    ENE: 'NO',
    ONO: 'NO',
    E: 'O',
    ESE: 'ZO',
    OZO: 'ZO',
    SE: 'ZO',
    SSE: 'ZO',
    ZZO: 'ZO',
    S: 'Z',
    SSW: 'ZW',
    ZZW: 'ZW',
    SW: 'ZW',
    WSW: 'ZW',
    WZW: 'ZW',
    W: 'W',
    WNW: 'NW',
    NW: 'NW',
    NNW: 'NW',
  };

  if (aliases[clean] && DIRECTION_META_MAP[aliases[clean]]) {
    return DIRECTION_META_MAP[aliases[clean]];
  }

  if (typeof degrees === 'number' && !isNaN(degrees)) {
    const deg = ((degrees % 360) + 360) % 360;
    if (deg >= 337.5 || deg < 22.5) return DIRECTION_META_MAP['N'];
    if (deg >= 22.5 && deg < 67.5) return DIRECTION_META_MAP['NO'];
    if (deg >= 67.5 && deg < 112.5) return DIRECTION_META_MAP['O'];
    if (deg >= 112.5 && deg < 157.5) return DIRECTION_META_MAP['ZO'];
    if (deg >= 157.5 && deg < 202.5) return DIRECTION_META_MAP['Z'];
    if (deg >= 202.5 && deg < 247.5) return DIRECTION_META_MAP['ZW'];
    if (deg >= 247.5 && deg < 292.5) return DIRECTION_META_MAP['W'];
    return DIRECTION_META_MAP['NW'];
  }

  return null;
}

/**
 * Construeert gestructureerde wind- en werprichtingbegeleiding met Google Maps oriëntatie
 * en duidelijke scheiding tussen windherkomst, blaasrichting, windkant en werpadvies.
 */
export function buildWindCastingGuidance(
  dirText: string,
  degrees: number | undefined,
  location: FishingLocation | undefined,
  context: {
    effectiveWaterTemp: number;
    season: 'Voorjaar' | 'Zomer' | 'Herfst' | 'Winter';
    isColdWind: boolean;
    isCoolingPeriod: boolean;
    isWarmingPeriod: boolean;
    avgWindSpeed: number;
    isCalmWind: boolean;
    isWarmConditions: boolean;
    isFlowingWater: boolean;
    waterType: string;
  },
  personalEvidence?: RodPositioningAdvice['personalEvidence']
 ): WindCastingGuidance | undefined {
  const meta = getDirectionMeta(dirText, degrees);
  if (!meta) return undefined;
  const actualDegrees = meta.degrees;
  const oppDegrees = meta.oppositeDegrees;

  // 1. Google Maps oriëntatie en GPS-coördinaten van de stek
  let coordinatesText: string | undefined = undefined;
  if (typeof location?.latitude === 'number' && typeof location?.longitude === 'number') {
    const lat = location.latitude;
    const lon = location.longitude;
    const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'NB' : 'ZB'}`;
    const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'OL' : 'WL'}`;
    coordinatesText = `${latStr}, ${lonStr}`;
  }

  const mapFlowDescription = coordinatesText
    ? `Kijk je op Google Maps naar deze stek (${coordinatesText}): Noord is altijd de bovenkant van je kaart. De wind waait ${meta.mapFlow}.`
    : `Kijk je op Google Maps naar jouw viswater: Noord is altijd de bovenkant van je kaart. De wind waait ${meta.mapFlow}.`;

  const spotGpsText = coordinatesText ? `GPS-stek: ${coordinatesText}` : 'GPS-coördinaten niet vastgelegd';

  // 2. Beoordeling van de windkant op basis van seizoen, watertemperatuur en biologie
  const {
    effectiveWaterTemp,
    season,
    isColdWind,
    isCoolingPeriod,
    isWarmingPeriod,
    avgWindSpeed,
    isCalmWind,
    isWarmConditions,
    isFlowingWater,
    waterType,
  } = context;

  let isWindwardFavorable = false;
  let windwardAssessment = '';

  if (isFlowingWater) {
    isWindwardFavorable = false;
    windwardAssessment = `Op stromend water (${waterType.toLowerCase()}) bepalen vaargeultaluds, stroomnaden en kribkoppen de vispositie veel sterker dan de winddrift op het wateroppervlak.`;
  } else if (effectiveWaterTemp < 8 || (effectiveWaterTemp < 10 && isColdWind) || isCoolingPeriod) {
    isWindwardFavorable = false;
    windwardAssessment = `Niet aanbevolen (koud water / afkoeling). In koud water (${effectiveWaterTemp.toFixed(1)} °C) en bij koude wind onttrekt aanlandige golfslag extra warmte aan de oever. Karper en witvis mijden deze kille golfslag en zoeken energiebesparing in de luwe oever of diepere rustkuilen.`;
  } else if (season === 'Voorjaar' && (isWarmingPeriod || effectiveWaterTemp >= 11)) {
    isWindwardFavorable = false;
    windwardAssessment = `Geringe voorkeur. In het voorjaar warmen ondiepe, zonbeschenen oeverzones en beschutte baaien uit de wind sneller op dan een aanlandige oever met kille kabbel. Vis concentreert zich vaak in de opwarmende luwtes.`;
  } else if ((season === 'Zomer' || season === 'Herfst') && avgWindSpeed >= 12 && !isColdWind) {
    isWindwardFavorable = true;
    windwardAssessment = `Gunstige zoekzone. Een aanhoudende bries (${avgWindSpeed} km/u) stuwt warm oppervlaktewater, zoöplankton, fytoplankton en zwevend natuurlijk voedsel naar de ${meta.oppositeFull.toLowerCase()}elijke oever. Troebeling en golfslag verminderen de argwaan van foeragerende vis. (Let bij diep water wel op mogelijke retourstroom nabij de bodem).`;
  } else if (season === 'Zomer' && isCalmWind && isWarmConditions) {
    isWindwardFavorable = false;
    windwardAssessment = `Neutraal tot risicovol wegens windstilte. Bij warmte en weinig wind (${avgWindSpeed} km/u) stagneert het wateroppervlak. Zoek eerder zuurstofrijke overgangszones, diepere kuilen of schaduwrijke overkappingen.`;
  } else {
    isWindwardFavorable = false;
    windwardAssessment = `Gematigd / neutraal. De windkant biedt lichte troebeling, maar bij stabiele milde condities foerageert vis evengoed langs diepere taluds of in luwe overgangszones.`;
  }

  // 3. Werpadvies & Voorkomen van Schijnzekerheid
  const hasEmpiricalDirection = Boolean(
    personalEvidence?.hasSufficientData && personalEvidence.favoriteDirection
  );

  let isCastingDirectionDefinite = false;
  let recommendedDirection: CompassDirection | null = null;
  let summary = '';
  let reason = '';

  if (hasEmpiricalDirection && personalEvidence?.favoriteDirection) {
    isCastingDirectionDefinite = true;
    recommendedDirection = personalEvidence.favoriteDirection;
    summary = `Aanbevolen werprichting: ${personalEvidence.favoriteDirection} (empirisch ondersteund door ${personalEvidence.totalCompletedSessionsOnSpot} eerdere sessies op deze specifieke stek).`;
    reason = `Op basis van jouw eigen geregistreerde sessies op deze specifieke stek met historisch succes leverde aasaanbieding richting ${personalEvidence.favoriteDirection} het hoogste vangstresultaat op.`;
  } else {
    isCastingDirectionDefinite = false;
    recommendedDirection = null;
    summary = 'Werprichting is afhankelijk van je gekozen oeverpositie ter plaatse (geen vaste werprichting gefingeerd).';
    reason = 'De bekende GPS-coördinaten markeren de stek, maar bepalen niet aan welke zijde van het water je staat of waar de oeverlijn loopt. Stem je werprichting af op jouw gekozen vispositie.';
  }

  const scenarioGuidance = {
    standingLeewardBank: `Sta je aan de luwe oever (wind in de rug)? Werp met de wind mee richting ${meta.oppositeFull.toLowerCase()} het open water op. Dit werpt stil en ver, waarbij natuurlijk aangedreven voedsel van je af het water in waait.${!isWindwardFavorable ? ' In de huidige omstandigheden (kou/voorjaarsluwte) is dit een verantwoorde keuze.' : ''}`,
    standingWindwardBank: `Sta je aan de windkant (wind in je gezicht op de ${meta.oppositeFull.toLowerCase()}oever)? Vis kort op het oevertalud of werp schuin tegen de wind in. ${isWindwardFavorable ? 'De branding woelt hier bodemleven los waar actieve vis vlak onder de kant op afkomt.' : 'Wees voorzichtig: door koud water of afkoeling is deze oever momenteel kil en woelig; vis zoekt waarschijnlijk beschutting in diepte of luwte.'}`,
  };

  const onSiteChecklist = [
    `Controleer de feitelijke kabbel en golfslag op het wateroppervlak (bomenrijen, rietkragen of dijken kunnen de ${meta.fullName.toLowerCase()}enwind lokaal afbuigen of breken).`,
    `Kijk waar schuimkragen of troebeling tegen de kant slaan (de actuele aanlandige oever aan de ${meta.oppositeFull.toLowerCase()}zijde) en waar het water spiegelglad blijft (de luwte aan de ${meta.fullName.toLowerCase()}zijde).`,
    `Houd rekening met watertemperatuur en seizoen: bij koud water (<8 °C) is de luwte of een diepere kuil fysiologisch rustiger dan de koude windkant.`,
    `Peil het bodemverloop: zoek het eerste talud, een mosselbank of een dieper plateau binnen jouw comfortabele werpbereik.`,
  ];

  return {
    windOrigin: {
      shortText: meta.shortText,
      short: meta.shortText,
      fullName: meta.fullName,
      degrees: actualDegrees,
      label: `Wind komt UIT het ${meta.fullName} (${meta.shortText}, ~${actualDegrees}°)`,
    },
    windDestination: {
      shortText: meta.oppositeShort,
      short: meta.oppositeShort,
      fullName: meta.oppositeFull,
      degrees: oppDegrees,
      label: `Wind waait RICHTING het ${meta.oppositeFull} (${meta.oppositeShort}, ~${oppDegrees}°)`,
    },
    googleMapsVisual: {
      compassRule: 'Op Google Maps geldt standaard: Noord = Boven, Oost = Rechts, Zuid = Onder, West = Links.',
      mapFlowDescription,
      coordinatesText: coordinatesText ?? 'GPS-coördinaten niet vastgelegd',
      spotGpsText,
    },
    banksContext: {
      potentialWindwardBank: `De ${meta.oppositeFull.toLowerCase()}elijke oever(s) van het wateroppervlak (aanlandige oever waar de wind tegenaan botst)`,
      potentialLeewardBank: `De ${meta.fullName.toLowerCase()}elijke oever(s) van het wateroppervlak (luwe oever, beschut onder de wind)`,
      isWindwardFavorable,
      windwardAssessment,
    },
    castingAdvice: {
      isCastingDirectionDefinite,
      recommendedDirection,
      summary,
      reason,
      scenarioGuidance,
    },
    onSiteChecklist,
  };
}

/**
 * Analyseert tactische hengelpositionering en visbeweging op basis van fysische factoren
 * (wind, temperatuur, thermische trend, diepte en seizoen) en optionele persoonlijke logboekdata.
 *
 * BELANGRIJK: Deze engine is 100% onafhankelijk van de biologische activiteitsindex (1.0-10.0)
 * en de Poisson-vangstkansformule. Er worden géén bonuspunten of kansverhogingen berekend.
 */
export function analyzeRodPositioning(
  dateStr: string,
  forecasts: WeatherHourlyForecast[],
  species: FishSpecies | 'Algemeen',
  options: RodPositioningOptions
): RodPositioningAdvice {
  const { location, userWaterTemp, thermalAnalysis, historicalSessions, historicalCatches = [], targetSlot } = options;

  // 1. Relevante weersperiode selecteren (targetSlot of daggemiddelde)
  const dayForecasts = forecasts.filter((h) => h.time.startsWith(dateStr));

  const slotForecasts = targetSlot && TIME_SLOT_HOURS[targetSlot]
    ? dayForecasts.filter((h) => {
        const hour = parseInt(h.time.slice(11, 13), 10);
        const config = TIME_SLOT_HOURS[targetSlot];
        return hour >= config.start && hour < config.end;
      })
    : dayForecasts;
  const sampleForecasts = slotForecasts;

  // Bereken uitsluitend gemiddelden uit geldige metingen/verwachtingen.
  // Ontbrekende waarden blijven null; luchttemperatuur vervangt nooit watertemperatuur.
  const minimumWeatherSamples = Math.max(1, Math.ceil(sampleForecasts.length * 0.5));
  const validWindSamples = sampleForecasts.filter((h) =>
    typeof h.windSpeed === 'number' && Number.isFinite(h.windSpeed) && h.windSpeed >= 0 &&
    typeof h.windDirection === 'number' && Number.isFinite(h.windDirection) &&
    h.windDirection >= 0 && h.windDirection <= 360 &&
    typeof h.windDirectionText === 'string' && h.windDirectionText.trim().length > 0
  );
  const validWind = validWindSamples.length >= minimumWeatherSamples ? validWindSamples : [];
  const validAirTemps = sampleForecasts
    .map((h) => h.temperature)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= -30 && v <= 55);
  const usableAirTemps = validAirTemps.length >= minimumWeatherSamples ? validAirTemps : [];

  const avgWindSpeed = validWind.length > 0
    ? Math.round((validWind.reduce((sum, h) => sum + h.windSpeed, 0) / validWind.length) * 10) / 10
    : null;
  const maxWindSpeed = validWind.length > 0
    ? Math.round(Math.max(...validWind.map((h) => h.windSpeed)))
    : null;
  const avgAirTemp = usableAirTemps.length > 0
    ? Math.round((usableAirTemps.reduce((sum, v) => sum + v, 0) / usableAirTemps.length) * 10) / 10
    : null;

  let avgWindDegrees: number | undefined;
  let windDirText = 'Onbekend';
  let windTrend: 'Aantrekkend' | 'Afnemend' | 'Draaiend' | 'Stabiel' | undefined = validWind.length > 0 ? 'Stabiel' : undefined;
  let intraSessionNote: string | undefined;

  if (validWind.length > 0) {
    const radians = validWind.map((h) => h.windDirection * Math.PI / 180);
    const sinMean = radians.reduce((sum, value) => sum + Math.sin(value), 0) / radians.length;
    const cosMean = radians.reduce((sum, value) => sum + Math.cos(value), 0) / radians.length;
    const resultantLength = Math.hypot(sinMean, cosMean);

    if (resultantLength > 1e-6) {
      avgWindDegrees = (Math.atan2(sinMean, cosMean) * 180 / Math.PI + 360) % 360;
      const nearestDirection = Object.entries(DIRECTION_META_MAP)
        .sort((a, b) => {
          const da = Math.abs(((Number(a[1].degrees) - avgWindDegrees! + 540) % 360) - 180);
          const db = Math.abs(((Number(b[1].degrees) - avgWindDegrees! + 540) % 360) - 180);
          return da - db;
        })[0];
      windDirText = nearestDirection?.[0] ?? 'Onbekend';
    } else {
      windDirText = 'Wisselend';
    }

    const firstH = validWind[0];
    const lastH = validWind[validWind.length - 1];
    const speedDelta = lastH.windSpeed - firstH.windSpeed;
    const directionSequence = validWind.map((h) => h.windDirectionText.trim());
    if (directionSequence[0] !== directionSequence[directionSequence.length - 1] && validWind.length > 1) {
      windTrend = 'Draaiend';
      intraSessionNote = `Wind draait van ${directionSequence[0]} naar ${directionSequence[directionSequence.length - 1]} tijdens het tijdvak; de lokale oppervlaktebeweging kan mee veranderen.`;
    } else if (speedDelta >= 6) {
      windTrend = 'Aantrekkend';
      intraSessionNote = `Wind trekt aan van ${firstH.windSpeed} naar ${lastH.windSpeed} km/u.`;
    } else if (speedDelta <= -6) {
      windTrend = 'Afnemend';
      intraSessionNote = `Wind neemt af van ${firstH.windSpeed} naar ${lastH.windSpeed} km/u.`;
    }
  }

  // 2. Seizoen & thermische context (inclusief 24-72u historie en modelschatting)
  const month = getAmsterdamMonth(dateStr) ?? 1; // 1-12
  const season = getSeasonNL(month);

  const measuredWaterTemp = typeof userWaterTemp === 'number' && Number.isFinite(userWaterTemp)
    ? userWaterTemp
    : thermalAnalysis.hasMeasuredWaterTemp &&
        typeof thermalAnalysis.measuredWaterTemp === 'number' &&
        Number.isFinite(thermalAnalysis.measuredWaterTemp)
      ? thermalAnalysis.measuredWaterTemp
      : null;
  const hasMeasuredTemp = measuredWaterTemp !== null;
  const estimatedWaterTemp = typeof thermalAnalysis.estimatedWaterTemp === 'number' && Number.isFinite(thermalAnalysis.estimatedWaterTemp)
    ? thermalAnalysis.estimatedWaterTemp
    : null;
  const effectiveWaterTemp = measuredWaterTemp ?? estimatedWaterTemp;

  // Ontbrekende luchttemperatuur of wind wordt niet als normale conditie ingevuld.
  const isCoolingPeriod = thermalAnalysis.trend === 'Waarschijnlijke afkoeling';
  const isWarmingPeriod = thermalAnalysis.trend === 'Waarschijnlijke opwarming';
  const isColdWind = (avgAirTemp !== null && (avgAirTemp < 8 || (avgAirTemp < 12 && season === 'Voorjaar'))) || isCoolingPeriod;
  const isStrongWind = avgWindSpeed !== null && maxWindSpeed !== null && (avgWindSpeed >= 20 || maxWindSpeed >= 35);
  const isCalmWind = avgWindSpeed !== null && avgWindSpeed <= 10;
  const isWarmConditions = effectiveWaterTemp !== null && effectiveWaterTemp >= 21;

  // 3. Watertype & diepte-eigenschappen
  const waterType = location?.waterType;
  const isFlowingWater = waterType === 'Rivier' || waterType === 'Kanaal';
  const waterDepth = location?.waterDepth;

  // 4. Alleen een soortspecifieke tactische hypothese als watertype, thermische
  // context en de relevante weergegevens bekend zijn. Anders: bruikbaar algemeen
  // zoekadvies op basis van werkelijk geregistreerde lokale kenmerken.
  const canUseSpeciesHypothesis = Boolean(
    waterType && effectiveWaterTemp !== null && avgWindSpeed !== null
  );
  const canBuildWindCastingGuidance = canUseSpeciesHypothesis && avgWindDegrees !== undefined;
  const tacticalHypothesis = canUseSpeciesHypothesis
    ? determineTacticalHypothesis(species, {
        isFlowingWater,
        waterType: waterType!,
        waterDepth,
        season,
        effectiveWaterTemp: effectiveWaterTemp!,
        avgWindSpeed: avgWindSpeed!,
        maxWindSpeed: maxWindSpeed!,
        windDirText,
        isColdWind,
        isStrongWind,
        isCalmWind,
        isWarmConditions,
        isWarmingPeriod,
        targetSlot,
        thermalTrend: thermalAnalysis.trend,
      })
    : {
        recommendedZone: location?.habitatFeatures?.length
          ? 'Geregistreerde lokale structuur als eerste zoekzone'
          : 'Algemene zoekzone — aanvullende locatiegegevens nodig',
        rationale: [
          waterType ? `Watertype: ${waterType}.` : 'Watertype onbekend; stromend of stilstaand water wordt niet verondersteld.',
          effectiveWaterTemp !== null ? `Watertemperatuur: ${hasMeasuredTemp ? 'gemeten' : 'geschat'} ${effectiveWaterTemp.toFixed(1)} °C.` : 'Watertemperatuur ontbreekt; luchttemperatuur wordt niet als vervanging gebruikt.',
          avgWindSpeed !== null ? `Wind: ${avgWindSpeed} km/u.` : 'Windgegevens ontbreken; geen windgestuurde zone gekozen.',
          location?.habitatFeatures?.length ? `Gebruik de vastgelegde kenmerken: ${location.habitatFeatures.join(', ')}.` : 'Er zijn geen concrete lokale habitatkenmerken vastgelegd.',
          'Dit is een voorlopige zoekhypothese; controleer diepte, bodem en visactiviteit ter plaatse.',
        ].join(' '),
        alternativeOption: 'Vergelijk een tweede lokaal zichtbare structuur of diepteovergang; neem geen niet-geregistreerde bodemvorm aan.',
        confidenceLevel: 'Laag' as const,
      };

  // 5. Expliciete ontbrekende informatie (eerlijke modelbeperkingen, beknopt en zonder dubbele teksten)
  const missingInformation: string[] = [
    'Exacte oeverlijnoriëntatie en omtrek van het water zijn niet bekend in het systeem (GPS is een enkel punt). Onderzoek ter plekke welke oever daadwerkelijk de wind opvangt (aanlandig) of beschut ligt (aflandig).',
  ];

  if (!waterType) missingInformation.push('Watertype ontbreekt; het model neemt geen plas, kanaal of rivier aan.');
  if (!waterDepth) {
    missingInformation.push(
      'Waterdiepte en bodemprofiel zijn niet vastgelegd; er wordt geen standaarddiepte ingevuld.'
    );
  } else {
    missingInformation.push(
      `Geregistreerde gemiddelde diepte is ${waterDepth} m; lokale geulen, taluds of plateaus kunnen afwijken.`
    );
  }

  if (hasMeasuredTemp) {
    // De lokale meting is de thermische ankerwaarde.
  } else if (estimatedWaterTemp !== null) {
    missingInformation.push(
      `Watertemperatuur is een modelschatting (~${estimatedWaterTemp.toFixed(1)} °C), geen directe thermometermeting op de stek.`
    );
  } else {
    missingInformation.push('Watertemperatuur ontbreekt; luchttemperatuur wordt niet als vervanging gebruikt.');
  }
  if (avgWindSpeed === null || avgWindDegrees === undefined) {
    missingInformation.push('Onvoldoende geldige windgegevens voor een wind-/werpkompasadvies.');
  }
  if (avgAirTemp === null) missingInformation.push('Luchttemperatuur ontbreekt; geen thermische luchthypothese toegepast.');

  missingInformation.push(
    'Lokale microklimaten (bomenrijen, rietkragen, bebouwing) kunnen de windrichting aan het wateroppervlak sterk afbuigen.'
  );

  // 6. Persoonlijke leerresultaten (Strikte drempel: >= 11 voltooide sessies op DEZELFDE stek, waarvan >= 6 met baitDirection)
  let personalEvidence: RodPositioningAdvice['personalEvidence'] = undefined;

  if (location?.id) {
    // Filter uitsluitend voltooide sessies op exact deze geregistreerde stek (benchmark uitgesloten)
    const validSpotSessions = historicalSessions.filter((session) => {
      if (session.locationId !== location.id || session.isBenchmark) return false;
      if (species !== 'Algemeen' && !session.targetSpecies?.includes(species)) return false;
      if (session.outcome === 'skunk_confirmed') return true;
      if (session.outcome !== 'catch') return false;
      return historicalCatches.some((item) =>
        item.sessionId === session.id &&
        (species === 'Algemeen' || item.species === species) &&
        item.legacyImportQuality?.speciesKnown !== false
      );
    });

    const totalCompleted = validSpotSessions.length;

    // Filter sessies met een bruikbare baitDirection
    const withDirection = validSpotSessions.filter(
      (s) => s.baitDirection && COMPASS_DIRECTIONS.includes(s.baitDirection)
    );

    const hasSufficientData = totalCompleted >= 11 && withDirection.length >= 6;

    let summaryNote = '';
    let favoriteDirection: CompassDirection | null = null;

    if (!hasSufficientData) {
      if (totalCompleted < 11) {
        summaryNote = `Er zijn ${totalCompleted} van de minimaal 11 voltooide sessies op deze specifieke stek geregistreerd. De richtingshistorie is nog niet toereikend voor persoonlijke nuances (puur algemeen fysisch advies).`;
      } else {
        summaryNote = `Er zijn ${totalCompleted} voltooide sessies op deze stek, maar slechts ${withDirection.length} met een geregistreerde aasaanbiedingsrichting (minimaal 6 vereist). Vul de werprichting in bij komende sessies om dit persoonlijke profiel op te bouwen.`;
      }
    } else {
      // Analyseer richtingensucces
      const dirStats: Record<CompassDirection, { total: number; catches: number }> = {} as any;
      for (const dir of COMPASS_DIRECTIONS) {
        dirStats[dir] = { total: 0, catches: 0 };
      }

      for (const s of withDirection) {
        const d = s.baitDirection!;
        if (dirStats[d]) {
          dirStats[d].total++;
          if (s.outcome === 'catch') {
            dirStats[d].catches++;
          }
        }
      }

      // Zoek de meest succesvolle richting met minimaal 2 sessies
      let bestDir: CompassDirection | null = null;
      let bestRate = -1;
      let bestCatches = 0;

      for (const dir of COMPASS_DIRECTIONS) {
        const st = dirStats[dir];
        if (st.total >= 2) {
          const rate = st.catches / st.total;
          if (rate > bestRate || (rate === bestRate && st.catches > bestCatches)) {
            bestRate = rate;
            bestCatches = st.catches;
            bestDir = dir;
          }
        }
      }

      favoriteDirection = bestDir;

      if (bestDir && bestRate > 0) {
        const stat = dirStats[bestDir];
        const pct = Math.round(bestRate * 100);
        summaryNote = `Voorzichtige empirische logboekobservatie (N=${totalCompleted} voltooide sessies, waarvan ${withDirection.length} met geregistreerde richting): Aasaanbieding richting ${bestDir} leverde in ${stat.catches} van de ${stat.total} sessies vangst op (${pct}%). Dit is een voorlopige waarneming op basis van eigen data, geen wetenschappelijk bewijs. Laat dit het algemene fysische advies hooguit licht nuanceren.`;
      } else {
        summaryNote = `Op basis van ${totalCompleted} voltooide sessies (${withDirection.length} met geregistreerde richting) tekent zich nog geen duidelijke voorkeursrichting af op deze stek. Blijf het algemene wind- en diepteadvies volgen.`;
      }
    }

    personalEvidence = {
      hasSufficientData,
      totalCompletedSessionsOnSpot: totalCompleted,
      sessionsWithDirection: withDirection.length,
      summaryNote,
      favoriteDirection,
    };
  }

  const windCastingGuidance = canBuildWindCastingGuidance
    ? buildWindCastingGuidance(
        windDirText,
        avgWindDegrees,
        location,
        {
          effectiveWaterTemp: effectiveWaterTemp!,
          season,
          isColdWind,
          isCoolingPeriod,
          isWarmingPeriod,
          avgWindSpeed: avgWindSpeed!,
          isCalmWind,
          isWarmConditions,
          isFlowingWater,
          waterType: waterType!,
        },
        personalEvidence
      )
    : undefined;

  return {
    recommendedZone: tacticalHypothesis.recommendedZone,
    rationale: tacticalHypothesis.rationale,
    alternativeOption: tacticalHypothesis.alternativeOption,
    confidenceLevel: tacticalHypothesis.confidenceLevel,
    windContext: {
      directionText: windDirText,
      speedKmH: avgWindSpeed,
      gustsKmH: maxWindSpeed !== null && avgWindSpeed !== null && maxWindSpeed > avgWindSpeed ? maxWindSpeed : undefined,
      isStrongWind,
      isCalmWind: avgWindSpeed === null ? undefined : isCalmWind,
      isColdWind,
      windTrend,
      intraSessionNote,
    },
    thermalContext: {
      trend: thermalAnalysis.trend,
      season,
      waterTempNote: hasMeasuredTemp
        ? `Gemeten: ${measuredWaterTemp} °C`
        : estimatedWaterTemp !== null
        ? `Geschat: ~${estimatedWaterTemp} °C`
        : 'Geen watertemperatuur bekend',
    },
    missingInformation,
    personalEvidence,
    windCastingGuidance,
  };
}
