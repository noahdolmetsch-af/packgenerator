/**
 * Paket U2/U3 «Symbole auf der Karte» (Noah 19.10.2026): every kind of stop as a small symbol in a light
 * circle (cart, cutlery, drop, bed, train, wrench, roof …) instead of a coloured dot, on the race map and
 * the live map. The drawings are Lucide icons (ISC licence, https://lucide.dev), copied here as SVG so a
 * canvas can draw them for maplibre (addImage).
 * Kinds: those of race/outside.js, of the POI search (map/poisearch.js) and the app's own points.
 * Pure (no browser); MapView turns symbolSvg into images. Tested in tests/map-symbols.test.js.
 */
/** kind → Lucide icon name */
export const KIND_ICON = {
  water: 'droplet',
  shop: 'shopping-cart',
  food: 'utensils',
  fuel: 'fuel',
  bike: 'wrench',
  repair: 'wrench',
  sleep: 'bed',
  bed: 'bed-double',
  camp: 'tent',
  shelter: 'house',
  toilet: 'toilet',
  pharmacy: 'pill',
  hospital: 'hospital',
  atm: 'banknote',
  station: 'train-front',
  laundry: 'washing-machine',
  view: 'binoculars',
  // MORE kinds of the place search (map/poisearch.js)
  supermarket: 'shopping-basket',
  bakery: 'croissant',
  icecream: 'ice-cream-cone',
  bench: 'armchair',
  picnic: 'tree-pine',
  charge: 'plug-zap',
  bikepark: 'circle-parking',
  rental: 'bike',
  roofbus: 'bus',
  hut: 'house',
  bivouac: 'mountain',
  waitroom: 'train-front',
  night24: 'moon',
  bus: 'bus',
  transit: 'tram-front',
  info: 'info',
  swim: 'waves-horizontal',
  church: 'church',
  pass: 'mountain',
  doctor: 'stethoscope',
  police: 'shield',
  post: 'mail',
  depot: 'package',
  startfinish: 'flag',
  own: 'map-pin',
  // Paket Wetter: your webcams with a place (src/lib/wetter/webcams.js)
  webcam: 'webcam',
  other: 'circle-dot',
};
/** Lucide icon name → its SVG elements (24 × 24, drawn with a stroke) */
export const ICON_SVG = {
  'droplet': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  'shopping-cart': '<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',
  'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  'fuel': '<path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5"/><path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16"/><path d="M2 21h13"/><path d="M3 9h11"/>',
  'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',
  'bed': '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  'bed-double': '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  'tent': '<path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/>',
  'house': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'toilet': '<path d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18"/><path d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/>',
  'pill': '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  'hospital': '<path d="M12 7v4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M14 9h-4"/><path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/>',
  'banknote': '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  'train-front': '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
  'washing-machine': '<path d="M3 6h3"/><path d="M17 6h.01"/><rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5"/>',
  'binoculars': '<path d="M10 10h4"/><path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/><path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"/><path d="M 22 16 L 2 16"/><path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"/><path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3"/>',
  'package': '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/>',
  'flag': '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  'circle-dot': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="12" r="10"/>',
  'webcam': '<circle cx="12" cy="10" r="8"/><circle cx="12" cy="10" r="3"/><path d="M7 22h10"/><path d="M12 22v-4"/>',
  'shopping-basket': '<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/>',
  'croissant': '<path d="M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97 11 11 0 0 1 .132-6.487"/><path d="M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352 11 11 0 0 0-6.486.132"/><path d="M18 5a4 3 0 0 1 4 3 2 2 0 0 1-2 2 10 10 0 0 0-5.139 1.42"/><path d="M5 18a3 4 0 0 0 3 4 2 2 0 0 0 2-2 10 10 0 0 1 1.42-5.14"/><path d="M8.709 2.554a10 10 0 0 0-6.155 6.155 1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676"/>',
  'ice-cream-cone': '<path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"/><path d="M17 7A5 5 0 0 0 7 7"/><path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4"/>',
  'armchair': '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/>',
  'tree-pine': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
  'plug-zap': '<path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="m2 22 3-3"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m18 3-4 4h6l-4 4"/>',
  'circle-parking': '<circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  'bike': '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  'bus': '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  'tram-front': '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'waves-horizontal': '<path d="M2 12q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 19q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 5q2.5 2 5 0t5 0 5 0 5 0"/>',
  'church': '<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9"/><path d="M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14"/>',
  'mountain': '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  'stethoscope': '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'mail': '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
};
/** The kinds of the POI search (map/poisearch.js) that must all have a symbol. */
export const SEARCH_KINDS = ['water', 'shop', 'food', 'fuel', 'bike', 'repair', 'sleep', 'camp', 'shelter', 'toilet', 'pharmacy', 'hospital', 'atm', 'station', 'laundry', 'view', 'supermarket', 'bakery', 'icecream', 'bench', 'picnic', 'charge', 'bikepark', 'rental', 'roofbus', 'hut', 'bivouac', 'waitroom', 'night24', 'bus', 'transit', 'info', 'swim', 'church', 'pass', 'doctor', 'police', 'post'];
/** The image id of a kind on the map (an unknown kind gets the «other» symbol). */
export const symbolId = (kind) => `sym-${KIND_ICON[kind] ? kind : 'other'}`;
/** Every kind with a symbol. */
export const SYMBOL_KINDS = Object.keys(KIND_ICON);
/**
 * The SVG image of a kind: a light circle (paper) with a thin ring and the icon in the kind colour.
 * colour / paper: plain colours (maplibre cannot read CSS tokens); size: px.
 */
export function symbolSvg(kind, colour, paper, size = 64) {
  const icon = ICON_SVG[KIND_ICON[kind] ?? KIND_ICON.other] ?? '';
  const r = size / 2;
  const s = (size * 0.54) / 24;
  const o = (size - 24 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${r}" cy="${r}" r="${r - size / 16}" fill="${paper}" stroke="${colour}" stroke-width="${size / 20}"/><g transform="translate(${o} ${o}) scale(${s})" fill="none" stroke="${colour}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icon}</g></svg>`;
}
