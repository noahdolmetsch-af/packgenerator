// «Ausgeliehen: die Meldung steht beim Speichern» (Durchklick Etappe 2, Befund E2-005, Noah 05.11.2026)
export default {
  title: 'Lent out: the message stands next to «Save»',
  lead: 'When a new lending list is missing a name or a thing, the message now appears right above «Save».',
  points: [{ text: 'Lent out: «Please choose at least one thing.» is next to the Save button', go: { href: '#/gear/lend' } }],
  small: [],
  test: ['Open Gear › Lent out › «New lending list», type a name and tap «Save» without choosing a thing.', 'The red message appears right above «Save», you do not have to scroll up to find it.'],
  since: [],
  de: {
    'Lent out: the message stands next to «Save»': 'Ausgeliehen: Die Meldung steht beim Speichern',
    'When a new lending list is missing a name or a thing, the message now appears right above «Save».': 'Fehlt bei einer neuen Leihliste ein Name oder eine Sache, erscheint die Meldung jetzt direkt über «Speichern».',
    'Lent out: «Please choose at least one thing.» is next to the Save button': 'Ausgeliehen: «Bitte mindestens eine Sache wählen.» steht beim Speichern-Knopf',
    'Open Gear › Lent out › «New lending list», type a name and tap «Save» without choosing a thing.': 'Öffne Material › Ausgeliehen › «Neue Leihliste», tippe einen Namen und dann «Speichern», ohne eine Sache zu wählen.',
    'The red message appears right above «Save», you do not have to scroll up to find it.': 'Die rote Meldung erscheint direkt über «Speichern», du musst nicht nach oben scrollen.',
  },
};
