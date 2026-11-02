// «Quellen der Vorschläge» (Noah 2.11.2026 «a»): in «Still to plan» every source can be switched on or off
export default {
  title: 'Choose where suggestions come from',
  lead: 'In «Still to plan» you switch each source of the suggestions on or off.',
  points: [{ text: 'Planen › Woche › Still to plan: «Where do the suggestions come from?» lists Google tasks, bike care, trips, season ideas and more', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }, { sel: '[data-sg-sources] > summary' }], where: 'Planen › Woche: open «Still to plan», then «Where do the suggestions come from?».' } }],
  small: [{ box: 'new', text: 'Every switch has Undo', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }, { sel: '[data-sg-sources] > summary' }], where: 'Planen › Woche: open «Still to plan», then «Where do the suggestions come from?».' } }],
  test: ['Planen › Woche: open «Still to plan», then «Where do the suggestions come from?».', 'Switch a source off: its suggestions disappear and «Undo» brings them back. Reload: the switch stays off.'],
  since: [],
  de: {
    'Choose where suggestions come from': 'Wähle, woher Vorschläge kommen',
    'In «Still to plan» you switch each source of the suggestions on or off.': 'In «Noch einplanen» schaltest du jede Quelle der Vorschläge ein oder aus.',
    'Planen › Woche › Still to plan: «Where do the suggestions come from?» lists Google tasks, bike care, trips, season ideas and more': 'Planen › Woche › Noch einplanen: «Woher kommen die Vorschläge?» listet Google Aufgaben, Velopflege, Touren, Saisonideen und mehr',
    'Planen › Woche: open «Still to plan», then «Where do the suggestions come from?».': 'Planen › Woche: «Noch einplanen» öffnen, dann «Woher kommen die Vorschläge?».',
    'Every switch has Undo': 'Jeder Schalter hat Rückgängig',
    'Switch a source off: its suggestions disappear and «Undo» brings them back. Reload: the switch stays off.': 'Eine Quelle ausschalten: ihre Vorschläge verschwinden, «Rückgängig» bringt sie zurück. Seite neu laden: der Schalter bleibt aus.',
  },
};
