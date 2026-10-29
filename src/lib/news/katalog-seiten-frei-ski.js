// «Heute als Begleiter» PR 3 (Noah 28.10.2026, Auffälligkeiten 10–12): 13 pages that had no line in «What the app can do»
export default {
  title: 'More pages in the catalogue',
  lead: 'The pages of Free time and of ski tours, Small apps and Calm and personal now have their own line.',
  points: [
    { text: 'Free time: My evening, What matters to me, Travel wishes, First night, For next time, What am I up for?, My collections', href: '#/me/frei', go: 'f.freiabend' },
    { text: 'Ski tours: Backpack check, Start check, Season care, After the tour', href: '#/ski', go: 'f.skicheck' },
  ],
  small: [{ box: 'new', text: 'Small apps and Calm and personal can be found in the search', go: 'f.miniapps' }],
  test: ['Open Me › What the app can do and search «Rucksack».', 'Tap «Backpack check»: the backpack check of the ski tour opens.', 'Search «Sammlungen»: «My collections» leads to Free time.'],
  since: ['f.miniapps', 'f.ruhig', 'f.freiabend', 'f.freiwesentlich', 'f.freireise', 'f.freinacht', 'f.freinaechstes', 'f.freilust', 'f.freisamml', 'f.skicheck', 'f.skistart', 'f.skicare', 'f.skiafter'],
  de: {
    'More pages in the catalogue': 'Mehr Seiten im Katalog',
    'The pages of Free time and of ski tours, Small apps and Calm and personal now have their own line.': 'Die Seiten von Freie Zeit und Skitouren, Kleine Apps und Ruhig und persönlich haben jetzt eine eigene Zeile.',
    'Free time: My evening, What matters to me, Travel wishes, First night, For next time, What am I up for?, My collections': 'Freie Zeit: Mein Abend, Was mir wesentlich ist, Reise-Wünsche, Erste Nacht, Fürs nächste Mal, Worauf hab ich Lust?, Meine Sammlungen',
    'Ski tours: Backpack check, Start check, Season care, After the tour': 'Skitouren: Rucksack-Check, Start-Check, Saison-Pflege, Nach der Tour',
    'Small apps and Calm and personal can be found in the search': 'Kleine Apps und Ruhig und persönlich findet die Suche',
    'Open Me › What the app can do and search «Rucksack».': 'Öffne Ich › Was die App kann und suche «Rucksack».',
    'Tap «Backpack check»: the backpack check of the ski tour opens.': 'Tippe auf «Rucksack-Check»: der Rucksack-Check der Skitour öffnet sich.',
    'Search «Sammlungen»: «My collections» leads to Free time.': 'Suche «Sammlungen»: «Meine Sammlungen» führt zu Freie Zeit.',
  },
};
