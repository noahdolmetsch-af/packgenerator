// «Neuer Schwung» B22 «Rückgängig gleitet» (Noah 27.10.2026 «ich möchte b13 bis b24 alle umsetzen»): the notes with
// Undo stack instead of replacing each other, glide up, show their time and close with a swipe or ×
export default {
  title: 'Every Undo stays',
  lead: 'Two deletes in a row: both can come back.',
  points: [{ text: 'A second note no longer pushes away the first one: each keeps its own «Undo» for 4 seconds' }],
  small: [{ box: 'nicer', text: 'Notes glide up from below, a thin line shows the time left, swipe sideways or × closes them' }],
  test: ['Delete two learnings one after the other under Touren › Rückblick › Gelernt.', 'Both notes are at the bottom: «Zurücknehmen» on the upper one brings the first learning back.'],
  since: [],
  de: {
    'Every Undo stays': 'Jedes Rückgängig bleibt',
    'Dismiss message': 'Meldung ausblenden',
    'Take back|older note': 'Zurücknehmen',
    'Two deletes in a row: both can come back.': 'Zweimal nacheinander gelöscht: beides kommt zurück.',
    'A second note no longer pushes away the first one: each keeps its own «Undo» for 4 seconds': 'Eine zweite Meldung verdrängt die erste nicht mehr: jede behält 4 Sekunden ihr eigenes «Rückgängig»',
    'Notes glide up from below, a thin line shows the time left, swipe sideways or × closes them': 'Meldungen gleiten von unten auf, ein dünner Strich zeigt die Zeit, zur Seite wischen oder × schliesst sie',
    'Delete two learnings one after the other under Touren › Rückblick › Gelernt.': 'Lösche unter Touren › Rückblick › Gelernt zwei Erkenntnisse nacheinander.',
    'Both notes are at the bottom: «Zurücknehmen» on the upper one brings the first learning back.': 'Unten stehen beide Meldungen: «Zurücknehmen» bei der oberen holt die erste Erkenntnis zurück.',
  },
};
