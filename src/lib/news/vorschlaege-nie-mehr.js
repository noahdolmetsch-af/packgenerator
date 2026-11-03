// «Nie mehr vorschlagen» (Noah 2.11.2026 «b»): a single suggestion in «Still to plan» can be put away for good, and brought back
export default {
  title: 'Never suggest this again',
  lead: 'Each suggestion in «Still to plan» has «Never suggest»; a list «Put away» brings it back.',
  points: [{ text: 'Planen › Woche › Still to plan: «Never suggest» under a suggestion; «Put away» lists them with «Show again»', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }, { sel: '[data-sg-never]' }], where: 'Planen › Woche: open «Still to plan», look for «Never suggest» under a suggestion.' } }],
  small: [{ box: 'new', text: 'Undo after every «Never suggest»', go: { href: '#/week', steps: [{ sel: '[data-sg-toggle]' }, { sel: '[data-sg-never]' }], where: 'Planen › Woche: open «Still to plan», look for «Never suggest» under a suggestion.' } }],
  test: ['Planen › Woche: open «Still to plan» and tap «Never suggest» under a suggestion: it disappears.', 'Open «Put away» below the list and tap «Show again»: the suggestion is back. Reload: both states stay.'],
  since: [],
  de: {
    'Never suggest this again': 'Nie mehr vorschlagen',
    'Each suggestion in «Still to plan» has «Never suggest»; a list «Put away» brings it back.': 'Jeder Vorschlag in «Noch einplanen» hat «Nie mehr vorschlagen»; eine Liste «Ausgeblendet» holt ihn zurück.',
    'Planen › Woche › Still to plan: «Never suggest» under a suggestion; «Put away» lists them with «Show again»': 'Planen › Woche › Noch einplanen: «Nie mehr vorschlagen» unter einem Vorschlag; «Ausgeblendet» listet sie mit «Wieder zeigen»',
    'Planen › Woche: open «Still to plan», look for «Never suggest» under a suggestion.': 'Planen › Woche: «Noch einplanen» öffnen, «Nie mehr vorschlagen» unter einem Vorschlag suchen.',
    'Undo after every «Never suggest»': 'Rückgängig nach jedem «Nie mehr vorschlagen»',
    'Planen › Woche: open «Still to plan» and tap «Never suggest» under a suggestion: it disappears.': 'Planen › Woche: «Noch einplanen» öffnen und unter einem Vorschlag «Nie mehr vorschlagen» antippen: er verschwindet.',
    'Open «Put away» below the list and tap «Show again»: the suggestion is back. Reload: both states stay.': '«Ausgeblendet» unter der Liste öffnen und «Wieder zeigen» antippen: der Vorschlag ist zurück. Seite neu laden: beide Zustände bleiben.',
  },
};
