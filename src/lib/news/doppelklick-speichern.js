// «Doppeltipp auf Speichern» (Durchklick Etappe 4, Befund E4-003, Noah 05.11.2026)
export default {
  title: 'Remember: a double tap on Save adds once',
  lead: 'Tapping «Save» twice quickly in the to-do, birthday, plant or list window no longer adds the entry twice.',
  points: [{ text: 'Remember: «Save» works once, however fast you tap', go: { href: '#/calendar', steps: [{ text: 'Add a to-do' }] } }],
  small: [],
  test: ['Open Planning › Remember, tap «Add a to-do», write something and tap «Save» twice quickly.', 'The to-do appears once in the list.'],
  since: [],
  de: {
    'Remember: a double tap on Save adds once': 'Merken: Ein Doppeltipp auf «Speichern» legt nur einmal an',
    'Tapping «Save» twice quickly in the to-do, birthday, plant or list window no longer adds the entry twice.': 'Wer im Fenster für To-do, Geburtstag, Pflanze oder Liste zweimal schnell «Speichern» tippt, legt den Eintrag nicht mehr doppelt an.',
    'Remember: «Save» works once, however fast you tap': 'Merken: «Speichern» gilt einmal, egal wie schnell du tippst',
    'Open Planning › Remember, tap «Add a to-do», write something and tap «Save» twice quickly.': 'Öffne Planen › Merken, tippe «To-do hinzufügen», schreibe etwas und tippe zweimal schnell auf «Speichern».',
    'The to-do appears once in the list.': 'Das To-do steht nur einmal in der Liste.',
  },
};
