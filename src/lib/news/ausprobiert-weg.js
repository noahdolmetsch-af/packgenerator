// «Heute als Begleiter» (Noah 1.11.2026 «a»): the tile «Tried it yet?» is gone, «Discover» takes its place
export default {
  title: 'Today: «Tried it yet?» is gone',
  lead: 'The tile «Tried it yet?» is gone. «Discover» shows one function per moment.',
  points: [{ text: '«Discover» on Today suggests one function per moment instead of «Tried it yet?»', go: { href: '#/', steps: [{ sel: '[data-section="discover"]' }], where: 'The card «Discover» sits on Today below the trip and the weigh-in question.' } }],
  small: [],
  test: ['Open Today: no tile «Tried it yet?».', '«Add a tile» no longer lists «Tried it yet?»; «Discover» is there.'],
  since: [],
  de: {
    'Today: «Tried it yet?» is gone': 'Heute: «Schon probiert?» ist weg',
    'The tile «Tried it yet?» is gone. «Discover» shows one function per moment.': 'Die Kachel «Schon probiert?» ist weg. «Entdecken» zeigt eine Funktion pro Moment.',
    '«Discover» on Today suggests one function per moment instead of «Tried it yet?»': '«Entdecken» auf Heute schlägt statt «Schon probiert?» eine Funktion pro Moment vor',
    'The card «Discover» sits on Today below the trip and the weigh-in question.': 'Die Karte «Entdecken» steht auf Heute unter der Tour und der Gewichtsfrage.',
    'Open Today: no tile «Tried it yet?».': 'Öffne Heute: keine Kachel «Schon probiert?».',
    '«Add a tile» no longer lists «Tried it yet?»; «Discover» is there.': '«Kachel hinzufügen» nennt «Schon probiert?» nicht mehr; «Entdecken» ist da.',
  },
};
