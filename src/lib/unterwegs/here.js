/**
 * Paket K: the location, read once and only when a button is pressed (decision 10.10.2026). Never
 * stored. → { lat, lon, acc } or null (refused, no GPS, too slow).
 */
export function whereAmI({ timeout = 10000, geo = typeof navigator !== 'undefined' ? navigator.geolocation : null } = {}) {
  return new Promise((done) => {
    if (!geo?.getCurrentPosition) return done(null);
    geo.getCurrentPosition(
      (p) => done({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy ?? null }),
      () => done(null),
      { timeout, maximumAge: 120000, enableHighAccuracy: false },
    );
  });
}
