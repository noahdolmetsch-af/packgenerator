// «Planen als verbindende Mitte» (Noah 1.11.2026 «4a» + «bitte ebenfalls einplanen»): time needed for a to-do, free time with its basis and a buffer
export default {
  title: 'Time needed and buffer',
  lead: 'To-dos can say how long they take, and free time shows what fits.',
  points: [
    { text: 'To-dos get an optional time (e.g. 30 min); it shows under the to-do', href: '#/week', go: 'f.weekplan' },
    { text: 'Free time: the window says what it is based on, keeps 30 minutes as a buffer and offers to put a fitting to-do there', href: '#/week', go: 'f.freeslot' },
  ],
  small: [{ box: 'nicer', text: 'Without calendar or home place the hint has the buttons «Connect calendar» and «Set home place»', go: 'f.freeslot' }],
  test: ['Planen › Woche › «To-do»: enter a title and «30» minutes, save. It shows with «30 min».', 'With the calendar on and a home place, the free window offers the to-do; without them the hint has two buttons.'],
  since: [],
  de: {
    'Time needed and buffer': 'Zeitbedarf und Puffer',
    'To-dos can say how long they take, and free time shows what fits.': 'To-dos können sagen, wie lange sie dauern, und die freie Zeit zeigt, was passt.',
    'To-dos get an optional time (e.g. 30 min); it shows under the to-do': 'To-dos bekommen eine freiwillige Zeit (z. B. 30 Min); sie steht unter dem To-do',
    'Free time: the window says what it is based on, keeps 30 minutes as a buffer and offers to put a fitting to-do there': 'Freie Zeit: Das Fenster sagt, worauf es beruht, lässt 30 Minuten als Puffer frei und bietet ein passendes To-do an',
    'Without calendar or home place the hint has the buttons «Connect calendar» and «Set home place»': 'Ohne Kalender oder Wohnort hat der Hinweis die Knöpfe «Kalender verbinden» und «Wohnort festlegen»',
    'Planen › Woche › «To-do»: enter a title and «30» minutes, save. It shows with «30 min».': 'Planen › Woche › «To-do»: Titel und «30» Minuten eingeben, speichern. Es steht mit «30 Min» da.',
    'With the calendar on and a home place, the free window offers the to-do; without them the hint has two buttons.': 'Mit Kalender und Wohnort bietet das freie Fenster das To-do an; ohne beides hat der Hinweis zwei Knöpfe.',
  },
};
