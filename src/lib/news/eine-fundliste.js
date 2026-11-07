// «Träume und Neuland» N10 (Noah 07.11.2026 «ok N10»): eine Fundliste für Neuland, Gipfelbuch und Neuland des Jahres
export default {
  title: 'A list of finds',
  lead: 'New ground, the summit book and «Neuland of the year» now read from one list.',
  points: [
    { text: 'Trips › Look back › New ground: the card «List of finds» shows everything you reached for the first time', href: '#/neuland', go: 'f.findlist' },
  ],
  small: [
    { box: 'new', text: 'A place in the summit book with coordinates is ticked in New ground too, and shows once in the list', go: 'f.findlist' },
    { box: 'new', text: 'The year review and «What does me good» show the same list as «Neuland of the year»', go: 'f.findlist' },
  ],
  test: [
    'Open Trips › Look back › New ground: the card «List of finds» is at the top.',
    'Switch between «This year» and «All years».',
    'Under Ich › What does me good add a Neuland entry: it appears in the list.',
  ],
  since: ['f.findlist'],
  de: {
    'A list of finds': 'Eine Fundliste',
    'New ground, the summit book and «Neuland of the year» now read from one list.': 'Neuland, das Gipfelbuch und das «Neuland des Jahres» lesen jetzt aus einer Liste.',
    'Trips › Look back › New ground: the card «List of finds» shows everything you reached for the first time': 'Touren › Rückblick › Neuland: die Karte «Fundliste» zeigt alles, was du zum ersten Mal erreicht hast',
    'A place in the summit book with coordinates is ticked in New ground too, and shows once in the list': 'Ein Ort im Gipfelbuch mit Koordinaten ist auch in Neuland abgehakt und steht nur einmal in der Liste',
    'The year review and «What does me good» show the same list as «Neuland of the year»': 'Das Jahresheft und «Was mir gut tut» zeigen dieselbe Liste als «Neuland des Jahres»',
    'Open Trips › Look back › New ground: the card «List of finds» is at the top.': 'Öffne Touren › Rückblick › Neuland: oben steht die Karte «Fundliste».',
    'Switch between «This year» and «All years».': 'Wechsle zwischen «Dieses Jahr» und «Alle Jahre».',
    'Under Ich › What does me good add a Neuland entry: it appears in the list.': 'Trage unter Ich › Was mir gut tut einen Neuland-Eintrag ein: er steht in der Liste.',
  },
};
