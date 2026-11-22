// «Gestern nachtragen» (Noah 19.11.2026 «1-5a», 21.11.2026 «bitte hiermit fortfahren»): the tick window has «When» and a field for your own length
export default {
  title: 'Tick off yesterday',
  lead: 'The tick window of a tile has «When»: you can tick off a training of an earlier day, with a time if you like.',
  points: [
    { text: 'On Active tap «•••» on a tile: «When» offers today, yesterday, the day before and «Other day» (a date up to a year back)', go: { href: '#/flow', steps: [{ sel: '[data-more="yoga"]' }, { sel: '#tick-when' }] } },
    { text: 'A time is optional; the training counts on that day in the history, the weekly goals and Analysis', go: { href: '#/flow', steps: [{ sel: '[data-more="yoga"]' }, { sel: '[data-when-time]' }] } },
    { text: 'The window has «Own length» next to its duration buttons', go: { href: '#/flow', steps: [{ sel: '[data-more="yoga"]' }, { sel: '[data-own-min]' }] } },
  ],
  small: [],
  test: ['On Active tap «•••» on the tile «Yoga», choose «Yesterday» and tap «Tick off»: the message says «yesterday» and «Geschafft» shows yesterday.', 'Choose «Other day», type a date and a time, tick off: the training stands on that day in your history.'],
  since: [],
  de: {
    'Tick off yesterday': 'Gestern nachtragen',
    'The tick window of a tile has «When»: you can tick off a training of an earlier day, with a time if you like.': 'Das Abhak-Fenster einer Kachel hat «Wann»: Du kannst ein Training von einem früheren Tag abhaken, auf Wunsch mit Uhrzeit.',
    'On Active tap «•••» on a tile: «When» offers today, yesterday, the day before and «Other day» (a date up to a year back)': 'Tippe auf Aktiv bei einer Kachel auf «•••»: «Wann» bietet heute, gestern, vorgestern und «Anderer Tag» (ein Datum bis ein Jahr zurück)',
    'A time is optional; the training counts on that day in the history, the weekly goals and Analysis': 'Eine Uhrzeit ist freiwillig; das Training zählt an diesem Tag im Verlauf, in den Wochenzielen und in Auswerten',
    'The window has «Own length» next to its duration buttons': 'Das Fenster hat neben den Dauer-Knöpfen das Feld «Eigene Dauer»',
    'On Active tap «•••» on the tile «Yoga», choose «Yesterday» and tap «Tick off»: the message says «yesterday» and «Geschafft» shows yesterday.': 'Tippe auf Aktiv bei der Kachel «Yoga» auf «•••», wähle «Gestern» und tippe «Abhaken»: Die Meldung sagt «gestern» und «Geschafft» zeigt gestern.',
    'Choose «Other day», type a date and a time, tick off: the training stands on that day in your history.': 'Wähle «Anderer Tag», gib ein Datum und eine Uhrzeit ein und hake ab: Das Training steht an diesem Tag in deinem Verlauf.',
  },
};
