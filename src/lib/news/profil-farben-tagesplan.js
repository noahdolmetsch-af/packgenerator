// «Höhenprofil überall» (Noah 23.11.2026 «1-5a», Idee A): the profile of the stage on «Unterwegs» gets the steepness colours and the spot under the finger
export default {
  title: 'The profile of the day in colours',
  lead: 'On the way, the elevation profile of today’s stage shows how steep each stretch is, and tells you more when you tap it.',
  points: [{ text: 'Green is flat, yellow to dark red steeper, blue downhill; tap the profile for km, height and steepness', go: { href: '#/ride', where: 'On «On the way» (a tour with a GPX route), under the times of the stage.' } }],
  small: [],
  test: ['Open «On the way» with a tour that has a GPX route: the profile under the times is coloured.', 'Tap the middle of the profile: a line over it says km, height and steepness.'],
  since: [],
  de: {
    'The profile of the day in colours': 'Das Profil des Tages in Farben',
    'On the way, the elevation profile of today’s stage shows how steep each stretch is, and tells you more when you tap it.': 'Unterwegs zeigt das Höhenprofil der heutigen Etappe, wie steil jedes Stück ist, und sagt mehr, wenn du es antippst.',
    'Green is flat, yellow to dark red steeper, blue downhill; tap the profile for km, height and steepness': 'Grün ist flach, Gelb bis Dunkelrot steiler, Blau bergab; tippe auf das Profil für km, Höhe und Steigung',
    'On «On the way» (a tour with a GPX route), under the times of the stage.': 'Auf «Unterwegs» (eine Tour mit GPX-Route), unter den Zeiten der Etappe.',
    'Open «On the way» with a tour that has a GPX route: the profile under the times is coloured.': 'Öffne «Unterwegs» mit einer Tour, die eine GPX-Route hat: das Profil unter den Zeiten ist farbig.',
    'Tap the middle of the profile: a line over it says km, height and steepness.': 'Tippe in die Mitte des Profils: eine Zeile darüber nennt km, Höhe und Steigung.',
  },
};
