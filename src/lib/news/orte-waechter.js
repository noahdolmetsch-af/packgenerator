// «App-Landkarte» (Noah 22.11.2026 «1-3»): two checks, nothing changes in the app
export default {
  title: 'A check that every page has a home',
  lead: 'Two tests now stop a page without a place in the bar and a page that stands under two places.',
  points: [
    { text: 'Nothing changes in the app: every page already has its place, and a new page without one now fails the check before it goes online', go: null },
  ],
  small: [],
  test: [
    'Open any page, for example Stops nearby: in the bar a place is marked.',
    'Nothing else to check: this change only adds tests.',
  ],
  since: [],
  de: {
    'A check that every page has a home': 'Eine Prüfung: jede Seite hat einen Ort',
    'Two tests now stop a page without a place in the bar and a page that stands under two places.': 'Zwei Tests stoppen jetzt eine Seite ohne Ort in der Leiste und eine Seite, die unter zwei Orten steht.',
    'Nothing changes in the app: every page already has its place, and a new page without one now fails the check before it goes online': 'In der App ändert sich nichts: jede Seite hat schon ihren Ort, und eine neue Seite ohne Ort fällt jetzt in der Prüfung durch, bevor sie online geht',
    'Open any page, for example Stops nearby: in the bar a place is marked.': 'Öffne irgendeine Seite, zum Beispiel Stopps in der Nähe: in der Leiste ist ein Ort markiert.',
    'Nothing else to check: this change only adds tests.': 'Sonst gibt es nichts zu prüfen: diese Änderung fügt nur Tests hinzu.',
  },
};
