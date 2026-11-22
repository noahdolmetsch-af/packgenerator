// «Wochenbalken» (Noah 07.11.2026 «alle A–F», Idee B): values that add up show one bar per week from 3 months on
export default {
  title: 'Weekly bars from 3 months',
  lead: 'Values that add up, like your cardio load, show one bar per week from 3 months on.',
  points: [{ text: 'Tap a weekly bar to see the week and its seven days', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '#wv-course' }], where: 'Analyse › Cardio load › «3 M», under «Course»: tap a bar.' } }],
  small: [{ box: 'new', text: 'The month stays one bar per day' }],
  test: ['Open Analyse › Cardio load, range «3 M»: the course shows about 13 bars, one per week, marked «per week».', 'Tap a bar: the label names the week, and the card shows its seven days to tap.'],
  since: [],
  de: {
    'Weekly bars from 3 months': 'Wochenbalken ab 3 Monaten',
    'Values that add up, like your cardio load, show one bar per week from 3 months on.': 'Werte, die sich aufaddieren, wie deine Cardio-Belastung, zeigen ab 3 Monaten einen Balken pro Woche.',
    'Tap a weekly bar to see the week and its seven days': 'Tippe einen Wochenbalken, um die Woche und ihre sieben Tage zu sehen',
    'Analyse › Cardio load › «3 M», under «Course»: tap a bar.': 'Analyse › Cardio-Belastung › «3 M», unter «Verlauf»: einen Balken antippen.',
    'The month stays one bar per day': 'Der Monat bleibt ein Balken pro Tag',
    'Open Analyse › Cardio load, range «3 M»: the course shows about 13 bars, one per week, marked «per week».': 'Öffne Analyse › Cardio-Belastung, Zeitraum «3 M»: der Verlauf zeigt etwa 13 Balken, einen pro Woche, beschriftet «pro Woche».',
    'Tap a bar: the label names the week, and the card shows its seven days to tap.': 'Tippe einen Balken: die Beschriftung nennt die Woche, und die Karte zeigt ihre sieben Tage zum Antippen.',
  },
};
