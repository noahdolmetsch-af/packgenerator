/**
 * BF7 «Wartungs-Check»: the only addresses /api/linkcheck checks (the app's list is
 * src/lib/maintenance/links.js; tests/maintenance.test.js keeps both the same).
 */
export const LINK_CHECKS = [
  'https://www.slf.ch/',
  'https://www.meteoschweiz.admin.ch/',
  'https://api.open-meteo.com/v1/forecast?latitude=46.95&longitude=7.45&daily=temperature_2m_max&forecast_days=1',
  'https://geocoding-api.open-meteo.com/v1/search?name=Bern&count=1',
  'https://tile.openstreetmap.org/0/0/0.png',
  'https://www.strava.com/',
];
