// «Nichts doppelt: Gewohnheiten» (Noah 04.11.2026 «1a»): «Active today» leaves out what stands on top as a habit
export default {
  title: 'Active today shows only what is not up with your habits',
  lead: 'Yoga on top as a habit card and again as a tile below: that is over. A quiet line names what stands on top.',
  points: [{ text: '«Active today» leaves out the activities that already stand on top of Today as habit cards', go: { href: '#/', steps: [{ sel: '[data-section="acts"]' }] } }],
  small: [],
  test: [
    'Open Today: an activity that stands on top as a habit card is not a tile in «Active today».',
    'Under the tiles one line says which activities are up with your habits. Take a habit away (pencil on the card): its tile is back.',
  ],
  since: [],
  de: {
    'Active today shows only what is not up with your habits': 'Aktiv heute zeigt nur, was nicht oben bei deinen Gewohnheiten steht',
    'Yoga on top as a habit card and again as a tile below: that is over. A quiet line names what stands on top.': 'Yoga oben als Gewohnheits-Karte und unten nochmals als Kachel: das ist vorbei. Eine leise Zeile nennt, was oben steht.',
    '«Active today» leaves out the activities that already stand on top of Today as habit cards': '«Aktiv heute» lässt die Aktivitäten weg, die schon oben auf Heute als Gewohnheits-Karten stehen',
    'Open Today: an activity that stands on top as a habit card is not a tile in «Active today».': 'Öffne Heute: Eine Aktivität, die oben als Gewohnheits-Karte steht, ist keine Kachel in «Aktiv heute».',
    'Under the tiles one line says which activities are up with your habits. Take a habit away (pencil on the card): its tile is back.': 'Unter den Kacheln sagt eine Zeile, welche Aktivitäten oben bei den Gewohnheiten stehen. Nimm eine Gewohnheit weg (Stift auf der Karte): Ihre Kachel ist wieder da.',
    '{list}: up with your habits': '{list}: oben bei deinen Gewohnheiten',
  },
};
