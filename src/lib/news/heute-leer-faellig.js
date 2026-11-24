// «Heute fällig» auch auf leerem Gerät (Regel 11: was heute fällig ist, versteckt sich nie)
export default {
  title: 'Due today also on an empty Today',
  lead: 'Something due today now shows on Today even when nothing else is set up yet.',
  points: [
    { text: 'With Fitbit connected, the body block also stands on an empty Today and says why a value is missing', go: { href: '#/', where: 'The body block on Today.' } },
    { text: 'A team date, a to-do or bike care due today stands on Today even with no bike or trip yet', go: { href: '#/', where: 'The card «Due today» on Today.' } },
  ],
  small: [],
  test: [
    'Open Today on a device with only a calendar link: the date of today stands under «Start here».',
    'Add a bike: «Due today» stays on Today.',
  ],
  since: [],
  de: {
    'Due today also on an empty Today': 'Heute fällig auch auf leerer Heute-Seite',
    'Something due today now shows on Today even when nothing else is set up yet.': 'Was heute fällig ist, steht jetzt auf Heute, auch wenn sonst noch nichts eingerichtet ist.',
    'A team date, a to-do or bike care due today stands on Today even with no bike or trip yet': 'Ein Termin, ein To-do oder Velopflege, die heute fällig sind, stehen auf Heute, auch ohne Velo und Tour',
    'The card «Due today» on Today.': 'Die Karte «Heute fällig» auf Heute.',
    'The body block on Today.': 'Der Körper-Block auf Heute.',
    'With Fitbit connected, the body block also stands on an empty Today and says why a value is missing': 'Mit verbundenem Fitbit steht der Körper-Block auch auf leerer Heute-Seite und sagt, warum ein Wert fehlt',
    'Open Today on a device with only a calendar link: the date of today stands under «Start here».': 'Öffne Heute auf einem Gerät mit nur einem Kalender-Link: Der Termin von heute steht unter «Starte hier».',
    'Add a bike: «Due today» stays on Today.': 'Erfasse ein Velo: «Heute fällig» bleibt auf Heute.',
  },
};
