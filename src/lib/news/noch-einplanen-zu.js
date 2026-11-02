// «Noch einplanen zugeklappt» (Noah 2.11.2026): in Planen › Woche the block «Still to plan» is folded at first
export default {
  title: 'Still to plan is folded',
  lead: 'In the week the block «Still to plan» shows only its heading and the number of suggestions until you open it.',
  points: [{ text: 'Planen › Woche: tap «Still to plan» to open the suggestions; the app remembers it', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }], where: 'Planen › Woche: the block «Still to plan».' } }],
  small: [],
  test: ['Planen › Woche: «Still to plan» is closed and shows the number of suggestions.', 'Tap it: the suggestions open. Reload the page: it stays open. Tap again: it closes.'],
  since: [],
  de: {
    'Still to plan is folded': 'Noch einplanen ist zugeklappt',
    'In the week the block «Still to plan» shows only its heading and the number of suggestions until you open it.': 'In der Woche zeigt der Block «Noch einplanen» erst nur die Überschrift und die Anzahl der Vorschläge, bis du ihn öffnest.',
    'Planen › Woche: tap «Still to plan» to open the suggestions; the app remembers it': 'Planen › Woche: «Noch einplanen» antippen öffnet die Vorschläge; die App merkt es sich',
    'Planen › Woche: the block «Still to plan».': 'Planen › Woche: der Block «Noch einplanen».',
    'Planen › Woche: «Still to plan» is closed and shows the number of suggestions.': 'Planen › Woche: «Noch einplanen» ist zu und zeigt die Anzahl Vorschläge.',
    'Tap it: the suggestions open. Reload the page: it stays open. Tap again: it closes.': 'Antippen: die Vorschläge öffnen sich. Seite neu laden: bleibt offen. Nochmals antippen: schliesst.',
  },
};
