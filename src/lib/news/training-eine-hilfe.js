// «Eine Hilfe-Zeile auf Training» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 2)
export default {
  title: 'Training: one help line',
  lead: 'Under the title of Training there is now one help line, «What you can do here». The second line «How it works» is gone once you folded the introduction.',
  points: [
    { text: 'Fold the introduction on Training: one help line stays, not two', go: { href: '#/flow/training', steps: [{ sel: '[data-seiteninhalt-line]' }], where: 'Training, under the title.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training. On the first visit the introduction «Your training by heart rate zones» is open: tap «Fold».',
    'Under the title only the line «What you can do here» stays, no second line «How it works».',
  ],
  since: [],
  de: {
    'Training: one help line': 'Training: eine Hilfe-Zeile',
    'Under the title of Training there is now one help line, «What you can do here». The second line «How it works» is gone once you folded the introduction.': 'Unter dem Titel von Training steht jetzt eine Hilfe-Zeile, «Was du hier tun kannst». Die zweite Zeile «So geht\'s» ist weg, sobald du die Einführung eingeklappt hast.',
    'Fold the introduction on Training: one help line stays, not two': 'Klappst du die Einführung auf Training ein, bleibt eine Hilfe-Zeile stehen, nicht zwei',
    'Training, under the title.': 'Training, unter dem Titel.',
    'Open Aktiv › Training. On the first visit the introduction «Your training by heart rate zones» is open: tap «Fold».': 'Öffne Aktiv › Training. Beim ersten Besuch ist die Einführung «Dein Training nach Pulszonen» offen: tippe auf «Einklappen».',
    'Under the title only the line «What you can do here» stays, no second line «How it works».': 'Unter dem Titel bleibt nur die Zeile «Was du hier tun kannst», keine zweite Zeile «So geht\'s».',
  },
};
