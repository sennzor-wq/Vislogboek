export interface CivilTwilightTimes {
  sunrise: string;
  sunset: string;
  civilDawn: string;
  civilDusk: string;
}

function parseLocalMinutes(value: string, expectedDate: string): number | null {
  if (!value.startsWith(expectedDate)) return null;
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatLocalMinutes(value: number): string {
  const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
  return String(Math.floor(normalized / 60)).padStart(2, '0') + ':' + String(normalized % 60).padStart(2, '0');
}

/**
 * Benadert civiele dageraad en civiele schemering (zonmiddelpunt op -6°)
 * vanuit de lokale zonsopkomst/-ondergang van Open-Meteo en de breedtegraad.
 * Het verschil tussen de standaard zonschijf-horizon (-0,833°) en -6° wordt
 * met de NOAA-zonstandbenadering berekend; lokale klok/tijdzone blijft afkomstig
 * van de bronwaarden. Geen netwerk, locale klok of vaste minutenbonus nodig.
 */
export function calculateCivilTwilightTimes(
  date: string,
  latitude: number,
  sunrise: string,
  sunset: string
): CivilTwilightTimes | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(latitude) || latitude < -89 || latitude > 89) return null;
  const sunriseMinutes = parseLocalMinutes(sunrise, date);
  const sunsetMinutes = parseLocalMinutes(sunset, date);
  if (sunriseMinutes === null || sunsetMinutes === null || sunsetMinutes <= sunriseMinutes) return null;

  const [year, month, day] = date.split('-').map(Number);
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
  const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  const gamma = (2 * Math.PI / daysInYear) * (dayOfYear - 1);
  const declination = 0.006918
    - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const latitudeRadians = latitude * Math.PI / 180;
  const hourAngle = (zenithDegrees: number): number | null => {
    const zenith = zenithDegrees * Math.PI / 180;
    const denominator = Math.cos(latitudeRadians) * Math.cos(declination);
    if (Math.abs(denominator) < 1e-9) return null;
    const cosine = (Math.cos(zenith) - Math.sin(latitudeRadians) * Math.sin(declination)) / denominator;
    if (!Number.isFinite(cosine) || cosine < -1 || cosine > 1) return null;
    return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
  };
  const standardSunriseAngle = hourAngle(90.833);
  const civilTwilightAngle = hourAngle(96);
  if (standardSunriseAngle === null || civilTwilightAngle === null || civilTwilightAngle <= standardSunriseAngle) return null;

  const extensionMinutes = 4 * (civilTwilightAngle - standardSunriseAngle);
  if (!Number.isFinite(extensionMinutes) || extensionMinutes <= 0 || extensionMinutes > 180) return null;

  return {
    sunrise: formatLocalMinutes(sunriseMinutes),
    sunset: formatLocalMinutes(sunsetMinutes),
    civilDawn: formatLocalMinutes(sunriseMinutes - extensionMinutes),
    civilDusk: formatLocalMinutes(sunsetMinutes + extensionMinutes),
  };
}
