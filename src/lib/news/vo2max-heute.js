// «VO2max auf Heute» (Noah 28.10.2026 «2 a und b», thread «Heute ruhiger»): a calm tile with the last VO2max and the
// change over four weeks, only when there is a value (src/lib/home/Vo2Tile.svelte)
export default {
  title: 'VO2max on Today',
  lead: 'Your fitness value at a glance.',
  points: [
    { text: 'The tile «VO2max» on Today has «Course»: it opens the tab VO2max in Körperwerte', go: { href: '#/flow/stats/vo2max', steps: [{ sel: '[data-btab="vo2max"]' }] } },
    { text: 'Under «Your body» a tile shows your last VO2max from Fitbit or Apple Health, its day and the change over four weeks', go: { href: '#/', steps: [{ sel: '[data-section="vo2max"]' }], where: 'Shows on Today under «Your body» once your watch has delivered a VO2max.' } },
  ],
  small: [
    { box: 'new', text: 'Last value, its day and the change since four weeks ago' },
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
    'Shows on Today under «Your body» once your watch has delivered a VO2max.': 'Zeigt sich auf Heute unter «Dein Körper», sobald deine Uhr einen VO2max geliefert hat.',
    'Under «Your body» a tile shows your last VO2max from Fitbit or Apple Health, its day and the change over four weeks': 'Unter «Dein Körper» zeigt eine Kachel deinen letzten VO2max von Fitbit oder Apple Health, seinen Tag und die Veränderung über vier Wochen',
    'The tile «VO2max» on Today has «Course»: it opens the tab VO2max in Körperwerte': 'Die Kachel «VO2max» auf Heute hat «Verlauf»: es öffnet den Reiter VO2max in Körperwerte',
    'Last value, its day and the change since four weeks ago': 'Letzter Wert, sein Tag und die Veränderung seit vier Wochen',
    'Without a value the tile stays away': 'Ohne Wert bleibt die Kachel weg',
    'Open Today and scroll to «Your body»: the tile «VO2max» shows a number in ml/kg/min with its day.': 'Öffne Heute und scrolle zu «Dein Körper»: die Kachel «VO2max» zeigt eine Zahl in ml/kg/min mit ihrem Tag.',
    'Tap «Course» on the tile: Körperwerte opens with the tab VO2max.': 'Tippe auf der Kachel «Verlauf»: Körperwerte öffnet sich mit dem Reiter VO2max.',
  },
};
