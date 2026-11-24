// «Alte Vorschläge aus «Woche vorschlagen» entfernen» (Noah 24.11.2026 «a ★ Ja», Thread «Wochenplan-Vorschläge verlässlich machen»), Schritt 7
export default {
  title: 'Take out old suggestions',
  lead: 'Old units from «Suggest the week» that still sit in your week can be taken out in one tap, so the hours add up again.',
  points: [
    { text: 'In the weekly plan a calm line says how many old suggestions are still in your week; «Take them out» removes only those, with Undo', go: { href: '#/flow/wochenplan', where: 'Training › Weekly plan, further down, when old suggestions are still in your week.' } },
  ],
  small: [{ box: 'new', text: 'Your own units and TrainingPeaks always stay' }],
  test: [
    'Open Training › Weekly plan. If old suggestions are still in your week, a line says so: tap «Take them out».',
    'Look at Training › Week: the old suggestions are gone, your own units and TrainingPeaks stay, and «Undo» brings them back.',
  ],
  since: [],
  de: {
    'Take out old suggestions': 'Alte Vorschläge entfernen',
    'Old units from «Suggest the week» that still sit in your week can be taken out in one tap, so the hours add up again.': 'Alte Einheiten aus «Woche vorschlagen», die noch in deiner Woche liegen, nimmst du mit einem Tipp heraus, damit die Stunden wieder stimmen.',
    'In the weekly plan a calm line says how many old suggestions are still in your week; «Take them out» removes only those, with Undo': 'Im Wochenplan sagt eine ruhige Zeile, wie viele alte Vorschläge noch in deiner Woche liegen; «Entfernen» nimmt nur diese heraus, mit Rückgängig',
    'Training › Weekly plan, further down, when old suggestions are still in your week.': 'Training › Wochenplan, weiter unten, wenn noch alte Vorschläge in deiner Woche liegen.',
    'Your own units and TrainingPeaks always stay': 'Deine eigenen Einheiten und TrainingPeaks bleiben immer',
    'Open Training › Weekly plan. If old suggestions are still in your week, a line says so: tap «Take them out».': 'Öffne Training › Wochenplan. Liegen noch alte Vorschläge in deiner Woche, sagt es eine Zeile: Tipp auf «Entfernen».',
    'Look at Training › Week: the old suggestions are gone, your own units and TrainingPeaks stay, and «Undo» brings them back.': 'Öffne Training › Woche: Die alten Vorschläge sind weg, deine eigenen Einheiten und TrainingPeaks bleiben, und «Rückgängig» bringt sie zurück.',
  },
};
