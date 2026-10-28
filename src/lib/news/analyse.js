// «Analyse» PR 1 (Noah 27.10.2026 «1a 2a 3a 4a 5b», thread «Analyse-Tool für alle Daten»): every value on one
// page, «Mehr» on «Aktiv heute» leads there, and the «•••» on the tiles no longer cover the names
export default {
  title: 'Analyse: all your values',
  lead: 'One page with every value of the app, from Fitbit, Strava, your body, «Wi gaht\'s?» and Aktiv.',
  points: [
    { text: 'Auswerten › Analyse: every value as a tile with its course', go: 'f.analyse' },
    { text: '«More» under «Active today» on Today leads there', go: { href: '#/', where: 'On Today, below the tiles of «Active today».' } },
  ],
  small: [{ box: 'fixed', text: 'The «•••» on the activity tiles no longer cover the names', go: { href: '#/', where: 'On Today, below the tiles of «Active today».' } }],
  test: [
    'On Today, at «Active today»: long names like «Liegestütze» stand whole, the «•••» sit on the right beside them.',
    'Tap «More» below the tiles: the page Analyse opens with groups Heart, Sleep, Movement and your activities.',
    'Tap a source chip (e.g. Strava) to switch it off, and choose «90 days»: the tiles change.',
    'Tap a tile, e.g. «Resting pulse» or «Sauna»: its course opens.',
  ],
  since: ['f.analyse'],
  de: {
    'On Today, below the tiles of «Active today».': 'Auf Heute, unter den Kacheln von «Aktiv heute».',
    'Analyse: all your values': 'Analyse: alle deine Werte',
    'One page with every value of the app, from Fitbit, Strava, your body, «Wi gaht\'s?» and Aktiv.': 'Eine Seite mit jedem Wert der App, aus Fitbit, Strava, deinem Körper, «Wi gaht\'s?» und Aktiv.',
    'Auswerten › Analyse: every value as a tile with its course': 'Auswerten › Analyse: jeder Wert als Kachel mit seinem Verlauf',
    '«More» under «Active today» on Today leads there': '«Mehr» unter «Aktiv heute» auf Heute führt dorthin',
    'The «•••» on the activity tiles no longer cover the names': 'Die «•••» auf den Aktivitäts-Kacheln decken die Namen nicht mehr ab',
    'On Today, at «Active today»: long names like «Liegestütze» stand whole, the «•••» sit on the right beside them.': 'Auf Heute bei «Aktiv heute»: Lange Namen wie «Liegestütze» stehen ganz da, die «•••» sitzen rechts daneben.',
    'Tap «More» below the tiles: the page Analyse opens with groups Heart, Sleep, Movement and your activities.': 'Tippe unter den Kacheln auf «Mehr»: Die Seite Analyse öffnet sich mit den Gruppen Herz, Schlaf, Bewegung und deinen Aktivitäten.',
    'Tap a source chip (e.g. Strava) to switch it off, and choose «90 days»: the tiles change.': 'Tippe auf eine Quelle (z. B. Strava), um sie auszuschalten, und wähle «90 Tage»: Die Kacheln ändern sich.',
    'Tap a tile, e.g. «Resting pulse» or «Sauna»: its course opens.': 'Tippe eine Kachel an, z. B. «Ruhepuls» oder «Sauna»: Ihr Verlauf öffnet sich.',
  },
};
