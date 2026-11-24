// «Woche vorschlagen» löscht TrainingPeaks nicht mehr (Noah 23.11.2026 «5a», Thread «Wochenplan-Vorschläge verlässlich machen»)
export default {
  title: 'A suggestion keeps your TrainingPeaks sessions',
  lead: 'Taking over the suggestion for the week no longer removes what comes from TrainingPeaks.',
  points: [
    { text: '«Take over» in the suggestion for the week replaces only your own sessions from today on; sessions from TrainingPeaks stay where they are', go: { href: '#/flow/training', where: 'Training › Week, «Suggest week» in a week with TrainingPeaks sessions.' } },
  ],
  small: [{ box: 'new', text: 'The button only says «replaces the planned days» when there is something of your own to replace' }],
  test: [
    'Open Training › Week. Tap «Suggest week» and then «Take over».',
    'The sessions marked «TP» are still in the week and on their days; Undo brings your old plan back.',
  ],
  since: [],
  de: {
    'A suggestion keeps your TrainingPeaks sessions': 'Ein Vorschlag lässt deine TrainingPeaks-Einheiten stehen',
    'Taking over the suggestion for the week no longer removes what comes from TrainingPeaks.': 'Wer den Vorschlag für die Woche übernimmt, löscht damit nicht mehr, was aus TrainingPeaks kommt.',
    '«Take over» in the suggestion for the week replaces only your own sessions from today on; sessions from TrainingPeaks stay where they are': '«Übernehmen» im Vorschlag für die Woche ersetzt nur deine eigenen Einheiten ab heute; Einheiten aus TrainingPeaks bleiben, wo sie sind',
    'Training › Week, «Suggest week» in a week with TrainingPeaks sessions.': 'Training › Woche, «Woche vorschlagen» in einer Woche mit TrainingPeaks-Einheiten.',
    'The button only says «replaces the planned days» when there is something of your own to replace': 'Der Knopf sagt «ersetzt die geplanten Tage» nur noch, wenn etwas Eigenes zu ersetzen da ist',
    'Open Training › Week. Tap «Suggest week» and then «Take over».': 'Öffne Training › Woche. Tippe auf «Woche vorschlagen» und dann auf «Übernehmen».',
    'The sessions marked «TP» are still in the week and on their days; Undo brings your old plan back.': 'Die Einheiten mit «TP» stehen weiter in der Woche an ihren Tagen; «Rückgängig» bringt deinen alten Plan zurück.',
  },
};
