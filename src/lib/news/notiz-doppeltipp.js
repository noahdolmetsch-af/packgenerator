// «Doppeltipp auf Speichern» in Notizen (Durchklick Etappe 4, Befund E4-004, Noah 05.11.2026)
export default {
  title: 'Notes: a double tap on Save keeps one note',
  lead: 'Tapping «Save» twice quickly under «New note» no longer creates the note twice.',
  points: [{ text: 'Notes: «Save» works once, however fast you tap', go: { href: '#/notes', steps: [{ text: 'New note' }] } }],
  small: [],
  test: ['Open Planning › Notes, write a note and tap «Save» twice quickly.', 'The note appears once in the list.'],
  since: [],
  de: {
    'Notes: a double tap on Save keeps one note': 'Notizen: Ein Doppeltipp auf «Speichern» legt nur eine Notiz an',
    'Tapping «Save» twice quickly under «New note» no longer creates the note twice.': 'Wer bei «Neue Notiz» zweimal schnell «Speichern» tippt, legt die Notiz nicht mehr doppelt an.',
    'Notes: «Save» works once, however fast you tap': 'Notizen: «Speichern» gilt einmal, egal wie schnell du tippst',
    'Open Planning › Notes, write a note and tap «Save» twice quickly.': 'Öffne Planen › Notizen, schreibe eine Notiz und tippe zweimal schnell auf «Speichern».',
    'The note appears once in the list.': 'Die Notiz steht nur einmal in der Liste.',
  },
};
