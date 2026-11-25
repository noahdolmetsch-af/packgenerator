// «Knapper Seitenkopf» Wetter (Noah 23.11.2026 «1-5 a», Design-Abgleich): one short sentence, the row «Belongs to» starts folded on a phone
export default {
  title: 'A shorter head on Weather',
  lead: 'On a phone the row «Belongs to: plan a tour» above the weather starts as one line, and the sentence under the title is shorter.',
  points: [{ text: 'Weather starts with the title and one short sentence, the row of links is one folded line on a phone', go: { href: '#/wetter', steps: [{ sel: '[data-card-line="gd:wetter"]' }], where: 'Weather, on a phone: the line «Belongs to …» above the title.' } }],
  small: [],
  test: ['Open Weather on a phone: above the title stands one line «Belongs to …», not a block of chips.', 'Tap the line: the chips open, and «Fold the card» closes them again.'],
  since: [],
  de: {
    'A shorter head on Weather': 'Ein kürzerer Kopf bei Wetter',
    'On a phone the row «Belongs to: plan a tour» above the weather starts as one line, and the sentence under the title is shorter.': 'Am Handy beginnt die Reihe «Gehört zu: Tour planen» über dem Wetter als eine Zeile, und der Satz unter dem Titel ist kürzer.',
    'Weather starts with the title and one short sentence, the row of links is one folded line on a phone': 'Wetter beginnt mit dem Titel und einem kurzen Satz, die Reihe mit Links ist am Handy eine zugeklappte Zeile',
    'Weather, on a phone: the line «Belongs to …» above the title.': 'Wetter, am Handy: die Zeile «Gehört zu …» über dem Titel.',
    'Open Weather on a phone: above the title stands one line «Belongs to …», not a block of chips.': 'Öffne Wetter am Handy: über dem Titel steht eine Zeile «Gehört zu …», kein Block aus Chips.',
    'Tap the line: the chips open, and «Fold the card» closes them again.': 'Tippe die Zeile: die Chips öffnen sich, «Einklappen» schliesst sie wieder.',
  },
};
