// «Neuer Schwung» E8 «Schalter Bewegung» (Noah 27.10.2026 «1a 2a 3a 4a 5a», idea E8): Ich › Darstellung › Bedienung
// › Bewegung: Voll, Ruhig or Aus, for all moving building blocks at once
export default {
  title: 'You decide how much moves',
  lead: 'Full, calm or off: one switch for all movements.',
  points: [{ text: 'Me › Appearance › Handling › Motion: Full, Calm or Off', href: '#/me/look' }],
  small: [{ box: 'new', text: 'Calm leaves out the confetti, Off stops every movement in the app' }],
  test: ['Open Ich › Darstellung and choose «Aus» under Bedienung › Bewegung.', 'Delete something and look at the note at the bottom: it appears without gliding. Then choose «Voll» again.'],
  since: [],
  de: {
    'You decide how much moves': 'Du bestimmst, wie viel sich bewegt',
    'Full, calm or off: one switch for all movements.': 'Voll, ruhig oder aus: ein Schalter für alle Bewegungen.',
    'Me › Appearance › Handling › Motion: Full, Calm or Off': 'Ich › Darstellung › Bedienung › Bewegung: Voll, Ruhig oder Aus',
    'Calm leaves out the confetti, Off stops every movement in the app': 'Ruhig lässt den Farbregen weg, Aus hält jede Bewegung in der App an',
    'Open Ich › Darstellung and choose «Aus» under Bedienung › Bewegung.': 'Öffne Ich › Darstellung und wähle unter Bedienung › Bewegung «Aus».',
    'Delete something and look at the note at the bottom: it appears without gliding. Then choose «Voll» again.': 'Lösche etwas und schau die Meldung unten an: sie erscheint ohne Gleiten. Danach wieder «Voll» wählen.',
    // the switch itself (Ich › Darstellung), kept here so de/index.js needs no new line
    Motion: 'Bewegung',
    'Full|motion': 'Voll',
    'Calm|motion': 'Ruhig',
    'Off|motion': 'Aus',
    'Full: everything glides, big moments with confetti. Calm: small movements only. Off: nothing moves.': 'Voll: alles gleitet, grosse Momente mit Farbregen. Ruhig: nur kleine Bewegungen. Aus: nichts bewegt sich.',
  },
};
