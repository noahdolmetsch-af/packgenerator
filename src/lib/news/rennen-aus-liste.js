// «Rennen aus der Rennliste» (Noah 24.11.2026 «a»): the races of your own race list become races of the app; the Velo-Countdown knows the freeze
export default {
  title: 'Race atlas',
  lead: 'Your own race list now lives in the app as a race atlas: filter it, see your year with overlaps and a map, and the countdown says when nothing may change any more.',
  points: [
    { text: 'Trips › Races › «Race atlas»: choose the file once; then a list with filters, a year line with overlaps and a map of the start places', go: { href: '#/race', steps: [{ text: 'Open the race atlas' }] } },
    { text: 'The race countdown shows the days to the start and the stop: from 6 weeks before nothing changes on the bike, bags, lights and mounts; the bike service is 3 weeks before', go: 'f.racecheck' },
  ],
  test: [
    'Go to Trips › Races, then tap «Race atlas» and choose the file of your race list.',
    'Filter the list, star a race, then look at «Year line» and «Map».',
    'Open a race and tap «Create race»: it stands under «Coming»; «Undo» takes it back.',
  ],
  since: ['f.raceatlas'],
  de: {
    'Race atlas': 'Rennatlas',
    'Your own race list now lives in the app as a race atlas: filter it, see your year with overlaps and a map, and the countdown says when nothing may change any more.': 'Deine eigene Rennliste lebt jetzt als Rennatlas in der App: Du filterst sie, siehst dein Jahr mit Überschneidungen und eine Karte, und der Countdown sagt, ab wann sich nichts mehr ändern darf.',
    'Trips › Races › «Race atlas»: choose the file once; then a list with filters, a year line with overlaps and a map of the start places': 'Touren › Rennen › «Rennatlas»: Datei einmal wählen; dann eine Liste mit Filtern, ein Zeitstrahl mit Überschneidungen und eine Karte der Startorte',
    'Open the race atlas': 'Zum Rennatlas',
    'The race countdown shows the days to the start and the stop: from 6 weeks before nothing changes on the bike, bags, lights and mounts; the bike service is 3 weeks before': 'Der Rennen-Countdown zeigt die Tage bis zum Start und bis zum Stopp: ab 6 Wochen vorher ändert sich nichts mehr an Velo, Taschen, Licht und Halterungen; der Velo-Service ist 3 Wochen vorher',
    'Go to Trips › Races, then tap «Race atlas» and choose the file of your race list.': 'Geh zu Touren › Rennen, tippe auf «Rennatlas» und wähl die Datei deiner Rennliste.',
    'Filter the list, star a race, then look at «Year line» and «Map».': 'Filtere die Liste, markiere ein Rennen mit dem Stern und schau dann «Zeitstrahl» und «Karte» an.',
    'Open a race and tap «Create race»: it stands under «Coming»; «Undo» takes it back.': 'Öffne ein Rennen und tippe «Rennen anlegen»: Es steht unter «Kommende»; «Rückgängig» nimmt es zurück.',
  },
};
