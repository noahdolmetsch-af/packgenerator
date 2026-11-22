// «Verbesserungs-Logbuch» L5 (Noah 22.11.2026 «4a»), step 3: new kinds and groups, the way of a kind
export default {
  title: 'Your own kinds and groups in the improvement log',
  lead: 'You can add kinds and groups to the improvement log and say what happens with a kind.',
  points: [
    { text: 'In «Kinds and groups»: «Kind in …» adds a kind to a group, «New group» adds a group; you choose the way when you make a kind (small change, first a picture, only a note; the standard is «first a picture»)', go: { href: '#/me/logbuch', steps: [{ sel: '[data-lb-kinds]' }] } },
    { text: '«⋯» › «Change the way» changes it later; the entries of that kind follow', go: 'f.logbuch' },
    { text: '«Back to standard» brings the first kinds and groups back; entries of your own kinds stay, without a kind, and «Undo» brings everything back', go: 'f.logbuch' },
  ],
  test: ['Open Me › Improvement log › «Change the kinds and groups» and tap «Kind in …» at a group.', 'Type a name, choose the way and save: the kind is in the list and in the window «New entry».', 'Tap «⋯» › «Change the way» at it and choose «Only a note»: its entries become notes.'],
  since: [],
  de: {
    'Your own kinds and groups in the improvement log': 'Eigene Arten und Gruppen im Verbesserungs-Logbuch',
    'You can add kinds and groups to the improvement log and say what happens with a kind.': 'Du kannst dem Verbesserungs-Logbuch Arten und Gruppen hinzufügen und sagen, was mit einer Art passiert.',
    'In «Kinds and groups»: «Kind in …» adds a kind to a group, «New group» adds a group; you choose the way when you make a kind (small change, first a picture, only a note; the standard is «first a picture»)': 'In «Arten und Gruppen»: «Art in …» fügt einer Gruppe eine Art hinzu, «Neue Gruppe» eine Gruppe; den Weg wählst du beim Anlegen (kleine Änderung, zuerst ein Bild, nur eine Notiz; Standard ist «zuerst ein Bild»)',
    '«⋯» › «Change the way» changes it later; the entries of that kind follow': '«⋯» › «Weg ändern» ändert ihn später; die Einträge dieser Art folgen',
    '«Back to standard» brings the first kinds and groups back; entries of your own kinds stay, without a kind, and «Undo» brings everything back': '«Zurück zum Standard» holt die ersten Arten und Gruppen zurück; Einträge deiner eigenen Arten bleiben, ohne Art, und «Rückgängig» holt alles zurück',
    'Open Me › Improvement log › «Change the kinds and groups» and tap «Kind in …» at a group.': 'Öffne Ich › Verbesserungs-Logbuch › «Arten und Gruppen ändern» und tippe bei einer Gruppe auf «Art in …».',
    'Type a name, choose the way and save: the kind is in the list and in the window «New entry».': 'Tippe einen Namen, wähle den Weg und speichere: die Art steht in der Liste und im Fenster «Neuer Eintrag».',
    'Tap «⋯» › «Change the way» at it and choose «Only a note»: its entries become notes.': 'Tippe dort auf «⋯» › «Weg ändern» und wähle «Nur eine Notiz»: ihre Einträge werden zu Notizen.',
  },
};
