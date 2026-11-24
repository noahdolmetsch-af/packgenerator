// «Muster-Woche» (Noah 23.11.2026 «1-5a»): a made-up week of ticks as example data
export default {
  title: 'Example week',
  lead: 'The examples now bring a made-up week of ticks, so Tick off and My day are not empty on the first look.',
  points: [
    { text: 'Examples with «Active and everyday» now carry six days of ticks: meditation, yoga, bike, push-ups, sauna, stretch and run', go: { href: '#/me/data', steps: [{ sel: '[data-testid="adjust-examples"], main h1' }], where: 'Me › Data and backup › Adjust the examples' } },
    { text: 'Me › Data and backup › «Remove the examples» takes the example ticks away again, your own ticks stay', go: null },
  ],
  small: [{ box: 'new', text: 'The example ticks are marked by their name «ex-tick» inside the data, never written over your own' }],
  test: [
    'Open Me › Data and backup › «Adjust the examples», pick «Active and everyday» and tap «Put the examples in».',
    'Open My day (tab «Tick off») and go back a few days: the example ticks are there.',
    'Open Me › Data and backup › «Remove the examples»: the example ticks go, your own ticks stay.',
  ],
  since: [],
  de: {
    'Example week': 'Beispiel-Woche',
    'The examples now bring a made-up week of ticks, so Tick off and My day are not empty on the first look.': 'Die Beispiele bringen jetzt eine erfundene Woche mit Haken, so sind Abhaken und Mein Tag beim ersten Blick nicht leer.',
    'Examples with «Active and everyday» now carry six days of ticks: meditation, yoga, bike, push-ups, sauna, stretch and run': 'Beispiele mit «Abhaken und Alltag» bringen jetzt sechs Tage mit Haken: Meditation, Yoga, Velo, Liegestütze, Sauna, Dehnen und Laufen',
    'Me › Data and backup › Adjust the examples': 'Ich › Daten und Backup › Beispiele anpassen',
    'Me › Data and backup › «Remove the examples» takes the example ticks away again, your own ticks stay': 'Ich › Daten und Backup › «Beispiele entfernen» nimmt die Beispiel-Haken wieder weg, deine eigenen Haken bleiben',
    'The example ticks are marked by their name «ex-tick» inside the data, never written over your own': 'Die Beispiel-Haken sind in den Daten an ihrem Namen «ex-tick» erkennbar und überschreiben nie deine eigenen',
    'Open Me › Data and backup › «Adjust the examples», pick «Active and everyday» and tap «Put the examples in».': 'Öffne Ich › Daten und Backup › «Beispiele anpassen», wähle «Abhaken und Alltag» und tippe auf «Beispiele einsetzen».',
    'Open My day (tab «Tick off») and go back a few days: the example ticks are there.': 'Öffne Mein Tag (Reiter «Abhaken») und gehe ein paar Tage zurück: Die Beispiel-Haken sind da.',
    'Open Me › Data and backup › «Remove the examples»: the example ticks go, your own ticks stay.': 'Öffne Ich › Daten und Backup › «Beispiele entfernen»: Die Beispiel-Haken gehen, deine eigenen bleiben.',
  },
};
