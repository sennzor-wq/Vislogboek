import { buildPrognosisIntervalOutput, createPrognosisIntervalOutput } from './src/services/prognosisIntervalOutput';
import { DayPrognosis, WeatherHourlyForecast } from './src/types';
import { buildVisCoachAdviceText } from './src/services/sessionCoachService';

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log('[PASS] ' + label); passed++; }
  else { console.error('[FAIL] ' + label); failed++; }
}

const day = {
  date: '2026-11-23', dayName: 'Maandag', species: 'Karper',
  activityScore: 6.2, activityScoreAvailable: true, advice: 'Gunstig',
  bestTimeSlot: 'Middag', alternativeTimeSlots: [], summaryRationale: 'Dagcontext',
  personalCatchChance: 42, personalCatchConfidence: 'Matig', relevantSessionCount: 6,
  plannedDurationHours: 2.75, provenance: 'Eigen waarnemingen', timeSlots: {} as any,
} as DayPrognosis;

const forecasts: WeatherHourlyForecast[] = [
  { time: '2026-11-23T09:00:00.000Z', temperature: 12, pressure: 1016, windSpeed: 8, windDirection: 225, windDirectionText: 'ZW', precipitation: 0, precipitationProbability: 10, cloudCover: 40, weatherCode: 1 },
  { time: '2026-11-23T10:00:00.000Z', temperature: 13, pressure: 1015, windSpeed: 9, windDirection: 230, windDirectionText: 'ZW', precipitation: 0.2, precipitationProbability: 20, cloudCover: 45, weatherCode: 2 },
  { time: '2026-11-23T11:00:00.000Z', temperature: 14, pressure: 1014, windSpeed: 10, windDirection: 235, windDirectionText: 'ZW', precipitation: 0, precipitationProbability: 10, cloudCover: 50, weatherCode: 2 },
];

const complete = createPrognosisIntervalOutput('2026-11-23T10:15:00+01:00', '2026-11-23T12:00:00+01:00', forecasts, day, 'Ochtend');
assert(complete.status === 'complete' && complete.segments.length === 2, 'Bekend interval levert opeenvolgende uursegmenten');
assert(complete.dayContext.activityScore === 6.2 && complete.dayContext.bestTimeSlot === 'Middag', 'Bestaande dagprognose blijft herkenbaar als dagcontext');
assert(complete.sessionContext.personalCatchChance === 42 && complete.sessionContext.plannedDurationHours === 2.75, 'Persoonlijke vangkans blijft één sessiebrede uitkomst');
assert(complete.startContext.selectedTimeSlot === 'Ochtend', 'Gekozen starttijdvak blijft afzonderlijke tactische context');
assert(complete.segments[0].weatherContext.airTemperatureC.status === 'available', 'Geldig uurrecord levert beschrijvende luchttemperatuur');
assert(complete.segments[0].weatherContext.wind.status === 'available', 'Wind vereist geldige snelheid én richting/label');
assert(complete.segments.every(s => s.factorResolution.thermalActivity === 'not_calculated_per_segment'), 'Segmentcontext wordt niet als thermische segmentscore gepresenteerd');
const composedAdvice = buildVisCoachAdviceText(day, null, null, null, 2.75, complete);
assert(composedAdvice.summary.includes('dagprognose') && composedAdvice.summary.includes('geen sessiescore'), 'VisCoach houdt dagprognose expliciet gescheiden van sessieadvies');
assert(composedAdvice.advice.includes('Verloop tijdens je sessie') && composedAdvice.advice.includes('wind ZW'), 'VisCoach vertaalt de segmenten chronologisch naar één samenhangend advies');

const partial = createPrognosisIntervalOutput('2026-11-23T10:15:00+01:00', '2026-11-23T13:00:00+01:00', forecasts.slice(0, 2), day, 'Ochtend');
assert(partial.status === 'partial' && partial.segments.length === 3, 'Ontbrekend uur maakt dekking gedeeltelijk zonder segment te verwijderen');
assert(partial.segments[2].weatherRecordStatus === 'missing', 'Ontbrekend forecastrecord krijgt expliciete missing-status');
assert(partial.segments[2].weatherContext.pressureHpa.status === 'unknown' && partial.segments[2].weatherContext.pressureHpa.value === null, 'Ontbrekende druk wordt unknown/null en nooit nul');

const badFieldForecasts = [{ ...forecasts[0], windDirectionText: '', precipitation: -1 }];
const badFields = createPrognosisIntervalOutput('2026-11-23T10:00:00+01:00', '2026-11-23T11:00:00+01:00', badFieldForecasts, day, 'Ochtend');
assert(badFields.segments[0].weatherContext.wind.status === 'unknown', 'Wind zonder geldig richtingslabel wordt onbekend');
assert(badFields.segments[0].weatherContext.precipitationMm.status === 'unknown', 'Ongeldige factorwaarde wordt afzonderlijk onbekend');
const invalidRecordAdvice = buildVisCoachAdviceText(day, null, null, null, 1, badFields);
assert(invalidRecordAdvice.advice.includes('uurforecastrecords aanwezig') && invalidRecordAdvice.advice.includes('geen bruikbare weersgegevens'), 'Aanwezig uurrecord wordt niet verward met bruikbare waarden voor alle factoren');

const unknownEnd = createPrognosisIntervalOutput('2026-11-23T10:15:00+01:00', null, forecasts, { ...day, plannedDurationHours: null, personalCatchChance: null } as DayPrognosis, 'Ochtend');
assert(unknownEnd.status === 'unknown_end' && unknownEnd.segments.length === 0, 'Onbekende eindtijd levert geen gefabriceerde segmenten');
assert(unknownEnd.sessionContext.plannedDurationHours === null && unknownEnd.sessionContext.personalCatchChance === null, 'Onbekende duur houdt sessiebrede vangkans null');

const unavailableDayScore = buildPrognosisIntervalOutput(
  { ...complete, segments: complete.segments.map(s => ({
    startTime: s.startTime, endTime: s.endTime, durationMinutes: s.durationMinutes,
    targetDate: s.targetDate, timeSlot: s.timeSlot, weatherAvailable: true,
    weatherSampleTime: null, weatherSample: null,
  })), coverageRatio: 1 },
  { ...day, activityScoreAvailable: false } as DayPrognosis,
  'Ochtend'
);
assert(!unavailableDayScore.dayContext.activityScoreAvailable && unavailableDayScore.dayContext.activityScore === null, 'Niet-beschikbare dagscore blijft null in intervalcontract');

console.log('\nInterval output contract: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
