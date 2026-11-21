// «UI-Test Flow» Fund 3 (Noah «b»): the numbers on Aktiv say what they count
export default {
  title: 'The numbers on Active say what they count',
  lead: '«This week» now says «Wochenziele», and the ring «Move» says it counts only the sport goals.',
  points: [{ text: '«10 Wochenziele offen» in «This week» and «0 von 8 Sportzielen im Soll» in the ring', go: { href: '#/flow', steps: [{ sel: 'main [data-week-glance]' }], where: 'Aktiv › Heute › «Diese Woche» and «Ringe».' } }],
  small: [],
  test: ['Open Aktiv › Heute: «Diese Woche» says «… Wochenziele offen».', 'In «Ringe» the row «Bewegen» says «… Sportzielen im Soll».'],
  since: [],
  de: {
    'The numbers on Active say what they count': 'Die Zahlen auf Aktiv sagen, was sie zählen',
    '«This week» now says «Wochenziele», and the ring «Move» says it counts only the sport goals.': '«Diese Woche» sagt jetzt «Wochenziele», und der Ring «Bewegen» sagt, dass er nur die Bewegungsziele zählt.',
    '«10 Wochenziele offen» in «This week» and «0 von 8 Sportzielen im Soll» in the ring': '«10 Wochenziele offen» in «Diese Woche» und «0 von 8 Sportzielen im Soll» im Ring',
    'Aktiv › Heute › «Diese Woche» and «Ringe».': 'Aktiv › Heute › «Diese Woche» und «Ringe».',
    'Open Aktiv › Heute: «Diese Woche» says «… Wochenziele offen».': 'Öffne Aktiv › Heute: «Diese Woche» sagt «… Wochenziele offen».',
    'In «Ringe» the row «Bewegen» says «… Sportzielen im Soll».': 'In «Ringe» sagt die Zeile «Bewegen» «… Sportzielen im Soll».',
  },
};
