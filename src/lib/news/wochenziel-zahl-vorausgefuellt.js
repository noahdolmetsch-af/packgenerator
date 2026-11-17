// «UI-Test Flow» Fund 6 (Noah 17.11.2026 «c»): the week goal form starts with a number, and says why «Add» is off when it is empty
export default {
  title: 'Week goal: the number is filled in',
  lead: 'When you add a week goal, the number is already there (150 km or 2×). Change it, or tap «Add».',
  points: [{ text: 'The number follows what you pick until you type your own', go: { href: '#/flow', steps: [{ sel: '[data-wg-new], [data-wg-empty] button' }], where: 'Aktiv › My week goals › Add a week goal.' } }],
  small: [{ box: 'new', text: 'An empty number says «Type a number above 0.»' }],
  test: ['Open Aktiv › My week goals and tap «Add a week goal»: the number is already filled in.', 'Empty the number: a hint appears and «Add» is off.'],
  since: [],
  de: {
    'Week goal: the number is filled in': 'Wochenziel: die Zahl ist schon da',
    'When you add a week goal, the number is already there (150 km or 2×). Change it, or tap «Add».': 'Wenn du ein Wochenziel hinzufügst, steht die Zahl schon da (150 km oder 2×). Ändere sie oder tippe auf «Hinzufügen».',
    'The number follows what you pick until you type your own': 'Die Zahl passt sich deiner Wahl an, bis du eine eigene tippst',
    'Aktiv › My week goals › Add a week goal.': 'Aktiv › Meine Wochenziele › Wochenziel hinzufügen.',
    'An empty number says «Type a number above 0.»': 'Eine leere Zahl sagt «Tippe eine Zahl über 0.»',
    'Open Aktiv › My week goals and tap «Add a week goal»: the number is already filled in.': 'Öffne Aktiv › Meine Wochenziele und tippe auf «Wochenziel hinzufügen»: die Zahl ist schon ausgefüllt.',
    'Empty the number: a hint appears and «Add» is off.': 'Leere die Zahl: ein Hinweis erscheint und «Hinzufügen» ist aus.',
  },
};
