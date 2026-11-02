// «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a», «einverstanden»): «What you can do here» on the pages of Lust
export default {
  title: 'What you can do here',
  lead: 'Dreams, Compass, Free time and Inspiration say on the page what each function is for.',
  points: [
    {
      text: 'On top of the page: each function with one sentence on what it is for, «How it works» opens steps and an example',
      go: { href: '#/trips/dreams', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
  ],
  small: [{ box: 'new', text: '× folds the card to one line on this page; a tap opens it again', go: { href: '#/trips/dreams', steps: [{ sel: '[data-seiteninhalt-fold]' }] } }],
  test: [
    'Open Trips › Dreams: on top is «What you can do here» with the functions of the page.',
    'Tap «How it works» under one: steps and an example open.',
  ],
  since: [],
  de: {
    'Dreams, Compass, Free time and Inspiration say on the page what each function is for.': 'Träume, Kompass, Freie Zeit und Inspiration sagen auf der Seite, wozu jede Funktion gut ist.',
    'On top of the page: each function with one sentence on what it is for, «How it works» opens steps and an example': 'Oben auf der Seite: jede Funktion mit einem Satz, wozu sie gut ist; «So geht es» öffnet Schritte und ein Beispiel',
    '× folds the card to one line on this page; a tap opens it again': '× klappt die Karte auf dieser Seite zu einer Zeile zu, ein Tipp öffnet sie wieder',
    'Open Trips › Dreams: on top is «What you can do here» with the functions of the page.': 'Öffne Touren › Träume: oben steht «Was du hier tun kannst» mit den Funktionen der Seite.',
    'Tap «How it works» under one: steps and an example open.': 'Tippe bei einer auf «So geht es»: Schritte und ein Beispiel öffnen sich.',
  },
};
