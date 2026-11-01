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

/**
 * Bepaalt het seizoen voor voerberekening.
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
 * Formatteert datum naar YYYY-MM-DD.
 */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Berekent het gestructureerde voorvoerprogramma voor een geplande sessie.
 * Houdt rekening met watertemperatuur (metabolisme), seizoen, wind, watertype
 * en persoonlijke vangsthistorie uit het logboek.
 */
export function calculatePrebaitPlan(
  targetDateStr: string,
  species: FishSpecies | 'Algemeen',
  thermalAnalysis: WaterThermalAnalysis,
  options: PrebaitProgramOptions = {},
  historicalSessions: FishingSession[] = [],
  location?: FishingLocation,
  bankWind?: BankWindAnalysis,
  targetSlot: TimeSlot = 'Ochtend'
): PrebaitProgramPlan {
  const {
    availableDaysBefore = 2,
    preferredFeedType,
    sessionDurationHours = 3,
  } = options;

  const season = getSeasonNL(targetDateStr);
  const effectiveWaterTemp = thermalAnalysis.hasMeasuredWaterTemp && thermalAnalysis.measuredWaterTemp !== null
    ? thermalAnalysis.measuredWaterTemp
    : thermalAnalysis.estimatedWaterTemp ?? 14;

  const isFlowingWater = location?.waterType === 'Rivier' || location?.waterType === 'Kanaal';
  const targetDate = new Date(targetDateStr);

  const missingInformation: string[] = [];

  if (!thermalAnalysis.hasMeasuredWaterTemp) {
    missingInformation.push(
      `Watertemperatuur (~${effectiveWaterTemp.toFixed(1)} °C) is een modelschatting. Controleer de echte temperatuur met een thermometer; metabolisme reageert sterk op elke graad verschil.`
    );
  }
  missingInformation.push(
    'Bodemzachtheid en witvisdichtheid zijn niet numeriek gemeten. Bij een hoge brasem- of watervogeldruk kan voorvoer sneller verdwijnen.'
  );

  // 1. BIOLOGISCHE GESCHIKTHEID & STRATEGIE BEPALEN
  let suitability: PrebaitSuitability = 'Matig zinvol';
  let suitabilityScore = 5;
  let maxBiologicalDays = 2;
  let amountPerDayGrams = 400;
  let campaignSummary = '';
  let biologicalRationale = '';
  let temperatureFactorExplanation = '';
  let recommendedMix = '';
  let digestibilityNote = '';
  let particleSizeNote = '';
  let feedDuringSession = true;
  let sessionAmountGrams = 100;
  let sessionAdvice = '';

  if (effectiveWaterTemp < 6.0) {
    // Extreem koud water (< 6°C)
    suitability = 'Niet aanbevolen (instant vissen aanbevolen)';
    suitabilityScore = 2;
    maxBiologicalDays = 0;
    amountPerDayGrams = 0;
    campaignSummary = 'Niet voorvoeren. Kies voor een puur instant tactiek met minimaal haakaas.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C ligt het metabolisme van karper fysiologisch nagenoeg stil. De darmpassage duurt 48 tot 72 uur. Voorvoer blijft dagenlang onaangeroerd op de bodem liggen en kan verzuren.`;
    biologicalRationale =
      'Elke hand voer die je nu vooraf strooit, kan de weinige vissen die actief zijn voortijdig verzadigen. Instant vissen met een opvallend single hookbait of een vingerhoedje micro-PVA biedt de beste kans.';
    feedDuringSession = false;
    sessionAmountGrams = 20;
    sessionAdvice = 'Niet bijvoeren tijdens de sessie. Gebruik uitsluitend een single pop-up, klein maiskorreltje of micro-PVA zakje vlak bij de haak.';
    recommendedMix = 'Uitsluitend klein haakaas; geen voorvoermengsel.';
    digestibilityNote = 'Vis verteert nauwelijks in ijswater.';
    particleSizeNote = 'Microformaat (haakaas 10-12 mm of enkele maden).';
  } else if (effectiveWaterTemp < 10.0) {
    // Koud water (6 - 10°C)
    suitability = 'Beperkt / voorzichtig';
    suitabilityScore = 4;
    maxBiologicalDays = 1;
    amountPerDayGrams = 200;
    campaignSummary = 'Maximaal 1 dag vooraf zeer compact en licht verteerbaar voorvoeren.';
    temperatureFactorExplanation = `Watertemperatuur is ${effectiveWaterTemp.toFixed(1)} °C. Karper verteert traag en eet slechts kleine porties per etmaal.`;
    biologicalRationale =
      'Een lichte prikkel 24 uur vooraf wekt nieuwsgierigheid zonder de vissen te overvoeren. Gebruik fijne deeltjes die snel oplossen of worden geconsumeerd zonder vullend te zijn.';
    feedDuringSession = true;
    sessionAmountGrams = 50;
    sessionAdvice = 'Zeer spaarzaam bijvoeren: slechts enkele korrels mais of een klein handje fijne pellets na een aanbeet.';
    recommendedMix = 'Licht verteerbare granen (gekiemde hennep, een beetje zoete mais), verpulverde boilies en mini-pellets (2-4 mm).';
    digestibilityNote = 'Vermijd vette vismelen of zware eiwitrijke boilies; kies voor licht verteerbare koolhydraten.';
    particleSizeNote = 'Fijne partikels en verkruimeld voer (geen hele harde boilies van 20 mm).';
  } else if (effectiveWaterTemp < 16.0) {
    // Matig warm water (10 - 16°C: voorjaar of herfst)
    suitability = 'Matig zinvol';
    suitabilityScore = 7;
    maxBiologicalDays = 2;
    amountPerDayGrams = 400;
    campaignSummary = 'Opbouwcampagne van 1 tot 2 dagen vooraf met een gebalanceerde partikel- en pelletmix.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C is het enzymatische spijsverteringsstelsel van de vis matig actief. Voer passeert in circa 12 tot 20 uur.`;
    biologicalRationale =
      'Vis foerageert regelmatig. Twee dagen vooraf een bescheiden tapijtje aanbieden bouwt herkenning en vertrouwen op de stek op.';
    feedDuringSession = true;
    sessionAmountGrams = 150;
    sessionAdvice = 'Bij aanvang van de sessie 2-3 handjes rond de montages; daarna enkel spaarzaam bijvoeren na viscontact.';
    recommendedMix = 'Mix van zoete mais, hennep, 4-6 mm pellets en een beperkt aantal gehalveerde 15 mm boilies.';
    digestibilityNote = 'Goede balans tussen attractieve vloeistoffen, natuurlijke suikers en plantaardige eiwitten.';
    particleSizeNote = 'Gemengde deeltjesgrootte (2 mm tot 15 mm) houdt vis langer zoekend op de stek.';
  } else if (effectiveWaterTemp <= 22.0) {
    // Optimaal warm water (16 - 22°C: piekperiode)
    suitability = 'Zeer zinvol';
    suitabilityScore = 9;
    maxBiologicalDays = 3;
    amountPerDayGrams = isFlowingWater ? 900 : 700;
    campaignSummary = 'Volwaardige voorvoercampagne (2 tot 3 dagen) met voedzame boilies en partikels.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C bevindt karper zich in het optimale metabolische venster. Vertering duurt slechts 4 tot 8 uur en de eetlust is maximaal.`;
    biologicalRationale =
      'Door meerdere dagen achtereen rond hetzelfde tijdstip te voeren, nemen vissen de stek op in hun dagelijkse patrouilleroute en azen ze vol vertrouwen.';
    feedDuringSession = true;
    sessionAmountGrams = 250;
    sessionAdvice = 'Voer bij de start enkele handjes boilies/pellets verspreid over de stek. Blijf na elke vangst 1-2 handen bijvoeren om de school vast te houden.';
    recommendedMix = 'Voedzame kwaliteitsboilies (15-20 mm), tijgernoten, hennep en geperste vismeel- of hennepkoekpellets.';
    digestibilityNote = 'Eiwit- en vezelrijk voer wordt vlot verwerkt. Voeg gerust zwaardere boilies toe.';
    particleSizeNote = 'Grotere deeltjes (15-20 mm) om selectief op karper te vissen en kleine witvis te omzeilen.';
  } else {
    // Erg warm water (> 22°C / hittegolf)
    suitability = 'Beperkt / voorzichtig';
    suitabilityScore = 4;
    maxBiologicalDays = 1;
    amountPerDayGrams = 300;
    campaignSummary = 'Voorzichtig voeren. Zuurstofgehalte is leidend; voer alleen in de koelere nacht- of ochtenduren.';
    temperatureFactorExplanation = `Bij ${effectiveWaterTemp.toFixed(1)} °C kan het zuurstofgehalte in stilstaand water dalen. Rottend overdadig voer op de bodem verbruikt kostbare zuurstof.`;
    biologicalRationale =
      'Karpers azen in heet water vaak slechts korte periodes in de vroege ochtend of late nacht. Beperk het voorvoeren tot een kleine portie direct in de avondschemering.';
    feedDuringSession = true;
    sessionAmountGrams = 80;
    sessionAdvice = 'Vis subtiel met lichte aaspresentaties; vermijd grote voertapijten die de bodem kunnen verstikken.';
    recommendedMix = 'Lichte, niet-olieachtige pellets, zoete mais en kleine oplosbare boilies.';
    digestibilityNote = 'Vermijd vette oliën (zoals zalmolie) die bij hitte drijflagen vormen.';
    particleSizeNote = 'Kleine tot middelgrote partikels.';
  }

  // Rekening houden met voorkeur voor voersoort indien ingevoerd door de visser
  if (preferredFeedType && preferredFeedType.trim() !== '') {
    recommendedMix = `${preferredFeedType.trim()} (aangepast aan jouw persoonlijke voorkeur)`;
  }

  // 2. BEPALING VAN AANTAL VOORVOERDAGEN
  const shouldPrebait = suitabilityScore >= 4 && availableDaysBefore > 0;
  const effectiveDays = shouldPrebait
    ? Math.min(availableDaysBefore, maxBiologicalDays)
    : 0;

  // 3. TIJDSCHEMA OPSTELLEN PER VOERBEURT
  const moments: PrebaitFeedingMoment[] = [];
  let totalCampaignGrams = 0;

  if (effectiveDays > 0) {
    for (let dayOffset = -effectiveDays; dayOffset < 0; dayOffset++) {
      const momentDate = new Date(targetDate);
      momentDate.setDate(targetDate.getDate() + dayOffset);
      const mDateStr = toDateStr(momentDate);

      // Bepaal ideaal tijdstip: meestal avondschemering (rond 18:30-19:30), tenzij visdag een ochtendsessie is
      const suggestedTime = effectiveWaterTemp >= 22 ? '20:30 (na zonsondergang)' : '18:30 (avondschemering)';

      // Progressieve opbouw: 1e dag iets minder, dag voor de visdag de hoofdmoot
      const factor = dayOffset === -1 ? 1.0 : 0.8;
      const amountGrams = Math.round((amountPerDayGrams * factor) / 50) * 50;
      totalCampaignGrams += amountGrams;

      const handsCount = Math.max(1, Math.round(amountGrams / 150));
      const amountDisplay = `~${amountGrams} gram (ca. ${handsCount} ${handsCount === 1 ? 'hand' : 'handen'})`;

      let dayLabel = '';
      if (dayOffset === -1) {
        dayLabel = 'Gisteren / 1 dag vooraf';
      } else if (dayOffset === -2) {
        dayLabel = '2 dagen vooraf';
      } else {
        dayLabel = '3 dagen vooraf';
      }

      let purpose = '';
      if (dayOffset <= -2) {
        purpose = 'Stekvertrouwen & activatie: vis laten kennismaken met het voer op jouw visplek.';
      } else {
        purpose = 'Hoofdvoerbeurt: stek aantrekkelijk houden (laatste beurt minstens 14-18 uur vóór de sessie!).';
      }

      moments.push({
        dayOffset,
        date: mDateStr,
        dayLabel,
        suggestedTime,
        feedType: recommendedMix,
        amountGrams,
        amountDisplay,
        purpose,
      });
    }
  }

  // Voeg ook de visdag zelf toe ter verduidelijking
  const sessionHands = Math.max(1, Math.round(sessionAmountGrams / 120));
  moments.push({
    dayOffset: 0,
    date: targetDateStr,
    dayLabel: 'Visdag zelf',
    suggestedTime: `Bij aanvang van de ${targetSlot.toLowerCase()}sessie`,
    feedType: recommendedMix,
    amountGrams: sessionAmountGrams,
    amountDisplay: `~${sessionAmountGrams} gram (ca. ${sessionHands} ${sessionHands === 1 ? 'hand' : 'handen'})`,
    purpose: feedDuringSession
      ? 'Aanslag op de stek: compacte presentatie rond het haakaas.'
      : 'Geen bijvoer: puur instant vissen op wantrouwige of passieve vis.',
  });
  totalCampaignGrams += sessionAmountGrams;

  // 4. PERSOONLIJKE EVIDENCE UIT HET VISLOGBOEK
  let personalEvidence: PrebaitProgramPlan['personalEvidence'] = undefined;

  // Zoek sessies van dezelfde stek of doelsoort met voorvoergegevens
  const relevantSessions = historicalSessions.filter(
    (s) => (s.outcome === 'catch' || s.outcome === 'skunk_confirmed') && !s.isBenchmark
  );

  const prebaitedSessions = relevantSessions.filter(
    (s) => s.prebaited === true || (s.baitAndFeed && s.baitAndFeed.toLowerCase().includes('voorvoer'))
  );

  const nonPrebaitedSessions = relevantSessions.filter(
    (s) => s.prebaited === false || (s.prebaited === undefined && !(s.baitAndFeed && s.baitAndFeed.toLowerCase().includes('voorvoer')))
  );

  const hasSufficientData = relevantSessions.length >= 5 && prebaitedSessions.length >= 2;

  if (hasSufficientData) {
    const prebaitCatches = prebaitedSessions.filter((s) => s.outcome === 'catch').length;
    const nonPrebaitCatches = nonPrebaitedSessions.filter((s) => s.outcome === 'catch').length;

    const ratePrebait = Math.round((prebaitCatches / prebaitedSessions.length) * 100);
    const rateNonPrebait = nonPrebaitedSessions.length > 0
      ? Math.round((nonPrebaitCatches / nonPrebaitedSessions.length) * 100)
      : null;

    personalEvidence = {
      hasSufficientData: true,
      totalRelevantSessions: relevantSessions.length,
      relevantPrebaitedSessionsCount: prebaitedSessions.length,
      catchRateWithPrebait: ratePrebait,
      catchRateWithoutPrebait: rateNonPrebait,
      summaryNote: `Logboekinzicht (N=${relevantSessions.length} sessies): Sessies met voorvoeren leverden in ${prebaitCatches} van de ${prebaitedSessions.length} keer vangst op (${ratePrebait}%). Zonder voorvoeren was dit ${rateNonPrebait !== null ? `${rateNonPrebait}%` : 'onbekend'}. Let op: correlatie is geen causaal bewijs; weersomstandigheden en stekkeuze speelden eveneens een rol.`,
    };
  } else {
    personalEvidence = {
      hasSufficientData: false,
      totalRelevantSessions: relevantSessions.length,
      relevantPrebaitedSessionsCount: prebaitedSessions.length,
      catchRateWithPrebait: null,
      catchRateWithoutPrebait: null,
      summaryNote: `Er zijn momenteel ${prebaitedSessions.length} sessies met geregistreerd voorvoeren in jouw logboek (minimaal 5 vergelijkbare sessies vereist voor persoonlijke statistiek). Het advies volgt nu betrouwbare algemene biologische vuistregels.`,
    };
  }

  const confidenceLevel = hasSufficientData && thermalAnalysis.hasMeasuredWaterTemp
    ? 'Redelijk'
    : thermalAnalysis.hasMeasuredWaterTemp || availableDaysBefore > 0
    ? 'Matig'
    : 'Laag';

  return {
    suitability,
    suitabilityScore,
    shouldPrebait,
    recommendedDaysBefore: effectiveDays,
    totalAmountGrams: totalCampaignGrams,
    campaignSummary,
    biologicalRationale,
    temperatureFactorExplanation,
    moments,
    sessionDayGuidance: {
      feedDuringSession,
      recommendedAmountGrams: sessionAmountGrams,
      amountDisplay: `~${sessionAmountGrams} gram`,
      advice: sessionAdvice,
    },
    feedCompositionAdvice: {
      recommendedMix,
      digestibilityNote,
      particleSizeNote,
    },
    confidenceLevel,
    missingInformation,
    personalEvidence,
  };
}
