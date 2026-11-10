// «Wochenplan» (Noah 09.11.2026 «bau los», Teil 4): Fixtage, Wunschzeit, Verschieben, Warum hier?, Konflikt mit Wahl
export default {
  title: 'Fixed days and moving in your weekly plan',
  lead: 'Choose fixed days with a start time, move a unit for one week, and see why the plan put it there.',
  points: [
    { text: 'Fixed days per goal, each with its own start time', go: 'f.wochenplan' },
    { text: '«Move» puts a unit on another day or time, and the rest of the week plans itself anew', go: 'f.wochenplan' },
    { text: '«Why here?» gives the reason; a conflict offers a way out or «Leave it»', go: 'f.wochenplan' },
  ],
  test: [
    'On Active › Weekly plan tap «Wed» under «Tennis» (Fixed days): a fourth tennis unit stands on Wednesday. Tap «Undo».',
    'Tap «Move» at a unit and choose another day: it moves, the rest of the week plans anew, and the unit says «moved».',
    'Move «Tennis» onto the yoga at Monday 09:30: «What does not fit» offers «Back to the suggestion» or «Leave it».',
  ],
  de: {
    'Fixed days and moving in your weekly plan': 'Fixtage und Verschieben im Wochenplan',
    'Choose fixed days with a start time, move a unit for one week, and see why the plan put it there.': 'Wähle Fixtage mit Startzeit, verschiebe eine Einheit für eine Woche und sieh, warum der Plan sie dorthin gelegt hat.',
    'Fixed days per goal, each with its own start time': 'Fixtage pro Ziel, jeder mit eigener Startzeit',
    '«Move» puts a unit on another day or time, and the rest of the week plans itself anew': '«Verschieben» legt eine Einheit auf einen anderen Tag oder eine andere Zeit, und der Rest der Woche plant sich neu',
    '«Why here?» gives the reason; a conflict offers a way out or «Leave it»': '«Warum hier?» nennt den Grund; ein Konflikt bietet einen Ausweg oder «So lassen»',
    'On Active › Weekly plan tap «Wed» under «Tennis» (Fixed days): a fourth tennis unit stands on Wednesday. Tap «Undo».': 'Tippe auf Aktiv › Wochenplan bei «Tennis» unter «Fixtage» auf «Mi»: Eine vierte Tennis-Einheit steht am Mittwoch. Tippe «Rückgängig».',
    'Tap «Move» at a unit and choose another day: it moves, the rest of the week plans anew, and the unit says «moved».': 'Tippe bei einer Einheit «Verschieben» und wähle einen anderen Tag: Sie wandert, der Rest der Woche plant sich neu, und die Einheit sagt «verschoben».',
    'Move «Tennis» onto the yoga at Monday 09:30: «What does not fit» offers «Back to the suggestion» or «Leave it».': 'Verschiebe «Tennis» auf das Yoga am Montag um 09:30: «Was nicht passt» bietet «Zurück auf den Vorschlag» oder «So lassen».',
  },
};
