/**
 * «Logo-Wetter» (Noah 03.11.2026, H9 aus dem Geheimmenü): the fifth tap on «PG» can show the real weather of now
 * at the logo: a small sun, rain cloud or snow with the sentence of Today («14° and dry until 17:00.»). Nothing new
 * is fetched in a special way: it asks for the same home forecast as Today (home-weather.js, kept on the device);
 * without a home place or without a forecast it shows a sun and says so. Pure part tested in tests/logowetter.test.js.
 */
import { t } from '../i18n.svelte.js';
import { weatherLine } from '../home/heute.js';

/** Cold enough for snow when it rains (°C). */
export const SNOW_AT = 1;

/**
 * { kind: 'sun' | 'rain' | 'snow' | 'none', text } for the screen from the home forecast.
 * sun: dry for the next hours, rain: wet soon, snow: wet and at most SNOW_AT degrees, none: no forecast.
 * tr: the translator (t) – a parameter so tests need no language.
 */
export function logoWeather(forecast, now = new Date(), tr = t) {
  const line = weatherLine(forecast, now);
  if (!line) return { kind: 'none', text: tr('No weather loaded.') };
  if (line.dry) return { kind: 'sun', text: line.text };
  return { kind: line.temp <= SNOW_AT ? 'snow' : 'rain', text: line.text };
}

/** Reads the home forecast (Today's one) and turns it into the picture; never throws. */
export async function loadLogoWeather(db, now = new Date()) {
  try {
    const { homeForecast } = await import('../home-weather.js');
    return logoWeather(await homeForecast(db), now);
  } catch {
    return logoWeather(null, now);
  }
}
