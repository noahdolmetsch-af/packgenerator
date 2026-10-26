/**
 * Paket L «Werkzeugkasten» (Noah 19.10.2026, wishes #3, #149 and the small helpers): the tools of
 * Ich › Werkzeugkasten (#/me/tools), each on its own sub-page #/me/tools/<key>. Everything works on
 * the device; nothing is sent to a web page. Titles and lines are English keys for t().
 * Pure, tested in tests/werkzeugkasten.test.js.
 */
export const TOOLS_HASH = '#/me/tools';

export const TOOLS = [
  { key: 'calc', icon: 'calculator', title: 'Calculator', sub: 'Plus, minus, times, divided, percent' },
  { key: 'units', icon: 'ruler', title: 'Convert units', sub: 'km, kg, °C, tyre pressure; works offline' },
  { key: 'money', icon: 'coins', title: 'Currencies', sub: 'What it costs in Franken; rates once a day' },
  { key: 'costs', icon: 'wallet', title: 'Trip costs', sub: 'Who paid what, who owes whom' },
  { key: 'zones', icon: 'clock', title: 'Time zones', sub: 'The time in other places' },
  { key: 'compass', icon: 'compass', title: 'Compass', sub: 'North and your direction, from the phone' },
  { key: 'phrases', icon: 'languages', title: 'Phrases abroad', sub: 'Important sentences, offline' },
  { key: 'ablage', icon: 'paperclip', title: 'Links and files', sub: 'Important links and small files' },
  { key: 'pdf', icon: 'file', title: 'PDF', sub: 'Merge, make smaller, share' },
  { key: 'photo', icon: 'image', title: 'Photos', sub: 'Make smaller, cut, cut out' },
  { key: 'chains', icon: 'workflow', title: 'Tool chains', sub: 'Several steps with one tap, e.g. photos → PDF' },
  { key: 'convert', icon: 'images', title: 'Picture format', sub: 'HEIC, WebP, PNG → JPG' },
  { key: 'video', icon: 'film', title: 'Make video smaller', sub: 'For messages and e-mail' },
  { key: 'qr', icon: 'qr', title: 'Make a QR code', sub: 'Text, link or WLAN as a code' },
  { key: 'map', icon: 'route', title: 'Measure a route', sub: 'Tap on the map, see the length, save as GPX' },
  { key: 'gears', icon: 'cog', title: 'Gear ratios', sub: 'Chainring and cassette: metres and speed' },
  { key: 'level', icon: 'level', title: 'Spirit level', sub: 'How crooked, in degrees and percent' },
  { key: 'barcode', icon: 'scan', title: 'Bar code → gear', sub: 'Scan a product, find or add it in your gear' },
  { key: 'light', icon: 'flashlight', title: 'Magnifier and light', sub: 'Read small print, light up' },
  // Paket L2 «Bilderkennung» (Noah 19.10.2026): a photo ticks the packing list or adds gear; the sitting position from a photo or video
  { key: 'packphoto', icon: 'scaneye', title: 'Packing list by photo', sub: 'Tick off or add gear from one photo' },
  { key: 'sitpos', icon: 'person', title: 'Sitting position', sub: 'Knee and back angles from a photo or video' },
  // Paket B «QR an der Kiste» (Noah 24.10.2026 «2a»): labels for boxes and shelves at home
  { key: 'labels', icon: 'package', title: 'Box labels', sub: 'A QR code on each box: what is inside' },
];

/** The tools in the order the person set (unknown keys dropped, new tools at the end). */
export function orderTools(order) {
  const keys = (Array.isArray(order) ? order : []).filter((k, i, a) => toolOf(k) && a.indexOf(k) === i);
  return [...keys.map(toolOf), ...TOOLS.filter((x) => !keys.includes(x.key))];
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Big idea 1 «Passt gerade» (Noah 19.10.2026 «1-3 freigabe»): up to 3 tools that fit now, from the trips
 * (on the way or starting within 14 days; ended within 7 days). → [{ key, why }] (why: English key).
 * Only in the Werkzeugkasten; Heute stays as approved (rule 13).
 */
export function suggestTools(trips, today) {
  const real = (trips ?? []).filter((x) => x?.startDate && !x.idea && !x.skipped);
  const endOf = (x) => addDays(x.startDate, Math.max(1, Number(x.days) || 1) - 1);
  const soon = real.filter((x) => endOf(x) >= today && x.startDate <= addDays(today, 14)).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const out = [];
  const add = (key, why) => out.length < 3 && !out.some((o) => o.key === key) && out.push({ key, why });
  if (soon) {
    const abroad = String(soon.country || 'CH').toUpperCase() !== 'CH';
    if (abroad) {
      add('money', 'For your trip abroad');
      add('phrases', 'For your trip abroad');
    }
    if (soon.domain === 'ski' || soon.domain === 'hiking') add('compass', 'For the mountains');
    if (!soon.domain || soon.domain === 'bikepacking') add('map', 'To plan your trip');
    add('costs', 'Share the costs of the trip');
  }
  const ended = real.filter((x) => endOf(x) < today && endOf(x) >= addDays(today, -7)).sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  if (ended) add('costs', 'Your trip is over: who owes whom?');
  return out;
}

export const toolOf = (key) => TOOLS.find((x) => x.key === key) ?? null;

/** The tool of a hash: «#/me/tools/calc?x» → 'calc'; the list → ''. */
export function toolKeyOf(hash) {
  const m = /^#\/me\/tools\/([a-z]+)/.exec(String(hash ?? ''));
  return m && toolOf(m[1]) ? m[1] : '';
}

/**
 * Saves or shares a file: the share sheet where the device has one for files, else a download.
 * Einzelidee 27: the file is also kept under «Last results» of the Werkzeugkasten (on this device only;
 * only from a tool page; keep: false for a file already kept somewhere, like «Links and files»).
 */
export async function deliver(blob, name, { share = true, keep = true } = {}) {
  const tool = keep && typeof location !== 'undefined' ? (/^#\/me\/tools\/([a-z]+)/.exec(location.hash)?.[1] ?? '') : '';
  if (tool) {
    Promise.all([import('../ichideen/results.js'), import('../db.js')])
      .then(([r, d]) => r.keepResult(d.db, blob, name, tool))
      .catch(() => {});
  }
  const file = new File([blob], name, { type: blob.type });
  if (share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
