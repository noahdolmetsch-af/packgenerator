// «Termin festlegen» (Noah 1.11.2026 «3a»): Termin finden, den Termin festlegen und der Gruppe schicken
export default {
  title: 'Fix the date',
  lead: 'In a date question you fix the date, and the app writes the message to the group.',
  points: [{ text: 'Fix the best day: the question ends, the date stays, send it to the group', go: { href: '#/me/mini', where: 'Me › Mini tools › open a date question with answers: under «Best day» tap «Fix this date».' } }],
  small: [{ box: 'new', go: null, text: '«Withdraw the date» removes the fixed date again' }],
  test: [
    'Open Me › Mini tools and a date question with an answer, tap «Fix this date» and confirm.',
    'The card «The date is fixed» shows with «Send the date to the group» and «Add to calendar».',
  ],
  since: [],
  de: {
    'Fix the date': 'Termin festlegen',
    'In a date question you fix the date, and the app writes the message to the group.': 'In einer Termin-Frage legst du den Termin fest, und die App schreibt die Nachricht an die Gruppe.',
    'Fix the best day: the question ends, the date stays, send it to the group': 'Den besten Tag festlegen: die Frage endet, der Termin bleibt, schick ihn der Gruppe',
    'Me › Mini tools › open a date question with answers: under «Best day» tap «Fix this date».': 'Ich › Mini-Tools › eine Termin-Frage mit Antworten öffnen: unter «Bester Tag» «Diesen Termin festlegen» tippen.',
    '«Withdraw the date» removes the fixed date again': '«Termin zurücknehmen» nimmt den festgelegten Termin wieder weg',
    'Open Me › Mini tools and a date question with an answer, tap «Fix this date» and confirm.': 'Öffne Ich › Mini-Tools und eine Termin-Frage mit einer Antwort, tipp «Diesen Termin festlegen» und bestätige.',
    'The card «The date is fixed» shows with «Send the date to the group» and «Add to calendar».': 'Die Karte «Der Termin steht» erscheint mit «Termin an die Gruppe schicken» und «In Kalender».',
  },
};
