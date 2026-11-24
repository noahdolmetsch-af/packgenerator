// «Wechsel-Varianten» (Noah 04./05.11.2026, «2a» 23.11.2026, Thread «Wi gaht's? um Träume und Visionen erweitern»): other wordings from day to day, one switch
export default {
  title: 'Questions in other words',
  lead: 'Many questions in «Wi gaht\'s?» ask in other words from day to day. One switch keeps the main question.',
  points: [
    { text: 'The questions that are on at the start ask in three wordings, a different one each day', go: { href: '#/check/morning', steps: [{ sel: '[data-round-questions="morning"]' }], where: 'Today › Wi gaht\'s? in the morning: the wording of a question changes from day to day.' } },
    { text: '«Always the main question» in Me › Your questions turns this off', go: { href: '#/me/abfragen', steps: [{ sel: '[data-main-only]' }] } },
  ],
  small: [{ box: 'fixed', text: 'Your own and renamed questions keep their words' }],
  test: [
    'Open Today › Wi gaht\'s? in the morning and read the first question.',
    'Open Me › Your questions, find «Words of the questions» and switch on «Always the main question».',
    'Open Wi gaht\'s? in the morning again: every question asks in its main words.',
  ],
  since: [],
  de: {
    'Questions in other words': 'Fragen in anderen Worten',
    'Many questions in «Wi gaht\'s?» ask in other words from day to day. One switch keeps the main question.': 'Viele Fragen in «Wi gaht\'s?» stellen sich von Tag zu Tag in anderen Worten. Ein Schalter hält die Hauptfrage fest.',
    'The questions that are on at the start ask in three wordings, a different one each day': 'Die Fragen, die am Start an sind, fragen in drei Formulierungen, jeden Tag in einer anderen',
    'Today › Wi gaht\'s? in the morning: the wording of a question changes from day to day.': 'Heute › «Wi gaht\'s?» am Morgen: die Formulierung einer Frage wechselt von Tag zu Tag.',
    '«Always the main question» in Me › Your questions turns this off': '«Immer die Hauptfrage» unter Ich › Deine Fragen stellt das ab',
    'Your own and renamed questions keep their words': 'Eigene und umbenannte Fragen behalten ihre Worte',
    'Open Today › Wi gaht\'s? in the morning and read the first question.': 'Öffne Heute › «Wi gaht\'s?» am Morgen und lies die erste Frage.',
    'Open Me › Your questions, find «Words of the questions» and switch on «Always the main question».': 'Öffne Ich › Deine Fragen, finde «Worte der Fragen» und schalte «Immer die Hauptfrage» ein.',
    'Open Wi gaht\'s? in the morning again: every question asks in its main words.': 'Öffne «Wi gaht\'s?» am Morgen noch einmal: jede Frage steht im Haupttext.',
  },
};
