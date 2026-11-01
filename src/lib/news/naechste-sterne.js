// «Meilensteine aktiver machen» PR 1 (Noah 01.11.2026 «alle 1-6 PR», «alle vier Stellen»): the closest stars on Heute
export default {
  title: 'Your next stars',
  lead: 'The stars that are closest, on Today and on top of each sport',
  points: [{ text: 'Under «Active today» the three closest stars, with a bar', go: { href: '#/', steps: [{ sel: '[data-next-stars]' }] } }],
  small: [{ box: 'new', text: 'A tap opens the sport; «Hide» switches it off, «Show next stars» brings it back', go: { href: '#/', steps: [{ sel: '[data-next-stars]' }] } }],
  test: ['Open Today, under «Active today» look at «Your next stars».', 'Tap a row: the sport opens with its milestones.'],
  since: [],
  de: {
    'Your next stars': 'Deine nächsten Sterne',
    'The stars that are closest, on Today and on top of each sport': 'Die Sterne, die am nächsten sind, auf Heute und oben auf jeder Sportart',
    'Under «Active today» the three closest stars, with a bar': 'Unter «Aktiv heute» die drei nächsten Sterne, mit Balken',
    'A tap opens the sport; «Hide» switches it off, «Show next stars» brings it back': 'Ein Tipp öffnet die Sportart; «Ausblenden» schaltet es ab, «Nächste Sterne zeigen» holt es zurück',
    'Open Today, under «Active today» look at «Your next stars».': 'Öffne Heute und schau unter «Aktiv heute» auf «Deine nächsten Sterne».',
    'Tap a row: the sport opens with its milestones.': 'Tippe auf eine Zeile: die Sportart öffnet sich mit ihren Meilensteinen.',
  },
};
