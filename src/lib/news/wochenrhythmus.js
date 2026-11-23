// «Rhythmus und Vergleiche» (Noah 22.11.2026 «1a 2a 3a 4a 5a» und «a», Thread «Alle Sportarten und Erholung», Schritt C, G, H)
export default {
  title: 'Your week next to your usual week',
  lead: 'The week review and the card on Today show on which days you moved and how the week compares with your usual one.',
  points: [
    { text: 'Seven dots show the days with a session or a ride, next to the week and your usual week (the mean of the four weeks before) and the same week a year ago', go: { href: '#/flow/review', steps: [{ sel: '[data-wr="rhythm"]' }], where: 'Week review, under the five numbers.' } },
    { text: '«Where from?» opens a window with the sessions and rides behind the numbers, each with its source', go: { href: '#/flow/review', steps: [{ sel: '[data-wr-where-open]' }], where: 'Week review, under the five numbers.' } },
    { text: 'Your answers of «Wi gaht\'s?» per area (from three answers) and each question on its own', go: { href: '#/flow/review', steps: [{ sel: '[data-wr="answers"]' }], where: 'Week review, further down (when you answered scale questions that week).' } },
  ],
  small: [{ box: 'new', text: 'The card on Today shows the days as dots and your usual week; observation only, nothing is rated' }, { box: 'new', text: 'Where the watch knows a workout of the same sport on that day, «Add the duration» offers its length as a tip', go: { href: '#/flow/sports', where: 'Active › My activities › Add the duration, when a tick without minutes has a watch workout that day.' } }],
  test: [
    'Open the week review: under the five numbers a card shows seven dots and one sentence, next to your usual week.',
    'Tap «Where from?» under the five numbers: a window lists the sessions and rides of the week.',
    'Open Today on a Sunday evening: the card «Deine Woche» shows the days as dots and a line with your usual week.',
  ],
  since: [],
  de: {
    'Your week next to your usual week': 'Deine Woche neben deiner üblichen Woche',
    'The week review and the card on Today show on which days you moved and how the week compares with your usual one.': 'Der Wochenrückblick und die Karte auf Heute zeigen, an welchen Tagen du in Bewegung warst und wie die Woche zu deiner üblichen passt.',
    'Seven dots show the days with a session or a ride, next to the week and your usual week (the mean of the four weeks before) and the same week a year ago': 'Sieben Punkte zeigen die Tage mit einer Einheit oder Fahrt, daneben die Woche, deine übliche Woche (das Mittel der vier Wochen davor) und dieselbe Woche vor einem Jahr',
    'Week review, under the five numbers.': 'Wochenrückblick, unter den fünf Zahlen.',
    '«Where from?» opens a window with the sessions and rides behind the numbers, each with its source': '«Woher?» öffnet ein Fenster mit den Einheiten und Fahrten hinter den Zahlen, jede mit ihrer Quelle',
    'Your answers of «Wi gaht\'s?» per area (from three answers) and each question on its own': 'Deine Antworten aus «Wi gaht\'s?» pro Bereich (ab drei Antworten) und jede Frage einzeln',
    'Week review, further down (when you answered scale questions that week).': 'Wochenrückblick, weiter unten (wenn du in der Woche Skalenfragen beantwortet hast).',
    'Where the watch knows a workout of the same sport on that day, «Add the duration» offers its length as a tip': 'Wo die Uhr an dem Tag ein Training derselben Sportart kennt, bietet «Dauer nachtragen» dessen Länge als Tipp an',
    'Active › My activities › Add the duration, when a tick without minutes has a watch workout that day.': 'Aktiv › Meine Aktivitäten › Dauer nachtragen, wenn ein Haken ohne Minuten an dem Tag ein Uhr-Training hat.',
    'The card on Today shows the days as dots and your usual week; observation only, nothing is rated': 'Die Karte auf Heute zeigt die Tage als Punkte und deine übliche Woche; nur Beobachtung, nichts wird bewertet',
    'Open the week review: under the five numbers a card shows seven dots and one sentence, next to your usual week.': 'Öffne den Wochenrückblick: unter den fünf Zahlen zeigt eine Karte sieben Punkte und einen Satz, daneben deine übliche Woche.',
    'Tap «Where from?» under the five numbers: a window lists the sessions and rides of the week.': 'Tippe unter den fünf Zahlen auf «Woher?»: ein Fenster listet die Einheiten und Fahrten der Woche.',
    'Open Today on a Sunday evening: the card «Deine Woche» shows the days as dots and a line with your usual week.': 'Öffne Heute am Sonntagabend: die Karte «Deine Woche» zeigt die Tage als Punkte und eine Zeile mit deiner üblichen Woche.',
  },
};
