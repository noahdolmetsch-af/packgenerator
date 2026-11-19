// «UI-Test Flow» Fund 8 (Noah «c»): in «Diese Woche» the names are no longer cut; on a narrow card the days are a list
export default {
  title: 'Names in «This week» are read whole',
  lead: 'On the phone «This week» now shows one row per day, so a name like «Meditation» is no longer cut to «Medi…».',
  points: [{ text: 'One row per day with the tick and the name', go: { href: '#/flow', steps: [{ sel: 'main [data-week-glance]' }], where: 'Aktiv › Heute › «Diese Woche».' } }],
  small: [],
  test: ['Open Aktiv › Heute and look at «Diese Woche» on the phone.', 'Each day is one row: the day, the tick and the full name of what you did.'],
  since: [],
  de: {
    'Names in «This week» are read whole': 'Namen in «Diese Woche» stehen ganz da',
    'On the phone «This week» now shows one row per day, so a name like «Meditation» is no longer cut to «Medi…».': 'Am Handy zeigt «Diese Woche» jetzt eine Zeile pro Tag, darum wird ein Name wie «Meditation» nicht mehr zu «Medi…» abgeschnitten.',
    'One row per day with the tick and the name': 'Eine Zeile pro Tag mit Haken und Name',
    'Aktiv › Heute › «Diese Woche».': 'Aktiv › Heute › «Diese Woche».',
    'Open Aktiv › Heute and look at «Diese Woche» on the phone.': 'Öffne Aktiv › Heute und schau am Handy auf «Diese Woche».',
    'Each day is one row: the day, the tick and the full name of what you did.': 'Jeder Tag ist eine Zeile: der Tag, der Haken und der ganze Name von dem, was du gemacht hast.',
  },
};
