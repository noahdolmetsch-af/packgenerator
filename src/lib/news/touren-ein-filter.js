// «Ein Filter auf Touren» (Noah 26.11.2026 «Ja» und Wahl «a» auf die offene Frage 1 von «Touren-Seite klarer»)
export default {
  title: 'One filter on Trips',
  lead: 'The field and the buttons under the title of Trips now filter the list «My trips» itself.',
  points: [
    { text: 'The field and the buttons Year, Bike, Kind and Distance filter the list «My trips» directly', go: { href: '#/trips', steps: [{ sel: '[data-tour-bar]' }] } },
    { text: '«More filters» opens the rest: duration, weather, power and your saved filters', go: { href: '#/trips', steps: [{ sel: '[data-filter-open]' }] } },
  ],
  small: [{ box: 'fix', text: 'The box «Filter the list» beside the list is gone, there is one place to filter' }],
  test: [
    'Open Trips, type a word of a trip in the field under the title: the list «My trips» shows only the trips with that word.',
    'Tap «Bike», choose one: the list narrows, a chip above it takes the filter away again.',
    'Tap «More filters»: the same filter is in the window, with weather, power and «My filters».',
  ],
  since: [],
  de: {
    'One filter on Trips': 'Ein Filter auf Touren',
    'The field and the buttons under the title of Trips now filter the list «My trips» itself.': 'Das Feld und die Knöpfe unter dem Titel von Touren filtern jetzt die Liste «Meine Touren» selbst.',
    'The field and the buttons Year, Bike, Kind and Distance filter the list «My trips» directly': 'Das Feld und die Knöpfe Jahr, Velo, Art und Distanz filtern die Liste «Meine Touren» direkt',
    '«More filters» opens the rest: duration, weather, power and your saved filters': '«Mehr Filter» öffnet den Rest: Dauer, Wetter, Leistung und deine gespeicherten Filter',
    'The box «Filter the list» beside the list is gone, there is one place to filter': 'Die Box «Liste filtern» neben der Liste fällt weg, gefiltert wird an einem Ort',
    'Open Trips, type a word of a trip in the field under the title: the list «My trips» shows only the trips with that word.': 'Öffne Touren und tippe unter dem Titel ein Wort einer Tour ins Feld: die Liste «Meine Touren» zeigt nur die Touren mit diesem Wort.',
    'Tap «Bike», choose one: the list narrows, a chip above it takes the filter away again.': 'Tippe auf «Velo» und wähle eines: die Liste wird enger, ein Chip darüber nimmt den Filter wieder weg.',
    'Tap «More filters»: the same filter is in the window, with weather, power and «My filters».': 'Tippe auf «Mehr Filter»: im Fenster ist derselbe Filter, dazu Wetter, Leistung und «Meine Filter».',
  },
};
