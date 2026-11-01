import {
  WeatherHourlyForecast,
  FishingLocation,
  FishingSession,
  WaterThermalAnalysis,
  ThermalTrend,
} from '../types';

export interface ThermalAnalysisOptions {
  location?: FishingLocation;
  userMeasuredWaterTemp?: number | null;
  historicalSessions?: FishingSession[];
  targetHour?: number;
  currentDateRef?: Date;
}

/**
 * Berekent de waarschijnlijke thermische ontwikkeling van het viswater
 * op basis van meerdaagse weersontwikkeling, zonnestraling, waterdiepte en thermische traagheid.
 */
export function analyzeWaterThermalDevelopment(
  targetDateStr: string,
  forecasts: WeatherHourlyForecast[],
  options?: ThermalAnalysisOptions
): WaterThermalAnalysis {
  const location = options?.location;
  const userMeasured = options?.userMeasuredWaterTemp;
  const historicalSessions = options?.historicalSessions || [];
  const currentDateRef = options?.currentDateRef;

  // 1. Controleer op daadwerkelijk gemeten watertemperatuur voor de actuele situatie
  // Een meting (user-invoer of recente stekmeting) is strikt van toepassing op de actuele situatie (binnen 24 uur).
  // Laat een actuele of oude meting niet automatisch toekomstige dagen dicteren.
  const targetDateMs = new Date(`${targetDateStr}T12:00:00`).getTime();
  const refMs = currentDateRef ? currentDateRef.getTime() : targetDateMs;
  const diffHoursFromRef = (targetDateMs - refMs) / 3600000;

  // Is de doeldag de actuele situatie (binnen 24 uur van referentiedatum)?
  const isActualSituation = Math.abs(diffHoursFromRef) <= 24;

  let hasMeasured = false;
  let measuredTemp: number | null = null;

  if (typeof userMeasured === 'number' && !isNaN(userMeasured)) {
    if (isActualSituation) {
      hasMeasured = true;
      measuredTemp = Math.round(userMeasured * 10) / 10;
    }
  } else if (location?.id) {
    // Zoek naar recente daadwerkelijk gemeten watertemperatuur op exact dezelfde stek (< 24u)
    const recentLocSession = historicalSessions.find((s) => {
      if (s.locationId !== location.id) return false;
      if (typeof s.waterTemperature !== 'number' || isNaN(s.waterTemperature)) return false;
      const sessionDate = new Date(s.startTime).getTime();
      const diffHours = Math.abs(targetDateMs - sessionDate) / 3600000;
      return diffHours <= 24;
    });

    if (recentLocSession && typeof recentLocSession.waterTemperature === 'number') {
      hasMeasured = true;
      measuredTemp = recentLocSession.waterTemperature;
    }
  }

  // 2. Weergegevens voor de doeldag en omliggende dagen inspecteren
  const dayForecasts = forecasts.filter((h) => h.time.startsWith(targetDateStr));
  const validTemperatureForecasts = forecasts.filter((h) => Number.isFinite(h.temperature) && h.temperature >= -30 && h.temperature <= 55);
  const dayTemperatureForecasts = dayForecasts.filter((h) => Number.isFinite(h.temperature) && h.temperature >= -30 && h.temperature <= 55);

  // Voor een thermische schatting zijn minimaal zes geldige uurtemperaturen op de doeldag nodig.
  if (dayTemperatureForecasts.length < 6) {
    return {
      trend: 'Onvoldoende gegevens',
      trendConfidence: 'Onvoldoende gegevens',
      hasMeasuredWaterTemp: hasMeasured,
      measuredWaterTemp: measuredTemp,
      estimatedWaterTemp: null,
      estimatedRange: null,
      surfaceVsBulkNote: 'Onvoldoende uurlijkse weergegevens beschikbaar om waterstratificatie te analyseren.',
      inertiaFactor: 'Gemiddeld',
      summaryRationale: 'Er zijn onvoldoende betrouwbare weersgegevens om de thermische ontwikkeling te bepalen.',
      dataPointsAvailable: {
        past24hAvailable: false,
        past72hAvailable: false,
        solarRadiationIndication: 'Gering (zwaarbewolkt/mist)',
        windMixingInfluence: 'Rustig',
        depthKnown: typeof location?.waterDepth === 'number',
        waterDepthMeters: location?.waterDepth,
      },
      prognosisImpactNote: 'Geen thermische correctie toegepast wegens ontbrekende weerdata.',
    };
  }

  // Kenmerken van de doeldag
  const dayTemps = dayTemperatureForecasts.map((h) => h.temperature);
  const dayMin = Math.min(...dayTemps);
  const dayMax = Math.max(...dayTemps);
  const dayAvg = dayTemps.reduce((a, b) => a + b, 0) / dayTemps.length;
  const validDayWind = dayForecasts.filter((h) => Number.isFinite(h.windSpeed) && h.windSpeed >= 0 && h.windSpeed <= 200);
  const validDayCloud = dayForecasts.filter((h) => Number.isFinite(h.cloudCover) && h.cloudCover >= 0 && h.cloudCover <= 100);
  const dayAvgWind = validDayWind.length ? validDayWind.reduce((a, b) => a + b.windSpeed, 0) / validDayWind.length : null;
  const dayAvgCloud = validDayCloud.length ? validDayCloud.reduce((a, b) => a + b.cloudCover, 0) / validDayCloud.length : null;

  // 3. Evalueer omliggende dagen (voorafgaand en na de doeldag binnen de 8-daagse reeks)
  const targetTimeMs = new Date(`${targetDateStr}T12:00:00`).getTime();

  // Forecasts in vensters vóór de doeldag
  const past24hForecasts = forecasts.filter((h) => {
    const t = new Date(h.time).getTime();
    return t < targetTimeMs && t >= targetTimeMs - 24 * 3600000 && Number.isFinite(h.temperature) && h.temperature >= -30 && h.temperature <= 55;
  });
  const past72hForecasts = forecasts.filter((h) => {
    const t = new Date(h.time).getTime();
    return t < targetTimeMs && t >= targetTimeMs - 72 * 3600000 && Number.isFinite(h.temperature) && h.temperature >= -30 && h.temperature <= 55;
  });

  const hasPast24h = past24hForecasts.length >= 12;
  const hasPast72h = past72hForecasts.length >= 36;

  const past24Avg = hasPast24h
    ? past24hForecasts.reduce((s, h) => s + h.temperature, 0) / past24hForecasts.length
    : dayAvg;
  const past72Avg = hasPast72h
    ? past72hForecasts.reduce((s, h) => s + h.temperature, 0) / past72hForecasts.length
    : past24Avg;

  // 4. Waterdiepte en thermische traagheid
  const depth = location?.waterDepth ?? 2.0;
  const isDepthKnown = typeof location?.waterDepth === 'number';

  let inertiaFactor: 'Laag (snel reagerend)' | 'Gemiddeld' | 'Hoog (trage watermassa)';
  let responseWeight: number; // fractie per dag van de luchttemperatuur die doordringt
  if (depth <= 1.4 || location?.waterType === 'Polder' || location?.waterType === 'Stadswater') {
    inertiaFactor = 'Laag (snel reagerend)';
    responseWeight = 0.45;
  } else if (depth > 3.5 || location?.waterType === 'Plas/Zandafgraving') {
    inertiaFactor = 'Hoog (trage watermassa)';
    responseWeight = 0.18;
  } else {
    inertiaFactor = 'Gemiddeld';
    responseWeight = 0.28;
  }

  // Zonnestralingsindicatie (gebaseerd op bewolking overdag tussen 08:00 en 18:00)
  const daytimeHours = dayTemperatureForecasts.filter((h) => {
    const hour = parseInt(h.time.slice(11, 13), 10);
    return hour >= 8 && hour <= 18;
  });
  const daytimeCloudSamples = dayForecasts.filter((h) => {
    const hour = parseInt(h.time.slice(11, 13), 10);
    return hour >= 8 && hour <= 18 && Number.isFinite(h.cloudCover) && h.cloudCover >= 0 && h.cloudCover <= 100;
  });
  const daytimeCloudAvg = daytimeCloudSamples.length > 0 ? daytimeCloudSamples.reduce((s,h)=>s+h.cloudCover,0)/daytimeCloudSamples.length : null;

  let solarIndication: 'Sterk (zonnig)' | 'Matig (half bewolkt)' | 'Gering (zwaarbewolkt/mist)' | 'Onvoldoende gegevens';
  if (daytimeCloudAvg === null) solarIndication = 'Onvoldoende gegevens';
  else if (daytimeCloudAvg <= 35) solarIndication = 'Sterk (zonnig)';
  else if (daytimeCloudAvg <= 70) solarIndication = 'Matig (half bewolkt)';
  else solarIndication = 'Gering (zwaarbewolkt/mist)';

  // Windmenging
  let windMixing: 'Sterke menging' | 'Matige menging' | 'Rustig' | 'Onvoldoende gegevens';
  if (dayAvgWind === null) windMixing = 'Onvoldoende gegevens';
  else if (dayAvgWind >= 20) windMixing = 'Sterke menging';
  else if (dayAvgWind >= 9) windMixing = 'Matige menging';
  else windMixing = 'Rustig';

  // 5. Bepaal thermische trend
  // Vergelijk 24h/72h verloop en dagelijkse amplitude (dagMax vs dagMin)
  const deltaDayToPast = dayAvg - past72Avg;
  const dailyRange = dayMax - dayMin;

  let trend: ThermalTrend;
  let trendConfidence: 'Onvoldoende gegevens' | 'Laag' | 'Matig' | 'Redelijk' | 'Hoog' = 'Matig';
  let summaryRationale = '';
  let surfaceVsBulkNote = '';

  // Analyse van specifieke scenario's:
  // Scenario A: Warme middag met koude nacht (grote dagelijkse amplitude >= 10°C)
  const isHighDiurnalSwing = dailyRange >= 10 && dayMin <= 6;

  // Scenario B: Eén warme dag na koude dagen (dagAvg veel hoger dan 72h avg, maar nog niet ingebed)
  const isSingleWarmDayLag = deltaDayToPast > 2.5 && !hasPast72h;

  if (deltaDayToPast >= 2.0 && past24Avg > past72Avg + 1.0) {
    // Aanhoudende opwarming
    trend = 'Waarschijnlijke opwarming';
    trendConfidence = hasPast72h ? (isDepthKnown ? 'Hoog' : 'Redelijk') : 'Matig';
    summaryRationale = `Meerdere warmere dagen op rij (${past72Avg.toFixed(1)} °C → ${dayAvg.toFixed(1)} °C gem.) zorgen voor geleidelijke warmteopname in het viswater.`;

    if (solarIndication === 'Sterk (zonnig)') {
      surfaceVsBulkNote = 'Krachtige instraling warmt de bovenste waterlaag merkbaar sneller op dan de diepere bulk; vissen kunnen zich in de warmere toplaag ophouden.';
    } else {
      surfaceVsBulkNote = 'Dichte bewolking zorgt voor diffuse, gelijkmatige opwarming zonder scherpe oppervlaktelaag-pieken.';
    }
  } else if (deltaDayToPast <= -2.0 || (past24Avg < past72Avg - 1.5 && dayMax < past72Avg)) {
    // Aanhoudende afkoeling
    trend = 'Waarschijnlijke afkoeling';
    trendConfidence = hasPast72h ? (isDepthKnown ? 'Hoog' : 'Redelijk') : 'Matig';
    summaryRationale = `Dalende luchttemperatuur en koudere nachten (${dayMin.toFixed(1)} °C min) onttrekken warmte aan het wateroppervlak.`;
    surfaceVsBulkNote =
      windMixing === 'Sterke menging'
        ? 'Sterke wind mengt het water continu door, waardoor de afkoeling snel de volledige watermassa bereikt.'
        : 'Afkoelend oppervlaktewater zakt door hogere dichtheid naar beneden (convectiemenging).';
  } else if (isHighDiurnalSwing) {
    // Warme middag met koude nacht
    trend = 'Ongeveer stabiel';
    trendConfidence = 'Redelijk';
    summaryRationale = `Warme middag (${dayMax.toFixed(1)} °C) compenseert de nachtelijke kou (${dayMin.toFixed(1)} °C); het 24-uurs daggemiddelde (${dayAvg.toFixed(1)} °C) blijft evenwichtig.`;
    surfaceVsBulkNote = 'Overdag warmt de bovenste 20-40 cm tijdelijk op, maar straalt \'s nachts weer af naar de koude lucht. De diepere waterlaag blijft nagenoeg ongewijzigd.';
  } else if (isSingleWarmDayLag && inertiaFactor === 'Hoog (trage watermassa)') {
    trend = 'Ongeveer stabiel';
    trendConfidence = 'Matig';
    summaryRationale = `Een opwarmende dag (${dayMax.toFixed(1)} °C) heeft door de grote waterdiepte (${depth.toFixed(1)} m) nog weinig invloed op de diepe watermassa (thermische traagheid).`;
    surfaceVsBulkNote = 'Alleen de allerbovenste waterlaag kan bij windstil weer lokaal opwarmen; de rest van het water blijft stabiel koud.';
  } else {
    // Normale stabiele situatie
    trend = 'Ongeveer stabiel';
    trendConfidence = hasPast72h ? 'Redelijk' : 'Laag';
    summaryRationale = `Geleidelijk temperatuurverloop rond ${dayAvg.toFixed(1)} °C; geen abrupte warmte- of koude-inval verwacht.`;
    surfaceVsBulkNote = 'Geringe thermische gradiënt; temperatuurverschil tussen toplaag en bodem is minimaal.';
  }

  // 6. Geschatte watertemperatuur (strikt als modelschatting aangeduid, nooit gefingeerd)
  let estimatedWaterTemp: number | null = null;
  let estimatedRange: [number, number] | null = null;

  if (hasMeasured && measuredTemp !== null) {
    // Als er voor de actuele situatie gemeten is, blijft dat de onbetwiste referentie
    estimatedWaterTemp = measuredTemp;
    estimatedRange = [Math.round((measuredTemp - 0.5) * 10) / 10, Math.round((measuredTemp + 0.5) * 10) / 10];
  } else {
    // Modelleren via thermische traagheid en meerdaagse gemiddelden:
    // Gewogen mix van 72u gemiddelde, 24u gemiddelde en zonnestralingsbijdrage gekoppeld aan waterdiepte
    const weightCurrent = responseWeight;
    const weightPast = 1 - weightCurrent;
    const baseAirEquilibrium = weightPast * past72Avg + weightCurrent * dayAvg;
    let solarBonus = 0;
    if (isDepthKnown && solarIndication === 'Sterk (zonnig)' && depth <= 2.5) {
      solarBonus = depth <= 1.5 ? 0.8 : 0.4;
    }

    // Bij windstilte minder verdampingskoeling
    const rawEstimate = baseAirEquilibrium + solarBonus;
    estimatedWaterTemp = Math.round(rawEstimate * 10) / 10;

    // Onzekerheid neemt toe als de 72-uursreeks of de werkelijke waterdiepte ontbreekt.
    const margin = (depth > 3.0 ? 1.5 : 1.0) + (!hasPast72h ? 0.75 : 0) + (!isDepthKnown ? 0.5 : 0);
    estimatedRange = [
      Math.round((rawEstimate - margin) * 10) / 10,
      Math.round((rawEstimate + margin) * 10) / 10,
    ];
  }

  // 7. Behoedzame invloed op visprognose (Sectie 10)
  let prognosisImpactNote = '';
  if (hasMeasured && measuredTemp !== null) {
    prognosisImpactNote = `Gebruikt gemeten watertemperatuur (${measuredTemp} °C) als directe biologische invoer voor de actuele situatie.`;
  } else if (typeof userMeasured === 'number' && !isNaN(userMeasured) && !isActualSituation) {
    prognosisImpactNote = `Toekomstige prognose gebruikt geschatte watertemperatuur (~${estimatedWaterTemp} °C) via thermische traagheid en waterdiepte; eerdere actuele meting (${userMeasured} °C) bepaalt niet de toekomstige dagen.`;
  } else if (trend === 'Waarschijnlijke opwarming') {
    prognosisImpactNote = 'Opwarming stimuleert foerageergedrag, met name in ondiepe en zonbeschenen oeverzones.';
  } else if (trend === 'Waarschijnlijke afkoeling') {
    prognosisImpactNote = 'Afkoeling kan vis aanzetten tot kortere bijtperiodes of verplaatsing naar diepere, stabielere waterlagen.';
  } else {
    prognosisImpactNote = trend === 'Ongeveer stabiel' ? 'Stabiele thermische omstandigheden bieden constante foerageerpatronen zonder plotselinge omslag.' : 'Onvoldoende gegevens voor een betrouwbare thermische duiding.';
  }

  return {
    trend,
    trendConfidence,
    hasMeasuredWaterTemp: hasMeasured,
    measuredWaterTemp: measuredTemp,
    estimatedWaterTemp,
    estimatedRange,
    surfaceVsBulkNote,
    inertiaFactor,
    summaryRationale,
    dataPointsAvailable: {
      past24hAvailable: hasPast24h,
      past72hAvailable: hasPast72h,
      solarRadiationIndication: solarIndication,
      windMixingInfluence: windMixing,
      depthKnown: isDepthKnown,
      waterDepthMeters: isDepthKnown ? depth : undefined,
    },
    prognosisImpactNote,
  };
}