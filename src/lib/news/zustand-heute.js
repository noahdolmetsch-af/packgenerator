// «Ist alles in Ordnung?» auf Heute (Noah 02.11.2026 «1a danach 3 und 4»): a quiet line only when something is not right
export default {
  title: 'Today says when something is not right',
  lead: 'Little space, data the browser may delete, a failed sync: one quiet line on Today with its button. Nothing shows when all is well.',
  points: [{ text: 'Today shows a line when space runs low, the browser does not keep your data yet, or the sync failed', go: null }],
  small: [],
  test: [
    'Open Today: when all is well there is no extra line.',
    'Me › Data and backup › «Everything in order?» still lists every light.',
  ],
  since: [],
  de: {
    'Today says when something is not right': 'Heute sagt, wenn etwas nicht stimmt',
    'Little space, data the browser may delete, a failed sync: one quiet line on Today with its button. Nothing shows when all is well.': 'Wenig Platz, Daten, die der Browser löschen darf, ein Abgleich, der nicht klappte: eine ruhige Zeile auf Heute mit ihrem Knopf. Ist alles gut, steht nichts da.',
    'Today shows a line when space runs low, the browser does not keep your data yet, or the sync failed': 'Heute zeigt eine Zeile, wenn der Platz knapp wird, der Browser deine Daten noch nicht behält oder der Abgleich nicht klappte',
    'Open Today: when all is well there is no extra line.': 'Öffne Heute: Wenn alles gut ist, steht keine zusätzliche Zeile da.',
    'Me › Data and backup › «Everything in order?» still lists every light.': 'Ich › Daten und Backup › «Alles in Ordnung?» zeigt weiter jedes Licht.',
  },
};
