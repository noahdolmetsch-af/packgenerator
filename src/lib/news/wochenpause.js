// «Pausenwochen» (Noah 22.11.2026, Thread «Alle Sportarten und Erholung», Schritt I)
export default {
  title: 'Mark a week as a break',
  lead: 'A holiday, an illness or a quiet week no longer pulls your usual week down: mark it as a break.',
  points: [{ text: 'In the week review, «Mark as a break» keeps that week out of «Your usual week»; «Undo» takes it back', go: { href: '#/flow/review', steps: [{ sel: '[data-rhythm-pause]' }], where: 'Week review, in the card «Rhythm and comparison».' } }],
  small: [],
  test: [
    'Open the week review and tap «Mark as a break» in the card «Rhythm and comparison»: the line says the week does not count in your usual week.',
    'Tap «Undo» in the message: the mark is gone and the week counts again.',
  ],
  since: [],
  de: {
    'Mark a week as a break': 'Eine Woche als Pause markieren',
    'A holiday, an illness or a quiet week no longer pulls your usual week down: mark it as a break.': 'Ferien, Krankheit oder eine ruhige Woche ziehen deine übliche Woche nicht mehr nach unten: markiere sie als Pause.',
    'In the week review, «Mark as a break» keeps that week out of «Your usual week»; «Undo» takes it back': 'Im Wochenrückblick hält «Als Pause markieren» diese Woche aus «Deine übliche Woche» heraus; «Rückgängig» nimmt es zurück',
    'Week review, in the card «Rhythm and comparison».': 'Wochenrückblick, in der Karte «Rhythmus und Vergleich».',
    'Open the week review and tap «Mark as a break» in the card «Rhythm and comparison»: the line says the week does not count in your usual week.': 'Öffne den Wochenrückblick und tippe in der Karte «Rhythmus und Vergleich» auf «Als Pause markieren»: die Zeile sagt, dass die Woche nicht in deine übliche Woche zählt.',
    'Tap «Undo» in the message: the mark is gone and the week counts again.': 'Tippe in der Meldung auf «Rückgängig»: die Markierung ist weg und die Woche zählt wieder.',
  },
};
