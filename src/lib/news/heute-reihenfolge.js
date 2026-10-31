// Heute: «Discover» moves under the trip card and the weekly weight, so the day's questions stay in the first screens
export default {
  title: 'Today: Discover sits lower',
  lead: 'The «Discover» card now comes after your trip and the weekly weight question.',
  points: [{ text: 'On Today the «Discover» card sits under the trip card and «Weight this week?», so what matters today comes first', href: '#/', go: { href: '#/', steps: [{ sel: '[data-section="discover"]' }], where: 'Shows on Today.' } }],
  small: [],
  test: ['Open Today: the moment card comes first, then your trip and the weight question.', '«Discover» follows right under them.'],
  since: [],
  de: {
    'Today: Discover sits lower': 'Heute: Entdecken rutscht tiefer',
    'The «Discover» card now comes after your trip and the weekly weight question.': 'Die Karte «Entdecken» kommt jetzt nach deiner Tour und der Gewichtsfrage der Woche.',
    'On Today the «Discover» card sits under the trip card and «Weight this week?», so what matters today comes first': 'Auf Heute steht «Entdecken» unter der Tour-Karte und «Gewicht diese Woche?», so kommt zuerst, was heute zählt',
    'Shows on Today.': 'Zeigt sich auf Heute.',
    'Open Today: the moment card comes first, then your trip and the weight question.': 'Öffne Heute: Zuerst die Moment-Karte, dann deine Tour und die Gewichtsfrage.',
    '«Discover» follows right under them.': '«Entdecken» folgt direkt darunter.',
  },
};
