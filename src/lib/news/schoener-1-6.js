// «App schöner» (Noah 24.11.2026 «1b 2a 3a 4a 5a»): a colour per area, normal headings, icons, small moves
export default {
  title: 'A colour for every area',
  lead: 'Every area now has its own colour: the + button, the chosen chip and the line under the tab follow it, and Weather has its own symbol. Headings are written normally, ticks and stars are icons, and a tick grows a little when you tap it. You can switch the colours off under Me › Look › Operation.',
  points: [{ text: 'Open Trips or Analysis: the + button and the chosen chip wear the colour of the area', go: { href: '#/trips', steps: [{ sel: '[data-subtabs]' }], where: 'Trips: the chips under the tabs.' } }],
  small: [{ box: 'new', text: 'A colour for every area, switch off under Operation' }, { box: 'new', text: 'Weather has its own symbol' }],
  test: ['Open Trips, then Analysis and Weather: the + button and the chosen chip change colour with the area.', 'Open Me › Look › Operation and switch «Colour per area» off: everything is green again.', 'Tick something off in Plan › Tick off today: the tick grows a little.'],
  since: [],
  de: {
    'A colour for every area': 'Eine Farbe für jeden Bereich',
    'Every area now has its own colour: the + button, the chosen chip and the line under the tab follow it, and Weather has its own symbol. Headings are written normally, ticks and stars are icons, and a tick grows a little when you tap it. You can switch the colours off under Me › Look › Operation.': 'Jeder Bereich hat jetzt seine eigene Farbe: der Plus-Knopf, der gewählte Chip und der Strich unter dem Reiter folgen ihr, und Wetter hat ein eigenes Symbol. Überschriften stehen normal geschrieben, Haken und Sterne sind Icons, und ein Haken wächst kurz, wenn du ihn antippst. Die Farben lassen sich unter Ich › Darstellung › Bedienung ausschalten.',
    'Open Trips or Analysis: the + button and the chosen chip wear the colour of the area': 'Öffne Touren oder Auswerten: der Plus-Knopf und der gewählte Chip tragen die Farbe des Bereichs',
    'Trips: the chips under the tabs.': 'Touren: die Chips unter den Reitern.',
    'A colour for every area, switch off under Operation': 'Eine Farbe für jeden Bereich, ausschaltbar unter Bedienung',
    'Weather has its own symbol': 'Wetter hat ein eigenes Symbol',
    'Open Trips, then Analysis and Weather: the + button and the chosen chip change colour with the area.': 'Öffne Touren, dann Auswerten und Wetter: der Plus-Knopf und der gewählte Chip wechseln mit dem Bereich die Farbe.',
    'Open Me › Look › Operation and switch «Colour per area» off: everything is green again.': 'Öffne Ich › Darstellung › Bedienung und schalte «Farbe pro Bereich» aus: alles ist wieder grün.',
    'Tick something off in Plan › Tick off today: the tick grows a little.': 'Hake in Planen › Heute abhaken etwas ab: der Haken wächst kurz.',
  },
};
