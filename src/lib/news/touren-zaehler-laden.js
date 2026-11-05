// «Touren: Zähler beim Laden» (Durchklick Etappe 2, Befund E2-003, Noah 05.11.2026)
export default {
  title: 'Trips: the counts no longer start at zero',
  lead: 'The line «planned · ridden» on Trips shows only when the numbers are real, not «0 ridden» for a moment.',
  points: [{ text: 'Trips: the count line waits for the data instead of reading «0 ridden» first', go: { href: '#/trips', steps: [{ sel: '[data-counts]' }] } }],
  small: [],
  test: ['Open Trips (with many trips it is easier to see): the line under the title shows at once with the real numbers.', 'On a phone the row «With packing list» also shows no «0 trips» before the numbers are there.'],
  since: [],
  de: {
    'Trips: the counts no longer start at zero': 'Touren: Die Zähler fangen nicht mehr bei null an',
    'The line «planned · ridden» on Trips shows only when the numbers are real, not «0 ridden» for a moment.': 'Die Zeile «geplant · gefahren» bei Touren erscheint erst mit den echten Zahlen, nicht mehr kurz mit «0 gefahren».',
    'Trips: the count line waits for the data instead of reading «0 ridden» first': 'Touren: Die Zeile mit den Zahlen wartet auf die Daten, statt zuerst «0 gefahren» zu zeigen',
    'Open Trips (with many trips it is easier to see): the line under the title shows at once with the real numbers.': 'Öffne Touren (bei vielen Touren sieht man es besser): Die Zeile unter dem Titel erscheint gleich mit den echten Zahlen.',
    'On a phone the row «With packing list» also shows no «0 trips» before the numbers are there.': 'Auf dem Handy zeigt auch die Zeile «Mit Packliste» kein «0 Touren», bevor die Zahlen da sind.',
  },
};
