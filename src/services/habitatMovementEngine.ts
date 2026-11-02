import {
  FishSpecies,
  FishingLocation,
  FishingSession,
  TimeSlot,
  PresenceObservation,
  PresenceObservationType,
  WaterThermalAnalysis,
  BankWindAnalysis,
  HabitatZone,
  FishMovementHypothesis,
  HabitatMovementAnalysis,
} from '../types';

export interface HabitatMovementContext {
  location?: FishingLocation;
  bankWind?: BankWindAnalysis;
  thermalAnalysis: WaterThermalAnalysis;
  targetSlot?: TimeSlot;
  observations?: PresenceObservation[];
  sessionObservations?: PresenceObservationType[];
  historicalSessions?: FishingSession[];
  avgWindSpeedKmH?: number;
  windDirText?: string;
  pressureTrend?: 'stijgend' | 'dalend' | 'stabiel';
  cloudCoverPercent?: number;
}

/**
 * Bepaalt het meteorologisch seizoen voor habitatinschatting.
 */
function getSeasonNL(dateStr?: string): 'Voorjaar' | 'Zomer' | 'Herfst' | 'Winter' {
  const d = dateStr ? new Date(dateStr) : new Date();
  const month = d.getMonth() + 1;
  if (month === 12 || month === 1 || month === 2) return 'Winter';
  if (month >= 3 && month <= 5) return 'Voorjaar';
  if (month >= 6 && month <= 8) return 'Zomer';
  return 'Herfst';
}

/**
 * Module 3: Visbeweging & Habitatmodel.
 * Schat ruimtelijk in waar karper en andere vissoorten zich ophouden en hoe zij migreren
 * tussen holding/rustzones en foerageerzones.
 */
export function analyzeHabitatMovement(
  species: FishSpecies | 'Algemeen',
  dateStr: string,
  context: HabitatMovementContext
): HabitatMovementAnalysis {
  const {
    location,
    bankWind,
    thermalAnalysis,
    targetSlot,
    observations = [],
    sessionObservations = [],
    historicalSessions = [],
    avgWindSpeedKmH,
    windDirText,
    pressureTrend,
    cloudCoverPercent,
  } = context;

  const season = getSeasonNL(dateStr);
  const effectiveWaterTemp = thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null
    ? thermalAnalysis.measuredWaterTemp
    : typeof thermalAnalysis.estimatedWaterTemp === 'number' && Number.isFinite(thermalAnalysis.estimatedWaterTemp)
      ? thermalAnalysis.estimatedWaterTemp
      : null;

  const waterType = location?.waterType;
  const isFlowingWater = waterType === 'Rivier' || waterType === 'Kanaal';
  const waterDepth = location?.waterDepth;
  const habitatFeatures = location?.habitatFeatures || [];
  const locationNotes = location?.notes || '';

  // Data Provenance verzamelen
  const measuredDataPoints: string[] = [];
  const userObservations: string[] = [];
  const modelInferences: string[] = [];
  const missingInformation: string[] = [];

  // Metingen
  if (location?.latitude && location?.longitude) {
    measuredDataPoints.push(`GPS-coördinaten stek: ${location.latitude.toFixed(4)}° NB, ${location.longitude.toFixed(4)}° OL`);
  }
  if (thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null) {
    measuredDataPoints.push(`Direct gemeten watertemperatuur op stek: ${thermalAnalysis.measuredWaterTemp} °C`);
  }
  if (waterDepth) {
    measuredDataPoints.push(`Geregistreerde waterdiepte stek: ${waterDepth} meter`);
  }

  // Waarnemingen
  // Kijk naar recente waarnemingen
  const recentSpringenRollen =
    sessionObservations.includes('vis_springen_rollen') ||
    observations.some((o) => o.observationType === 'vis_springen_rollen');
  const recentBellen =
    sessionObservations.includes('aasbellen_voedselactiviteit') ||
    observations.some((o) => o.observationType === 'aasbellen_voedselactiviteit');
  const recentAanbeten =
    sessionObservations.includes('aanbeten') ||
    observations.some((o) => o.observationType === 'aanbeten');

  if (recentSpringenRollen) {
    userObservations.push('Directe waarneming: vis springen of rollen gezien op de stek');
  }
  if (recentBellen) {
    userObservations.push('Directe waarneming: aasbellen en actieve bodemwroeting waargenomen');
  }
  if (recentAanbeten) {
    userObservations.push('Directe waarneming: recente aanbeten of lijnzwemmers geregistreerd');
  }
  if (location?.waterFacingDirection) {
    userObservations.push(`Stekinstelling: kijkrichting over het water vastgelegd als ${location.waterFacingDirection}`);
  }
  if (habitatFeatures.length > 0) {
    userObservations.push(`Zichtbare stekstructuren: ${habitatFeatures.join(', ')}`);
  }

  // Modelaannames
  if (effectiveWaterTemp !== null) {
    modelInferences.push(thermalAnalysis.hasMeasuredWaterTemp
      ? 'Thermische analyse gebruikt de lokale watertemperatuurmeting.'
      : `Thermische analyse gebruikt een modelschatting van ${effectiveWaterTemp.toFixed(1)} °C.`);
  } else {
    missingInformation.push('Geen gemeten of bruikbaar geschatte watertemperatuur; thermische habitatduiding is beperkt.');
  }
  modelInferences.push(`Algemene seizoenscontext: ${season.toLowerCase()}.`);
  if (typeof avgWindSpeedKmH === 'number' && Number.isFinite(avgWindSpeedKmH) && typeof windDirText === 'string' && windDirText.trim()) {
    modelInferences.push(`Windcontext: ${avgWindSpeedKmH} km/u uit ${windDirText}.`);
  } else {
    missingInformation.push('Geldige windsnelheid en/of windrichting ontbreekt; windgestuurde beweging kan niet worden beoordeeld.');
  }
  if (!waterType) missingInformation.push('Watertype is niet vastgelegd; stromend en stilstaand water worden niet verondersteld.');
  if (pressureTrend === undefined || pressureTrend === null) missingInformation.push('Luchtdruktrend ontbreekt; er wordt geen druktrend verondersteld.');
  if (cloudCoverPercent === undefined || cloudCoverPercent === null || !Number.isFinite(cloudCoverPercent)) missingInformation.push('Bewolkingsgegevens ontbreken; lichtcontext is onbekend.');

  // Ontbrekende gegevens
  if (!waterDepth) {
    missingInformation.push('Exacte waterdiepte en bodemprofiel zijn niet vastgelegd voor deze stek; er wordt geen standaarddiepte ingevuld.');
  }
  if (habitatFeatures.length === 0 && !locationNotes) {
    missingInformation.push('Zichtbare oeverstructuren (zoals rietkragen, overhangende bomen of lelievelden) zijn niet ingevoerd in de stekinstellingen.');
  }
  missingInformation.push('Er is geen sonarbeeld of gedetailleerde bathymetrische bodemkaart beschikbaar; bodemverloop dient ter plaatse te worden gepeild.');

  // Detecteer aanwezige fysieke kenmerken uit tags en notities
  const notesLower = locationNotes.toLowerCase();
  const hasTrees = habitatFeatures.some((f) => f.toLowerCase().includes('boom')) || notesLower.includes('boom');
  const hasReeds = habitatFeatures.some((f) => f.toLowerCase().includes('riet')) || notesLower.includes('riet');
  const hasLilies = habitatFeatures.some((f) => f.toLowerCase().includes('lelie') || f.toLowerCase().includes('plant')) || notesLower.includes('lelie') || notesLower.includes('plant');
  const hasSand = notesLower.includes('zand') || habitatFeatures.some((f) => f.toLowerCase().includes('zand'));
  const hasMud = notesLower.includes('modder') || notesLower.includes('slib') || habitatFeatures.some((f) => f.toLowerCase().includes('slib') || f.toLowerCase().includes('modder'));

  // Bepaal primaire en alternatieve zone
  let primaryZone: HabitatZone;
  let alternativeZone: HabitatZone;
  let likelyDirection = '';
  let migrationalTrigger = '';
  let timeOfDayDynamic = '';
  let transitRoute = '';
  let windInfluence = '';
  let seasonalPattern = '';

  const isWinterOrCold = season === 'Winter' || (effectiveWaterTemp !== null && effectiveWaterTemp < 8);
  const isSpringWarming = season === 'Voorjaar' && (
    context.thermalAnalysis.trend === 'Waarschijnlijke opwarming' ||
    (effectiveWaterTemp !== null && effectiveWaterTemp >= 11)
  );
  const isSummerWarm = season === 'Zomer' || (effectiveWaterTemp !== null && effectiveWaterTemp >= 18);

  // 1. ZONES BEPALEN OBV OMSTANDIGHEDEN & SOORT
  if (recentBellen || recentSpringenRollen) {
    // Actuele viswaarneming heeft altijd de hoogste prioriteit
    primaryZone = {
      name: 'Actieve waarnemingszone (visvisuele hotspot)',
      habitatType: 'Foerageerzone',
      description: `Zone waar recent visactiviteit (${recentBellen ? 'aasbellen/wroeten' : 'springen/rollen'}) is waargenomen. Vis is hier fysiek aanwezig en actief in de waterlaag.`,
      depthProfileNote: waterDepth ? `Rond het bekende dieptebereik van ~${waterDepth} m` : 'Peil het bodemverloop rond de waarneming',
      structureNote: hasReeds ? 'Nabij de geregistreerde rietkraag' : hasTrees ? 'Onder de geregistreerde bomen' : 'Lokale structuur ter plaatse vaststellen',
      whyLikely: 'Ondersteund door jouw eigen recente visuele waarnemingen aan het water (geen zuivere modelaanname).',
    };

    alternativeZone = {
      name: 'Direct aangrenzende zoekzone',
      habitatType: 'Doorgang / transitie',
      description: 'Controleer de directe omgeving van de waarneming op een aangrenzende route of structuur; diepteverloop en vluchtweg zijn niet geregistreerd.',
      depthProfileNote: 'Peil het lokale diepteverloop; geen talud aangenomen.',
      structureNote: 'Alleen ter plaatse vastgestelde structuren gebruiken',
      whyLikely: 'Een nabijgelegen vergelijkingszone helpt vaststellen of de activiteit lokaal geconcentreerd is.'
    };
  } else if (!waterType) {
    const knownStructure = habitatFeatures.length > 0 || locationNotes.trim().length > 0;
    primaryZone = {
      name: knownStructure ? 'Bekende lokale structuurzone' : 'Algemene zoekzone — watertype onbekend',
      habitatType: knownStructure ? 'Overgangszone' : 'Foerageerzone',
      description: knownStructure
        ? 'Gebruik uitsluitend de geregistreerde lokale structuur als uitgangspunt; zonder watertype kan niet worden bepaald hoe stroming en watermassa de vispositie beïnvloeden.'
        : 'Zonder bekend watertype, diepteprofiel of actuele waarneming is geen specifieke habitatzone verantwoord aan te wijzen.',
      depthProfileNote: waterDepth ? `Geregistreerde stekdiepte: ${waterDepth} m; lokale variatie is onbekend.` : 'Diepte onbekend; peil ter plaatse.',
      structureNote: knownStructure ? habitatFeatures.join(', ') || 'Zie steknotities' : 'Lokale structuur ter plaatse vaststellen',
      whyLikely: 'Dit is een voorzichtige lokale zoekhypothese, geen vastgestelde vispositie.',
    };
    alternativeZone = {
      name: 'Alternatieve lokale structuur',
      habitatType: 'Doorgang / transitie',
      description: 'Controleer ter plaatse diepteovergangen, dekking en zichtbare visactiviteit.',
      depthProfileNote: 'Geen dieptezone afgeleid.',
      structureNote: 'Alleen lokaal vastgestelde structuren gebruiken',
      whyLikely: 'Alternatief om de zoekruimte te spreiden zonder watertype of bodemvorm te verzinnen.',
    };
  } else if (isFlowingWater) {
    // Stromend water
    primaryZone = {
      name: 'Stroomnaad & kribvak-luwte',
      habitatType: 'Overgangszone',
      description: 'De overgangszone tussen de snelle hoofdstroom en het rustige water in het kribvak of achter een oeveruitsteeksel.',
      depthProfileNote: 'Bodemverhang aan de rand van de vaargeul',
      structureNote: 'Kribkop, stroomnaad of steenstorttalud',
      whyLikely: 'Voedsel dwarrelt hier natuurlijk neer terwijl de vis minimale zwemenergie verbruikt.',
    };

    alternativeZone = {
      name: 'Diepe vaargeulbodem of rustkuil in de buitenbocht',
      habitatType: 'Holding / rustzone',
      description: 'Diepere geul waar grotere vis rust tijdens piekstroming of fel scheepvaartverkeer.',
      depthProfileNote: 'Diepste watergedeelte van het profiel',
      structureNote: 'Harde zandbodem of stenen',
      whyLikely: 'Biedt rust en constante watertemperatuur op stromend water.',
    };
  } else if (effectiveWaterTemp === null) {
    const knownStructure = habitatFeatures.length > 0 || locationNotes.trim().length > 0;
    primaryZone = {
      name: knownStructure ? 'Lokale structuurzone — thermische context onbekend' : 'Algemene zoekzone — watertemperatuur onbekend',
      habitatType: knownStructure ? 'Overgangszone' : 'Foerageerzone',
      description: knownStructure
        ? 'De geregistreerde structuur is een bruikbaar startpunt, maar zonder watertemperatuur wordt geen thermisch gestuurd diepte- of bewegingspatroon aangenomen.'
        : 'Zonder actuele thermische informatie en lokale habitatkenmerken is geen specifieke zone te onderbouwen. Zoek systematisch en let op directe viswaarnemingen.',
      depthProfileNote: waterDepth ? `Geregistreerde stekdiepte: ${waterDepth} m; diepteverloop onbekend.` : 'Diepte onbekend; peil ter plaatse.',
      structureNote: knownStructure ? habitatFeatures.join(', ') || 'Zie steknotities' : 'Lokale structuur ter plaatse vaststellen',
      whyLikely: 'De zone is gebaseerd op bekende lokale kenmerken, niet op een veronderstelde watertemperatuur.',
    };
    alternativeZone = {
      name: 'Alternatieve lokale zoekzone',
      habitatType: 'Doorgang / transitie',
      description: 'Controleer een andere lokaal zichtbare structuur of diepteovergang; neem geen standaarddiepte aan.',
      depthProfileNote: 'Geen dieptezone afgeleid.',
      structureNote: 'Ter plaatse vaststellen',
      whyLikely: 'Spreid de zoekinspanning totdat temperatuur- en habitatgegevens beschikbaar zijn.',
    };
  } else if (isWinterOrCold) {
    // Winter / Koud water (< 8°C)
    primaryZone = {
      name: 'Diepere beschutte rustzone (Holding Area)',
      habitatType: 'Holding / rustzone',
      description: `In koud water (${effectiveWaterTemp.toFixed(1)} °C) ligt het metabolisme van karper en witvis laag. Ze scholen compact samen in de diepste, meest temperatuurvaste kuilen of in de windstille luwte.`,
      depthProfileNote: waterDepth ? `Diepere kuil (> ${waterDepth} m)` : 'Diepste bereikbare zone van het water',
      structureNote: hasTrees ? 'Overhangende takken of beschutte oeverhoek' : 'Stille bodemkuil',
      whyLikely: 'Thermische stabiliteit: koud water met golven onttrekt te veel energie. Vissen zoeken fysiologische rust.',
    };

    alternativeZone = {
      name: 'Zonbeschenen ondiepte tijdens middagpiek',
      habitatType: 'Foerageerzone',
      description: 'Bij zonnig winterweer kan een windluwe, ondiepe oeverzone net 0.5 °C opwarmen tussen 12:00 en 15:00 uur.',
      depthProfileNote: 'Ondiepe plaat (0.8 - 1.5 m) pal op het zuiden gericht',
      structureNote: 'Donkere slibbodem die zonnewarmte absorbeert',
      whyLikely: 'Soms verlaten enkele vissen de holding area voor een kort zonnebad of snack.',
    };
  } else if (isSpringWarming) {
    // Voorjaar met opwarming
    primaryZone = {
      name: 'Ondiepe zonbeschenen voorjaarsbaai / rietkraag',
      habitatType: 'Foerageerzone',
      description: 'Ondieptes (0.5 - 1.5 m) warmen door zoninstraling 1 tot 3 °C sneller op dan de rest van het water. Karper ontwaakt uit winterrust en zoekt deze warmte direct op.',
      depthProfileNote: 'Ondiep water (< 1.5 m)',
      structureNote: hasReeds ? 'Rietkragen en jonge waterplanten' : 'Zuidelijk gelegen oeverzone',
      whyLikely: 'Verhoogt de lichaamstemperatuur en versnelt enzymatische vertering van voorjaarsvoedsel (muggenlarven).',
    };

    alternativeZone = {
      name: 'Eerste taludrand aan de rand van de ondiepte',
      habitatType: 'Doorgang / transitie',
      description: 'Het talud waar de ondiepe plaat overloopt in dieper water; dient als wachtkamer in de kille ochtenden.',
      depthProfileNote: 'Middeldiepe overgang (1.8 - 2.5 m)',
      structureNote: 'Taludknik',
      whyLikely: 'Als de nacht koud was, wachten vissen hier tot de zon de plaat opwarmt.',
    };
  } else if (isSummerWarm) {
    // Zomer
    if (bankWind?.isConfigured && bankWind.relation.includes('aanlandig') && avgWindSpeedKmH >= 12) {
      primaryZone = {
        name: 'Aanlandige oeverzone (actieve branding & voedseldrift)',
        habitatType: 'Foerageerzone',
        description: `Door de wind (${avgWindSpeedKmH} km/u) wordt warm water, plankton en zwevend voedsel tegen de oever gedrukt. Golven verminderen argwaan en brengen zuurstof.`,
        depthProfileNote: 'Bovenste taludrand vlak onder de kant (1.0 - 2.0 m)',
        structureNote: 'Brandingrand en uitspoeling onder de oever',
        whyLikely: 'Karper aast graag vlak in de branding waar muggenlarven en slibdiertjes losspoelen.',
      };
    } else {
      primaryZone = {
        name: targetSlot === 'Middag' ? 'Schaduwrijke holdingzone onder begroeiing' : 'Oevertaluds en mosselbanken',
        habitatType: targetSlot === 'Middag' ? 'Holding / rustzone' : 'Foerageerzone',
        description: targetSlot === 'Middag'
          ? 'Tijdens de felle middagzon schuilt vis onder overhangende bomen, lelies of in diepere schaduw om fel licht te mijden.'
          : 'Tijdens schemering en nacht trekken vissen over de oevertaluds om slakjes en bodemleven te vergaren.',
        depthProfileNote: targetSlot === 'Middag' ? 'Onder de schaduw (1.5 - 2.5 m)' : 'Flank van het talud',
        structureNote: hasTrees ? 'Overhangende bomen' : hasLilies ? 'Lelievelden' : 'Taludrand',
        whyLikely: 'Zomerdynamiek: rust overdag in schaduw/diepte; actief azen in de schemering en nacht.',
      };
    }

    alternativeZone = {
      name: 'Open water overgangszone / plateaurand',
      habitatType: 'Doorgang / transitie',
      description: 'Een onderwaterplateau of richel op ruimer water waar vis tijdens rustige windperioden cruist.',
      depthProfileNote: 'Middeldiepe richel (2.0 - 3.0 m)',
      structureNote: 'Harde zand- of grindplaat',
      whyLikely: 'Zuurstofrijk en vrij van dichtgroeiende waterplanten.',
    };
  } else {
    // Herfst (najaar)
    primaryZone = {
      name: 'Diepere foerageerplateaus & windwaartse oevervoet',
      habitatType: 'Foerageerzone',
      description: 'In het najaar vreten karpers zich vol voor de winter. Ze concentreren zich op stabiele voedselrijke plateaus en langs de windkant waar het laatste zweefvuil verzamelt.',
      depthProfileNote: 'Dieper plateau (2.0 - 3.5 m)',
      structureNote: hasMud ? 'Rijke slibplaten met rode muggenlarven' : 'Bodemvoet van het talud',
      whyLikely: 'Hoge voedseldichtheid en stabiele najaarstemperatuur.',
    };

    alternativeZone = {
      name: 'Steile taludkanten nabij afstervende vegetatie',
      habitatType: 'Doorgang / transitie',
      description: 'Rietkragen en waterlelies sterven af; vissen patrouilleren langs de overgang naar de diepe kom.',
      depthProfileNote: 'Onderkant van het talud (2.5 - 4.0 m)',
      structureNote: 'Rietvoet of takkenpartij',
      whyLikely: 'Insecten en slakken verlaten afstervende planten en vallen op het talud.',
    };
  }

  // 2. BEWEGINGSHYPOTHESE (TREKROUTES & DYNAMIEK)
  if (!targetSlot) {
    likelyDirection = 'Onbekend — geen specifiek vistijdvak geselecteerd';
    migrationalTrigger = 'Geen tijdvakgebonden trigger afgeleid';
    timeOfDayDynamic = 'Kies een concreet vistijdvak en beoordeel ter plaatse de actuele visactiviteit.';
  } else if (targetSlot === 'Ochtend') {
    likelyDirection = 'Vissen migreren geleidelijk terug van ondiepe nachtelijke aaszones naar dieper water of schaduw';
    migrationalTrigger = 'Toenemend daglicht en opkomende zon verminderen de dekking op ondiep water';
    timeOfDayDynamic = 'Eerste uren rond zonsopkomst: hoge aaskans op de ondiepe taluds; later in de ochtend zakt de vis dieper weg';
  } else if (targetSlot === 'Middag') {
    likelyDirection = 'Passieve holding in diepe rustkuilen of onder beschutte schaduw';
    migrationalTrigger = 'Hoge lichtintensiteit en eventuele warmteopbouw in de oppervlaktelaag';
    timeOfDayDynamic = 'Statische periode met weinig verplaatsing, tenzij een sterke bries voor golfslag en troebeling zorgt';
  } else if (targetSlot === 'Avond') {
    likelyDirection = 'Vanuit dagrustzones actief optrekkend naar de oevertaluds, rietkragen en platen';
    migrationalTrigger = 'Invallende schemering en afnemende lichtsterkte nemen de argwaan van schuwe vissen weg';
    timeOfDayDynamic = 'Avondschemering brengt een piek in visverplaatsing: scholen verspreiden zich over foerageerroutes langs de contouren van het water';
  } else {
    // Nacht
    likelyDirection = 'Vrij rondtrekkend over de ondiepere oeverzones en uitgestrekte bodemplaten';
    migrationalTrigger = 'Volledige duisternis biedt maximale beschutting tegen roofvijanden en hengeldruk';
    timeOfDayDynamic = 'Continue zoektocht naar bodemleven op dieptes waar overdag zelden een vis zwemt';
  }

  transitRoute = hasReeds
    ? 'Mogelijke route langs de geregistreerde rietkraag; controleer de feitelijke doorloop ter plaatse'
    : 'Mogelijke route langs lokaal vastgestelde diepte- of structuurverschillen; bodemverloop is niet ingemeten';

  windInfluence = typeof avgWindSpeedKmH === 'number' && Number.isFinite(avgWindSpeedKmH) && windDirText
    ? avgWindSpeedKmH >= 15
      ? `Stevige wind (${avgWindSpeedKmH} km/u uit ${windDirText}) kan oppervlaktevoedsel verplaatsen; de lokale uitwerking hangt af van oevergeometrie en stroming.`
      : `Wind ${avgWindSpeedKmH} km/u uit ${windDirText}; zonder lokale oever- en stromingsgegevens wordt geen vaste bewegingsrichting aangenomen.`
    : 'Onbekend: windsnelheid of windrichting ontbreekt; geen windgestuurde verplaatsing aangenomen.';

  seasonalPattern = `${season}: ${
    isWinterOrCold
      ? 'Minimale actieradius, vis blijft binnen enkele tientallen meters van de rustkuil.'
      : isSpringWarming
      ? 'Doelgerichte trek naar zonbeschenen ondieptes zodra het water opwarmt.'
      : isSummerWarm
      ? 'Vaste dag- en nachtpatronen tussen schaduw overdag en oeveraaskans in de schemering.'
      : 'Intensieve zoektocht naar calorierijk voedsel over het hele bodemoppervlak.'
  }`;

  const movementHypothesis: FishMovementHypothesis = {
    likelyDirection,
    migrationalTrigger,
    timeOfDayDynamic,
    transitRoute,
    windInfluence,
    seasonalPattern,
  };

  // Omgevingsinvloeden toelichten
  const environmentalInfluence = {
    temperatureImpact: effectiveWaterTemp === null
      ? 'Onbekend: geen gemeten of bruikbaar geschatte watertemperatuur.'
      : `Watertemperatuur (${thermalAnalysis.hasMeasuredWaterTemp ? 'gemeten' : 'geschat'}: ${effectiveWaterTemp.toFixed(1)} °C) geeft thermische context; de reactie verschilt per soort, acclimatisatie en lokale watermassa.`,
    windAndWaveImpact: typeof avgWindSpeedKmH === 'number' && Number.isFinite(avgWindSpeedKmH) && windDirText
      ? `Windkracht ${avgWindSpeedKmH} km/u uit ${windDirText}${bankWind?.isConfigured ? `; oeverrelatie: ${bankWind.relation.toLowerCase()}.` : '; zonder bekende oevergeometrie is de lokale windwerking niet vastgesteld.'}`
      : 'Onbekend: onvoldoende geldige windgegevens; geen wind- of golfwerking aangenomen.',
    pressureTrendImpact: pressureTrend
      ? `Luchtdruktrend: ${pressureTrend}. Deze wordt als weerscontext getoond; geen automatische biologische invloed aangenomen.`
      : 'Onbekend: luchtdruktrend ontbreekt; geen trend verondersteld.',
    lightAndSolarImpact: typeof cloudCoverPercent === 'number' && Number.isFinite(cloudCoverPercent)
      ? `Bewolking: circa ${cloudCoverPercent}%. Dit beschrijft de lichtcontext; een soortspecifiek activiteitseffect is niet gekwantificeerd.`
      : 'Onbekend: bewolkingsgegevens ontbreken; lichtcontext niet beoordeeld.',
  };

  const confidenceLevel =
    userObservations.length >= 2 && location?.waterFacingDirection
      ? 'Redelijk'
      : userObservations.length >= 1 || location?.waterDepth !== undefined
      ? 'Matig'
      : 'Laag';

  return {
    primaryZone,
    alternativeZone,
    movementHypothesis,
    environmentalInfluence,
    confidenceLevel,
    dataProvenance: {
      measuredDataPoints,
      userObservations,
      modelInferences,
    },
    missingInformation,
  };
}
