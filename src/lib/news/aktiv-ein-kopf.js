// «Ein Kopf für Aktiv» (Noah 17.11.2026 «a», UI-Test der Seite Flow, Funde 1 und 5): Woche, Erholung, Sporttasche und Ideen beginnen wie die anderen Aktiv-Seiten
export default {
  title: 'One head for all Active pages',
  lead: 'Week, Recovery, Sport bag and Ideas now start like the other pages of Active: path, title, then the page. The row of five cards above the title is gone.',
  points: [
    { text: 'A tap on a day of «This week» opens the week at that day, and the day is marked', go: { href: '#/flow', steps: [{ sel: '[data-week-glance] [data-week-day]' }] } },
    { text: 'Sport bag and Ideas are tiles in «All here» on Active', go: { href: '#/flow', steps: [{ sel: '[data-all-here-tile="sportbag"]' }] } },
  ],
  small: [{ box: 'nicer', text: 'On a phone the title of Week and Recovery comes much higher up' }],
  test: ['Open Active and tap a day (for example Thursday) in «This week»: the week opens and that day is marked.', 'On Active, in «All here», tap «Sport bag»: the page starts with its title, no row of cards above it.'],
  since: [],
  de: {
    'One head for all Active pages': 'Ein Kopf für alle Aktiv-Seiten',
    'Week, Recovery, Sport bag and Ideas now start like the other pages of Active: path, title, then the page. The row of five cards above the title is gone.': 'Woche, Erholung, Sporttasche und Ideen beginnen jetzt wie die anderen Aktiv-Seiten: Pfad, Titel, dann die Seite. Die Reihe mit fünf Karten über dem Titel fällt weg.',
    'A tap on a day of «This week» opens the week at that day, and the day is marked': 'Ein Tipp auf einen Tag in «Diese Woche» öffnet die Woche an diesem Tag, und der Tag ist markiert',
    'Sport bag and Ideas are tiles in «All here» on Active': 'Sporttasche und Ideen sind Kacheln in «Alles hier» auf Aktiv',
    'On a phone the title of Week and Recovery comes much higher up': 'Am Handy steht der Titel von Woche und Erholung viel weiter oben',
    'Open Active and tap a day (for example Thursday) in «This week»: the week opens and that day is marked.': 'Öffne Aktiv und tippe in «Diese Woche» auf einen Tag (zum Beispiel Donnerstag): Die Woche öffnet sich, und der Tag ist markiert.',
    'On Active, in «All here», tap «Sport bag»: the page starts with its title, no row of cards above it.': 'Tippe in Aktiv bei «Alles hier» auf «Sporttasche»: Die Seite beginnt mit ihrem Titel, keine Kartenreihe darüber.',
  },
};
