// «Wegweiser statt Katalog» PR 18 (Noah 01.11.2026 «1-5a», plan «freigabe» 1–26): the card with «Good to know» on the pages of Körper
export default {
  title: 'Good to know for body and training',
  lead: 'Aktiv, your sports, training, meditation and body values now show what you can do there, each with a short tip.',
  points: [
    {
      text: 'Aktiv, sports, training, meditation and body values show «What you can do here» with «Good to know»; observation only',
      go: { href: '#/flow', steps: [{ sel: '[data-seiteninhalt-know]' }] },
    },
  ],
  small: [],
  test: [
    'Open Aktiv: on top is «What you can do here», each function with a line «Good to know».',
    'Open Aktiv › Training: the card is there too; × folds it to one line.',
  ],
  since: [],
  de: {
    'Good to know for body and training': 'Gut zu wissen für Körper und Training',
    'Aktiv, your sports, training, meditation and body values now show what you can do there, each with a short tip.': 'Aktiv, deine Sportarten, Training, Meditation und Körperwerte zeigen jetzt, was du dort tun kannst, je mit einem kurzen Tipp.',
    'Aktiv, sports, training, meditation and body values show «What you can do here» with «Good to know»; observation only': 'Aktiv, Sportarten, Training, Meditation und Körperwerte zeigen «Was du hier tun kannst» mit «Gut zu wissen»; nur Beobachtung',
    'Open Aktiv: on top is «What you can do here», each function with a line «Good to know».': 'Öffne Aktiv: oben steht «Was du hier tun kannst», jede Funktion mit einer Zeile «Gut zu wissen».',
    'Open Aktiv › Training: the card is there too; × folds it to one line.': 'Öffne Aktiv › Training: auch dort steht die Karte; × klappt sie auf eine Zeile zu.',
  },
};
