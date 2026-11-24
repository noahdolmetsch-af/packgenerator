// «Aktionen in Auswerten» (Noah 23.11.2026 «1-5a», 3a), Teil 1: «Rückgängig» bleibt 8 Sekunden, überall gleich
export default {
  title: 'Undo stays 8 seconds',
  lead: '«Undo» on every note now stays 8 seconds instead of 4, and the time stops while you hold the note.',
  points: [
    { text: 'Every note with «Undo» (deleted, renamed, saved, ticked) stays 8 seconds, and stops while the mouse or a finger is on it or it has the focus', go: { href: '#/', where: 'Delete or rename something small (for example a weight or an idea): the note at the bottom stays 8 seconds.' } },
  ],
  small: [],
  test: [
    'Delete a small thing (for example a weight in «Gewicht»): the note with «Undo» stays about 8 seconds.',
    'Put the mouse (or a finger) on the note: the thin line stops and the note stays until you let go.',
  ],
  since: [],
  de: {
    'Undo stays 8 seconds': '«Rückgängig» bleibt 8 Sekunden',
    '«Undo» on every note now stays 8 seconds instead of 4, and the time stops while you hold the note.': '«Rückgängig» bleibt auf jedem Hinweis jetzt 8 statt 4 Sekunden, und die Zeit steht still, solange du den Hinweis festhältst.',
    'Every note with «Undo» (deleted, renamed, saved, ticked) stays 8 seconds, and stops while the mouse or a finger is on it or it has the focus': 'Jeder Hinweis mit «Rückgängig» (gelöscht, umbenannt, gespeichert, abgehakt) bleibt 8 Sekunden und hält an, solange Maus oder Finger darauf sind oder er den Fokus hat',
    'Delete or rename something small (for example a weight or an idea): the note at the bottom stays 8 seconds.': 'Lösche oder benenne etwas Kleines um (zum Beispiel ein Gewicht oder eine Idee): Der Hinweis unten bleibt 8 Sekunden.',
    'Delete a small thing (for example a weight in «Gewicht»): the note with «Undo» stays about 8 seconds.': 'Lösche etwas Kleines (zum Beispiel ein Gewicht): Der Hinweis mit «Rückgängig» bleibt etwa 8 Sekunden.',
    'Put the mouse (or a finger) on the note: the thin line stops and the note stays until you let go.': 'Halte die Maus (oder einen Finger) auf den Hinweis: Die dünne Linie hält an, und der Hinweis bleibt, bis du loslässt.',
  },
};
