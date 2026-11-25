// «App schöner, Runde 2b» (Noah 24.11.2026 «1-7 alle»): icons in four sizes, one number style, a calmer Trips row
export default {
  title: 'Calmer icons and numbers',
  lead: 'All icons now stand in the same few sizes, ticks and stars are drawn icons, the sums at the top of Week are one number style, and «Tour from komoot» is a quiet link next to «Races» instead of a chip.',
  points: [{ text: 'Open Trips: «Tour from komoot» is a quiet link with an arrow beside «Races»', go: { href: '#/trips', steps: [{ sel: '[data-to-komoot]' }], where: 'Trips: the row at the top, beside «Races».' } }],
  small: [{ box: 'new', text: 'Icons in the same sizes everywhere' }, { box: 'new', text: 'The sums in Week as big numbers' }],
  test: ['Open Trips: «Tour from komoot» is a text link beside «Races», no chip under the head.', 'Open Week: the sums at the top stand as numbers with a small text.', 'Mark an item as a favourite in Gear: the star is a drawn icon.'],
  since: [],
  de: {
    'Calmer icons and numbers': 'Ruhigere Icons und Zahlen',
    'All icons now stand in the same few sizes, ticks and stars are drawn icons, the sums at the top of Week are one number style, and «Tour from komoot» is a quiet link next to «Races» instead of a chip.': 'Alle Icons stehen jetzt in wenigen gleichen Grössen, Haken und Sterne sind gezeichnete Icons, die Summen oben in Woche haben einen Zahlenstil, und «Tour aus komoot» ist ein ruhiger Link neben «Rennen» statt eines Chips.',
    'Open Trips: «Tour from komoot» is a quiet link with an arrow beside «Races»': 'Öffne Touren: «Tour aus komoot» ist ein ruhiger Link mit Pfeil neben «Rennen»',
    'Trips: the row at the top, beside «Races».': 'Touren: die Zeile oben, neben «Rennen».',
    'Icons in the same sizes everywhere': 'Icons überall in gleichen Grössen',
    'The sums in Week as big numbers': 'Die Summen in Woche als grosse Zahlen',
    'Open Trips: «Tour from komoot» is a text link beside «Races», no chip under the head.': 'Öffne Touren: «Tour aus komoot» ist ein Text-Link neben «Rennen», kein Chip unter dem Kopf.',
    'Open Week: the sums at the top stand as numbers with a small text.': 'Öffne Woche: die Summen oben stehen als Zahlen mit kleinem Text.',
    'Mark an item as a favourite in Gear: the star is a drawn icon.': 'Markiere in Material ein Teil als Favorit: der Stern ist ein gezeichnetes Icon.',
  },
};
