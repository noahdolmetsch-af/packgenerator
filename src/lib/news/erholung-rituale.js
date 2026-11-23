// «Erholung und Rituale» (Noah 22.11.2026 «a», Thread «Alle Sportarten und Erholung», Schritt J): sauna, meditation, friends … as times per week
export default {
  title: 'Rest and rituals',
  lead: 'Sauna, meditation, friends and the like are counted as times per week, next to your goal, and never as sport hours.',
  points: [
    { text: 'The week review has a card «Rest and rituals»: how many times each ritual happened, on how many days, with your goal of the week', go: { href: '#/flow/review', steps: [{ sel: '[data-rituale="week"]' }], where: 'Week review, under «Form and recovery» (when you ticked a ritual or gave one a goal).' } },
    { text: 'The Sports year shows the same card for the period: times, the mean per week, the goal and the year before', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-rituale="period"]' }], where: 'Analysis › Sports year, above «Ticks and rhythm».' } },
  ],
  small: [{ box: 'new', text: 'Time shows only where it was measured; the usual duration is not added up for rituals' }],
  test: [
    'Open the week review: a card «Rest and rituals» lists your rituals with the times of the week and the goal.',
    'Open Analysis › Sports year: the same card shows times, the mean per week and, for a year, the year before.',
  ],
  since: [],
  de: {
    'Rest and rituals': 'Erholung und Rituale',
    'Sauna, meditation, friends and the like are counted as times per week, next to your goal, and never as sport hours.': 'Sauna, Meditation, Freunde und Ähnliches werden als Mal pro Woche gezählt, neben deinem Ziel, und nie als Sportstunden.',
    'The week review has a card «Rest and rituals»: how many times each ritual happened, on how many days, with your goal of the week': 'Der Wochenrückblick hat eine Karte «Erholung und Rituale»: wie oft jedes Ritual vorkam, an wie vielen Tagen, mit deinem Ziel der Woche',
    'Week review, under «Form and recovery» (when you ticked a ritual or gave one a goal).': 'Wochenrückblick, unter «Form und Erholung» (wenn du ein Ritual abgehakt oder ihm ein Ziel gegeben hast).',
    'The Sports year shows the same card for the period: times, the mean per week, the goal and the year before': 'Das Sportjahr zeigt dieselbe Karte für den Zeitraum: Mal, Mittel pro Woche, Ziel und das Jahr davor',
    'Analysis › Sports year, above «Ticks and rhythm».': 'Auswerten › Sportjahr, über «Haken und Rhythmus».',
    'Time shows only where it was measured; the usual duration is not added up for rituals': 'Zeit steht nur dort, wo sie gemessen wurde; die übliche Dauer wird bei Ritualen nicht aufsummiert',
    'Open the week review: a card «Rest and rituals» lists your rituals with the times of the week and the goal.': 'Öffne den Wochenrückblick: eine Karte «Erholung und Rituale» listet deine Rituale mit den Malen der Woche und dem Ziel.',
    'Open Analysis › Sports year: the same card shows times, the mean per week and, for a year, the year before.': 'Öffne Auswerten › Sportjahr: dieselbe Karte zeigt Mal, Mittel pro Woche und bei einem Jahr das Jahr davor.',
  },
};
