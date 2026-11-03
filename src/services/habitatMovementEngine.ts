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
  if (typeof location?.latitude === 'number' && Number.isFinite(location.latitude) && typeof location?.longitude === 'number' && Number.isFinite(location.longitude)) {
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
  const hasUsableWindDirection = typeof windDirText === 'string' &&
    windDirText.trim().length > 0 &&
    windDirText !== 'Wisselend' &&
    windDirText !== 'Onbekend';
  if (typeof avgWindSpeedKmH === 'number' && Number.isFinite(avgWindSpeedKmH)) {
    modelInferences.push(hasUsableWindDirection
      ? `Windcontext: ${avgWindSpeedKmH} km/u uit ${windDirText}.`
      : `Windsnelheid: ${avgWindSpeedKmH} km/u; richting is wisselend of onbekend.`);
  } else {
    missingInformation.push('Geldige windsnelheid ontbreekt; windgestuurde beweging kan niet worden beoordeeld.');
  }
  if (!hasUsableWindDirection) {
    missingInformation.push('Windrichting is wisselend of onbekend; er wordt geen vaste windrichting aangenomen.');
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

  // Temperatuur stuurt de thermische classificatie; kalenderseizoen alleen is
  // geen bewijs dat het water koud of warm is.
  const isWinterOrCold = effectiveWaterTemp !== null && effectiveWaterTemp < 8;
  const isSpringWarming = season === 'Voorjaar' && (
    context.thermalAnalysis.trend === 'Waarschijnlijke opwarming' ||
    (effectiveWaterTemp !== null && effectiveWaterTemp >= 11)
  );
  const isSummerWarm = effectiveWaterTemp !== null && effectiveWaterTemp >= 18;

  // 1. ZONES BEPALEN OBV OMSTANDIGHEDEN & SOORT
  if (recentBellen || recentSpringenRollen) {
    // Actuele viswaarneming heeft altijd de hoogste prioriteit
    primaryZone = {
      name: 'Actieve waarnemingszone (visvisuele hotspot)',
      habitatType: 'Foerageerzone',
      description: `Zone waar recent visactiviteit (${recentBellen ? 'aasbellen/wroeten' : 'springen/rollen'}) is waargenomen. Vis is hier fysiek aanwezig en actief in de waterlaag.`,
      depthProfileNote: waterDepth ? `Geregistreerde gemiddelde stekdiepte: ${waterDepth} m; diepte rond de waarneming onbekend.` : 'Peil het bodemverloop rond de waarneming',
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
      name: 'Lokale stromings- of luwteovergang',
      habitatType: 'Overgangszone',
      description: 'Zoek waar de stroomsnelheid lokaal verandert of luwte ontstaat, indien zo’n overgang op deze locatie aanwezig is. Een krib, vaargeul of steenstort wordt niet verondersteld.',
      depthProfileNote: 'Stromings- en bodemprofiel zijn niet ingemeten; controleer dit ter plaatse.',
      structureNote: 'Alleen geregistreerde of ter plaatse zichtbare stromingsstructuren gebruiken',
      whyLikely: 'Overgangen tussen stroming en luwte kunnen voedseltransport en energieverbruik beïnvloeden; de exacte zone is lokaal niet vastgesteld.',
    };

    alternativeZone = {
      name: 'Mogelijke lokale luwtezone',
      habitatType: 'Holding / rustzone',
      description: 'Vergelijk een lokaal aanwezige luwte of rustiger stromingsdeel; een buitenbocht, diepe kuil of harde bodem is niet uit de beschikbare stekgegevens af te leiden.',
      depthProfileNote: 'Diepteverloop onbekend; peil ter plaatse.',
      structureNote: 'Lokale luwte of structuur ter plaatse vaststellen',
      whyLikely: 'Een rustiger stromingsdeel kan een alternatief bieden, afhankelijk van de feitelijke rivier- of kanaalgeometrie.',
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
      description: `Bij ${effectiveWaterTemp.toFixed(1)} °C kan de stofwisseling en voedselopname van ${species} lager liggen dan bij gematigde temperaturen. Een thermisch stabielere of beschutte zone is een zoekhypothese, geen vastgestelde lokale rustkuil.`,
      depthProfileNote: waterDepth ? `Geregistreerde stekdiepte: ${waterDepth} m; een diepere zone is niet ingemeten.` : 'Diepteverloop onbekend; zoek niet automatisch de diepste zone.',
      structureNote: hasTrees ? 'Geregistreerde overhangende bomen kunnen beschutting bieden' : 'Lokale beschutting ter plaatse vaststellen',
      whyLikely: 'Thermische stabiliteit kan relevant zijn bij koud water; de exacte diepte en positie moeten lokaal worden vastgesteld.',
    };

    alternativeZone = {
      name: 'Alternatieve ondiepe zoekzone (indien aanwezig)',
      habitatType: 'Foerageerzone',
      description: 'Een aantoonbaar ondiepere, beschutte zone kan als vergelijking dienen wanneer zoninstraling aanwezig is; lokale temperatuurverschillen zijn niet gemeten.',
      depthProfileNote: 'Ondiepere zone alleen gebruiken als die ter plaatse is vastgesteld; exacte diepte onbekend.',
      structureNote: hasMud ? 'Geregistreerde slib-/modderbodem' : 'Bodemtype en zonexpositie ter plaatse vaststellen',
      whyLikely: 'Dit is een alternatieve zoekhypothese; zonder lokale meting is niet bekend of de zone werkelijk warmer is.',
    };
  } else if (isSpringWarming) {
    // Voorjaar met opwarming
    primaryZone = {
      name: 'Ondiepe, zonbeschenen zoekzone (indien aanwezig)',
      habitatType: 'Foerageerzone',
      description: 'Ondiepe zones kunnen bij voldoende zoninstraling sneller reageren dan dieper water. Of er op deze stek zo’n zone bestaat en hoeveel zij opwarmt, is niet gemeten.',
      depthProfileNote: 'Ondiepere zone; exacte diepte en temperatuurverschil niet geregistreerd.',
      structureNote: hasReeds ? 'Geregistreerde rietkraag of waterplanten' : 'Zonexpositie en aanwezige oeverstructuur ter plaatse vaststellen',
      whyLikely: 'Een ondiepere zone is een mogelijke zoekplek tijdens opwarming, geen bewezen voorkeur voor deze specifieke stek.',
    };

    alternativeZone = {
      name: 'Lokale diepteovergang (indien aanwezig)',
      habitatType: 'Doorgang / transitie',
      description: 'Een lokale overgang naar dieper water kan als alternatief dienen wanneer de ondiepte nog koud is; het bestaan van zo’n talud is niet geregistreerd.',
      depthProfileNote: 'Overgangszone alleen gebruiken als die ter plaatse is gepeild.',
      structureNote: 'Talud of diepteknik ter plaatse vaststellen',
      whyLikely: 'Een overgang kan vissen toegang geven tot verschillende dieptes zonder een vaste diepte aan te nemen.',
    };
  } else if (isSummerWarm) {
    // Zomer
    if (bankWind?.isConfigured && bankWind.relation.includes('aanlandig') && typeof avgWindSpeedKmH === 'number' && avgWindSpeedKmH >= 12) {
      primaryZone = {
        name: 'Aanlandige oeverzone (actieve branding & voedseldrift)',
        habitatType: 'Foerageerzone',
        description: `Door de wind (${avgWindSpeedKmH} km/u) wordt warm water, plankton en zwevend voedsel tegen de oever gedrukt. Golven verminderen argwaan en brengen zuurstof.`,
        depthProfileNote: 'Lokale oeverzone; diepte en bodemvorm zijn niet ingemeten.',
        structureNote: 'Feitelijke brandingrand en aanwezige bodemstructuur ter plaatse controleren',
        whyLikely: 'Wind kan oppervlaktevoedsel verplaatsen; het effect op bodemvoedsel en vispositie hangt af van diepte en lokale stroming.',
      };
    } else {
      primaryZone = {
        name: targetSlot === 'Middag' ? 'Schaduwrijke structuurzone (indien aanwezig)' : 'Lokale oeverstructuurzone',
        habitatType: targetSlot === 'Middag' ? 'Holding / rustzone' : 'Foerageerzone',
        description: targetSlot === 'Middag'
          ? 'Bij fel licht kan aanwezige schaduw dekking bieden; alleen toepassen waar bomen, vegetatie of andere schaduw werkelijk aanwezig zijn.'
          : 'Rond schemering kunnen sommige soorten langs lokale oeverstructuren foerageren; dit is geen vaste route voor iedere soort.',
        depthProfileNote: targetSlot === 'Middag' ? 'Diepte onder de aanwezige schaduw is niet geregistreerd.' : 'Lokale diepte en taludverloop ter plaatse vaststellen.',
        structureNote: hasTrees ? 'Geregistreerde overhangende bomen' : hasLilies ? 'Geregistreerde waterplanten' : 'Schaduw en lokale structuur ter plaatse vaststellen',
        whyLikely: 'Licht en lokale dekking kunnen het zonegebruik beïnvloeden; de exacte stekstructuur bepaalt of dit advies toepasbaar is.',
      };
    }

    alternativeZone = {
      name: 'Open-water overgang (indien lokaal aanwezig)',
      habitatType: 'Doorgang / transitie',
      description: 'Een open-water overgang kan als alternatief worden onderzocht als dieptekaart of peiling daar aanleiding toe geeft; plateau of harde bodem is niet geregistreerd.',
      depthProfileNote: 'Geen bathymetrische gegevens; diepte ter plaatse vaststellen.',
      structureNote: 'Bodemtype en eventuele richel eerst vaststellen',
      whyLikely: 'Dit alternatief spreidt de zoekruimte zonder een niet-geregistreerde bodemvorm aan te nemen.',
    };
  } else {
    // Algemene overgangszone wanneer geen specifieke thermische situatie past.
    const knownStructure = habitatFeatures.length > 0 || locationNotes.trim().length > 0;
    primaryZone = {
      name: season === 'Herfst' ? 'Lokale zoekzone — najaarscontext' : 'Lokale overgangszone',
      habitatType: 'Overgangszone',
      description: knownStructure
        ? `Gebruik de geregistreerde lokale structuur (${habitatFeatures.join(', ') || locationNotes}) als startpunt. Er is onvoldoende informatie om een specifieke trekroute of dieptezone aan te wijzen.`
        : 'Zonder geregistreerde lokale structuur of bathymetrie is alleen een algemene zoekzone te geven; peil diepte en bodem ter plaatse.',
      depthProfileNote: waterDepth ? `Geregistreerde stekdiepte: ${waterDepth} m; lokaal diepteverloop onbekend.` : 'Diepteverloop niet geregistreerd.',
      structureNote: knownStructure ? habitatFeatures.join(', ') || 'Zie steknotities' : 'Lokale structuur ter plaatse vaststellen',
      whyLikely: 'Een overgangszone is een werkhypothese om lokaal structuur- en diepteverschil te onderzoeken, geen voorspelde vispositie.',
    };
    alternativeZone = {
      name: 'Alternatieve lokale structuurzone',
      habitatType: 'Doorgang / transitie',
      description: 'Vergelijk een tweede daadwerkelijk aanwezige structuur of diepteovergang en let op directe viswaarnemingen.',
      depthProfileNote: 'Geen dieptezone afgeleid.',
      structureNote: 'Alleen lokaal vastgestelde structuren gebruiken',
      whyLikely: 'Een tweede lokale zone biedt een controle zonder niet-geregistreerde habitatkenmerken aan te nemen.',
    };
  }

  // 2. BEWEGINGSHYPOTHESE (TREKROUTES & DYNAMIEK)
  if (!targetSlot) {
    likelyDirection = 'Onbekend — geen specifiek vistijdvak geselecteerd';
    migrationalTrigger = 'Geen tijdvakgebonden trigger afgeleid';
    timeOfDayDynamic = 'Kies een concreet vistijdvak en beoordeel ter plaatse de actuele visactiviteit.';
  } else if (targetSlot === 'Ochtend') {
    likelyDirection = 'Mogelijke verplaatsing tussen rust- en foerageerzones; richting en afstand zijn niet lokaal vastgesteld.';
    migrationalTrigger = 'Toenemend daglicht kan het gebruik van dekking en open water beïnvloeden.';
    timeOfDayDynamic = 'Ochtendactiviteit verschilt per soort, seizoen en locatie; controleer waar vis daadwerkelijk actief is.';
  } else if (targetSlot === 'Middag') {
    likelyDirection = 'Geen vaste middagroute aangenomen; vis kan lokaal rusten of blijven foerageren.';
    migrationalTrigger = 'Lichtintensiteit en watertemperatuur kunnen het zonegebruik beïnvloeden.';
    timeOfDayDynamic = 'Beoordeel lokale schaduw, watertemperatuur en directe viswaarnemingen; een algemene rustperiode wordt niet verondersteld.';
  } else if (targetSlot === 'Avond') {
    likelyDirection = 'Een verplaatsing naar oeverstructuren is mogelijk, maar niet zonder lokale waarneming bevestigd.';
    migrationalTrigger = 'Afnemende lichtsterkte kan voor sommige soorten het foerageergedrag beïnvloeden.';
    timeOfDayDynamic = 'Avondschemering kan relevant zijn voor sommige soorten; een vaste activiteitspiek wordt niet aangenomen.';
  } else {
    // Nacht
    likelyDirection = 'Nachtelijke verplaatsing hangt af van soort, prooiaanbod, dekking en lokale waterstructuur.';
    migrationalTrigger = 'Duisternis verandert licht- en predatordruk, maar de lokale reactie is niet vastgesteld.';
    timeOfDayDynamic = 'Controleer bekende structuren en recente waarnemingen; geen vaste nachtelijke route aangenomen.';
  }

  transitRoute = hasReeds
    ? 'Mogelijke route langs de geregistreerde rietkraag; controleer of deze structuur doorloopt.'
    : 'Geen concrete transitroute afgeleid; gebruik alleen lokaal vastgestelde diepte- of structuurverschillen.';

  windInfluence = typeof avgWindSpeedKmH === 'number' && Number.isFinite(avgWindSpeedKmH)
    ? hasUsableWindDirection
      ? avgWindSpeedKmH >= 15
        ? `Stevige wind (${avgWindSpeedKmH} km/u uit ${windDirText}) kan oppervlaktevoedsel verplaatsen; de lokale uitwerking hangt af van oevergeometrie en stroming.`
        : `Wind ${avgWindSpeedKmH} km/u uit ${windDirText}; zonder lokale oever- en stromingsgegevens wordt geen vaste bewegingsrichting aangenomen.`
      : `Windsnelheid ${avgWindSpeedKmH} km/u; richting is wisselend of onbekend, dus geen vaste windgestuurde verplaatsing aangenomen.`
    : 'Onbekend: windsnelheid ontbreekt; geen windgestuurde verplaatsing aangenomen.';

  seasonalPattern = effectiveWaterTemp === null
    ? `${season}: kalenderseizoen bekend, maar zonder watertemperatuur wordt geen thermisch gestuurd actieradius- of trekpatroon aangenomen.`
    : `${season}: ${
        isWinterOrCold
          ? 'Koudere omstandigheden kunnen de actieradius beperken; exacte lokale rustzones zijn niet vastgesteld.'
          : isSpringWarming
          ? 'Opwarming kan gebruik van ondiepere zones bevorderen; lokale temperatuurverschillen zijn niet gemeten.'
          : isSummerWarm
          ? 'Dag-/nachtverschillen kunnen het zonegebruik beïnvloeden; lokale schaduw en temperatuur zijn niet volledig in kaart.'
          : 'Seizoenscontext kan voedselzoekgedrag beïnvloeden; de exacte lokale route is niet vastgesteld.'
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
