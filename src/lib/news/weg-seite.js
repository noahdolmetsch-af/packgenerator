// «Weg zum Ziel» (Noah 05.11.2026 «1b 2b 3a 4a 5a»): die Seite mit Zeitlinie, Anlegen und eigenen Schritten
export default {
  title: 'Way to the goal',
  lead: 'Name a big goal with a start day. The app counts back and lays out the steps on a timeline.',
  points: [
    { text: 'Tap «New way», name the goal and set the start day: the steps stand on a timeline from far ahead to the last two weeks', go: { href: '#/trips/weg', steps: [{ sel: '[data-weg-add],[data-weg-new]' }], where: 'Trips › Way to the goal.' } },
    { text: 'Tick a step, move it to another day, rename it, delete it (with Undo) or add your own step', go: { href: '#/trips/weg', steps: [{ sel: '[data-weg-own]' }] } },
  ],
  small: [{ box: 'new', text: 'Trips shows «Way to the goal» among its tiles' }],
  test: ['Open Trips › Way to the goal and tap «New way»: name «Race in May» with a start day in a few months and tap «Create way».', 'Add your own step «Book the train» for a day: it stands on the timeline in its group; tick it, then delete it and tap «Undo».'],
  since: ['f.weg'],
  de: {
    'Way to the goal': 'Weg zum Ziel',
    'Name a big goal with a start day. The app counts back and lays out the steps on a timeline.': 'Nenne ein grosses Ziel mit Starttag. Die App zählt rückwärts und legt die Schritte auf einer Zeitlinie aus.',
    'Tap «New way», name the goal and set the start day: the steps stand on a timeline from far ahead to the last two weeks': 'Tippe «Neuer Weg», nenne das Ziel und setze den Starttag: Die Schritte stehen auf einer Zeitlinie von weit weg bis zu den letzten zwei Wochen',
    'Trips › Way to the goal.': 'Touren › Weg zum Ziel.',
    'Tick a step, move it to another day, rename it, delete it (with Undo) or add your own step': 'Hake einen Schritt ab, verschiebe ihn auf einen anderen Tag, benenne ihn um, lösche ihn (mit Rückgängig) oder schreibe einen eigenen Schritt',
    'Trips shows «Way to the goal» among its tiles': 'Touren zeigt «Weg zum Ziel» unter den Kacheln',
    'Open Trips › Way to the goal and tap «New way»: name «Race in May» with a start day in a few months and tap «Create way».': 'Öffne Touren › Weg zum Ziel und tippe «Neuer Weg»: nenne ihn «Rennen im Mai» mit einem Starttag in ein paar Monaten und tippe «Weg anlegen».',
    'Add your own step «Book the train» for a day: it stands on the timeline in its group; tick it, then delete it and tap «Undo».': 'Schreibe einen eigenen Schritt «Zug buchen» für einen Tag: Er steht in seiner Gruppe auf der Zeitlinie; hake ihn ab, lösche ihn und tippe «Rückgängig».',
  },
};
