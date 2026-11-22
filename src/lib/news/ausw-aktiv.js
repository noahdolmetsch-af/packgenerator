// «Auswerten aufräumen» (Noah 07.11.2026 «5a»), Teil 3: pinned lists stand on Aktiv, the question help is folded
export default {
  title: 'Analysis: tidier start',
  lead: 'A list you pinned to Active now stands on Active. Under «Your questions» one folded line holds the explanation.',
  points: [
    {
      text: 'A list pinned to Active stands at the bottom of the page Active, no longer under Analysis',
      go: { href: '#/flow', steps: [{ text: 'Active|place' }] },
    },
    {
      text: 'Under «Your questions» the explanation is folded: «Why questions? Where do I see the answers?»',
      go: { href: '#/auswerten', steps: [{ text: 'Why questions? Where do I see the answers?' }] },
    },
  ],
  small: [],
  test: [
    'Open Analysis › Overview: under «Your questions» one line «Why questions? Where do I see the answers?» is closed.',
    'Tap that line: the three short answers open.',
    'Pin one of your lists to Active (list page › Pin): it stands at the bottom of Active and no longer on Analysis.',
  ],
  since: [],
  de: {
    'Analysis: tidier start': 'Auswerten: aufgeräumter Start',
    'A list you pinned to Active now stands on Active. Under «Your questions» one folded line holds the explanation.': 'Eine Liste, die du an Aktiv angeheftet hast, steht jetzt auf Aktiv. Unter «Deine Fragen» steckt die Erklärung in einer eingeklappten Zeile.',
    'A list pinned to Active stands at the bottom of the page Active, no longer under Analysis': 'Eine an Aktiv angeheftete Liste steht unten auf der Seite Aktiv, nicht mehr unter Auswerten',
    'Under «Your questions» the explanation is folded: «Why questions? Where do I see the answers?»': 'Unter «Deine Fragen» ist die Erklärung eingeklappt: «Warum Fragen? Wo sehe ich die Antworten?»',
    'Why questions? Where do I see the answers?': 'Warum Fragen? Wo sehe ich die Antworten?',
    'Open Analysis › Overview: under «Your questions» one line «Why questions? Where do I see the answers?» is closed.': 'Öffne Auswerten › Übersicht: Unter «Deine Fragen» steht eine geschlossene Zeile «Warum Fragen? Wo sehe ich die Antworten?».',
    'Tap that line: the three short answers open.': 'Tippe auf die Zeile: Die drei kurzen Antworten öffnen sich.',
    'Pin one of your lists to Active (list page › Pin): it stands at the bottom of Active and no longer on Analysis.': 'Hefte eine deiner Listen an Aktiv an (Listenseite › Anheften): Sie steht unten auf Aktiv und nicht mehr auf Auswerten.',
  },
};
