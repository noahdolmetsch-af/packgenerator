// «Training verbessern» 2 (Noah 2.11.2026): a suggestion for the training week, with the reasons, and other layouts
export default {
  title: 'A suggestion for your training week',
  lead: 'One tap builds a week from your goal, your race, how you feel today and your sports. It says why, and you take it over or not.',
  points: [{ text: 'In «Plan the week» tap «Suggestion for this week», then «Another suggestion» for more', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }] } }],
  small: [
    { box: 'new', text: 'Every day of the suggestion can be changed, swapped for another sport or removed, and you can add more sessions on a day', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }, { sel: '[data-sug-edit]' }] } },
    { box: 'new', text: 'Taking it over can be undone right away', go: null },
  ],
  test: [
    'Open Aktiv › Training and tap «Suggestion for this week» under the days.',
    'Read the reasons, tap «Another suggestion» once, then «Take over». The days fill; tap «Undo» to get the old plan back.',
  ],
  since: [],
  de: {
    'A suggestion for your training week': 'Ein Vorschlag für deine Trainingswoche',
    'One tap builds a week from your goal, your race, how you feel today and your sports. It says why, and you take it over or not.': 'Ein Tipp baut eine Woche aus deinem Ziel, deinem Rennen, wie du dich heute fühlst und deinen Sportarten. Er sagt, warum, und du übernimmst ihn oder nicht.',
    'In «Plan the week» tap «Suggestion for this week», then «Another suggestion» for more': 'Tippe bei «Woche planen» auf «Vorschlag für diese Woche», dann auf «Anderer Vorschlag» für weitere',
    'Every day of the suggestion can be changed, swapped for another sport or removed, and you can add more sessions on a day': 'Jeder Tag des Vorschlags lässt sich ändern, gegen eine andere Sportart tauschen oder entfernen, und du kannst mehrere Einheiten pro Tag einplanen',
    'Taking it over can be undone right away': 'Das Übernehmen lässt sich sofort rückgängig machen',
    'Open Aktiv › Training and tap «Suggestion for this week» under the days.': 'Öffne Aktiv › Training und tippe unter den Tagen auf «Vorschlag für diese Woche».',
    'Read the reasons, tap «Another suggestion» once, then «Take over». The days fill; tap «Undo» to get the old plan back.': 'Lies die Gründe, tippe einmal auf «Anderer Vorschlag», dann auf «Übernehmen». Die Tage füllen sich; mit «Rückgängig» ist der alte Plan wieder da.',
  },
};
