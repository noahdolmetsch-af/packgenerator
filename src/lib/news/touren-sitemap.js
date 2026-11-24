// «Sitemap» Touren (Noah 24.11.2026 «K1-K9»): Rennen als Reiter, Werkzeuge für eine Tour, «Unterwegs» auf der Übersicht. Eine Datei für den ganzen PR.
export default {
  title: 'Trips: Races as a tab, tools for a tour',
  lead: 'Races are the third tab of Trips, the tools of one tour sit in one closed row, and «On the way» is one tap from the overview.',
  points: [
    { text: 'Trips has a tab «Races» next to Dreams; «Templates» moved behind «More» on the phone', go: { href: '#/trips', steps: [{ text: 'Races' }] } },
    { text: 'Packing a tour: under «More about this trip» the new row «Tools for this tour» holds food and water, tour path, way to the goal, trips side by side, stops, quiz and checks per trip type', go: { href: '#/pack', steps: [{ sel: '[data-morefold="tools"]' }] } },
    { text: 'With a planned tour, the overview of Trips shows «On the way ›» beside «Races ›»', go: { href: '#/trips', steps: [{ sel: '[data-to-ontheway]' }] } },
  ],
  small: [],
  test: ['Open Trips: the third tab is «Races». Tap it: your races open and the tab stays lit.', 'On a phone tap «More» in the tab bar: «Templates» is there.', 'Open Pack with a tour, scroll to «More about this trip» and open «Tools for this tour»: seven ways, each opens its page.', 'On Trips › Overview with a planned tour tap «On the way ›».'],
  since: [],
  de: {
    'Trips: Races as a tab, tools for a tour': 'Touren: Rennen als Reiter, Werkzeuge für eine Tour',
    'Races are the third tab of Trips, the tools of one tour sit in one closed row, and «On the way» is one tap from the overview.': 'Rennen sind der dritte Reiter von Touren, die Werkzeuge einer Tour stehen in einer geschlossenen Zeile, und «Unterwegs» ist von der Übersicht einen Tipp entfernt.',
    'Trips has a tab «Races» next to Dreams; «Templates» moved behind «More» on the phone': 'Touren hat einen Reiter «Rennen» neben Träume; «Vorlagen» ist am Handy hinter «Mehr»',
    'Packing a tour: under «More about this trip» the new row «Tools for this tour» holds food and water, tour path, way to the goal, trips side by side, stops, quiz and checks per trip type': 'Beim Packen: unter «Mehr zu dieser Tour» hat die neue Zeile «Werkzeuge für diese Tour» Verpflegung, Tour-Pfad, Weg zum Ziel, Touren nebeneinander, Stopps, Quiz und Checks pro Tourart',
    'With a planned tour, the overview of Trips shows «On the way ›» beside «Races ›»': 'Mit einer geplanten Tour zeigt die Übersicht von Touren «Unterwegs ›» neben «Rennen ›»',
    'Open Trips: the third tab is «Races». Tap it: your races open and the tab stays lit.': 'Öffne Touren: der dritte Reiter ist «Rennen». Tippe ihn an: deine Rennen öffnen sich und der Reiter bleibt markiert.',
    'On a phone tap «More» in the tab bar: «Templates» is there.': 'Tippe am Handy in der Reiterleiste auf «Mehr»: dort steht «Vorlagen».',
    'Open Pack with a tour, scroll to «More about this trip» and open «Tools for this tour»: seven ways, each opens its page.': 'Öffne Packen mit einer Tour, geh zu «Mehr zu dieser Tour» und öffne «Werkzeuge für diese Tour»: sieben Wege, jeder öffnet seine Seite.',
    'On Trips › Overview with a planned tour tap «On the way ›».': 'Tippe auf Touren › Übersicht mit einer geplanten Tour auf «Unterwegs ›».',
  },
};
