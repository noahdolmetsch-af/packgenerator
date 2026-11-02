// «Wegweiser statt Katalog» PR 20 (Noah 01.11.2026 «1-5a», «freigabe» steps 1–26): «What you can do here» with «Good to know» on the pages of the app itself
export default {
  title: 'Good to know about the app itself',
  lead: 'Lists, privacy, search, the assistant and the helper now show what you can do there, each with a short tip.',
  points: [
    {
      text: 'Lists and types, Privacy and terms and 8 more pages of the app show «What you can do here» with «Good to know»',
      go: { href: '#/me/lists', steps: [{ sel: '[data-seiteninhalt-know]' }] },
    },
  ],
  small: [],
  test: [
    'Open Me › Lists and types: on top is «What you can do here», each function with a line «Good to know».',
    'Open Me › Privacy and terms: the card is there too; × folds it to one line.',
  ],
  since: [],
  de: {
    'Good to know about the app itself': 'Gut zu wissen über die App selbst',
    'Lists, privacy, search, the assistant and the helper now show what you can do there, each with a short tip.': 'Listen, Datenschutz, Suche, Assistent und Helfer zeigen jetzt, was du dort tun kannst, jeweils mit einem kurzen Tipp.',
    'Lists and types, Privacy and terms and 8 more pages of the app show «What you can do here» with «Good to know»': 'Listen und Typen, Datenschutz und Nutzung und 8 weitere Seiten der App zeigen «Was du hier tun kannst» mit «Gut zu wissen»',
    'Open Me › Lists and types: on top is «What you can do here», each function with a line «Good to know».': 'Öffne Ich › Listen und Typen: oben steht «Was du hier tun kannst», jede Funktion mit einer Zeile «Gut zu wissen».',
    'Open Me › Privacy and terms: the card is there too; × folds it to one line.': 'Öffne Ich › Datenschutz und Nutzung: auch dort ist die Karte; × klappt sie auf eine Zeile zu.',
  },
};
