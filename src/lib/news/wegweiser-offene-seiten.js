// «Wegweiser statt Katalog» PR 21 (Noah 01.11.2026 «1-5a»): the card «What you can do here» on pages of one thing: one trip's
// debrief, a race, one diary entry. The fold choice holds for all pages of the same kind.
export default {
  title: 'What you can do here, on every tour',
  lead: 'One tour, one race, one diary entry: the card with its functions and good to know shows there too.',
  points: [
    {
      text: 'Debrief of one tour: «What you can do here» with breakdown, travel book, tour picture and more',
      go: { href: '#/debrief', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
    {
      text: 'A race and a diary entry show the card too; a race in race mode stays free for riding',
      go: { href: '#/race', where: 'Shows when you open one race under Races.' },
    },
    {
      text: 'Folded once, folded for every tour: × holds for all pages of the same kind',
      go: { href: '#/debrief', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
  ],
  small: [],
  test: [
    'Open Debrief and a finished tour: at the top is «What you can do here», each function with «Good to know».',
    'Tap ×, then open another tour: the card stays one line there too.',
    'Open a race under Races: the card shows race map and climbs.',
  ],
  since: [],
  de: {
    'What you can do here, on every tour': 'Was du hier tun kannst, auf jeder Tour',
    'One tour, one race, one diary entry: the card with its functions and good to know shows there too.': 'Eine Tour, ein Rennen, ein Tagebucheintrag: die Karte mit ihren Funktionen und «Gut zu wissen» erscheint auch dort.',
    'Debrief of one tour: «What you can do here» with breakdown, travel book, tour picture and more': 'Rückblick einer Tour: «Was du hier tun kannst» mit Panne, Reisebuch, Tourbild und mehr',
    'A race and a diary entry show the card too; a race in race mode stays free for riding': 'Ein Rennen und ein Tagebucheintrag zeigen die Karte auch; im Rennmodus bleibt der Bildschirm frei fürs Fahren',
    'Shows when you open one race under Races.': 'Erscheint, wenn du unter Rennen ein Rennen öffnest.',
    'Folded once, folded for every tour: × holds for all pages of the same kind': 'Einmal zugeklappt, für jede Tour zugeklappt: × gilt für alle Seiten der gleichen Art',
    'Open Debrief and a finished tour: at the top is «What you can do here», each function with «Good to know».': 'Öffne Rückblick und eine abgeschlossene Tour: oben steht «Was du hier tun kannst», jede Funktion mit «Gut zu wissen».',
    'Tap ×, then open another tour: the card stays one line there too.': 'Tippe auf × und öffne eine andere Tour: die Karte bleibt auch dort eine Zeile.',
    'Open a race under Races: the card shows race map and climbs.': 'Öffne unter Rennen ein Rennen: die Karte zeigt Rennkarte und Anstiege.',
  },
};
