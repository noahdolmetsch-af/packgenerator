/**
 * Paket X «Stopps als Wegpunkte für Garmin» (Noah 20.10.2026): one GPX writer for every export of the app
 * that a bike computer should read (Garmin, Wahoo, Hammerhead, Komoot import): the route as a track and
 * the stops (shops, water, beds, stations, own points) as waypoints with a symbol the device knows.
 * The «Umweg neu planen» of the live map uses it too (detour + the rest of the route).
 * Pure functions plus saveGpx (a download on the device; nothing is sent anywhere).
 * Tested in tests/gpxout.test.js.
 */

/** Garmin symbol names (they also show on Wahoo as a plain pin) for the kinds of places of the app. */
export const GPX_SYM = {
  shop: 'Shopping Center',
  food: 'Restaurant',
  fuel: 'Gas Station',
  water: 'Drinking Water',
  sleep: 'Lodging',
  camp: 'Campground',
  bike: 'Bike Trail',
  repair: 'Bike Trail',
  station: 'Ground Transportation',
  shelter: 'Building',
  target: 'Flag, Red',
  start: 'Flag, Green',
  end: 'Flag, Red',
  own: 'Flag, Blue',
};
/** Garmin devices cut long names; 30 characters still read well. */
export const WPT_NAME_MAX = 30;
/** Bike computers slow down with very many waypoints. */
export const WPT_MAX = 250;

const esc = (s) => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
const c6 = (v) => (Math.round(Number(v) * 1e6) / 1e6).toString();
const okPt = (p) => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon));
const pair = (p) => (Array.isArray(p) ? { lat: p[0], lon: p[1], ele: p[2] } : p);

/** A name for a waypoint: trimmed, at most WPT_NAME_MAX characters. */
export const wptName = (s) => {
  const v = String(s ?? '').replace(/\s+/g, ' ').trim();
  return v.length > WPT_NAME_MAX ? `${v.slice(0, WPT_NAME_MAX - 1)}…` : v;
};

/**
 * The GPX text. line: [[lat, lon, ele?]] or [{ lat, lon, ele? }]; stops: [{ lat, lon, name, kind, note? }].
 * Stops without a place are left out, at most WPT_MAX.
 */
export function gpxString({ name = 'Route', line = [], stops = [], creator = 'Pack Generator' } = {}) {
  const pts = line.map(pair).filter(okPt);
  const wpts = stops.filter(okPt).slice(0, WPT_MAX);
  const w = wpts
    .map((s) => {
      const sym = GPX_SYM[s.kind] ?? GPX_SYM.own;
      const desc = s.note ? `<desc>${esc(s.note)}</desc>` : '';
      return `  <wpt lat="${c6(s.lat)}" lon="${c6(s.lon)}"><name>${esc(wptName(s.name || s.kind || 'Stop'))}</name>${desc}<sym>${esc(sym)}</sym><type>${esc(s.kind ?? 'own')}</type></wpt>`;
    })
    .join('\n');
  const trk = pts.map((p) => `      <trkpt lat="${c6(p.lat)}" lon="${c6(p.lon)}">${Number.isFinite(Number(p.ele)) && p.ele !== null && p.ele !== '' ? `<ele>${Math.round(Number(p.ele))}</ele>` : ''}</trkpt>`).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<gpx version="1.1" creator="${esc(creator)}" xmlns="http://www.topografix.com/GPX/1/1">`,
    `  <metadata><name>${esc(name)}</name></metadata>`,
    w,
    pts.length ? `  <trk><name>${esc(name)}</name>\n    <trkseg>\n${trk}\n    </trkseg>\n  </trk>` : '',
    '</gpx>',
    '',
  ]
    .filter((x) => x !== '')
    .join('\n');
}

/** A file name from a route name: letters, digits and dashes, «.gpx» at the end. */
export const gpxFileName = (name = 'route') =>
  `${
    String(name)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'route'
  }.gpx`;

/** Download the GPX on this device (the share sheet on a phone that offers files, else a download). */
export async function saveGpx(text, name = 'route') {
  const file = gpxFileName(name);
  const blob = new Blob([text], { type: 'application/gpx+xml' });
  try {
    const f = new File([blob], file, { type: 'application/gpx+xml' });
    if (navigator.canShare?.({ files: [f] }) && matchMedia?.('(pointer: coarse)').matches) {
      await navigator.share({ files: [f], title: name });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
