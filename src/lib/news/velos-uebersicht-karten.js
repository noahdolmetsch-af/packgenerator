// «Velos-Übersicht» Schritt 1 (Noah 1.11.2026): one card per bike with km, status and the next work
export default {
  title: 'Bikes at a glance',
  lead: 'On Bikes, every bike now has its own card with kilometres, an honest status and the next work.',
  points: [{ text: 'Each bike has a card on top of Bikes: kilometres, «nothing due» or «n due», and the next work', go: { href: '#/bikes', steps: [{ sel: '[data-bike-cards]' }] } }],
  small: [],
  test: ['Open Bikes: on top a card per bike shows its kilometres and its status.', 'Tap «Open care» on a card: you land in the care page of that bike.'],
  since: [],
  de: {
    'Bikes at a glance': 'Velos auf einen Blick',
    'On Bikes, every bike now has its own card with kilometres, an honest status and the next work.': 'Bei Velos hat jedes Velo jetzt eine eigene Karte mit Kilometern, einem ehrlichen Status und der nächsten Arbeit.',
    'Each bike has a card on top of Bikes: kilometres, «nothing due» or «n due», and the next work': 'Jedes Velo hat oben bei Velos eine Karte: Kilometer, «nichts fällig» oder «n fällig» und die nächste Arbeit',
    'Open Bikes: on top a card per bike shows its kilometres and its status.': 'Öffne Velos: oben zeigt eine Karte pro Velo die Kilometer und den Status.',
    'Tap «Open care» on a card: you land in the care page of that bike.': 'Tippe auf einer Karte «Pflege öffnen»: du landest auf der Pflege-Seite dieses Velos.',
  },
};
