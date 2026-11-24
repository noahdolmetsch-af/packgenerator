// «Verbindungen» (Noah 04./05.11.2026, «3b» 23.11.2026, Thread «Wi gaht's? um Träume und Visionen erweitern»): sentence questions offer what the app knows
export default {
  title: 'Answer with what the app knows',
  lead: 'Sentence questions in «Wi gaht\'s?» offer your to-dos, goals, activities, friends and stars as one-tap answers.',
  points: [
    { text: '«Your most important goal for today» offers your to-dos, goals of the week and activities', go: { href: '#/check/morning', steps: [{ sel: '[data-links]' }], where: 'Today › Wi gaht\'s? in the morning: under the goal question, if you have to-dos or goals.' } },
    { text: 'In the evening «Did you reach your goal?» names this morning\'s goal', go: null },
  ],
  small: [{ box: 'fixed', text: 'A tap only fills the field, nothing is copied or changed' }],
  test: [
    'Open Today › Wi gaht\'s? in the morning; under the goal question tap one of your to-dos.',
    'Tap a goal of the week too: it is added after a dot.',
    'Reload: the sentence is still there.',
  ],
  since: [],
  de: {
    'Answer with what the app knows': 'Antworten mit dem, was die App weiss',
    'Sentence questions in «Wi gaht\'s?» offer your to-dos, goals, activities, friends and stars as one-tap answers.': 'Satzfragen in «Wi gaht\'s?» bieten deine To-dos, Ziele, Aktivitäten, Freunde und Sterne als Antwort zum Antippen an.',
    '«Your most important goal for today» offers your to-dos, goals of the week and activities': '«Dein wichtigstes Ziel heute» bietet deine To-dos, Wochenziele und Aktivitäten an',
    'Today › Wi gaht\'s? in the morning: under the goal question, if you have to-dos or goals.': 'Heute › «Wi gaht\'s?» am Morgen: unter der Zielfrage, wenn du To-dos oder Ziele hast.',
    'In the evening «Did you reach your goal?» names this morning\'s goal': 'Am Abend nennt «Hast du dein Ziel erreicht?» das Ziel von heute Morgen',
    'A tap only fills the field, nothing is copied or changed': 'Ein Tipp füllt nur das Feld, nichts wird kopiert oder geändert',
    'Open Today › Wi gaht\'s? in the morning; under the goal question tap one of your to-dos.': 'Öffne Heute › «Wi gaht\'s?» am Morgen; tippe unter der Zielfrage eines deiner To-dos an.',
    'Tap a goal of the week too: it is added after a dot.': 'Tippe auch ein Wochenziel an: es wird nach einem Punkt angehängt.',
    'Reload: the sentence is still there.': 'Lade neu: der Satz steht noch da.',
  },
};
