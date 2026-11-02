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

  // 1. Verzamel echte temperatuurmetingen voor exact dezelfde stek.
  // Een oudere meting blijft bruikbaar als startpunt voor een modelschatting,
  // maar wordt nooit als actuele meting voor een latere doeldag gepresenteerd.
  const targetDateMs = new Date(`${targetDateStr}T12:00:00`).getTime();
  const refMs = currentDateRef ? currentDateRef.getTime() : targetDateMs;
  const targetIsCurrentDate = Boolean(currentDateRef && currentDateRef.toISOString().slice(0, 10) === targetDateStr);
  // Voor vandaag rekenen we vanaf het echte huidige tijdstip, niet vanaf een vaste middagreferentie.
  const estimationTargetMs = targetIsCurrentDate && currentDateRef ? currentDateRef.getTime() : targetDateMs;
  const measurementCandidates: Array<{ temperature: number; timestampMs: number; source: 'current' | 'session' }> = [];

  if (typeof userMeasured === 'number' && Number.isFinite(userMeasured) && userMeasured >= 0 && userMeasured <= 35) {
    measurementCandidates.push({ temperature: userMeasured, timestampMs: refMs, source: 'current' });
  }

  if (location?.id) {
    for (const session of historicalSessions) {
      if (session.locationId !== location.id || session.isBenchmark === true) continue;
      if (typeof session.waterTemperature !== 'number' || !Number.isFinite(session.waterTemperature) ||
          session.waterTemperature < 0 || session.waterTemperature > 35) continue;
      const timestampMs = new Date(session.startTime).getTime();
      if (!Number.isFinite(timestampMs)) continue;
      measurementCandidates.push({ temperature: session.waterTemperature, timestampMs, source: 'session' });
    }
  }

  const usableAnchors = measurementCandidates
    .filter((measurement) => measurement.timestampMs <= estimationTargetMs || (measurement.source === 'current' && targetIsCurrentDate))
    .sort((a, b) => b.timestampMs - a.timestampMs);
  const anchor = usableAnchors[0] ?? null;
  const anchorAgeHours = anchor
    ? Math.max(0, (estimationTargetMs - anchor.timestampMs) / 3600000)
    : null;
  // Bewaar de volledige herkomst van het laatst bekende meetanker, ook wanneer
  // de meting te oud is of de weersdekking onvoldoende is voor extrapolatie.
  const weatherSinceAnchor = anchor
    ? forecasts.filter((h) => {
        const t = new Date(h.time).getTime();
        return Number.isFinite(t) && t > anchor.timestampMs && t <= estimationTargetMs &&
          Number.isFinite(h.temperature) && h.temperature >= -30 && h.temperature <= 55;
      }).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    : [];
  // Een oude sessiemeting wordt niet actueel enkel omdat de prognose voor vandaag is.
  const isActualSituation = Boolean(anchor && (
    (anchor.source === 'current' && targetIsCurrentDate) ||
    Math.abs(estimationTargetMs - anchor.timestampMs) <= 6 * 3600000
  ));
  const hasMeasured = isActualSituation;
  const measuredTemp = hasMeasured && anchor ? Math.round(anchor.temperature * 10) / 10 : null;

  // 2. Weergegevens voor de doeldag en omliggende dagen inspecteren
  const dayForecasts = forecasts.filter((h) => h.time.startsWith(targetDateStr));
  const dayTemperatureForecasts = dayForecasts.filter((h) => Number.isFinite(h.temperature) && h.temperature >= -30 && h.temperature <= 55);
  const expectedAnchorHours = anchorAgeHours === null ? 0 : Math.max(0, Math.floor(anchorAgeHours));
  let weatherCoverageRatio = expectedAnchorHours > 0
    ? Math.min(1, weatherSinceAnchor.length / expectedAnchorHours)
    : Math.min(1, dayTemperatureForecasts.length / 24);

  // Voor een thermische schatting zijn minimaal zes geldige uurtemperaturen op de doeldag nodig.
  if (dayTemperatureForecasts.length < 6) {
    const recentAnchorAgeHours = anchor ? Math.max(0, (estimationTargetMs - anchor.timestampMs) / 3600000) : null;
    const recentAnchorEstimate = anchor && recentAnchorAgeHours !== null && recentAnchorAgeHours <= 24
      ? Math.round(anchor.temperature * 10) / 10
      : null;
    return {
      trend: 'Onvoldoende gegevens',
      trendConfidence: 'Onvoldoende gegevens',
      hasMeasuredWaterTemp: hasMeasured,
      measuredWaterTemp: measuredTemp,
      estimatedWaterTemp: recentAnchorEstimate,
      estimatedRange: recentAnchorEstimate === null ? null : [Math.round((recentAnchorEstimate - 1.0) * 10) / 10, Math.round((recentAnchorEstimate + 1.0) * 10) / 10],
      waterTemperatureStatus: hasMeasured ? 'measured' : recentAnchorEstimate !== null ? 'estimated_from_measurement' : 'unknown',
      anchorMeasurementTimestamp: anchor ? new Date(anchor.timestampMs).toISOString() : null,
      anchorAgeHours,
      weatherCoverageRatio,
      uncertaintyC: recentAnchorEstimate === null ? null : 1.0,
      surfaceVsBulkNote: recentAnchorEstimate === null ? 'Onvoldoende uurlijkse weergegevens beschikbaar om waterstratificatie te analyseren.' : 'Recente echte stekmeting als tijdelijk anker gebruikt; zonder weerdekking is geen betrouwbare verdere temperatuurontwikkeling te berekenen.',
      inertiaFactor: 'Gemiddeld',
      summaryRationale: recentAnchorEstimate === null ? 'Er zijn onvoldoende betrouwbare weersgegevens om de thermische ontwikkeling te bepalen.' : 'De recente watertemperatuurmeting geeft een bruikbaar kortetermijn-startpunt, maar de verdere ontwikkeling is onzeker door ontbrekende weergegevens.',
      dataPointsAvailable: {
        past24hAvailable: false,
        past72hAvailable: false,
        solarRadiationIndication: 'Onvoldoende gegevens',
        windMixingInfluence: 'Onvoldoende gegevens',
        depthKnown: typeof location?.waterDepth === 'number',
        waterDepthMeters: location?.waterDepth,
      },
      prognosisImpactNote: recentAnchorEstimate === null ? 'Geen thermische correctie toegepast wegens ontbrekende weerdata.' : 'Korte-termijnschatting gebruikt de recente gemeten watertemperatuur met een ruime onzekerheidsmarge; weerontwikkeling ontbreekt.'
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

  // 6. Geschatte watertemperatuur. Als een eerdere echte meting bestaat,
  // wordt die als beginwaarde gebruikt en stap voor stap aangepast met het weer
  // sinds de meting. Dit is een modelschatting, geen nieuwe meting.
  let estimatedWaterTemp: number | null = null;
  let estimatedRange: [number, number] | null = null;
  let usedMeasuredAnchor = false;
  let measurementAgeHours: number | null = null;

  if (anchor && measuredTemp !== null) {
    estimatedWaterTemp = measuredTemp;
    estimatedRange = [Math.round((measuredTemp - 0.5) * 10) / 10, Math.round((measuredTemp + 0.5) * 10) / 10];
    usedMeasuredAnchor = true;
  } else if (anchor) {
    const elapsedSinceAnchorHours = anchorAgeHours ?? 0;
    measurementAgeHours = elapsedSinceAnchorHours;
    const orderedWeather = weatherSinceAnchor;

    const expectedHours = Math.max(0, Math.floor(elapsedSinceAnchorHours));
    const coverage = expectedHours === 0 ? 1 : Math.min(1, orderedWeather.length / expectedHours);
    weatherCoverageRatio = coverage;
    // Alleen een weer-gestuurde extrapolatie als het grootste deel van de periode
    // sinds de meting door uurlijkse data wordt afgedekt. Geen ontbrekende dagen invullen.
    if (elapsedSinceAnchorHours <= 96 && coverage >= 0.65 && orderedWeather.length >= Math.min(6, expectedHours)) {
      let waterTemp = anchor.temperature;
      const depth = typeof location?.waterDepth === 'number' && location.waterDepth > 0
        ? location.waterDepth
        : 2.0;
      // Eerste-orde warmte-uitwisseling: ondiep water reageert sneller; diep water trager.
      let timeConstantHours = depth <= 1.4 ? 54 : depth > 3.5 ? 150 : 96;
      if (location?.waterType === 'Polder' || location?.waterType === 'Stadswater') timeConstantHours *= 0.85;
      if (location?.waterType === 'Plas/Zandafgraving' && depth > 3.5) timeConstantHours *= 1.15;

      // Vooraf timestamps en prefix-sommen maken 24u/72u-gemiddelden O(n) in plaats
      // van bij ieder uur opnieuw de volledige reeks te filteren (O(n²)).
      const weatherTimes = orderedWeather.map((sample) => new Date(sample.time).getTime());
      const temperaturePrefix = [0];
      for (const sample of orderedWeather) {
        temperaturePrefix.push(temperaturePrefix[temperaturePrefix.length - 1] + sample.temperature);
      }
      let start24 = 0;
      let start72 = 0;

      for (let i = 0; i < orderedWeather.length; i++) {
        const hour = orderedWeather[i];
        const hourMs = weatherTimes[i];
        const previousMs = i === 0 ? anchor.timestampMs : weatherTimes[i - 1];
        const elapsedHours = Math.max(0, Math.min(3, (hourMs - previousMs) / 3600000));
        if (elapsedHours === 0) continue;

        const min24 = hourMs - 24 * 3600000;
        const min72 = hourMs - 72 * 3600000;
        while (start24 <= i && weatherTimes[start24] < min24) start24++;
        while (start72 <= i && weatherTimes[start72] < min72) start72++;

        const count24 = i - start24 + 1;
        const count72 = i - start72 + 1;
        const mean24 = count24 > 0
          ? (temperaturePrefix[i + 1] - temperaturePrefix[start24]) / count24
          : hour.temperature;
        const mean72 = count72 > 0
          ? (temperaturePrefix[i + 1] - temperaturePrefix[start72]) / count72
          : mean24;

        const cloud = Number.isFinite(hour.cloudCover) ? Math.max(0, Math.min(100, hour.cloudCover)) : null;
        const solarAdjustment = cloud === null ? 0 : (1 - cloud / 100) * (hour.temperature > waterTemp ? 0.35 : 0.12);
        const equilibrium = mean24 * 0.65 + mean72 * 0.35 + solarAdjustment;
        const wind = Number.isFinite(hour.windSpeed) ? Math.max(0, hour.windSpeed) : null;
        const mixingMultiplier = wind === null ? 1 : wind >= 20 ? 0.82 : wind >= 9 ? 0.92 : 1.08;
        const alpha = 1 - Math.exp(-elapsedHours / (timeConstantHours * mixingMultiplier));
        waterTemp += (equilibrium - waterTemp) * alpha;
      }

      estimatedWaterTemp = Math.round(waterTemp * 10) / 10;
      const uncertainty = 0.45 + elapsedSinceAnchorHours * 0.009 + (coverage < 0.85 ? 0.45 : 0) +
        (typeof location?.waterDepth !== 'number' ? 0.5 : 0);
      estimatedRange = [
        Math.round((waterTemp - uncertainty) * 10) / 10,
        Math.round((waterTemp + uncertainty) * 10) / 10,
      ];
      usedMeasuredAnchor = true;
    } else if (elapsedSinceAnchorHours <= 24) {
      // Bij een recente meting en ontbrekende uurlijkse weerdekking: korte-termijn
      // stabiliteitsaanname met ruime marge, expliciet lage betrouwbaarheid.
      estimatedWaterTemp = Math.round(anchor.temperature * 10) / 10;
      estimatedRange = [
        Math.round((anchor.temperature - 1.0) * 10) / 10,
        Math.round((anchor.temperature + 1.0) * 10) / 10,
      ];
      usedMeasuredAnchor = true;
    }
  }

  if (estimatedWaterTemp === null) {
    // Zonder lokale meet-anker blijft de bestaande weer-/dieptebenadering beschikbaar,
    // maar de bandbreedte blijft ruimer omdat geen echte stekmeting de berekening verankert.
    const weightCurrent = responseWeight;
    const weightPast = 1 - weightCurrent;
    const baseAirEquilibrium = weightPast * past72Avg + weightCurrent * dayAvg;
    let solarBonus = 0;
    if (isDepthKnown && solarIndication === 'Sterk (zonnig)' && depth <= 2.5) {
      solarBonus = depth <= 1.5 ? 0.8 : 0.4;
    }
    const rawEstimate = baseAirEquilibrium + solarBonus;
    estimatedWaterTemp = Math.round(rawEstimate * 10) / 10;
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
  } else if (anchor && estimatedWaterTemp !== null && usedMeasuredAnchor) {
    prognosisImpactNote = `Prognose gebruikt een modelschatting (~${estimatedWaterTemp} °C), verankerd aan de laatste echte stekmeting van ${anchor.temperature.toFixed(1)} °C (${Math.round((estimationTargetMs - anchor.timestampMs) / 3600000)} uur eerder) en aangepast met de beschikbare weersontwikkeling.`;
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
    waterTemperatureStatus: hasMeasured ? 'measured' : anchor && usedMeasuredAnchor ? 'estimated_from_measurement' : estimatedWaterTemp !== null ? 'estimated_from_weather' : 'unknown',
    anchorMeasurementTimestamp: anchor ? new Date(anchor.timestampMs).toISOString() : null,
    anchorAgeHours,
    weatherCoverageRatio,
    uncertaintyC: estimatedRange ? Math.round(((estimatedRange[1] - estimatedRange[0]) / 2) * 10) / 10 : null,
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