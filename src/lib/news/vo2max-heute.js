// «VO2max auf Heute» (Noah 28.10.2026 «2 a und b», thread «Heute ruhiger»): a calm tile with the last VO2max and the
// change over four weeks, only when there is a value (src/lib/home/Vo2Tile.svelte)
export default {
  title: 'VO2max on Today',
  lead: 'Your fitness value at a glance.',
  points: [
    { text: 'Under «Your body» a tile shows your last VO2max from Fitbit or Apple Health, its day and the change over four weeks', href: '#/flow/stats/vo2max' },
  ],
  small: [
    { box: 'new', text: '«Course» opens its tab in Körperwerte' },
    { box: 'nicer', text: 'Without a value the tile stays away' },
  ],
  test: [
    'Open Today and scroll to «Your body»: the tile «VO2max» shows a number in ml/kg/min with its day.',
    'Tap «Course» on the tile: Körperwerte opens with the tab VO2max.',
  ],
  since: [],
  de: {
    'VO2max on Today': 'VO2max auf Heute',
    'Your fitness value at a glance.': 'Dein Fitnesswert auf einen Blick.',
    'Under «Your body» a tile shows your last VO2max from Fitbit or Apple Health, its day and the change over four weeks': 'Unter «Dein Körper» zeigt eine Kachel deinen letzten VO2max von Fitbit oder Apple Health, seinen Tag und die Veränderung über vier Wochen',
    '«Course» opens its tab in Körperwerte': '«Verlauf» öffnet seinen Reiter in Körperwerte',
    'Without a value the tile stays away': 'Ohne Wert bleibt die Kachel weg',
    'Open Today and scroll to «Your body»: the tile «VO2max» shows a number in ml/kg/min with its day.': 'Öffne Heute und scrolle zu «Dein Körper»: die Kachel «VO2max» zeigt eine Zahl in ml/kg/min mit ihrem Tag.',
    'Tap «Course» on the tile: Körperwerte opens with the tab VO2max.': 'Tippe auf der Kachel «Verlauf»: Körperwerte öffnet sich mit dem Reiter VO2max.',
  },
};
