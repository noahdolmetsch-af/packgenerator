// «Höhenprofil wird abgefahren» (Noah 03.11.2026 «E und F», Paket E, Idee 13): a dot rides the profile once
export default {
  title: 'The profile is ridden',
  lead: 'When a tour opens, a small dot rides along the elevation line once and the line draws itself behind it.',
  points: [{ text: 'Open a finished tour: the dot rides its elevation profile in about a second and a half', go: { href: '#/trips/rides', where: 'Tour page: open a finished tour, the profile sits under the map.' } }],
  small: [{ box: 'new', text: 'With «reduce motion» or motion «Off» nothing rides: the profile is there at once' }],
  test: [
    'Open Trips › Rides and tap a finished tour.',
    'Scroll to the elevation profile: a dot rides along it once.',
    'Switch motion to «Off» (Me › Appearance) and open the tour again: no dot, the profile is just there.',
  ],
  since: [],
  de: {
    'The profile is ridden': 'Das Profil wird abgefahren',
    'When a tour opens, a small dot rides along the elevation line once and the line draws itself behind it.': 'Beim Öffnen einer Tour fährt ein kleiner Punkt einmal die Höhenlinie ab, und die Linie zeichnet sich hinter ihm.',
    'Open a finished tour: the dot rides its elevation profile in about a second and a half': 'Öffne eine abgeschlossene Tour: der Punkt fährt ihr Höhenprofil in etwa anderthalb Sekunden ab',
    'Tour page: open a finished tour, the profile sits under the map.': 'Tour-Seite: öffne eine abgeschlossene Tour, das Profil steht unter der Karte.',
    'With «reduce motion» or motion «Off» nothing rides: the profile is there at once': 'Mit «Bewegung reduzieren» oder Bewegung «Aus» fährt nichts: das Profil ist sofort da',
    'Open Trips › Rides and tap a finished tour.': 'Öffne Touren › Fahrten und tippe auf eine abgeschlossene Tour.',
    'Scroll to the elevation profile: a dot rides along it once.': 'Scrolle zum Höhenprofil: ein Punkt fährt einmal daran entlang.',
    'Switch motion to «Off» (Me › Appearance) and open the tour again: no dot, the profile is just there.': 'Stelle die Bewegung auf «Aus» (Ich › Darstellung) und öffne die Tour nochmals: kein Punkt, das Profil ist einfach da.',
  },
};
