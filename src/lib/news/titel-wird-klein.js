// «Bewegung beim Seitenwechsel» 5 «Grosser Titel wird klein» (Noah 03.11.2026 «b», Paket A): the page's name stays on as one small line at the top while you scroll
export default {
  title: 'The title stays on top',
  lead: 'Scroll down a page and its name stays at the top as one small line.',
  points: [{ text: 'Open Tours and scroll down: the name «Tours» stays at the top as a small line, and goes when you scroll back up', href: '#/trips', go: { href: '#/trips', where: 'Shows on every page with a big title when you scroll down.' } }],
  small: [{ box: 'new', text: 'A page that keeps its own bar at the top (like the search row of the material list) keeps it: there the small line stays away', go: { href: '#/gear', where: 'Shows in Material, where the search row stays on top.' } }],
  test: ['Open Tours and scroll down a little: the name «Tours» stays at the top as a small line.', 'Scroll back to the top: the line goes and the big title is back.'],
  since: [],
  de: {
    'The title stays on top': 'Der Titel bleibt oben',
    'Scroll down a page and its name stays at the top as one small line.': 'Scrollst du eine Seite nach unten, bleibt ihr Name oben als kleine Zeile stehen.',
    'Open Tours and scroll down: the name «Tours» stays at the top as a small line, and goes when you scroll back up': 'Öffne Touren und scrolle nach unten: der Name «Touren» bleibt oben als kleine Zeile stehen und geht, wenn du wieder nach oben scrollst',
    'Shows on every page with a big title when you scroll down.': 'Zeigt sich auf jeder Seite mit grossem Titel, wenn du nach unten scrollst.',
    'A page that keeps its own bar at the top (like the search row of the material list) keeps it: there the small line stays away': 'Eine Seite, die eine eigene Leiste oben behält (wie die Suchzeile der Materialliste), behält sie: dort bleibt die kleine Zeile weg',
    'Shows in Material, where the search row stays on top.': 'Zeigt sich in Material, wo die Suchzeile oben stehen bleibt.',
    'Open Tours and scroll down a little: the name «Tours» stays at the top as a small line.': 'Öffne Touren und scrolle ein Stück nach unten: der Name «Touren» bleibt oben als kleine Zeile stehen.',
    'Scroll back to the top: the line goes and the big title is back.': 'Scrolle wieder ganz nach oben: die Zeile geht und der grosse Titel ist wieder da.',
  },
};
