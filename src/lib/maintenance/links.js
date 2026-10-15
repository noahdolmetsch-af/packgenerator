/**
 * BF7 «Wartungs-Check» (Noah 13.10.2026): the outside addresses the app shows or needs, checked once a
 * month. A browser cannot read another site's answer, so the small server function api/linkcheck.js
 * asks for the app; it only checks the addresses of LINK_CHECKS (api/_lib/links.js, a test keeps both
 * lists the same).
 *   shown: a link the app shows (checks.js: SLF, MeteoSwiss)
 *   used:  a service the app needs (weather, places, the map, Strava)
 */
export const LINKS = [
  { id: 'slf', name: 'SLF avalanche bulletin', url: 'https://www.slf.ch/', kind: 'shown' },
  { id: 'meteoswiss', name: 'MeteoSwiss', url: 'https://www.meteoschweiz.admin.ch/', kind: 'shown' },
  { id: 'forecast', name: 'Weather forecast (Open-Meteo)', url: 'https://api.open-meteo.com/v1/forecast?latitude=46.95&longitude=7.45&daily=temperature_2m_max&forecast_days=1', kind: 'used' },
  { id: 'places', name: 'Place search (Open-Meteo)', url: 'https://geocoding-api.open-meteo.com/v1/search?name=Bern&count=1', kind: 'used' },
  { id: 'map', name: 'Map tiles (OpenStreetMap)', url: 'https://tile.openstreetmap.org/0/0/0.png', kind: 'used' },
  { id: 'strava', name: 'Strava', url: 'https://www.strava.com/', kind: 'used' },
];

export const LINKCHECK_URL = 'https://packgen-three.vercel.app/api/linkcheck';
