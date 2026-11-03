// «Velos-Übersicht» Schritt 4 (Noah 1.11.2026): the latest workshop visits over all bikes under the bike cards
export default {
  title: 'Workshop and history on Bikes',
  lead: 'Under «Next up», Bikes shows the latest workshop visits of all bikes with date, cost and receipt.',
  points: [{ text: 'A card «Workshop and history» lists the three latest visits with date, cost and receipt; a tap opens the visit', go: { href: '#/bikes', steps: [{ sel: '[data-visit-history]' }] } }],
  small: [],
  test: ['Open Bikes: the card «Workshop and history» shows the latest visits, or says there is none yet.', 'Tap a visit: the workshop page opens at that visit.'],
  since: [],
  de: {
    'Workshop and history on Bikes': 'Werkstatt und Verlauf bei Velos',
    'Under «Next up», Bikes shows the latest workshop visits of all bikes with date, cost and receipt.': 'Unter «Als Nächstes» zeigt Velos die letzten Werkstattbesuche aller Velos mit Datum, Kosten und Beleg.',
    'A card «Workshop and history» lists the three latest visits with date, cost and receipt; a tap opens the visit': 'Eine Karte «Werkstatt und Verlauf» listet die drei letzten Besuche mit Datum, Kosten und Beleg; ein Tipp öffnet den Besuch',
    'Open Bikes: the card «Workshop and history» shows the latest visits, or says there is none yet.': 'Öffne Velos: die Karte «Werkstatt und Verlauf» zeigt die letzten Besuche oder sagt, dass es noch keinen gibt.',
    'Tap a visit: the workshop page opens at that visit.': 'Tippe auf einen Besuch: die Werkstatt-Seite öffnet sich bei diesem Besuch.',
  },
};
