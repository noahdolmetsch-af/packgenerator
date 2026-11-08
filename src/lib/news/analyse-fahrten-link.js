// «Fahrten ›» (Noah 08.11.2026 «1-3 ok», Vorschlag 2): from a trip in the list of a value to its saved rides
export default {
  title: 'Rides from the trip list',
  lead: 'A trip in the list of a value with saved rides has a second tip «Rides ›».',
  points: [{ text: 'In Analyse, on the page of a value, a finished trip with saved rides shows «Rides ›» next to it and opens your rides', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-trip-list]' }], where: 'Analyse › a value (e.g. Cardio load) › the card «Trips in this range», on a trip with saved rides.' } }],
  small: [],
  test: ['Open Analyse › Cardio load (3 months) and look at the card «Trips in this range».', 'A finished trip with saved rides has «Rides ›» on its right; the tap opens your rides. The trip itself still opens its page.'],
  since: [],
  de: {
    'Rides from the trip list': 'Fahrten aus der Tour-Liste',
    'A trip in the list of a value with saved rides has a second tip «Rides ›».': 'Eine Tour in der Liste eines Werts, zu der du Fahrten gespeichert hast, hat einen zweiten Tipp «Fahrten ›».',
    'In Analyse, on the page of a value, a finished trip with saved rides shows «Rides ›» next to it and opens your rides': 'In der Analyse zeigt eine abgeschlossene Tour mit gespeicherten Fahrten auf der Seite eines Werts daneben «Fahrten ›» und öffnet deine Fahrten',
    'Analyse › a value (e.g. Cardio load) › the card «Trips in this range», on a trip with saved rides.': 'Analyse › ein Wert (z. B. Cardio-Belastung) › Karte «Touren in diesem Zeitraum», bei einer Tour mit gespeicherten Fahrten.',
    'Open Analyse › Cardio load (3 months) and look at the card «Trips in this range».': 'Öffne Analyse › Cardio-Belastung (3 Monate) und schau die Karte «Touren in diesem Zeitraum» an.',
    'A finished trip with saved rides has «Rides ›» on its right; the tap opens your rides. The trip itself still opens its page.': 'Eine abgeschlossene Tour mit gespeicherten Fahrten hat rechts «Fahrten ›»; der Tipp öffnet deine Fahrten. Die Tour selbst öffnet weiter ihre Seite.',
  },
};
