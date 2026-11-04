// «Training verbessern» 3c (Noah 3.11.2026 «3c»): a goal per sport («Yoga 2× per week») in the week suggestion
export default {
  title: 'A goal per sport',
  lead: 'In «Suggestion for this week» every sport of Aktiv has a «Times per week» setting with − and +. «Yoga 2×» puts two yoga sessions into the week. The app remembers it.',
  points: [{ text: 'Set how often a sport goes into the week', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }, { sel: '[data-sug-sports]' }] } }],
  small: [],
  test: [
    'Open Aktiv › Training, tap «Suggestion for this week» and look for «Times per week» (needs a sport in Aktiv).',
    'Tap + at a sport: it appears more often in the list below. Close and open the suggestion again: your number is still there.',
  ],
  since: [],
  de: {
    'A goal per sport': 'Ein Ziel pro Sportart',
    'In «Suggestion for this week» every sport of Aktiv has a «Times per week» setting with − and +. «Yoga 2×» puts two yoga sessions into the week. The app remembers it.': 'Bei «Vorschlag für diese Woche» hat jede Sportart aus Aktiv ein «Mal pro Woche» mit − und +. «Yoga 2×» legt zwei Yoga-Einheiten in die Woche. Die App merkt es sich.',
    'Set how often a sport goes into the week': 'Stelle ein, wie oft eine Sportart in die Woche kommt',
    'Open Aktiv › Training, tap «Suggestion for this week» and look for «Times per week» (needs a sport in Aktiv).': 'Öffne Aktiv › Training, tippe auf «Vorschlag für diese Woche» und such «Mal pro Woche» (braucht eine Sportart in Aktiv).',
    'Tap + at a sport: it appears more often in the list below. Close and open the suggestion again: your number is still there.': 'Tippe bei einer Sportart auf +: sie kommt in der Liste weiter unten öfter vor. Schliesse den Vorschlag und öffne ihn neu: deine Zahl ist noch da.',
  },
};
