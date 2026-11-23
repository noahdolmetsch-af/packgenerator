// «Live-Seite ruhiger» (Noah 23.11.2026 «bitte gleich Seite optimieren»): the list «During the ride» is help, so it is one closed line
export default {
  title: 'Calmer live page',
  lead: 'Before the start the live page is shorter: the list of what the map can do is one closed line.',
  points: [{ text: '«During the ride» is closed; tap it to see what the map can do', go: { href: '#/live', steps: [{ text: 'During the ride' }] } }],
  small: [],
  test: ['Open the live page: under the start button the line «During the ride – What the map can do» is closed.', 'Tap the line: the list opens, tap again: it closes.'],
  since: [],
  de: {
    'Calmer live page': 'Ruhigere Live-Seite',
    'Before the start the live page is shorter: the list of what the map can do is one closed line.': 'Vor dem Start ist die Live-Seite kürzer: Die Liste, was die Karte kann, ist eine geschlossene Zeile.',
    '«During the ride» is closed; tap it to see what the map can do': '«Während der Fahrt» ist zugeklappt; antippen zeigt, was die Karte kann',
    'Open the live page: under the start button the line «During the ride – What the map can do» is closed.': 'Die Live-Seite öffnen: unter dem Startknopf ist die Zeile «Während der Fahrt – Was die Karte kann» zugeklappt.',
    'Tap the line: the list opens, tap again: it closes.': 'Die Zeile antippen: die Liste öffnet sich, nochmals antippen: sie schliesst sich.',
  },
};
