// «Termin entfernen mit Rückgängig» (Durchklick Etappe 4, Befund E4-005, Noah 05.11.2026)
export default {
  title: 'Week: removing a date can be undone',
  lead: 'The × on a date or to-do in the week plan now says what happened and offers «Undo».',
  points: [{ text: 'Week: «Undo» after removing a date or to-do', go: { href: '#/week', steps: [{ text: 'Date' }] } }],
  small: [],
  test: ['Open Planning › Week, add a date and tap the × next to it.', 'The date is gone and «Undo» appears; tap it and the date is back.'],
  since: [],
  de: {
    'Week: removing a date can be undone': 'Woche: Einen Termin entfernen lässt sich zurücknehmen',
    'The × on a date or to-do in the week plan now says what happened and offers «Undo».': 'Das × bei einem Termin oder einer Aufgabe im Wochenplan sagt jetzt, was passiert ist, und bietet «Rückgängig» an.',
    'Week: «Undo» after removing a date or to-do': 'Woche: «Rückgängig» nach dem Entfernen eines Termins oder einer Aufgabe',
    'Open Planning › Week, add a date and tap the × next to it.': 'Öffne Planen › Woche, lege einen Termin an und tippe das × daneben.',
    'The date is gone and «Undo» appears; tap it and the date is back.': 'Der Termin ist weg und «Rückgängig» erscheint; tippe darauf, und der Termin ist zurück.',
  },
};
