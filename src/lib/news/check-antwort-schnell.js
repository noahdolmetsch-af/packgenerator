// «Check-Antwort ohne Ruckeln» (Noah 05.11.2026 «a», Thread «Verzögerung bei Eingaben und Tabs»)
export default {
  title: 'Check answers without lag',
  lead: 'A tap in the morning check or the evening review no longer makes the page read everything again.',
  points: [{ text: 'Morning check: tap an answer, the page stays calm', go: { href: '#/check/morning', steps: [{ sel: '[data-q="sleep"] button' }] } }],
  small: [{ box: 'new', text: 'Your answers are saved as before' }],
  test: ['Open the morning check and tap answers one after another: each tap shows at once.', 'Reload the page: the answers are still there.'],
  since: [],
  de: {
    'Check answers without lag': 'Check-Antworten ohne Ruckeln',
    'A tap in the morning check or the evening review no longer makes the page read everything again.': 'Ein Tipp im Morgen-Check oder Abendrückblick lässt die Seite nicht mehr alles neu einlesen.',
    'Morning check: tap an answer, the page stays calm': 'Morgen-Check: Eine Antwort antippen, die Seite bleibt ruhig',
    'Your answers are saved as before': 'Deine Antworten werden wie bisher gespeichert',
    'Open the morning check and tap answers one after another: each tap shows at once.': 'Öffne den Morgen-Check und tippe nacheinander Antworten an: Jeder Tipp zeigt sich sofort.',
    'Reload the page: the answers are still there.': 'Lade die Seite neu: Die Antworten sind noch da.',
  },
};
