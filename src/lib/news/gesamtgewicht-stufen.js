// «Gesamtgewicht in Stufen» (Noah 23.11.2026 «1a» und «5a», Thread «Packen nach Taschen am Bike ausbauen»)
export default {
  title: 'Weight in steps',
  lead: 'The weight card shows what your trip weighs with and without the bags, the bike and you.',
  points: [
    { text: 'Under the weight card: only the items, with the bags, with the bike and with you, each with what it adds', go: null },
    { text: 'The new button «Weigh bags» takes you to the next bag you have not put on the scale', go: null },
  ],
  test: ['Open the packing list of a tour with a bike and bags: in the card «Weight» the block «Total weight» shows four lines.', 'A trip without a bike has no line «With the bike».', 'Tap «Weigh bags»: the first bag without a number opens, the cursor is in the field «Packed bag on the scale».'],
  de: {
    'Weight in steps': 'Gewicht in Stufen',
    'The weight card shows what your trip weighs with and without the bags, the bike and you.': 'Die Gewichts-Karte zeigt, was deine Tour mit und ohne Taschen, Velo und dich wiegt.',
    'Under the weight card: only the items, with the bags, with the bike and with you, each with what it adds': 'In der Gewichts-Karte: nur die Teile, mit Taschen, mit Velo und mit dir, jede Zeile mit dem, was sie dazu bringt',
    'The new button «Weigh bags» takes you to the next bag you have not put on the scale': 'Der neue Knopf «Taschen wiegen» führt zur nächsten Tasche, die du noch nicht gewogen hast',
    'Open the packing list of a tour with a bike and bags: in the card «Weight» the block «Total weight» shows four lines.': 'Öffne die Packliste einer Tour mit Velo und Taschen: in der Karte «Gewicht» zeigt der Block «Gesamtgewicht» vier Zeilen.',
    'A trip without a bike has no line «With the bike».': 'Eine Tour ohne Velo hat keine Zeile «Mit Velo».',
    'Tap «Weigh bags»: the first bag without a number opens, the cursor is in the field «Packed bag on the scale».': 'Tippe auf «Taschen wiegen»: die erste Tasche ohne Zahl öffnet sich, der Cursor steht im Feld «Gepackte Tasche auf der Waage».',
  },
};
