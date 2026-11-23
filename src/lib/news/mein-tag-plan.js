// «Mein Tag» (Noah 23.11.2026 «ja»): step 4, «Plan my day» for the entries without a time
export default {
  title: 'Plan my day',
  lead: '«My day» can propose a time for each entry that has none yet, with the reason, lighter or harder.',
  points: [
    { text: 'Tap «Plan my day» on «My day»: every entry without a time gets a free slot, with air for the way', go: 'f.meintag' },
    { text: 'Choose «Lighter» or «Harder»; untick a line you do not want; nothing is saved before «Take over» and Undo is offered', go: 'f.meintag' },
  ],
  test: ['Open Plan › Week › «My day» on a day with an entry that has no time.', 'Tap «Plan my day»: each entry has a time and a reason.', 'Tap «Take over»: the entries stand in the timeline; «Undo» takes them back.'],
  de: {
    'Plan my day': 'Tag planen lassen',
    '«My day» can propose a time for each entry that has none yet, with the reason, lighter or harder.': '«Mein Tag» schlägt für jeden Eintrag ohne Zeit eine Zeit vor, mit Grund, leichter oder härter.',
    'Tap «Plan my day» on «My day»: every entry without a time gets a free slot, with air for the way': 'Tippe auf «Mein Tag» «Tag planen lassen»: jeder Eintrag ohne Zeit bekommt eine freie Lücke, mit Luft für den Weg',
    'Choose «Lighter» or «Harder»; untick a line you do not want; nothing is saved before «Take over» and Undo is offered': 'Wähle «Leichter» oder «Härter», nimm eine Zeile raus, die du nicht willst; vor «Übernehmen» wird nichts gespeichert, und «Rückgängig» wird angeboten',
    'Open Plan › Week › «My day» on a day with an entry that has no time.': 'Öffne Planen › Woche › «Mein Tag» an einem Tag mit einem Eintrag ohne Zeit.',
    'Tap «Plan my day»: each entry has a time and a reason.': 'Tippe «Tag planen lassen»: jeder Eintrag hat eine Zeit und einen Grund.',
    'Tap «Take over»: the entries stand in the timeline; «Undo» takes them back.': 'Tippe «Übernehmen»: die Einträge stehen in der Zeitleiste; «Rückgängig» nimmt sie zurück.',
  },
};
