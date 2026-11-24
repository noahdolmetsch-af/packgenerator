// «Eine Seite pro Gipfel» (Noah 24.11.2026 «alle 1-5 zusammen», Gipfelbuch ausbauen, Idee 3)
export default {
  title: 'A page for every summit',
  lead: 'Each place of the summit book now has its own page with all visits.',
  points: [
    { text: 'Summit book › tap a place › «Open the page of this place»: every visit with its day, temperature and the time up; the fastest time is on top', go: { href: '#/flow/gipfelbuch', where: 'Shows after you have a place in the summit book: tap it, then «Open the page of this place».', steps: [{ sel: '[data-gb-place]' }, { sel: '[data-gb-own]' }] } },
    { text: 'Add your own photos and a note to every visit; the photos of the Strava ride show too', go: { href: '#/flow/gipfelbuch', where: 'Shows after you have a place in the summit book: tap it, then «Open the page of this place».', steps: [{ sel: '[data-gb-place]' }, { sel: '[data-gb-own]' }] } },
  ],
  small: [{ box: 'new', text: 'The collection wall opens a place on its own page', go: { href: '#/debrief/sammlung', where: 'Shows after you have a place in the summit book: tap it under «Added lately».' } }],
  test: [
    'Open the summit book and tap a place.',
    'Tap «Open the page of this place»: the visits stand there, newest first.',
    'Tap «Note» on a visit, type a few words and save; they stay after you leave the page.',
    'Tap «Photo» and pick a picture; the small cross takes it away again.',
  ],
  since: [],
  de: {
    'A page for every summit': 'Eine Seite für jeden Gipfel',
    'Each place of the summit book now has its own page with all visits.': 'Jeder Ort im Gipfelbuch hat jetzt eine eigene Seite mit allen Besuchen.',
    'Summit book › tap a place › «Open the page of this place»: every visit with its day, temperature and the time up; the fastest time is on top': 'Gipfelbuch › Ort antippen › «Seite dieses Ortes öffnen»: jeder Besuch mit Tag, Temperatur und Zeit hoch; die schnellste Zeit steht oben',
    'Add your own photos and a note to every visit; the photos of the Strava ride show too': 'Füge jedem Besuch eigene Fotos und eine Notiz bei; die Fotos der Strava-Fahrt erscheinen auch',
    'The collection wall opens a place on its own page': 'Die Sammel-Wand öffnet einen Ort auf seiner eigenen Seite',
    'Shows after you have a place in the summit book: tap it under «Added lately».': 'Erscheint, sobald du einen Ort im Gipfelbuch hast: tippe ihn unter «Zuletzt dazugekommen» an.',
    'Shows after you have a place in the summit book: tap it, then «Open the page of this place».': 'Erscheint, sobald du einen Ort im Gipfelbuch hast: tippe ihn an, dann «Seite dieses Ortes öffnen».',
    'Open the summit book and tap a place.': 'Öffne das Gipfelbuch und tippe einen Ort an.',
    'Tap «Open the page of this place»: the visits stand there, newest first.': 'Tippe auf «Seite dieses Ortes öffnen»: die Besuche stehen dort, die neuesten zuerst.',
    'Tap «Note» on a visit, type a few words and save; they stay after you leave the page.': 'Tippe bei einem Besuch auf «Notiz», schreibe ein paar Worte und speichere; sie bleiben, auch wenn du die Seite verlässt.',
    'Tap «Photo» and pick a picture; the small cross takes it away again.': 'Tippe auf «Foto» und wähle ein Bild; das kleine Kreuz nimmt es wieder weg.',
  },
};
