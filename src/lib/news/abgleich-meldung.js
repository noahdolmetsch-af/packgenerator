// Noah 1.11.2026: after pairing or «Sync now» the app says whether it worked
export default {
  title: 'Sync says when it is done',
  lead: 'After pairing or «Sync now» a clear line says how many entries came and went.',
  points: [{ text: 'Sync now shows «Done: … received, … sent»', go: { href: '#/me/data', where: 'Shows under «Sync now» in Me › Data, once sync is on.' } }],
  small: [],
  test: ['Ich › Daten › Handy und Computer: tap «Sync now».', 'A line says «Done: … received, … sent» or that both devices are up to date.'],
  since: [],
  de: {
    'Sync says when it is done': 'Der Abgleich sagt, wann er fertig ist',
    'After pairing or «Sync now» a clear line says how many entries came and went.': 'Nach dem Koppeln oder «Jetzt abgleichen» sagt eine klare Zeile, wie viele Einträge kamen und gingen.',
    'Sync now shows «Done: … received, … sent»': 'Jetzt abgleichen zeigt «Fertig: … geholt, … geschickt»',
    'Shows under «Sync now» in Me › Data, once sync is on.': 'Zeigt sich unter «Jetzt abgleichen» in Ich › Daten, sobald der Sync an ist.',
    'Ich › Daten › Handy und Computer: tap «Sync now».': 'Ich › Daten › Handy und Computer: Tippe «Jetzt abgleichen».',
    'A line says «Done: … received, … sent» or that both devices are up to date.': 'Eine Zeile sagt «Fertig: … geholt, … geschickt» oder dass beide Geräte auf demselben Stand sind.',
  },
};
