// «Termine ziehen» für «Mein Tag» (Noah 24.11.2026 «2b»: der Baustein gilt überall; Mein Tag als eigener Teil)
export default {
  title: 'My day: pull entries like everywhere else',
  lead: 'In «My day» you now pull an entry like in the week: the entry itself, and units and entries without a time onto another day.',
  points: [
    { text: 'Pull an entry of «My day» by itself to a new time (computer: with the mouse; phone: press and hold first); the grip and the lower edge still work', go: { href: '#/day', where: 'Planen › My day: pull one of your own entries to another hour.' } },
    { text: 'A unit of the training plan and an entry without a time can be pulled onto the chip of another day', go: { href: '#/day', where: 'Planen › My day: pull a unit onto the chip of tomorrow.' } },
    { text: '«Move all …» under the timeline moves everything that can move to another day at once', go: { href: '#/day', where: 'Planen › My day: «Move all …» stands below the timeline on a day with two or more entries.' } },
  ],
  small: [],
  test: [
    'Open Planen › My day and pull an own entry to another hour: «Moved» appears with «Undo».',
    'Pull an entry without a time onto the chip of tomorrow, then tap «Undo».',
    'Tap «Move all …» below the timeline, choose a day and tap «Move».',
  ],
  since: [],
  de: {
    'My day: pull entries like everywhere else': 'Mein Tag: Einträge ziehen wie überall',
    'In «My day» you now pull an entry like in the week: the entry itself, and units and entries without a time onto another day.': 'In «Mein Tag» ziehst du einen Eintrag jetzt wie in der Woche: den Eintrag selbst, und Einheiten und Einträge ohne Zeit auf einen anderen Tag.',
    'Pull an entry of «My day» by itself to a new time (computer: with the mouse; phone: press and hold first); the grip and the lower edge still work': 'Ziehe einen Eintrag von «Mein Tag» an ihm selbst auf eine neue Zeit (Computer: mit der Maus; Handy: zuerst lange drücken); der Griff und der untere Rand gehen weiterhin',
    'Planen › My day: pull one of your own entries to another hour.': 'Planen › Mein Tag: Ziehe einen eigenen Eintrag auf eine andere Stunde.',
    'A unit of the training plan and an entry without a time can be pulled onto the chip of another day': 'Eine Einheit des Trainingsplans und ein Eintrag ohne Zeit lassen sich auf den Chip eines anderen Tages ziehen',
    'Planen › My day: pull a unit onto the chip of tomorrow.': 'Planen › Mein Tag: Ziehe eine Einheit auf den Chip von morgen.',
    '«Move all …» under the timeline moves everything that can move to another day at once': '«Alles verschieben …» unter der Zeitleiste legt alles, was sich bewegen lässt, auf einmal auf einen anderen Tag',
    'Planen › My day: «Move all …» stands below the timeline on a day with two or more entries.': 'Planen › Mein Tag: «Alles verschieben …» steht unter der Zeitleiste an einem Tag mit zwei oder mehr Einträgen.',
    'Open Planen › My day and pull an own entry to another hour: «Moved» appears with «Undo».': 'Öffne Planen › Mein Tag und ziehe einen eigenen Eintrag auf eine andere Stunde: «Verschoben» erscheint mit «Rückgängig».',
    'Pull an entry without a time onto the chip of tomorrow, then tap «Undo».': 'Ziehe einen Eintrag ohne Zeit auf den Chip von morgen und tippe dann auf «Rückgängig».',
    'Tap «Move all …» below the timeline, choose a day and tap «Move».': 'Tippe unter der Zeitleiste auf «Alles verschieben …», wähle einen Tag und tippe auf «Verschieben».',
  },
};
