// «Aktionen in Auswerten» (Noah 23.11.2026 «1-5a», 2a), Teil 3: eine neue eigene Frage meldet sich mit Rückgängig und Ansehen
export default {
  title: 'A new question says it is saved',
  lead: 'After «Create your own question» a note says when the question comes, with «Undo» and «Look at it».',
  points: [
    { text: 'A new own question in «Your questions» now shows a note «Question saved. It comes daily · 20:00.» with «Undo» and «Look at it» (it jumps to the question and lights it up)', go: { href: '#/me/abfragen', where: 'Tap «Create your own question» in «Your questions», fill it in and save: the note shows at the bottom.' } },
  ],
  small: [],
  test: [
    'In «Your questions» tap «Create your own question», give it a name and save: a note says when it comes.',
    'Tap «Look at it» in the note: the page jumps to the new question and lights it up for a moment.',
    'Create another one and tap «Undo» in the note: the question is gone again.',
  ],
  since: [],
  de: {
    'A new question says it is saved': 'Eine neue Frage meldet sich',
    'After «Create your own question» a note says when the question comes, with «Undo» and «Look at it».': 'Nach «Eigene Frage anlegen» sagt ein Hinweis, wann die Frage kommt, mit «Rückgängig» und «Ansehen».',
    'A new own question in «Your questions» now shows a note «Question saved. It comes daily · 20:00.» with «Undo» and «Look at it» (it jumps to the question and lights it up)': 'Eine neue eigene Frage in «Wi gaht\'s?» zeigt jetzt den Hinweis «Frage gespeichert. Sie kommt täglich · 20:00.» mit «Rückgängig» und «Ansehen» (es springt zur Frage und hebt sie hervor)',
    'Tap «Create your own question» in «Your questions», fill it in and save: the note shows at the bottom.': 'Tippe in «Wi gaht\'s?» auf «Eigene Frage anlegen», fülle sie aus und speichere: Der Hinweis erscheint unten.',
    'In «Your questions» tap «Create your own question», give it a name and save: a note says when it comes.': 'Tippe in «Wi gaht\'s?» auf «Eigene Frage anlegen», gib ihr einen Namen und speichere: Ein Hinweis sagt, wann sie kommt.',
    'Tap «Look at it» in the note: the page jumps to the new question and lights it up for a moment.': 'Tippe im Hinweis auf «Ansehen»: Die Seite springt zur neuen Frage und hebt sie kurz hervor.',
    'Create another one and tap «Undo» in the note: the question is gone again.': 'Lege noch eine an und tippe im Hinweis auf «Rückgängig»: Die Frage ist wieder weg.',
  },
};
