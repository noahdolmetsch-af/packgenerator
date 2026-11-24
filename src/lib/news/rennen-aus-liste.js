// «Rennen aus der Rennliste» (Noah 24.11.2026 «a»): the races of your own race list become races of the app; the Velo-Countdown knows the freeze
export default {
  title: 'Races from your race list',
  lead: 'Your own race list can bring its races into the app, and the countdown now says when nothing may change any more.',
  points: [
    { text: 'Trips › Races › «Take races from your race list»: choose the file, tick the races, and they become races with day and length', go: { href: '#/race', steps: [{ text: 'Take races from your race list' }] } },
    { text: 'The race countdown: from 6 weeks before nothing changes on the bike, bags, lights and mounts; the bike service is 3 weeks before', go: 'f.racecheck' },
  ],
  test: [
    'Go to Trips › Races, then tap «Take races from your race list».',
    'Choose a file of your race list: the races are listed, the registered ones and your favourites are ticked.',
    'Tap «Create … races»: the races stand under «Coming races»; «Undo» takes them back.',
  ],
  since: ['f.raceatlas'],
  de: {
    'Races from your race list': 'Rennen aus der Rennliste',
    'Your own race list can bring its races into the app, and the countdown now says when nothing may change any more.': 'Deine eigene Rennliste kann ihre Rennen in die App bringen, und der Countdown sagt jetzt, ab wann sich nichts mehr ändern darf.',
    'Trips › Races › «Take races from your race list»: choose the file, tick the races, and they become races with day and length': 'Touren › Rennen › «Rennen aus deiner Rennliste übernehmen»: Datei wählen, Rennen ankreuzen, und sie werden Rennen mit Tag und Länge',
    'Take races from your race list': 'Rennen aus deiner Rennliste übernehmen',
    'The race countdown: from 6 weeks before nothing changes on the bike, bags, lights and mounts; the bike service is 3 weeks before': 'Der Rennen-Countdown: ab 6 Wochen vorher ändert sich nichts mehr an Velo, Taschen, Licht und Halterungen; der Velo-Service ist 3 Wochen vorher',
    'Go to Trips › Races, then tap «Take races from your race list».': 'Geh zu Touren › Rennen und tippe auf «Rennen aus deiner Rennliste übernehmen».',
    'Choose a file of your race list: the races are listed, the registered ones and your favourites are ticked.': 'Wähl eine Datei deiner Rennliste: Die Rennen stehen in einer Liste, die angemeldeten und deine Favoriten sind angekreuzt.',
    'Tap «Create … races»: the races stand under «Coming races»; «Undo» takes them back.': 'Tippe auf «… Rennen anlegen»: Die Rennen stehen unter «Kommende»; «Rückgängig» nimmt sie zurück.',
  },
};
