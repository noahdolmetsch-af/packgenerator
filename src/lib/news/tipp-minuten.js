// «Tipp → Minuten» (Noah 24.11.2026 «1-3»): «Did it» on a trip tip counts the time for the challenge Outdoors
export default {
  title: 'Trip tip counts for Outdoors',
  lead: 'When you did a trip tip, one tap adds its time to your outdoor challenge.',
  points: [
    { text: 'Under the trip tips a button «Did it · +n min» adds the chosen time to Outdoors today (Undo takes it back)', go: { href: '#/trips/dreams', steps: [{ sel: '[data-tt-did]' }], where: 'Trips › Dreams › Fits today: trip tips, under the list (only while the challenge runs).' } },
  ],
  small: [{ box: 'new', text: 'Without a running challenge the button is not there' }],
  test: [
    'Start the challenge Outdoors on Today, then open Trips › Dreams.',
    'Under the trip tips tap «Did it»: the time you chose is added to Outdoors today.',
    'Tap «Undo»: the minutes are gone again.',
  ],
  since: [],
  de: {
    'Trip tip counts for Outdoors': 'Ausflugstipp zählt für Draussen',
    'When you did a trip tip, one tap adds its time to your outdoor challenge.': 'Wenn du einen Ausflugstipp gemacht hast, zählt ein Tipp seine Zeit zur Challenge Draussen.',
    'Under the trip tips a button «Did it · +n min» adds the chosen time to Outdoors today (Undo takes it back)': 'Unter den Ausflugstipps zählt der Knopf «Gemacht · +n Min» die gewählte Zeit heute zu Draussen (Rückgängig nimmt sie zurück)',
    'Trips › Dreams › Fits today: trip tips, under the list (only while the challenge runs).': 'Touren › Träume › Heute passt: Ausflugstipps, unter der Liste (nur solange die Challenge läuft).',
    'Without a running challenge the button is not there': 'Ohne laufende Challenge fehlt der Knopf',
    'Start the challenge Outdoors on Today, then open Trips › Dreams.': 'Starte auf Heute die Challenge Draussen und öffne dann Touren › Träume.',
    'Under the trip tips tap «Did it»: the time you chose is added to Outdoors today.': 'Tippe unter den Ausflugstipps «Gemacht»: die gewählte Zeit wird heute zu Draussen gezählt.',
    'Tap «Undo»: the minutes are gone again.': 'Tippe «Rückgängig»: die Minuten sind wieder weg.',
  },
};
