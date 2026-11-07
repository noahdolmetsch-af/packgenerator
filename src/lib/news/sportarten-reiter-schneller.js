// «Meine Sportarten baut schneller auf» (Noah 05.11.2026 «a: Schwerste Reiter einzeln», Thread «Verzögerung bei Eingaben und Tabs»)
export default {
  title: 'My sports opens a bit faster',
  lead: 'The squares of «All sports at a glance» are built only when you open that fold.',
  points: [{ text: 'Aktiv › My sports: the page shows up sooner, «All sports at a glance» at the end works as before', go: { href: '#/flow/sports', steps: [{ sel: '[data-mosaic] summary' }] } }],
  small: [{ box: 'new', text: 'The day names on the squares are looked up once, not once per square' }],
  test: ['Open Aktiv › My sports: the list of your sports is there at once.', 'At the end of the page tap «All sports at a glance»: the squares per day show as before.'],
  since: [],
  de: {
    'My sports opens a bit faster': 'Meine Sportarten baut etwas schneller auf',
    'The squares of «All sports at a glance» are built only when you open that fold.': 'Die Quadrate von «Alle Sportarten auf einen Blick» entstehen erst, wenn du dieses Feld öffnest.',
    'Aktiv › My sports: the page shows up sooner, «All sports at a glance» at the end works as before': 'Aktiv › Meine Sportarten: Die Seite steht früher, «Alle Sportarten auf einen Blick» am Ende funktioniert wie bisher',
    'The day names on the squares are looked up once, not once per square': 'Die Tagesnamen auf den Quadraten werden einmal nachgeschlagen, nicht einmal pro Quadrat',
    'Open Aktiv › My sports: the list of your sports is there at once.': 'Öffne Aktiv › Meine Sportarten: Die Liste deiner Sportarten ist sofort da.',
    'At the end of the page tap «All sports at a glance»: the squares per day show as before.': 'Tippe am Ende der Seite auf «Alle Sportarten auf einen Blick»: Die Quadrate pro Tag erscheinen wie bisher.',
  },
};
