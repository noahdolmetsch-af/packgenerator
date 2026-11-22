// «Verbesserungs-Logbuch» L5 (Noah 22.11.2026 «1a 2a 3a 4a 5a»), step 2: delete kinds and groups, with the question and Undo
export default {
  title: 'Delete kinds and groups in the improvement log',
  lead: 'Every kind and every group of the improvement log can be deleted. A window asks first where things go, and you can undo it.',
  points: [
    { text: 'In «Kinds and groups»: «⋯» › «Delete» at a kind asks where its entries go («No kind» is chosen, or pick another kind); «Undo» brings it all back', go: { href: '#/me/logbuch', steps: [{ sel: '[data-lb-kinds]' }] } },
    { text: 'Deleting a group asks where its kinds go («No group» is chosen, or another group); no entry and no kind is lost', go: 'f.logbuch' },
    { text: 'An entry without a kind shows «No kind» and can still be changed; «Back to standard» brings the first kinds and groups back', go: 'f.logbuch' },
  ],
  test: ['Open Me › Improvement log › «Change the kinds and groups», tap «⋯» at a kind and «Delete».', 'The window asks where the entries go: «No kind» is chosen. Tap «Delete»: the kind is gone, its entries show «No kind».', 'Tap «Undo» in the window: the kind and its entries are back.'],
  since: [],
  de: {
    'Delete kinds and groups in the improvement log': 'Arten und Gruppen im Verbesserungs-Logbuch löschen',
    'Every kind and every group of the improvement log can be deleted. A window asks first where things go, and you can undo it.': 'Jede Art und jede Gruppe des Verbesserungs-Logbuchs lässt sich löschen. Ein Fenster fragt zuerst, wohin die Dinge gehen, und du kannst es rückgängig machen.',
    'In «Kinds and groups»: «⋯» › «Delete» at a kind asks where its entries go («No kind» is chosen, or pick another kind); «Undo» brings it all back': 'In «Arten und Gruppen»: «⋯» › «Löschen» bei einer Art fragt, wohin ihre Einträge gehen («Ohne Art» ist gewählt, oder wähle eine andere Art); «Rückgängig» holt alles zurück',
    'Deleting a group asks where its kinds go («No group» is chosen, or another group); no entry and no kind is lost': 'Beim Löschen einer Gruppe fragt das Fenster, wohin ihre Arten gehen («Ohne Gruppe» ist gewählt, oder eine andere Gruppe); kein Eintrag und keine Art geht verloren',
    'An entry without a kind shows «No kind» and can still be changed; «Back to standard» brings the first kinds and groups back': 'Ein Eintrag ohne Art zeigt «Ohne Art» und lässt sich weiter ändern; «Zurück zum Standard» holt die ersten Arten und Gruppen zurück',
    'Open Me › Improvement log › «Change the kinds and groups», tap «⋯» at a kind and «Delete».': 'Öffne Ich › Verbesserungs-Logbuch › «Arten und Gruppen ändern», tippe bei einer Art auf «⋯» und «Löschen».',
    'The window asks where the entries go: «No kind» is chosen. Tap «Delete»: the kind is gone, its entries show «No kind».': 'Das Fenster fragt, wohin die Einträge gehen: «Ohne Art» ist gewählt. Tippe auf «Löschen»: die Art ist weg, ihre Einträge zeigen «Ohne Art».',
    'Tap «Undo» in the window: the kind and its entries are back.': 'Tippe im Fenster auf «Rückgängig»: die Art und ihre Einträge sind zurück.',
  },
};
