// Noah 21.11.2026 «a» (Thread «App-Landkarte»): Active leads to the page «Done», and two dead links are repaired
export default {
  title: 'Active leads to «Done»',
  lead: 'On Active a link «Done» shows what today’s ticks brought. Two links that opened Today by mistake now go where they should.',
  points: [{ text: 'Active: «Done» next to «Week in review»', go: { href: '#/flow', where: 'Shows on Active under «This week», in front of «Week in review».' } }],
  small: [{ box: 'fixed', text: '«Check the bike» in the recovery path opens Bikes' }],
  test: ['Open Active and tap «Done» under «This week».', 'The page shows what you ticked today, or says that nothing is ticked yet.'],
  since: [],
  de: {
    'Active leads to «Done»': 'Aktiv führt zu «Geschafft»',
    'On Active a link «Done» shows what today’s ticks brought. Two links that opened Today by mistake now go where they should.': 'Auf Aktiv zeigt ein Link «Geschafft», was die Haken von heute gebracht haben. Zwei Links, die aus Versehen Heute öffneten, führen jetzt dorthin, wohin sie sollen.',
    'Active: «Done» next to «Week in review»': 'Aktiv: «Geschafft» vor «Wochenrückblick»',
    'Shows on Active under «This week», in front of «Week in review».': 'Zeigt sich auf Aktiv unter «Diese Woche», vor «Wochenrückblick».',
    '«Check the bike» in the recovery path opens Bikes': '«Velo prüfen» im Erholungs-Weg öffnet Velos',
    'Open Active and tap «Done» under «This week».': 'Öffne Aktiv und tippe unter «Diese Woche» auf «Geschafft».',
    'The page shows what you ticked today, or says that nothing is ticked yet.': 'Die Seite zeigt, was du heute abgehakt hast, oder sagt, dass noch nichts abgehakt ist.',
  },
};
