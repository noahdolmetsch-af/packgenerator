// «Dein Stand in Zahlen» (Noah 24.11.2026 «b», Thread «Mini-Landingpage pro Bereich bauen»): zuerst auf Velos und Material
export default {
  title: 'Your standing in numbers',
  lead: 'Velos und Material starts with three big numbers: this month\'s km, what is due in care, and the days since your last ride.',
  points: [
    { text: 'Open Bikes and Material: three big numbers stand on top, each one leads to where it comes from', go: { href: '#/bikes', steps: [{ sel: '[data-stand="velos"]' }] } },
    { text: 'Below them the kilometres of the last 12 months (a closed line on the phone)', go: { href: '#/bikes', steps: [{ sel: '[data-stand-chart]' }] } },
  ],
  small: [{ box: 'new', text: '«Hide» switches it off, with Undo; it comes back under Me › Look › Operation' }],
  test: ['Open Bikes and Material: three numbers on top, the bikes right below.', 'Tap «Hide»: the card is gone, «Undo» brings it back.'],
  since: [],
  de: {
    'Your standing in numbers': 'Dein Stand in Zahlen',
    'Velos und Material starts with three big numbers: this month\'s km, what is due in care, and the days since your last ride.': 'Velos und Material beginnt mit drei grossen Zahlen: die Kilometer dieses Monats, was in der Pflege fällig ist und die Tage seit deiner letzten Fahrt.',
    'Open Bikes and Material: three big numbers stand on top, each one leads to where it comes from': 'Öffne Velos und Material: Oben stehen drei grosse Zahlen, jede führt dorthin, woher sie kommt',
    'Below them the kilometres of the last 12 months (a closed line on the phone)': 'Darunter die Kilometer der letzten 12 Monate (am Handy eine geschlossene Zeile)',
    '«Hide» switches it off, with Undo; it comes back under Me › Look › Operation': '«Ausblenden» schaltet sie aus, mit Rückgängig; zurück unter Ich › Darstellung › Bedienung',
    'Open Bikes and Material: three numbers on top, the bikes right below.': 'Öffne Velos und Material: oben drei Zahlen, direkt darunter die Velos.',
    'Tap «Hide»: the card is gone, «Undo» brings it back.': 'Tippe «Ausblenden»: die Karte ist weg, «Rückgängig» bringt sie zurück.',
  },
};
