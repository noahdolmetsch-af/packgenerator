// «Block-Knöpfe» (Noah 21.11.2026 «a»): beim Abhaken die Dauer in Blöcken, Sauna 12 Min, Laufen indoor 10 Min
export default {
  title: 'Duration in blocks',
  lead: 'After you tick a sauna or an indoor run, the page «Done» offers blocks: 1 to 4 times 12 or 10 minutes.',
  points: [
    { text: 'Sauna in blocks of 12 minutes, running indoors in blocks of 10; the button of your last choice is marked', go: { href: '#/flow', steps: [{ sel: '[data-act="sauna"]' }, { sel: '[data-geschafft-blocks]' }] } },
  ],
  small: [{ box: 'new', text: 'Any sport can get its own block size: «In blocks» next to the duration' }],
  test: ['Tick the sauna on Active: the page «Done» shows 1 × 12 min up to 4 × 12 min; tap 2 × 12 min and the entry has 24 minutes.', 'Tap the same button again: the minutes are gone. The button of your last choice has a dashed border.', 'Tick tennis, tap «In blocks», type 30 and save: the buttons now count blocks of 30 minutes.'],
  since: [],
  de: {
    'Duration in blocks': 'Dauer in Blöcken',
    'After you tick a sauna or an indoor run, the page «Done» offers blocks: 1 to 4 times 12 or 10 minutes.': 'Nach dem Haken bei Sauna oder Laufen indoor bietet die Seite «Geschafft» Blöcke an: 1 bis 4 mal 12 oder 10 Minuten.',
    'Sauna in blocks of 12 minutes, running indoors in blocks of 10; the button of your last choice is marked': 'Sauna in Blöcken von 12 Minuten, Laufen indoor in Blöcken von 10; der Knopf deiner letzten Wahl ist markiert',
    'Any sport can get its own block size: «In blocks» next to the duration': 'Jede Sportart kann ihre eigene Blockgrösse bekommen: «In Blöcken» neben der Dauer',
    'Tick the sauna on Active: the page «Done» shows 1 × 12 min up to 4 × 12 min; tap 2 × 12 min and the entry has 24 minutes.': 'Hake auf Aktiv die Sauna ab: die Seite «Geschafft» zeigt 1 × 12 Min bis 4 × 12 Min; tippe 2 × 12 Min, dann hat der Eintrag 24 Minuten.',
    'Tap the same button again: the minutes are gone. The button of your last choice has a dashed border.': 'Tippe denselben Knopf nochmals: die Minuten sind weg. Der Knopf deiner letzten Wahl hat einen gestrichelten Rand.',
    'Tick tennis, tap «In blocks», type 30 and save: the buttons now count blocks of 30 minutes.': 'Hake Tennis ab, tippe «In Blöcken», tippe 30 und speichere: die Knöpfe zählen jetzt Blöcke von 30 Minuten.',
  },
};
