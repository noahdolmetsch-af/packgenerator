// «Erster Start in einem Fenster» (Noah 23.11.2026 «1-5a», V1 Klarheit und Auffindbarkeit)
export default {
  title: 'First start in one window',
  lead: 'A new app asks once, in one window: one big button puts the examples in.',
  points: [
    { text: 'The first-start window has one main button «Go, start with examples»; «Start empty» and «I already use the app on another device» are quiet below it', go: null },
    { text: 'The choice of what interests you moved to Me › Data and backup › «Adjust the examples»', go: { href: '#/me/data', steps: [{ text: 'Adjust the examples' }] } },
  ],
  small: [{ box: 'new', text: 'The short tour is no longer offered in the first window; it stays on Today and in the handbook' }],
  test: [
    'Open Me › Data and backup and tap «Adjust the examples»: the three kinds of examples are listed; what is already there says «Already in».',
    'Tick what you miss and tap «Put the examples in»: only that comes in, nothing you changed is written over.',
    'Tap «Remove the examples»: all of the examples go, your own things stay.',
  ],
  since: [],
  de: {
    'First start in one window': 'Erster Start in einem Fenster',
    'A new app asks once, in one window: one big button puts the examples in.': 'Eine neue App fragt einmal, in einem Fenster: Ein grosser Knopf holt die Beispiele.',
    'The first-start window has one main button «Go, start with examples»; «Start empty» and «I already use the app on another device» are quiet below it': 'Das Fenster beim ersten Start hat einen Hauptknopf «Los, mit Beispielen starten»; «Leer starten» und «Ich nutze die App schon auf einem anderen Gerät» stehen leiser darunter',
    'The choice of what interests you moved to Me › Data and backup › «Adjust the examples»': 'Die Wahl, was dich interessiert, liegt jetzt unter Ich › Daten und Backup › «Beispiele anpassen»',
    'The short tour is no longer offered in the first window; it stays on Today and in the handbook': 'Der kurze Rundgang wird im ersten Fenster nicht mehr angeboten; er bleibt auf Heute und im Handbuch',
    'Open Me › Data and backup and tap «Adjust the examples»: the three kinds of examples are listed; what is already there says «Already in».': 'Öffne Ich › Daten und Backup und tippe auf «Beispiele anpassen»: Die drei Arten von Beispielen stehen da; was schon da ist, sagt «Schon da».',
    'Tick what you miss and tap «Put the examples in»: only that comes in, nothing you changed is written over.': 'Hake an, was dir fehlt, und tippe auf «Beispiele übernehmen»: Nur das kommt dazu, nichts, was du geändert hast, wird überschrieben.',
    'Tap «Remove the examples»: all of the examples go, your own things stay.': 'Tippe auf «Beispiele entfernen»: Alle Beispiele gehen weg, deine eigenen Sachen bleiben.',
  },
};
