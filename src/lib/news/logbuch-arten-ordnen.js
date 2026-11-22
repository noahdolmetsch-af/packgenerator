// «Verbesserungs-Logbuch» L5 (Noah 22.11.2026 «1a 2a 3a 4a 5a»), step 1: rename and order the kinds and groups
export default {
  title: 'Rename and order the kinds in the improvement log',
  lead: 'The kinds and groups of the improvement log are yours: you can rename them and put them in your order.',
  points: [
    { text: 'New card «Kinds and groups» in the improvement log: rename a kind or a group in the «⋯» menu, put them in order with the arrows or by dragging; «Back to standard» brings the first version back', go: { href: '#/me/logbuch', steps: [{ sel: '[data-lb-kinds]' }] } },
    { text: 'In the window «Improve» the link «Change kinds» leads there', go: 'f.logbuch' },
    { text: 'Entries you already wrote keep their kind, whatever you rename or move', go: 'f.logbuch' },
  ],
  test: ['Open Me › Improvement log and tap «Change the kinds and groups» at the bottom.', 'Tap «⋯» at a kind, choose «Rename», type a new word and save: it shows in the list and in the filter.', 'Tap «Undo» in the window: the old word is back. Tap «Back to standard» to bring all words and the order back.'],
  since: [],
  de: {
    'Rename and order the kinds in the improvement log': 'Arten im Verbesserungs-Logbuch umbenennen und ordnen',
    'The kinds and groups of the improvement log are yours: you can rename them and put them in your order.': 'Die Arten und Gruppen des Verbesserungs-Logbuchs gehören dir: du kannst sie umbenennen und in deine Reihenfolge bringen.',
    'New card «Kinds and groups» in the improvement log: rename a kind or a group in the «⋯» menu, put them in order with the arrows or by dragging; «Back to standard» brings the first version back': 'Neue Karte «Arten und Gruppen» im Verbesserungs-Logbuch: eine Art oder Gruppe im Menü «⋯» umbenennen, mit den Pfeilen oder durch Ziehen ordnen; «Zurück zum Standard» holt die erste Fassung zurück',
    'In the window «Improve» the link «Change kinds» leads there': 'Im Fenster «Verbessern» führt der Link «Arten ändern» dorthin',
    'Entries you already wrote keep their kind, whatever you rename or move': 'Einträge, die du schon geschrieben hast, behalten ihre Art, egal was du umbenennst oder verschiebst',
    'Open Me › Improvement log and tap «Change the kinds and groups» at the bottom.': 'Öffne Ich › Verbesserungs-Logbuch und tippe unten auf «Arten und Gruppen ändern».',
    'Tap «⋯» at a kind, choose «Rename», type a new word and save: it shows in the list and in the filter.': 'Tippe bei einer Art auf «⋯», wähle «Umbenennen», tippe ein neues Wort und speichere: es steht in der Liste und im Filter.',
    'Tap «Undo» in the window: the old word is back. Tap «Back to standard» to bring all words and the order back.': 'Tippe im Fenster auf «Rückgängig»: das alte Wort ist zurück. Tippe auf «Zurück zum Standard», um alle Wörter und die Reihenfolge zurückzuholen.',
  },
};
