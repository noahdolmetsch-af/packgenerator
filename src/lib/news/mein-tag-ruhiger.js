// «Mein Tag» (Noah 23.11.2026 «4a 5a»): the timeline starts at «now», an empty day is quiet, the last tab is remembered
export default {
  title: 'A quieter My day',
  lead: '«My day» starts at the hour you are in, shows an empty day without empty hours and opens with the tab you used last.',
  points: [
    { text: 'Today the timeline starts one hour before «now»; earlier hours are one scroll up, earlier entries always show', go: 'f.meintag' },
    { text: 'An empty day shows only its message; «Show the timeline» opens the hours', go: 'f.meintag' },
    { text: '«My day» opens with the tab you used last: «Day», «To-dos» or «Tick off»', go: 'f.meintag' },
  ],
  test: ['Open «My day» today: the hours start just before «now», and «now» stands on the right.', 'Pick a day with nothing planned: a message and «Show the timeline».', 'Tap «Tick off», leave the page and come back: it opens on «Tick off».'],
  de: {
    'A quieter My day': 'Ein ruhigeres Mein Tag',
    '«My day» starts at the hour you are in, shows an empty day without empty hours and opens with the tab you used last.': '«Mein Tag» beginnt bei der Stunde, in der du bist, zeigt einen leeren Tag ohne leere Stunden und öffnet mit dem Reiter, den du zuletzt benutzt hast.',
    'Today the timeline starts one hour before «now»; earlier hours are one scroll up, earlier entries always show': 'Heute beginnt die Zeitleiste eine Stunde vor «jetzt»; frühere Stunden sind einmal hochscrollen entfernt, frühere Einträge sieht man immer',
    'An empty day shows only its message; «Show the timeline» opens the hours': 'Ein leerer Tag zeigt nur seine Meldung; «Zeitleiste zeigen» öffnet die Stunden',
    '«My day» opens with the tab you used last: «Day», «To-dos» or «Tick off»': '«Mein Tag» öffnet mit dem Reiter, den du zuletzt benutzt hast: «Tag», «To-dos» oder «Abhaken»',
    'Open «My day» today: the hours start just before «now», and «now» stands on the right.': 'Öffne «Mein Tag» heute: die Stunden beginnen kurz vor «jetzt», und «jetzt» steht rechts.',
    'Pick a day with nothing planned: a message and «Show the timeline».': 'Wähle einen Tag ohne Plan: eine Meldung und «Zeitleiste zeigen».',
    'Tap «Tick off», leave the page and come back: it opens on «Tick off».': 'Tippe «Abhaken», verlasse die Seite und komm zurück: sie öffnet auf «Abhaken».',
  },
};
