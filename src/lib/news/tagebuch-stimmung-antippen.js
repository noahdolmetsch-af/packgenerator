// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 12: the mood curve of the diary look back follows the same rules as the other charts
export default {
  title: 'The mood curve of your diary: a chart you can point at',
  lead: 'The mood of the last 90 days shows every day you noted one, with exact values and a table.',
  points: [
    { text: 'Point at a day for its mood; tap it for the day', href: '#/tagebuch', go: { href: '#/tagebuch', steps: [{ sel: '.tb-bar button[data-key="look"]' }, { sel: '[data-tb-mood-curve]' }], where: 'Diary › Look back › Mood, once you noted a mood on two days.' } },
    { text: '«As table» lists the days with a mood', href: '#/tagebuch', go: { href: '#/tagebuch', steps: [{ sel: '.tb-bar button[data-key="look"]' }, { sel: '[data-tb-mood-curve]' }], where: 'Diary › Look back › Mood, once you noted a mood on two days.' } },
  ],
  test: [
    'Open Diary › Look back (the mood curve shows once you chose a smiley on two days) and point at the curve: day and mood appear above it.',
    'Tap a day: a window shows its mood and how many entries it has; «Day before» and «Next day» walk through the days.',
    'Tap «As table»: the days with a mood are listed, the newest first.',
  ],
  since: [],
  de: {
    'The mood curve of your diary: a chart you can point at': 'Die Stimmungskurve deines Tagebuchs: ein Diagramm zum Antippen',
    'The mood of the last 90 days shows every day you noted one, with exact values and a table.': 'Die Stimmung der letzten 90 Tage zeigt jeden Tag, an dem du eine notiert hast, mit genauen Werten und einer Tabelle.',
    'Point at a day for its mood; tap it for the day': 'Zeig auf einen Tag für seine Stimmung; tippe ihn an für den Tag',
    '«As table» lists the days with a mood': '«Als Tabelle» listet die Tage mit einer Stimmung',
    'Diary › Look back › Mood, once you noted a mood on two days.': 'Tagebuch › Rückblick › Stimmung, sobald du an zwei Tagen eine Stimmung notiert hast.',
    'Open Diary › Look back (the mood curve shows once you chose a smiley on two days) and point at the curve: day and mood appear above it.': 'Öffne Tagebuch › Rückblick (die Kurve erscheint, sobald du an zwei Tagen ein Smiley gewählt hast) und zeig auf die Kurve: Tag und Stimmung stehen darüber.',
    'Tap a day: a window shows its mood and how many entries it has; «Day before» and «Next day» walk through the days.': 'Tippe einen Tag an: ein Fenster zeigt seine Stimmung und wie viele Einträge er hat; «Tag davor» und «Nächster Tag» führen durch die Tage.',
    'Tap «As table»: the days with a mood are listed, the newest first.': 'Tippe «Als Tabelle»: die Tage mit einer Stimmung stehen da, der neueste zuerst.',
  },
};
