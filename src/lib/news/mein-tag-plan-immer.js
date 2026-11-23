// «Mein Tag» (Noah 23.11.2026 21:13): «Tag planen lassen» plans every day, also sessions and calendar dates, and moves to tomorrow
export default {
  title: 'Plan every day',
  lead: '«Plan my day» is there on every day from today, plans sessions and calendar dates too, and moves to tomorrow what does not fit.',
  points: [
    { text: '«Plan my day» stands on today and on every later day, not only on today', go: 'f.meintag' },
    { text: 'Sessions, tasks and calendar dates without a time get a proposal too; calendar dates are not preselected, as they are often all day', go: 'f.meintag' },
    { text: 'In the evening, entries of your own that no longer fit today move to tomorrow, with the reason', go: 'f.meintag' },
  ],
  test: ['Open «My day», pick tomorrow and tap «Plan my day».', 'Each entry without a time has a proposal; tick a calendar date to plan it too.', 'Tap «Take over»: they stand in the timeline; «Undo» takes them back.'],
  de: {
    'Plan every day': 'Jeden Tag planen',
    '«Plan my day» is there on every day from today, plans sessions and calendar dates too, and moves to tomorrow what does not fit.': '«Tag planen lassen» gibt es an jedem Tag ab heute, plant auch Trainings und Kalendertermine und schiebt auf morgen, was nicht mehr passt.',
    '«Plan my day» stands on today and on every later day, not only on today': '«Tag planen lassen» steht heute und an jedem späteren Tag, nicht nur heute',
    'Sessions, tasks and calendar dates without a time get a proposal too; calendar dates are not preselected, as they are often all day': 'Trainings, Aufgaben und Kalendertermine ohne Zeit bekommen auch einen Vorschlag; Kalendertermine sind nicht vorgewählt, weil sie oft ganztägig sind',
    'In the evening, entries of your own that no longer fit today move to tomorrow, with the reason': 'Am Abend rutschen eigene Einträge, die heute nicht mehr passen, mit Grund auf morgen',
    'Open «My day», pick tomorrow and tap «Plan my day».': 'Öffne «Mein Tag», wähle morgen und tippe «Tag planen lassen».',
    'Each entry without a time has a proposal; tick a calendar date to plan it too.': 'Jeder Eintrag ohne Zeit hat einen Vorschlag; hake einen Kalendertermin an, um ihn auch zu planen.',
    'Tap «Take over»: they stand in the timeline; «Undo» takes them back.': 'Tippe «Übernehmen»: sie stehen in der Zeitleiste; «Rückgängig» nimmt sie zurück.',
  },
};
