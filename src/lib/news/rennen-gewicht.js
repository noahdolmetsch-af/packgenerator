// «Gewichtsrechner» (Noah 27.10.2026 «6a»): sheet 2 of the Rennen-Check adds up the grams against your target
export default {
  title: 'Weight of the setup',
  lead: 'The Rennen-Check adds up the grams of your bags.',
  points: [{ text: 'Rennen-Check › sheet 2: bags empty, packed and your target', href: '#/racecheck', go: { href: '#/racecheck', where: 'Shows in the race check, on sheet 2 (weight).' } }],
  small: [{ box: 'new', text: 'Shows how many kg you are over or under your target weight' }],
  test: ['Open Touren › «Rennen detailliert planen» › a race › Rennen-Check › sheet 2.', 'Write grams for two bags (e.g. «300» and «2× 100») and a target «1.5 kg»: below stands the sum and how far over or under you are.'],
  since: [],
  de: {
    'Shows in the race check, on sheet 2 (weight).': 'Zeigt sich im Rennen-Check, auf Blatt 2 (Gewicht).',
    'The Rennen-Check adds up the grams of your bags.': 'Der Rennen-Check zählt die Gramm deiner Taschen zusammen.',
    'Rennen-Check › sheet 2: bags empty, packed and your target': 'Rennen-Check › Blatt 2: Taschen leer, gepackt und dein Ziel',
    'Shows how many kg you are over or under your target weight': 'Zeigt, wie viele kg du über oder unter deinem Zielgewicht bist',
    'Open Touren › «Rennen detailliert planen» › a race › Rennen-Check › sheet 2.': 'Öffne Touren › «Rennen detailliert planen» › ein Rennen › Rennen-Check › Blatt 2.',
    'Write grams for two bags (e.g. «300» and «2× 100») and a target «1.5 kg»: below stands the sum and how far over or under you are.': 'Schreib Gramm für zwei Taschen (z. B. «300» und «2× 100») und ein Ziel «1.5 kg»: darunter stehen die Summe und wie weit du drüber oder drunter bist.',
  },
};
