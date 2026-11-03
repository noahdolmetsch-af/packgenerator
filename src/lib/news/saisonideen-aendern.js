// «Saisonideen ändern» (Noah 2.11.2026 «c»): the seasonal ideas in «Still to plan» can be renamed, deleted and added
export default {
  title: 'Change the season ideas',
  lead: 'The seasonal ideas in «Still to plan» are yours: rename them, delete them or add your own.',
  points: [{ text: 'Planen › Woche › Still to plan › Where do the suggestions come from? › Change season ideas', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }, { sel: '[data-sg-sources] > summary' }, { sel: '[data-sg-ideas] > summary' }], where: 'Planen › Woche: open «Still to plan», then «Where do the suggestions come from?» and «Change season ideas».' } }],
  small: [{ box: 'new', text: 'Own ideas get a season from month to month; delete asks first and has Undo', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }, { sel: '[data-sg-sources] > summary' }, { sel: '[data-sg-ideas] > summary' }], where: 'Planen › Woche: open «Still to plan», then «Where do the suggestions come from?» and «Change season ideas».' } }],
  test: ['Planen › Woche › Still to plan › Where do the suggestions come from? › Change season ideas: tap «Add an idea», type a name, pick the months and save.', 'Delete an idea: the app asks first, then «Undo» brings it back. Rename one with the pencil.'],
  since: [],
  de: {
    'Change the season ideas': 'Saisonideen ändern',
    'The seasonal ideas in «Still to plan» are yours: rename them, delete them or add your own.': 'Die Saisonideen in «Noch einplanen» gehören dir: umbenennen, löschen oder eigene hinzufügen.',
    'Planen › Woche › Still to plan › Where do the suggestions come from? › Change season ideas': 'Planen › Woche › Noch einplanen › Woher kommen die Vorschläge? › Saisonideen ändern',
    'Planen › Woche: open «Still to plan», then «Where do the suggestions come from?» and «Change season ideas».': 'Planen › Woche: «Noch einplanen» öffnen, dann «Woher kommen die Vorschläge?» und «Saisonideen ändern».',
    'Own ideas get a season from month to month; delete asks first and has Undo': 'Eigene Ideen bekommen eine Saison von Monat bis Monat; Löschen fragt zuerst und hat Rückgängig',
    'Planen › Woche › Still to plan › Where do the suggestions come from? › Change season ideas: tap «Add an idea», type a name, pick the months and save.': 'Planen › Woche › Noch einplanen › Woher kommen die Vorschläge? › Saisonideen ändern: «Idee hinzufügen» antippen, Namen tippen, Monate wählen und speichern.',
    'Delete an idea: the app asks first, then «Undo» brings it back. Rename one with the pencil.': 'Eine Idee löschen: die App fragt zuerst, «Rückgängig» holt sie zurück. Mit dem Stift umbenennen.',
  },
};
