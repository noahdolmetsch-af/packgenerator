// «Wegweiser statt Katalog», after the final measurement (Noah 03.11.2026 «a»): the mini tools get the card, as one line
export default {
  title: 'The tools explain themselves',
  lead: 'Trips › Toolbox now has «What you can do here» as one line: 22 mini tools, each with a tip.',
  points: [
    {
      text: 'Trips › Toolbox shows «What you can do here» with «Good to know» for every mini tool',
      go: { href: '#/me/tools', steps: [{ sel: '[data-seiteninhalt-line]' }] },
    },
  ],
  small: [],
  test: [
    'Open Trips › Toolbox: at the top is one line «What you can do here». Tap it.',
    'Tap «Show all»: «Compass» and «Spirit level» show with a line «Good to know».',
  ],
  since: [],
  de: {
    'The tools explain themselves': 'Der Werkzeugkasten erklärt sich selbst',
    'Trips › Toolbox now has «What you can do here» as one line: 22 mini tools, each with a tip.': 'Touren › Werkzeugkasten hat jetzt «Was du hier tun kannst» als eine Zeile: 22 Mini-Werkzeuge, je mit einem Tipp.',
    'Trips › Toolbox shows «What you can do here» with «Good to know» for every mini tool': 'Touren › Werkzeugkasten zeigt «Was du hier tun kannst» mit «Gut zu wissen» für jedes Mini-Werkzeug',
    'Open Trips › Toolbox: at the top is one line «What you can do here». Tap it.': 'Öffne Touren › Werkzeugkasten: oben steht eine Zeile «Was du hier tun kannst». Tipp darauf.',
    'Tap «Show all»: «Compass» and «Spirit level» show with a line «Good to know».': 'Tipp auf «Alle … zeigen»: «Kompass» und «Wasserwaage» stehen dort mit einer Zeile «Gut zu wissen».',
  },
};
