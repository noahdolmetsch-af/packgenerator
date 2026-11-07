// UI-Test 26.10.2026 T12 «Kleine Rechenfehler» (G4-02, G1-16, G3-15, G1-14, G4-05): «20 000 mAh» counts as 20'000; the check questions say how many come each day instead of «Tipps»; a meditation tick without minutes is no «0′» session; the shopping list is not «empty» above the trip's things; «Check building blocks» counts 1, 2, 3 and says what its number counts
export default {
  title: 'Small numbers fixed',
  lead: 'Five small numbers now say what they count.',
  points: [{ text: 'Power banks named «20 000 mAh» count with 20\'000 mAh in the power budget', href: '#/gear/power', go: 'f.power' }, { text: '«Check building blocks» says how many blocks have suggestions and numbers the changes 1, 2, 3', href: '#/blocks/check', go: 'f.blockcheck' }],
  small: [{ box: 'fixed', text: 'A meditation ticked without minutes shows «ticked», not «0′»', go: 'f.medlog' }, { box: 'nicer', text: 'The shopping list says when the trip\'s things are ready below it', go: 'f.shopping' }],
  test: ['Gear › Power: a power bank «… 20 000 mAh» shows 20\'000 mAh.', 'Building blocks: the button says «Check building blocks · N» and its hint «N with suggestions»; the overview counts 1, 2, 3.'],
  since: [],
  de: {
    'Small numbers fixed': 'Kleine Zahlen korrigiert',
    'Five small numbers now say what they count.': 'Fünf kleine Zahlen sagen jetzt, was sie zählen.',
    'Power banks named «20 000 mAh» count with 20\'000 mAh in the power budget': 'Powerbanks mit «20 000 mAh» im Namen zählen im Strombudget mit 20\'000 mAh',
    '«Check building blocks» says how many blocks have suggestions and numbers the changes 1, 2, 3': '«Bausteine prüfen» sagt, wie viele Bausteine Vorschläge haben, und zählt die Änderungen 1, 2, 3',
    'A meditation ticked without minutes shows «ticked», not «0′»': 'Eine Meditation ohne Minuten zeigt «abgehakt» statt «0′»',
    'The shopping list says when the trip\'s things are ready below it': 'Die Einkaufsliste sagt, wenn darunter die Dinge der Tour bereitstehen',
    'Gear › Power: a power bank «… 20 000 mAh» shows 20\'000 mAh.': 'Material › Strom: Eine Powerbank «… 20 000 mAh» zeigt 20\'000 mAh.',
    'Building blocks: the button says «Check building blocks · N» and its hint «N with suggestions»; the overview counts 1, 2, 3.': 'Bausteine: Der Knopf sagt «Bausteine prüfen · N» (Erklärung: «N mit Vorschlägen»); der Überblick zählt 1, 2, 3.',
  },
};
