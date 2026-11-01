// Live-Navigation «Karte dreht» (Noah 31.10.2026 «1-5 a», Frage 2a): the map turns with you on the way to a goal
export default {
  title: 'The map turns with you',
  lead: 'On the way to a goal your direction points up and the map zooms in before a turn.',
  points: [
    { text: 'The map turns so that you always ride «up» and zooms in before a turn', href: '#/live', go: 'f.live' },
    { text: '«North up» puts the map back to north, one tap turns it on again', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'New button «North up» on the live map', go: 'f.live' }],
  test: ['Ride to a goal on the live map: the map turns with you and zooms in before a turn.', 'Tap the arrow button «North up»: the map stays north up. Tap it again: it turns again.'],
  since: [],
  de: {
    'The map turns with you': 'Die Karte dreht mit dir',
    'On the way to a goal your direction points up and the map zooms in before a turn.': 'Auf dem Weg zu einem Ziel zeigt deine Fahrtrichtung nach oben, und die Karte zoomt vor einer Abzweigung hinein.',
    'The map turns so that you always ride «up» and zooms in before a turn': 'Die Karte dreht so, dass du immer «nach oben» fährst, und zoomt vor einer Abzweigung hinein',
    '«North up» puts the map back to north, one tap turns it on again': '«Norden oben» stellt die Karte wieder nach Norden, ein Tipp schaltet das Drehen wieder ein',
    'New button «North up» on the live map': 'Neuer Knopf «Norden oben» auf der Live-Karte',
    'Ride to a goal on the live map: the map turns with you and zooms in before a turn.': 'Auf der Live-Karte zu einem Ziel fahren: Die Karte dreht mit dir und zoomt vor einer Abzweigung hinein.',
    'Tap the arrow button «North up»: the map stays north up. Tap it again: it turns again.': 'Den Pfeil-Knopf «Norden oben» antippen: Die Karte bleibt nach Norden. Nochmal antippen: Sie dreht wieder.',
  },
};
