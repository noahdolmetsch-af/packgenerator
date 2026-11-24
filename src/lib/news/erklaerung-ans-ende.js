// «Erklärung ans Seitenende» (Noah 24.11.2026 «1-5a», impeccable Touren 4c): four Touren pages start with their content
export default {
  title: 'Explanations at the end of the page',
  lead: 'Fuelling plan, trips side by side, way to the goal and quiz start with their content. The explanation is one closed line at the end.',
  points: [
    { text: 'At the end of the page the line «How this page works» opens the explanation', go: { href: '#/trips/fuel', steps: [{ sel: '[data-page-note] summary' }] } },
  ],
  small: [],
  test: [
    'Open Trips › Food and water: the plan comes first, no paragraph above it.',
    'At the end tap «How this page works»: the explanation opens. The same on «Trips side by side», «Way to the goal» and «Quiz».',
  ],
  since: [],
  de: {
    'Explanations at the end of the page': 'Erklärungen am Seitenende',
    'Fuelling plan, trips side by side, way to the goal and quiz start with their content. The explanation is one closed line at the end.': 'Verpflegung, Touren nebeneinander, Weg zum Ziel und Quiz beginnen mit ihrem Inhalt. Die Erklärung ist eine geschlossene Zeile am Seitenende.',
    'At the end of the page the line «How this page works» opens the explanation': 'Am Seitenende öffnet die Zeile «So funktioniert diese Seite» die Erklärung',
    'Open Trips › Food and water: the plan comes first, no paragraph above it.': 'Öffne Touren › Verpflegung: der Plan steht zuerst, darüber kein Absatz.',
    'At the end tap «How this page works»: the explanation opens. The same on «Trips side by side», «Way to the goal» and «Quiz».': 'Tippe am Ende «So funktioniert diese Seite»: die Erklärung geht auf. Genauso bei «Touren nebeneinander», «Weg zum Ziel» und «Quiz».',
  },
};
