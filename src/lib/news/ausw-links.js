// «Auswerten aufräumen» (Noah 07.11.2026 «4a»), Teil 2: the link cards of the start are gone, the summit book is a tab
export default {
  title: 'Analysis: no double links',
  lead: 'The six link cards on the right of the start are gone: every page is a tab above. The summit book is a tab now.',
  points: [
    {
      text: 'The summit book is a tab in Analysis, next to New ground',
      go: { href: '#/flow/gipfelbuch', steps: [{ text: 'Summit book' }] },
    },
    {
      text: 'Ideas for your balance open from the page Impulses',
      go: { href: '#/flow/impulse', steps: [{ sel: '[data-ideas-link]' }] },
    },
  ],
  small: [],
  test: [
    'Open Analysis › Overview: the cards Ideas, Milestones, Trophies, Impulses, Summit book and Ticks evaluated are no longer on the right.',
    'Look at the tabs: the summit book stands next to New ground.',
    'Open Impulses: under the intro a line leads to Ideas for your balance.',
  ],
  since: [],
  de: {
    'Analysis: no double links': 'Auswerten: keine doppelten Links',
    'The six link cards on the right of the start are gone: every page is a tab above. The summit book is a tab now.': 'Die sechs Link-Karten rechts auf dem Start sind weg: Jede Seite ist ein Reiter oben. Das Gipfelbuch ist jetzt ein Reiter.',
    'The summit book is a tab in Analysis, next to New ground': 'Das Gipfelbuch ist ein Reiter in Auswerten, neben Neuland',
    'Summit book': 'Gipfelbuch',
    'Ideas for your balance open from the page Impulses': 'Ideen für deine Balance öffnen sich von der Seite Impulse',
    'Open Analysis › Overview: the cards Ideas, Milestones, Trophies, Impulses, Summit book and Ticks evaluated are no longer on the right.': 'Öffne Auswerten › Übersicht: Die Karten Ideen, Meilensteine, Trophäen, Impulse, Gipfelbuch und Haken ausgewertet stehen nicht mehr rechts.',
    'Look at the tabs: the summit book stands next to New ground.': 'Schau die Reiter an: Das Gipfelbuch steht neben Neuland.',
    'Open Impulses: under the intro a line leads to Ideas for your balance.': 'Öffne Impulse: Unter dem Einleitungstext führt eine Zeile zu Ideen für deine Balance.',
  },
};
