// «Höhenprofil überall» (Noah 23.11.2026 «1-5a», Idee A): the profile of the last tour in the debrief gets the steepness colours and the spot under the finger
export default {
  title: 'Debrief profiles in colours',
  lead: 'In the debrief, the elevation profile of your last tour shows how steep each stretch was, and tells you more when you tap it.',
  points: [{ text: 'Green is flat, yellow to dark red steeper, blue downhill; tap the profile for km, height and steepness', go: { href: '#/debrief', where: 'On «Debrief», in the card of your last tour (a tour with an uploaded ride).' } }],
  small: [],
  test: ['Open «Debrief»: the profile in the card of your last tour is coloured.', 'Tap the middle of the profile: a line over it says km, height and steepness.'],
  since: [],
  de: {
    'Debrief profiles in colours': 'Profile im Rückblick in Farben',
    'In the debrief, the elevation profile of your last tour shows how steep each stretch was, and tells you more when you tap it.': 'Im Rückblick zeigt das Höhenprofil deiner letzten Tour, wie steil jedes Stück war, und sagt mehr, wenn du es antippst.',
    'Green is flat, yellow to dark red steeper, blue downhill; tap the profile for km, height and steepness': 'Grün ist flach, Gelb bis Dunkelrot steiler, Blau bergab; tippe auf das Profil für km, Höhe und Steigung',
    'On «Debrief», in the card of your last tour (a tour with an uploaded ride).': 'Auf «Rückblick», in der Karte deiner letzten Tour (eine Tour mit hochgeladener Fahrt).',
    'Open «Debrief»: the profile in the card of your last tour is coloured.': 'Öffne «Rückblick»: das Profil in der Karte deiner letzten Tour ist farbig.',
    'Tap the middle of the profile: a line over it says km, height and steepness.': 'Tippe in die Mitte des Profils: eine Zeile darüber nennt km, Höhe und Steigung.',
  },
};
