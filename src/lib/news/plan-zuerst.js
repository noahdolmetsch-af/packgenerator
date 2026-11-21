// «Plan zuerst» (Noah 19.11.2026 «1-5a» und 21.11.2026 «a», Thread «Training erfassen vereinfachen», T4): «Erledigt» bei einer Einheit des Wochenplans öffnet ein kurzes Blatt, dann «Geschafft»
export default {
  title: 'Plan first',
  lead: 'Done on a unit of your weekly plan now counts like a normal tick and shows what you did.',
  points: [
    { text: 'On Today and on the weekly plan, «Done» on a unit opens a short sheet: the duration from the plan, how it was if you like, then «Save»', go: 'f.wochenplan' },
    { text: 'The unit is ticked in the plan and in your history, and the page «Geschafft» opens', go: 'f.geschafft' },
    { text: 'The app asks once which of your sports the unit belongs to; from then on one tap ticks the unit with the minutes from the plan, and «Undo» takes it back', go: 'f.wochenplan' },
  ],
  small: [{ box: 'new', text: 'Meditation, stretching and the rest day tick at once, without the sheet' }],
  test: [
    'Open Active › Weekly plan and tick a unit of this week: a short sheet opens with the planned minutes chosen. Tap «Save»: the page «Geschafft» opens.',
    'On «Geschafft» tap «Undo»: the tick is gone on the weekly plan too.',
  ],
  since: [],
  de: {
    'Plan first': 'Plan zuerst',
    'Done on a unit of your weekly plan now counts like a normal tick and shows what you did.': 'Erledigt bei einer Einheit deines Wochenplans zählt jetzt wie ein normaler Haken und zeigt, was du gemacht hast.',
    'On Today and on the weekly plan, «Done» on a unit opens a short sheet: the duration from the plan, how it was if you like, then «Save»': 'Auf Heute und im Wochenplan öffnet «Erledigt» bei einer Einheit ein kurzes Blatt: die Dauer aus dem Plan, wie es war, wenn du magst, dann «Speichern»',
    'The unit is ticked in the plan and in your history, and the page «Geschafft» opens': 'Die Einheit ist im Plan und in deinem Verlauf abgehakt, und die Seite «Geschafft» öffnet sich',
    'The app asks once which of your sports the unit belongs to; from then on one tap ticks the unit with the minutes from the plan, and «Undo» takes it back': 'Die App fragt einmal, zu welcher deiner Sportarten die Einheit gehört; ab dann hakt ein Tipp die Einheit mit den Minuten aus dem Plan ab, und «Rückgängig» nimmt sie zurück',
    'Meditation, stretching and the rest day tick at once, without the sheet': 'Meditation, Dehnen und der Ruheblock haken sofort ab, ohne Blatt',
    'Open Active › Weekly plan and tick a unit of this week: a short sheet opens with the planned minutes chosen. Tap «Save»: the page «Geschafft» opens.': 'Öffne Aktiv › Wochenplan und hake eine Einheit dieser Woche ab: Ein kurzes Blatt öffnet sich, die geplanten Minuten sind gewählt. Tippe «Speichern»: Die Seite «Geschafft» öffnet sich.',
    'On «Geschafft» tap «Undo»: the tick is gone on the weekly plan too.': 'Tippe auf «Geschafft» «Rückgängig»: Das Häkchen ist auch im Wochenplan weg.',
  },
};
