// «Kleiderschrank einrichten» (Noah 21.11.2026 «1-5a 4b», Thread «Kleiderschrank wieder ins Zentrum rücken», Weg C)
export default {
  title: 'Set up your wardrobe',
  lead: 'Give every piece its temperature in one tap, so the onion can think along.',
  points: [
    { text: 'The new page «Set up wardrobe»: one piece after the other, five steps from Warm to Frost, the suggestion is already chosen', go: 'f.wardrobesetup' },
    { text: 'The wardrobe says how many pieces still lack a temperature and leads there', go: { href: '#/wardrobe', steps: [{ sel: '[data-setup-hint]' }] } },
  ],
  small: [{ box: 'new', text: 'Skip a piece, or tell the app you do not have it any more; every save has an Undo', go: 'f.wardrobesetup' }],
  test: ['Open the wardrobe and tap «Set up wardrobe» next to the line about pieces without a temperature.', 'Tap «Save and next» for the first piece and see it leave the queue; tap Undo and it comes back.', 'Open Today: «What do I wear today?» now finds a piece where it said «nothing warm enough».'],
  since: ['f.wardrobesetup'],
  de: {
    'Set up your wardrobe': 'Kleiderschrank einrichten',
    'Give every piece its temperature in one tap, so the onion can think along.': 'Gib jedem Teil mit einem Tipp seine Temperatur, damit die Zwiebel mitdenken kann.',
    'The new page «Set up wardrobe»: one piece after the other, five steps from Warm to Frost, the suggestion is already chosen': 'Die neue Seite «Kleiderschrank einrichten»: ein Teil nach dem anderen, fünf Stufen von Warm bis Frost, der Vorschlag ist schon gewählt',
    'The wardrobe says how many pieces still lack a temperature and leads there': 'Der Kleiderschrank sagt, wie viele Teile noch keine Temperatur haben, und führt dorthin',
    'Skip a piece, or tell the app you do not have it any more; every save has an Undo': 'Überspring ein Teil oder sag der App, dass du es nicht mehr hast; jede Speicherung hat «Rückgängig»',
    'Open the wardrobe and tap «Set up wardrobe» next to the line about pieces without a temperature.': 'Öffne den Kleiderschrank und tippe auf «Kleiderschrank einrichten» neben der Zeile über Teile ohne Temperatur.',
    'Tap «Save and next» for the first piece and see it leave the queue; tap Undo and it comes back.': 'Tippe beim ersten Teil auf «Speichern und weiter»: es verlässt die Reihe; tippe auf «Rückgängig» und es kommt zurück.',
    'Open Today: «What do I wear today?» now finds a piece where it said «nothing warm enough».': 'Öffne Heute: «Was ziehe ich heute an?» findet jetzt ein Teil, wo vorher «nichts warm genug» stand.',
  },
};
