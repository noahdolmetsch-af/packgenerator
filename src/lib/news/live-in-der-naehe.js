// «In der Nähe aufgeräumt» (Noah 27.10.2026 «1a», thread Live Navigation): one heading in the window,
// and the distance off the route in km once it is 1 km or more.
export default {
  title: 'Nearby, tidied up',
  lead: 'The window «Nearby» on the live map has one heading, and far off the route the app says km.',
  points: [
    { text: 'One heading in «Nearby» instead of two', href: '#/live', go: { href: '#/live', where: 'Shows on the live map during a ride: tap «Nearby».' } },
  ],
  small: [{ box: 'fixed', text: 'Off the route: from 1 km on in km (e.g. 27.4 km instead of 27400 m)' }],
  test: ['Open the live map, start a ride and open «Nearby»: there is only one heading at the top.', 'Ride more than 1 km away from the route: the red line says the distance in km.'],
  since: [],
  de: {
    'Nearby, tidied up': 'In der Nähe aufgeräumt',
    'The window «Nearby» on the live map has one heading, and far off the route the app says km.': 'Das Fenster «In der Nähe» auf der Live-Karte hat nur noch eine Überschrift, und weit neben der Strecke zeigt die App km.',
    'One heading in «Nearby» instead of two': 'Eine Überschrift in «In der Nähe» statt zwei',
    'Off the route: from 1 km on in km (e.g. 27.4 km instead of 27400 m)': 'Neben der Strecke: ab 1 km in km (z. B. 27.4 km statt 27400 m)',
    'Open the live map, start a ride and open «Nearby»: there is only one heading at the top.': 'Live-Karte öffnen, Fahrt starten und «In der Nähe» öffnen: oben steht nur eine Überschrift.',
    'Ride more than 1 km away from the route: the red line says the distance in km.': 'Mehr als 1 km neben der Strecke fahren: die rote Zeile nennt die Distanz in km.',
  },
};
