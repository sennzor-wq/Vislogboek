import assert from 'node:assert/strict';
import {
  getGreetingLibrarySize,
  selectWelcomeGreeting,
  WelcomeGreetingContext,
} from './src/services/visCoachGreetingService';
import { WeatherHourlyForecast } from './src/types';

const fixedDate = new Date('2026-11-06T09:00:00+01:00');
const makeWeather = (overrides: Partial<WeatherHourlyForecast> = {}): WeatherHourlyForecast => ({
  time: '2026-11-06T09:00:00',
  temperature: 12,
  pressure: 1015,
  windSpeed: 8,
  windDirection: 225,
  windDirectionText: 'ZW',
  precipitation: 0,
  precipitationProbability: 5,
  cloudCover: 30,
  weatherCode: 1,
  ...overrides,
});

assert.equal(getGreetingLibrarySize(), 240, 'De welkomstbibliotheek bevat minimaal 200 onderscheidbare varianten.');

const coldContext: WelcomeGreetingContext = { date: fixedDate, weather: makeWeather({ temperature: 7 }) };
assert.equal(selectWelcomeGreeting(coldContext).category, 'cold', 'Lage temperatuur kiest een passende koude-weergroet.');

const warmContext: WelcomeGreetingContext = { date: fixedDate, weather: makeWeather({ temperature: 25 }) };
assert.equal(selectWelcomeGreeting(warmContext).category, 'warm', 'Hoge temperatuur kiest een passende warme-weergroet.');

const rainContext: WelcomeGreetingContext = { date: fixedDate, weather: makeWeather({ temperature: 14, precipitation: 0.4 }) };
assert.equal(selectWelcomeGreeting(rainContext).category, 'rain', 'Neerslag wordt in de begroeting herkend.');

const dryContext: WelcomeGreetingContext = { date: fixedDate, weather: makeWeather({ temperature: 14 }) };
assert.equal(selectWelcomeGreeting(dryContext).category, 'dry', 'Een droog uur wordt alleen genoemd bij lage neerslagkans.');

const breakContext: WelcomeGreetingContext = { date: fixedDate, daysSinceLastSession: 21 };
const breakGreeting = selectWelcomeGreeting(breakContext);
assert.equal(breakGreeting.category, 'long-break', 'Een langere pauze kiest een terugkomgroet.');
assert.ok(breakGreeting.text.includes('21'), 'Het aantal dagen wordt in de tekst ingevuld.');
assert.ok(!breakGreeting.text.includes('{days}'), 'De tekst bevat geen onvervulde placeholder.');

const skunkContext: WelcomeGreetingContext = { date: fixedDate, previousSessionOutcome: 'skunk_confirmed' };
assert.equal(selectWelcomeGreeting(skunkContext).category, 'previous-skunk', 'Alleen een expliciet bevestigde nulvangst kiest deze context.');

const catchContext: WelcomeGreetingContext = { date: fixedDate, previousSessionOutcome: 'catch', hasRecordedCatch: true };
assert.equal(selectWelcomeGreeting(catchContext).category, 'previous-catch', 'Een geregistreerde vangst kan in de begroeting worden verwerkt.');

const first = selectWelcomeGreeting(dryContext);
const next = selectWelcomeGreeting(dryContext, [first.id]);
assert.notEqual(next.id, first.id, 'Een recent getoonde begroeting wordt overgeslagen.');
const third = selectWelcomeGreeting(dryContext, [first.id, next.id]);
assert.notEqual(third.id, first.id, 'Ook meerdere recente begroetingen worden overgeslagen.');
assert.notEqual(third.id, next.id, 'De selectie doorloopt de categorie om variatie te behouden.');

console.log('VisCoach-welkomstteksten: alle tests geslaagd.');
