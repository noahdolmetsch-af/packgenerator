// «Eine Frage pro Thema» (Noah 04.11.2026 «3a», Thread «Planen: Tagescheck mit Fragen»): sechs doppelte Fragen sind zusammengelegt
export default {
  title: 'One question per topic',
  lead: 'Six questions that asked the same as another one are off now, so «Wi gaht\'s?» is shorter.',
  points: [{ text: 'In «Your questions» the merged ones say «merged into …»; switch one on again any time', go: { href: '#/me/abfragen', steps: [{ sel: '[data-merged]' }], where: 'Me › Your questions: a switched-off question with the note «merged into …».' } }],
  small: [{ box: 'fixed', text: 'Your old answers stay in the history' }],
  test: [
    'Open Me › Your questions: «How many grins did the day have?» is off and says «merged into …».',
    'Switch it on again: it asks from its next time on, like before.',
  ],
  since: [],
  de: {
    'One question per topic': 'Eine Frage pro Thema',
    'Six questions that asked the same as another one are off now, so «Wi gaht\'s?» is shorter.': 'Sechs Fragen, die dasselbe fragten wie eine andere, sind jetzt aus, damit «Wi gaht\'s?» kürzer ist.',
    'In «Your questions» the merged ones say «merged into …»; switch one on again any time': 'In «Deine Fragen» steht bei den zusammengelegten «zusammengelegt mit …»; du kannst jede wieder einschalten',
    'Me › Your questions: a switched-off question with the note «merged into …».': 'Ich › Deine Fragen: eine ausgeschaltete Frage mit dem Hinweis «zusammengelegt mit …».',
    'Your old answers stay in the history': 'Deine alten Antworten bleiben im Verlauf',
    'Open Me › Your questions: «How many grins did the day have?» is off and says «merged into …».': 'Öffne Ich › Deine Fragen: «Wie viele Grinser hatte der Tag?» ist aus und sagt «zusammengelegt mit …».',
    'Switch it on again: it asks from its next time on, like before.': 'Schalte sie wieder ein: sie fragt ab ihrer nächsten Zeit, wie vorher.',
  },
};
