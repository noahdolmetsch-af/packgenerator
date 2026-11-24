// «Fahrten: Liste zuerst» (Noah 24.11.2026 «1-5a», impeccable Touren 4a): with saved rides the button comes first, then the list
export default {
  title: 'Rides: your list comes first',
  lead: 'When you have saved rides, the page starts with one button «Upload ride» and then your rides.',
  points: [
    { text: 'Trips › Look back › Rides: one button to upload, right below it your saved rides', go: { href: '#/debrief/ride', steps: [{ sel: '[data-ride-table]' }] } },
  ],
  small: [{ box: 'new', text: 'The big dashed card with the long text stays on the empty page' }],
  test: [
    'Open Trips › Look back › Rides with at least one saved ride: the button «Upload ride» stands on top and the first ride is on the first screen.',
    'Tap «Where do I get the file?»: the explanation opens.',
  ],
  since: [],
  de: {
    'Rides: your list comes first': 'Fahrten: deine Liste zuerst',
    'When you have saved rides, the page starts with one button «Upload ride» and then your rides.': 'Wenn du Fahrten gespeichert hast, beginnt die Seite mit einem Knopf «Fahrt hochladen» und danach kommen deine Fahrten.',
    'Trips › Look back › Rides: one button to upload, right below it your saved rides': 'Touren › Rückblick › Fahrten: ein Knopf zum Hochladen, gleich darunter deine gespeicherten Fahrten',
    'The big dashed card with the long text stays on the empty page': 'Die grosse gestrichelte Karte mit dem langen Text bleibt auf der leeren Seite',
    'Open Trips › Look back › Rides with at least one saved ride: the button «Upload ride» stands on top and the first ride is on the first screen.': 'Öffne Touren › Rückblick › Fahrten mit mindestens einer gespeicherten Fahrt: oben steht der Knopf «Fahrt hochladen» und die erste Fahrt ist auf dem ersten Bildschirm.',
    'Tap «Where do I get the file?»: the explanation opens.': 'Tippe «Woher bekomme ich die Datei?»: die Erklärung geht auf.',
  },
};
