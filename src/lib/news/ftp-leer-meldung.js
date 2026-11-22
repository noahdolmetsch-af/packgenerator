// «FTP: leeres Feld» (Durchklick Etappe 5, Bericht Frage 1a, Noah 06.11.2026)
export default {
  title: 'An empty FTP field says what it did',
  lead: 'When you save the FTP field empty, the note says «Own FTP removed.» instead of «FTP saved.».',
  points: [{ text: 'Training › FTP: an empty field takes your own FTP away and says so', go: { href: '#/flow/training', where: 'Aktiv › Training, the section «FTP», «change», empty the field, «Save».' } }],
  small: [],
  test: ['Open Aktiv › Training, tap «change» at «FTP», type a number and save: the note says «FTP saved.».', 'Tap «change» again, empty the field and save: the note says «Own FTP removed.» and «Undo» brings the number back.'],
  since: [],
  de: {
    'An empty FTP field says what it did': 'Ein leeres FTP-Feld sagt, was es getan hat',
    'When you save the FTP field empty, the note says «Own FTP removed.» instead of «FTP saved.».': 'Wenn du das FTP-Feld leer speicherst, sagt die Meldung «Eigene FTP entfernt.» statt «FTP gespeichert.».',
    'Training › FTP: an empty field takes your own FTP away and says so': 'Training › FTP: Ein leeres Feld nimmt deine eigene FTP weg und sagt es',
    'Aktiv › Training, the section «FTP», «change», empty the field, «Save».': 'Aktiv › Training, Abschnitt «FTP», «ändern», Feld leeren, «Speichern».',
    'Open Aktiv › Training, tap «change» at «FTP», type a number and save: the note says «FTP saved.».': 'Öffne Aktiv › Training, tippe bei «FTP» auf «ändern», tippe eine Zahl und speichere: Die Meldung sagt «FTP gespeichert.».',
    'Tap «change» again, empty the field and save: the note says «Own FTP removed.» and «Undo» brings the number back.': 'Tippe wieder auf «ändern», leere das Feld und speichere: Die Meldung sagt «Eigene FTP entfernt.» und «Rückgängig» bringt die Zahl zurück.',
  },
};
