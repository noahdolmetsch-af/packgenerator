// «Kalender 1:1» Schritt 3 (Noah 28.10.2026 «1a 2a 3b»): repeat and appointment colour
export default {
  title: 'Repeats and colours for appointments',
  lead: 'A new appointment can repeat, and you can give it its own colour, as in Google.',
  points: [
    { text: 'New appointment › «Repeat»: every day, week, month or year, on weekdays only, or your own rhythm with an end', go: 'f.agenda' },
    { text: 'Give an appointment its own colour out of the eleven of Google; it shows in the week', go: { href: '#/me/agenda', where: 'Shows once Google Calendar is connected: open «New appointment» and look for «Colour».' } },
  ],
  small: [{ box: 'new', text: 'An appointment that already repeats keeps its rhythm; change the rhythm in Google' }],
  test: ['Open Planen › Termine › «New appointment», choose «Every week» under «Repeat» and enter it.', 'The appointment now stands on every week in the list and in the week view.', 'Open an appointment, pick a colour and save: the block in the week has that colour.'],
  since: [],
  de: {
    'Repeats and colours for appointments': 'Wiederholung und Farbe für Termine',
    'A new appointment can repeat, and you can give it its own colour, as in Google.': 'Ein neuer Termin kann sich wiederholen, und du kannst ihm eine eigene Farbe geben, wie bei Google.',
    'New appointment › «Repeat»: every day, week, month or year, on weekdays only, or your own rhythm with an end': 'Neuer Termin › «Wiederholung»: jeden Tag, jede Woche, jeden Monat, jedes Jahr, nur an Werktagen oder dein eigener Rhythmus mit Ende',
    'Give an appointment its own colour out of the eleven of Google; it shows in the week': 'Gib einem Termin eine eigene Farbe aus den elf von Google; sie zeigt sich in der Woche',
    'Shows once Google Calendar is connected: open «New appointment» and look for «Colour».': 'Erscheint, sobald Google Kalender verbunden ist: öffne «Termin eintragen» und suche «Farbe».',
    'An appointment that already repeats keeps its rhythm; change the rhythm in Google': 'Ein Termin, der sich schon wiederholt, behält seinen Rhythmus; den Rhythmus änderst du in Google',
    'Open Planen › Termine › «New appointment», choose «Every week» under «Repeat» and enter it.': 'Öffne Planen › Termine › «Termin eintragen», wähle unter «Wiederholung» «Jede Woche» und trage ihn ein.',
    'The appointment now stands on every week in the list and in the week view.': 'Der Termin steht jetzt in jeder Woche in der Liste und in der Wochenansicht.',
    'Open an appointment, pick a colour and save: the block in the week has that colour.': 'Öffne einen Termin, wähle eine Farbe und speichere: der Block in der Woche hat diese Farbe.',
  },
};
