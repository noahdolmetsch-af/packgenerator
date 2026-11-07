// «Doppeltipp-Schutz als ein Baustein» (Durchklick Etappe 4, Noah 06.11.2026 «5a»)
export default {
  title: 'Save works once, in every window',
  lead: 'A second tap on «Save» right after the first now does nothing, in every window of the app at once.',
  points: [{ text: 'Every «Save» window: two quick taps save once', go: { href: '#/notes', steps: [{ text: 'New note' }] } }],
  small: [],
  test: ['Open Planning › Notes, write a note and tap «Save» twice quickly.', 'The note appears once in the list.'],
  since: [],
  de: {
    'Save works once, in every window': 'Speichern gilt einmal, in jedem Fenster',
    'A second tap on «Save» right after the first now does nothing, in every window of the app at once.': 'Ein zweiter Tipp auf «Speichern» gleich nach dem ersten tut nichts mehr, in allen Fenstern der App auf einmal.',
    'Every «Save» window: two quick taps save once': 'Jedes «Speichern»-Fenster: Zwei schnelle Tipps speichern einmal',
    'Open Planning › Notes, write a note and tap «Save» twice quickly.': 'Öffne Planen › Notizen, schreibe eine Notiz und tippe zweimal schnell auf «Speichern».',
    'The note appears once in the list.': 'Die Notiz steht nur einmal in der Liste.',
  },
};
