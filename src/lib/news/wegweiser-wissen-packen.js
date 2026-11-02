// «Wegweiser statt Katalog» PR 16 (Noah 01.11.2026 «1-5a»): «What you can do here» with «Good to know» on Pack, templates, building blocks, labels and checks
export default {
  title: 'Good to know while packing',
  lead: 'Pack, templates, building blocks, box labels and checks now show what you can do there, each with a short tip.',
  points: [
    {
      text: 'Pack and templates: «What you can do here» lists its functions, each with «Good to know» (on Pack it starts as one line)',
      go: { href: '#/pack/templates', steps: [{ sel: '[data-seiteninhalt-know]' }] },
    },
  ],
  small: [{ box: 'new', text: 'Also on templates, building blocks, box labels, checks per trip type and the ski backpack check', go: 'f.blockcheck' }],
  test: [
    'Open Pack: at the top is one line «What you can do here». Tap it: the card opens, each function with «Good to know».',
    'Open Pack › Templates: the card is open there. Tap × on it: it becomes one line and stays so after a reload.',
  ],
  since: [],
  de: {
    'Good to know while packing': 'Gut zu wissen beim Packen',
    'Pack, templates, building blocks, box labels and checks now show what you can do there, each with a short tip.': 'Packen, Vorlagen, Bausteine, Kisten-Etiketten und Checks zeigen jetzt, was du dort tun kannst, jede Funktion mit einem kurzen Tipp.',
    'Pack and templates: «What you can do here» lists its functions, each with «Good to know» (on Pack it starts as one line)': 'Packen: «Was du hier tun kannst» zeigt seine Funktionen, jede mit «Gut zu wissen»',
    'Also on templates, building blocks, box labels, checks per trip type and the ski backpack check': 'Auch bei Vorlagen, Bausteinen, Kisten-Etiketten, Checks pro Tour-Art und dem Rucksack-Check für Skitouren',
    'Open Pack: at the top is one line «What you can do here». Tap it: the card opens, each function with «Good to know».': 'Öffne Packen: oben steht eine Zeile «Was du hier tun kannst». Tippe sie an: die Karte geht auf, jede Funktion mit «Gut zu wissen».',
    'Open Pack › Templates: the card is open there. Tap × on it: it becomes one line and stays so after a reload.': 'Öffne Packen › Vorlagen: dort ist die Karte offen. Tippe auf ×: sie wird eine Zeile und bleibt so, auch nach dem Neuladen.',
  },
};
