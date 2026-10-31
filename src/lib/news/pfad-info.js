// «Pfad auf jeder Seite» Schritt 2 (Noah 28.10.2026 «1a 2a», 29.10.2026 «Freigeben»): a small «i» that says where a tile comes from
export default {
  title: 'Where does this come from?',
  lead: 'A small «i» on four tiles of Today and on the tabs of Plan tells where something lives and where its data comes from.',
  points: [
    { text: 'Tap the «i» on «This week» on Today: path, where the data comes from, where it leads', go: { href: '#/', steps: [{ sel: '[data-info-open="tile.week"]' }] } },
    { text: 'The «i» on the tabs of Plan names what belongs together, for example Week, Remember and Appointments', go: { href: '#/week', steps: [{ sel: '[data-info-open="tab.week"]' }] } },
  ],
  small: [{ box: 'new', text: 'The «i» goes away with the path line: Me › Look › Handling', go: { href: '#/me/look', steps: [{ sel: 'input[data-op="path"]' }] } }],
  test: ['Open Plan › Week and tap the «i» at the right of the path: a sheet shows the path and what belongs together.', 'On Today tap the «i» on «This week»: the sheet says the data comes from what you tick in Active and from your rides.'],
  since: [],
  de: {
    'Where does this come from?': 'Woher kommt das?',
    'A small «i» on four tiles of Today and on the tabs of Plan tells where something lives and where its data comes from.': 'Ein kleines «i» an vier Kacheln von Heute und an den Reitern von Planen sagt, wo etwas liegt und woher seine Daten kommen.',
    'Tap the «i» on «This week» on Today: path, where the data comes from, where it leads': 'Tippe auf Heute beim «i» von «Diese Woche»: Pfad, woher die Daten kommen, wohin es führt',
    'The «i» on the tabs of Plan names what belongs together, for example Week, Remember and Appointments': 'Das «i» an den Reitern von Planen nennt, was zusammengehört, zum Beispiel Woche, Merken und Termine',
    'The «i» goes away with the path line: Me › Look › Handling': 'Das «i» verschwindet mit der Pfad-Zeile: Ich › Darstellung › Bedienung',
    'Open Plan › Week and tap the «i» at the right of the path: a sheet shows the path and what belongs together.': 'Öffne Planen › Woche und tippe rechts neben dem Pfad auf das «i»: ein Fenster zeigt den Pfad und was zusammengehört.',
    'On Today tap the «i» on «This week»: the sheet says the data comes from what you tick in Active and from your rides.': 'Tippe auf Heute beim «i» von «Diese Woche»: das Fenster sagt, die Daten kommen von dem, was du in Aktiv abhakst, und von deinen Fahrten.',
  },
};
