// «Neues Teil ohne Kategorie» (Durchklick Etappe 2, Befund E2-002, Noah 05.11.2026)
export default {
  title: 'New thing without a category: the message names the place',
  lead: 'A new thing closed with only a name now says where to find it: under «No category».',
  points: [{ text: 'Gear › add a thing, type a name only, close: the message says «under No category»', go: { href: '#/gear', steps: [{ sel: '.addb' }] } }],
  small: [],
  test: ['Open Gear, tap «Add item», type only a name and close the window with the ✕.', 'The message names the place: «You find it under No category». Open the thing there and pick a category.'],
  since: [],
  de: {
    'New thing without a category: the message names the place': 'Neues Teil ohne Kategorie: Die Meldung nennt den Ort',
    'A new thing closed with only a name now says where to find it: under «No category».': 'Ein neues Teil, das nur mit einem Namen geschlossen wird, sagt jetzt, wo du es findest: unter «Ohne Kategorie».',
    'Gear › add a thing, type a name only, close: the message says «under No category»': 'Material › Teil hinzufügen, nur einen Namen tippen, schliessen: Die Meldung sagt «unter Ohne Kategorie»',
    'Open Gear, tap «Add item», type only a name and close the window with the ✕.': 'Öffne Material, tippe auf «Teil hinzufügen», tippe nur einen Namen und schliesse das Fenster mit dem ✕.',
    'The message names the place: «You find it under No category». Open the thing there and pick a category.': 'Die Meldung nennt den Ort: «Du findest es unter Ohne Kategorie». Öffne das Teil dort und wähle eine Kategorie.',
  },
};
