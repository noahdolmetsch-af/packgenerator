// «Schneller speichern und starten» (Noah 11.11.2026 «ja», Messung 10.11.): the database no longer copies every result of a query
export default {
  title: 'Faster start, faster saving',
  lead: 'The app no longer copies all your rides again and again, so it starts and saves faster.',
  points: [{ text: 'Saving a trip, a setting or a ride no longer freezes the page for seconds', go: null }],
  small: [{ box: 'new', text: 'Analysis, Trips and Plan open faster with many rides' }],
  test: ['Open Analysis, then Trips: the pages show up without a long wait.', 'Change a trip and save it: the page stays usable.'],
  since: [],
  de: {
    'Faster start, faster saving': 'Schneller starten, schneller speichern',
    'The app no longer copies all your rides again and again, so it starts and saves faster.': 'Die App kopiert nicht mehr immer wieder alle deine Fahrten. Dadurch startet und speichert sie schneller.',
    'Saving a trip, a setting or a ride no longer freezes the page for seconds': 'Eine Tour, eine Einstellung oder eine Fahrt zu speichern, lässt die Seite nicht mehr sekundenlang einfrieren',
    'Analysis, Trips and Plan open faster with many rides': 'Analyse, Touren und Plan öffnen mit vielen Fahrten schneller',
    'Open Analysis, then Trips: the pages show up without a long wait.': 'Öffne Analyse, dann Touren: die Seiten erscheinen ohne lange Wartezeit.',
    'Change a trip and save it: the page stays usable.': 'Ändere eine Tour und speichere sie: die Seite bleibt bedienbar.',
  },
};
