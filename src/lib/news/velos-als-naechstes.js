// «Velos-Übersicht» Schritt 3 (Noah 1.11.2026): «Next up» over all bikes under the bike cards
export default {
  title: 'Next up on Bikes',
  lead: 'Under the bike cards, Bikes now lists the next open work over all bikes, the most urgent first.',
  points: [{ text: 'A card «Next up» under the bike cards lists the open work of all bikes; a tap opens that bike’s care', go: { href: '#/bikes', steps: [{ sel: '[data-next-up]' }] } }],
  small: [],
  test: ['Open Bikes: under the bike cards the card «Next up» names the open work, or says nothing is due.', 'Tap a line: you land in the care page of that bike.'],
  since: [],
  de: {
    'Next up on Bikes': 'Als Nächstes bei Velos',
    'Under the bike cards, Bikes now lists the next open work over all bikes, the most urgent first.': 'Unter den Velo-Karten listet Velos jetzt die nächste offene Arbeit über alle Velos, das Dringendste zuerst.',
    'A card «Next up» under the bike cards lists the open work of all bikes; a tap opens that bike’s care': 'Eine Karte «Als Nächstes» unter den Velo-Karten listet die offene Arbeit aller Velos; ein Tipp öffnet die Pflege dieses Velos',
    'Open Bikes: under the bike cards the card «Next up» names the open work, or says nothing is due.': 'Öffne Velos: unter den Velo-Karten nennt die Karte «Als Nächstes» die offene Arbeit oder sagt, dass nichts fällig ist.',
    'Tap a line: you land in the care page of that bike.': 'Tippe auf eine Zeile: du landest auf der Pflege-Seite dieses Velos.',
  },
};
