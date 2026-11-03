// «Strecke als Bild» (Noah 03.11.2026 «E und F», Paket E, Idee 23): the shape of a route next to each trip
export default {
  title: 'Route as a picture',
  lead: 'Every trip with a route shows its shape as a small sign in the list.',
  points: [{ text: 'Trips: each planned and each finished trip with a route shows its shape next to the km', go: { href: '#/trips', steps: [{ sel: '[data-route-shape]' }] } }],
  small: [{ box: 'new', text: 'A trip without a route shows no sign; nothing is invented' }],
  test: [
    'Open Trips.',
    'Look at a trip that has a route: its shape sits next to the km.',
    'Look at a trip without a route: no sign, the line «without a route» stays.',
  ],
  since: [],
  de: {
    'Route as a picture': 'Strecke als Bild',
    'Every trip with a route shows its shape as a small sign in the list.': 'Jede Tour mit Strecke zeigt in der Liste ihre Form als kleines Zeichen.',
    'Trips: each planned and each finished trip with a route shows its shape next to the km': 'Touren: jede geplante und jede abgeschlossene Tour mit Strecke zeigt ihre Form neben den Kilometern',
    'A trip without a route shows no sign; nothing is invented': 'Eine Tour ohne Strecke zeigt kein Zeichen; es wird nichts erfunden',
    'Open Trips.': 'Öffne Touren.',
    'Look at a trip that has a route: its shape sits next to the km.': 'Schau eine Tour mit Strecke an: ihre Form steht neben den Kilometern.',
    'Look at a trip without a route: no sign, the line «without a route» stays.': 'Schau eine Tour ohne Strecke an: kein Zeichen, die Zeile «ohne Strecke» bleibt.',
  },
};
