// «Schlag deinen Geist» (Noah 04.11.2026 «4b»): choose the ghost before the ride, on the live map
export default {
  title: 'Choose your ghost before the ride',
  lead: 'Before you start, the live map asks who you ride against today: your last ride on this tour, an earlier one, or nobody. During the ride you see how far ahead or behind your ghost you are.',
  points: [
    {
      text: 'Before the start you choose your ghost: your last ride, an earlier one on this tour, or «Without a ghost»',
      go: { href: '#/trips', where: 'Open the live map with a tour that has an earlier ride recorded in the app: the box «Who do you ride against today?» sits above «During the ride».' },
    },
    {
      text: 'During the ride you can change the ghost, and the line says «ahead of / behind your ghost of» with its day',
      go: { where: 'Open the live map with a tour that has an earlier ride recorded in the app: the box «Who do you ride against today?» sits above «During the ride».' },
    },
  ],
  small: [{ box: 'new', text: 'Only rides recorded in the app can be a ghost; Strava rides keep no track here', go: null }],
  test: [
    'Open the live map with a tour you have already recorded once in the app.',
    'Above «During the ride» the box «Who do you ride against today?» lists your last ride and older ones; the last ride is chosen.',
    'Choose «Without a ghost»: during the ride the line against the ghost stays away. Choose a ride again: it comes back.',
  ],
  since: [],
  de: {
    'Choose your ghost before the ride': 'Wähle deinen Geist vor der Fahrt',
    'Before you start, the live map asks who you ride against today: your last ride on this tour, an earlier one, or nobody. During the ride you see how far ahead or behind your ghost you are.': 'Vor dem Start fragt die Live-Karte, gegen wen du heute fährst: deine letzte Fahrt auf dieser Tour, eine frühere oder niemanden. Während der Fahrt siehst du, wie weit du vor oder hinter deinem Geist liegst.',
    'Before the start you choose your ghost: your last ride, an earlier one on this tour, or «Without a ghost»': 'Vor dem Start wählst du deinen Geist: deine letzte Fahrt, eine frühere auf dieser Tour oder «Ohne Geist»',
    'During the ride you can change the ghost, and the line says «ahead of / behind your ghost of» with its day': 'Während der Fahrt kannst du den Geist wechseln, und die Zeile nennt den Tag deines Geists',
    'Only rides recorded in the app can be a ghost; Strava rides keep no track here': 'Nur in der App aufgezeichnete Fahrten können ein Geist sein; Strava-Fahrten haben hier keine Spur',
    'Open the live map with a tour that has an earlier ride recorded in the app: the box «Who do you ride against today?» sits above «During the ride».': 'Öffne die Live-Karte mit einer Tour, zu der es eine in der App aufgezeichnete frühere Fahrt gibt: der Kasten «Gegen wen fährst du heute?» steht über «Während der Fahrt».',
    'Open the live map with a tour you have already recorded once in the app.': 'Öffne die Live-Karte mit einer Tour, die du schon einmal in der App aufgezeichnet hast.',
    'Above «During the ride» the box «Who do you ride against today?» lists your last ride and older ones; the last ride is chosen.': 'Über «Während der Fahrt» listet der Kasten «Gegen wen fährst du heute?» deine letzte und ältere Fahrten; die letzte ist gewählt.',
    'Choose «Without a ghost»: during the ride the line against the ghost stays away. Choose a ride again: it comes back.': 'Wähle «Ohne Geist»: während der Fahrt bleibt die Zeile gegen den Geist weg. Wähle wieder eine Fahrt: sie kommt zurück.',
  },
};
