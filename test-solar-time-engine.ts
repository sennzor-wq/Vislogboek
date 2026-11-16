import { calculateCivilTwilightTimes } from './src/services/solarTimeEngine';

const winter = calculateCivilTwilightTimes(
  '2026-12-21', 51.961, '2026-12-21T08:45', '2026-12-21T16:30'
);
if (!winter) throw new Error('Winter civil twilight should be calculable at the Netherlands latitude.');
if (!(winter.civilDawn < winter.sunrise && winter.sunset < winter.civilDusk)) {
  throw new Error('Civil dawn must precede sunrise and civil dusk must follow sunset.');
}
const dawnMinutes = Number(winter.civilDawn.slice(0, 2)) * 60 + Number(winter.civilDawn.slice(3));
const sunriseMinutes = Number(winter.sunrise.slice(0, 2)) * 60 + Number(winter.sunrise.slice(3));
const duskMinutes = Number(winter.civilDusk.slice(0, 2)) * 60 + Number(winter.civilDusk.slice(3));
const sunsetMinutes = Number(winter.sunset.slice(0, 2)) * 60 + Number(winter.sunset.slice(3));
if (sunriseMinutes - dawnMinutes < 25 || sunriseMinutes - dawnMinutes > 75 || duskMinutes - sunsetMinutes < 25 || duskMinutes - sunsetMinutes > 75) {
  throw new Error('Civil twilight extension should remain within a plausible seasonal range.');
}
const summer = calculateCivilTwilightTimes(
  '2026-06-21', 51.961, '2026-06-21T05:20', '2026-06-21T22:00'
);
if (!summer || summer.civilDawn >= winter.civilDawn || summer.civilDusk <= winter.civilDusk) {
  throw new Error('Long summer daylight should produce earlier civil dawn and later civil dusk than winter.');
}
if (calculateCivilTwilightTimes('2026-12-21', 91, '2026-12-21T08:45', '2026-12-21T16:30') !== null ||
    calculateCivilTwilightTimes('2026-12-21', 51.961, '2026-12-20T08:45', '2026-12-20T16:30') !== null) {
  throw new Error('Invalid latitude or mismatched date must not produce solar times.');
}

console.log('Solar time engine tests passed.');
