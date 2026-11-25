// «Mein Tag» (Noah 25.11.2026 «1-3», Idee 2): the evening review in one minute
export default {
  title: 'The evening review in one minute',
  lead: 'In the evening «My day» counts what is still open and lets you move it to tomorrow, tick it off or drop it, point by point or all at once.',
  points: [
    { text: 'From 18:00 on today, and on every earlier day, a closed line says how many points are still open', go: 'f.meintag' },
    { text: 'Opened, every own point has «Done», «To tomorrow» (on an earlier day «To today») and «Drop», each with Undo; «All to tomorrow» moves them together', go: 'f.meintag' },
    { text: 'A session of your plan that is not ticked leads to «Tick off»', go: 'f.meintag' },
  ],
  test: ['Open «My day» after 18:00 with an own to-do for today: a closed line «1 point is still open».', 'Open it, tap «To tomorrow»: the point is gone from today; tap «Undo»: it is back.', 'Open yesterday: the open points are there with «To today».'],
  de: {
    'The evening review in one minute': 'Der Abend-Rückblick in einer Minute',
    'In the evening «My day» counts what is still open and lets you move it to tomorrow, tick it off or drop it, point by point or all at once.': 'Abends zählt «Mein Tag», was noch offen ist, und lässt dich es auf morgen verschieben, abhaken oder weglassen, Punkt für Punkt oder alles zusammen.',
    'From 18:00 on today, and on every earlier day, a closed line says how many points are still open': 'Ab 18:00 heute und an jedem früheren Tag sagt eine zugeklappte Zeile, wie viele Punkte noch offen sind',
    'Opened, every own point has «Done», «To tomorrow» (on an earlier day «To today») and «Drop», each with Undo; «All to tomorrow» moves them together': 'Aufgeklappt hat jeder eigene Punkt «Erledigt», «Auf morgen» (an einem früheren Tag «Auf heute») und «Weg», je mit Rückgängig; «Alles auf morgen» verschiebt sie zusammen',
    'A session of your plan that is not ticked leads to «Tick off»': 'Eine Einheit deines Plans, die nicht abgehakt ist, führt zu «Abhaken»',
    'Open «My day» after 18:00 with an own to-do for today: a closed line «1 point is still open».': 'Öffne «Mein Tag» nach 18:00 mit einem eigenen To-do für heute: eine zugeklappte Zeile «1 Punkt ist noch offen».',
    'Open it, tap «To tomorrow»: the point is gone from today; tap «Undo»: it is back.': 'Klappe sie auf und tippe «Auf morgen»: der Punkt ist von heute weg; tippe «Rückgängig»: er ist wieder da.',
    'Open yesterday: the open points are there with «To today».': 'Öffne gestern: die offenen Punkte stehen da, mit «Auf heute».',
  },
};
