// «Fragen: langes Wort» (Nacht-Rundgang 08.11.2026, Noah «Ok»): a very long rule or question name no longer pushes the page wider than the screen
export default {
  title: 'Long names fit in your questions',
  lead: 'A very long name of a rule or question now wraps inside its row instead of pushing the page sideways.',
  points: [{ text: 'On the phone, a long rule or question name in «Your questions» breaks onto the next line', go: { href: '#/me/abfragen', where: 'Me › Your questions, in the rows of the rules and questions.' } }],
  small: [],
  test: ['Open Me › Your questions on the phone and create your own rule with a very long name without spaces.', 'The name breaks inside its row and the page, with the bar at the bottom, does not move sideways.'],
  since: [],
  de: {
    'Long names fit in your questions': 'Lange Namen passen in «Wi gaht\'s?»',
    'A very long name of a rule or question now wraps inside its row instead of pushing the page sideways.': 'Ein sehr langer Name einer Regel oder Frage bricht jetzt in seiner Zeile um und schiebt die Seite nicht mehr zur Seite.',
    'On the phone, a long rule or question name in «Your questions» breaks onto the next line': 'Auf dem Handy bricht ein langer Name einer Regel oder Frage unter «Wi gaht\'s?» in die nächste Zeile um',
    'Me › Your questions, in the rows of the rules and questions.': 'Ich › Wi gaht\'s?, in den Zeilen der Regeln und Fragen.',
    'Open Me › Your questions on the phone and create your own rule with a very long name without spaces.': 'Öffne Ich › Wi gaht\'s? auf dem Handy und lege eine eigene Regel mit einem sehr langen Namen ohne Leerzeichen an.',
    'The name breaks inside its row and the page, with the bar at the bottom, does not move sideways.': 'Der Name bricht in seiner Zeile um und die Seite mit der Leiste unten wackelt nicht zur Seite.',
  },
};
