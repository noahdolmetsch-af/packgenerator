// «Eine gemeinsame Rechnung» (Noah 22.11.2026 «1a 2a 3a 4a 5a», Thread «Alle Sportarten und Erholung»): the week is calculated one way
export default {
  title: 'One calculation for your week',
  lead: 'The card «Deine Woche», the week review and the comparisons now count the same: all your sports, each ride once.',
  points: [
    { text: 'Hours count what was measured plus the usual duration of ticked sessions, shown as «ca.»', go: { href: '#/flow/review', steps: [{ sel: '[data-five-ca]' }], where: 'Week review › Your week in five numbers, under the hours (when a session has no minutes).' } },
    { text: 'Rides that still wait in «Zum Prüfen» count in the km and are named; a ride that stood twice in the ledger counts once', go: { href: '#/flow/review', where: 'Week review, the line under the five numbers; on Today in the card «Deine Woche».' } },
    { text: 'Running, hiking and the like have their own small number, never counted as «Velo»; a workout of the watch without a tick is only told («Count them?»)', go: { href: '#/flow/review', where: 'Week review, the line under the five numbers.' } },
  ],
  small: [{ box: 'new', text: 'The week review, the card on Today and the observations show the same km and hours for the same week' }],
  test: [
    'Open the week review: under the hours it says how much of it is «ca.» (sessions without minutes).',
    'Under the five numbers a line names rides that wait in «Zum Prüfen» and the other sports (running, hiking).',
    'Open Today on a Sunday evening: the card «Deine Woche» shows the same km and hours as the review.',
  ],
  since: [],
  de: {
    'One calculation for your week': 'Eine Rechnung für deine Woche',
    'The card «Deine Woche», the week review and the comparisons now count the same: all your sports, each ride once.': 'Die Karte «Deine Woche», der Wochenrückblick und die Vergleiche zählen jetzt gleich: alle deine Sportarten, jede Fahrt einmal.',
    'Hours count what was measured plus the usual duration of ticked sessions, shown as «ca.»': 'Stunden zählen, was gemessen wurde, plus die übliche Dauer abgehakter Einheiten, sichtbar als «ca.»',
    'Week review › Your week in five numbers, under the hours (when a session has no minutes).': 'Wochenrückblick › Deine Woche in fünf Zahlen, unter den Stunden (wenn eine Einheit keine Minuten hat).',
    'Rides that still wait in «Zum Prüfen» count in the km and are named; a ride that stood twice in the ledger counts once': 'Fahrten, die noch in «Zum Prüfen» warten, zählen bei den km und werden genannt; eine Fahrt, die zweimal im Buch stand, zählt einmal',
    'Week review, the line under the five numbers; on Today in the card «Deine Woche».': 'Wochenrückblick, die Zeile unter den fünf Zahlen; auf Heute in der Karte «Deine Woche».',
    'Running, hiking and the like have their own small number, never counted as «Velo»; a workout of the watch without a tick is only told («Count them?»)': 'Laufen, Wandern und Ähnliches haben ihre eigene kleine Zahl, nie als «Velo» gezählt; ein Training der Uhr ohne Haken wird nur genannt («Zählen?»)',
    'Week review, the line under the five numbers.': 'Wochenrückblick, die Zeile unter den fünf Zahlen.',
    'The week review, the card on Today and the observations show the same km and hours for the same week': 'Wochenrückblick, Karte auf Heute und Beobachtungen zeigen für dieselbe Woche dieselben km und Stunden',
    'Open the week review: under the hours it says how much of it is «ca.» (sessions without minutes).': 'Öffne den Wochenrückblick: unter den Stunden steht, wie viel davon «ca.» ist (Einheiten ohne Minuten).',
    'Under the five numbers a line names rides that wait in «Zum Prüfen» and the other sports (running, hiking).': 'Unter den fünf Zahlen nennt eine Zeile Fahrten, die in «Zum Prüfen» warten, und die anderen Sportarten (Laufen, Wandern).',
    'Open Today on a Sunday evening: the card «Deine Woche» shows the same km and hours as the review.': 'Öffne Heute am Sonntagabend: die Karte «Deine Woche» zeigt dieselben km und Stunden wie der Rückblick.',
  },
};
