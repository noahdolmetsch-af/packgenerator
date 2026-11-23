// «Mein Tag» (Noah 23.11.2026): step 2, add, change, delete and drag your own entries
export default {
  title: 'My day',
  lead: 'On «My day» you can now plan: add, change, delete and drag your own dates and to-dos.',
  points: [
    { text: 'Tap «Add an entry» on «My day»: a date or a to-do with a day, a time and a length', go: 'f.meintag' },
    { text: 'Drag the grip of your own entry to another time or onto another day chip; drag its lower edge for the length', go: 'f.meintag' },
  ],
  test: ['Open Plan › Week › «My day» and tap «Add an entry»: give it a name and a time, save.', 'Drag the grip of the new entry one hour down: the time changes and «Undo» is offered.', 'Tap the entry, then «Delete»: it is gone and «Undo» brings it back.'],
  de: {
    'On «My day» you can now plan: add, change, delete and drag your own dates and to-dos.': 'Auf «Mein Tag» kannst du jetzt planen: eigene Termine und To-dos ergänzen, ändern, löschen und ziehen.',
    'Tap «Add an entry» on «My day»: a date or a to-do with a day, a time and a length': 'Tippe auf «Mein Tag» «Eintrag hinzufügen»: ein Termin oder ein To-do mit Tag, Zeit und Länge',
    'Drag the grip of your own entry to another time or onto another day chip; drag its lower edge for the length': 'Ziehe den Griff deines Eintrags auf eine andere Zeit oder auf den Tag oben; ziehe den unteren Rand für die Länge',
    'Open Plan › Week › «My day» and tap «Add an entry»: give it a name and a time, save.': 'Öffne Planen › Woche › «Mein Tag» und tippe «Eintrag hinzufügen»: gib ihm einen Namen und eine Zeit, speichere.',
    'Drag the grip of the new entry one hour down: the time changes and «Undo» is offered.': 'Ziehe den Griff des neuen Eintrags eine Stunde nach unten: die Zeit ändert sich und «Rückgängig» wird angeboten.',
    'Tap the entry, then «Delete»: it is gone and «Undo» brings it back.': 'Tippe den Eintrag an, dann «Löschen»: er ist weg und «Rückgängig» holt ihn zurück.',
  },
};
