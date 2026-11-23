// «Höhenprofil überall» (Noah 23.11.2026 «1-5a», Idee A): the profile of a ride gets the steepness colours and the spot under the finger
export default {
  title: 'The profile of a ride in colours',
  lead: 'The elevation profile of a ride now shows how steep each stretch is, and tells you more when you tap it.',
  points: [{ text: 'Green is flat, yellow to dark red is steeper, blue is downhill', go: { href: '#/debrief', where: 'On a ride page (Review › a ride), under «Numbers» and under «Planned vs real».' } }, { text: 'Tap or move over the profile: km, height and steepness of that spot', go: { href: '#/debrief', where: 'On a ride page (Review › a ride), tap the profile.' } }],
  small: [],
  test: ['Open a ride with a GPX file (Review › Rides › a ride): the profile under «Numbers» is coloured.', 'Tap the middle of the profile: a line over it says km, height and steepness.'],
  since: [],
  de: {
    'The profile of a ride in colours': 'Das Profil einer Fahrt in Farben',
    'The elevation profile of a ride now shows how steep each stretch is, and tells you more when you tap it.': 'Das Höhenprofil einer Fahrt zeigt jetzt, wie steil jedes Stück ist, und sagt mehr, wenn du es antippst.',
    'Green is flat, yellow to dark red is steeper, blue is downhill': 'Grün ist flach, Gelb bis Dunkelrot ist steiler, Blau geht bergab',
    'On a ride page (Review › a ride), under «Numbers» and under «Planned vs real».': 'Auf der Seite einer Fahrt (Rückblick › eine Fahrt), unter «Zahlen» und unter «Geplant gegen echt».',
    'Tap or move over the profile: km, height and steepness of that spot': 'Tippe auf das Profil oder fahre darüber: km, Höhe und Steigung an dieser Stelle',
    'On a ride page (Review › a ride), tap the profile.': 'Auf der Seite einer Fahrt (Rückblick › eine Fahrt) das Profil antippen.',
    'Open a ride with a GPX file (Review › Rides › a ride): the profile under «Numbers» is coloured.': 'Öffne eine Fahrt mit GPX-Datei (Rückblick › Fahrten › eine Fahrt): das Profil unter «Zahlen» ist farbig.',
    'Tap the middle of the profile: a line over it says km, height and steepness.': 'Tippe in die Mitte des Profils: eine Zeile darüber nennt km, Höhe und Steigung.',
  },
};
