// «Temperaturen nach Höhe in Tour planen» (Noah 05.11.2026 «4b»): 500 to 4000 m on the tour day, start and peak, hints
export default {
  title: 'Mountain temperatures for the ski tour',
  lead: 'Tour planning shows the air temperature at 500 to 4000 m on the day of your tour.',
  points: [
    { text: 'A table with eight heights at 6, 9, 12 and 15 h on the day of the tour', go: { href: '#/ski/plan', where: 'Ski tours › Plan the tour › «Temperatures by height» (the tour needs a place and a date in the next three days).' } },
    { text: 'Type the height of the start and of the peak: you get the temperature at the start, ready to use for «Temperature at the start»', go: { href: '#/ski/plan', where: 'Ski tours › Plan the tour › «Temperatures by height» › the two height fields.' } },
    { text: 'Hints: the 0 °C line, a very cold peak, a peak or a start above zero. A suggestion, never a judgement of the slope', go: { href: '#/ski/plan', where: 'Ski tours › Plan the tour › under the table, once you typed the heights.' } },
  ],
  small: [{ box: 'new', text: 'Nothing is filled in on its own: the temperature at the start is a button' }],
  test: [
    'Open Ski tours › Plan the tour: under «Conditions» you see «Temperatures by height» with eight heights.',
    'Type a height for the start: below the table you see the air at the start and the button «Use for «Temperature at the start»».',
    'Type a height for the peak: the hints show the 0 °C line and, depending on the numbers, a warm or cold peak.',
  ],
  since: [],
  de: {
    'Mountain temperatures for the ski tour': 'Bergtemperaturen für die Skitour',
    'Tour planning shows the air temperature at 500 to 4000 m on the day of your tour.': 'Die Tourenplanung zeigt die Lufttemperatur auf 500 bis 4000 m am Tag deiner Tour.',
    'A table with eight heights at 6, 9, 12 and 15 h on the day of the tour': 'Eine Tabelle mit acht Höhen um 6, 9, 12 und 15 Uhr am Tag der Tour',
    'Ski tours › Plan the tour › «Temperatures by height» (the tour needs a place and a date in the next three days).': 'Skitouren › Tour planen › «Temperaturen nach Höhe» (die Tour braucht einen Ort und ein Datum in den nächsten drei Tagen).',
    'Type the height of the start and of the peak: you get the temperature at the start, ready to use for «Temperature at the start»': 'Gib die Höhe von Start und Gipfel ein: Du bekommst die Temperatur am Start, bereit für «Temperatur am Start»',
    'Ski tours › Plan the tour › «Temperatures by height» › the two height fields.': 'Skitouren › Tour planen › «Temperaturen nach Höhe» › die zwei Höhenfelder.',
    'Hints: the 0 °C line, a very cold peak, a peak or a start above zero. A suggestion, never a judgement of the slope': 'Hinweise: die Nullgradgrenze, ein sehr kalter Gipfel, ein Gipfel oder ein Start über null. Ein Vorschlag, nie eine Beurteilung des Hangs',
    'Ski tours › Plan the tour › under the table, once you typed the heights.': 'Skitouren › Tour planen › unter der Tabelle, sobald du die Höhen eingegeben hast.',
    'Nothing is filled in on its own: the temperature at the start is a button': 'Nichts wird von selbst ausgefüllt: Die Temperatur am Start ist ein Knopf',
    'Open Ski tours › Plan the tour: under «Conditions» you see «Temperatures by height» with eight heights.': 'Öffne Skitouren › Tour planen: Unter «Bedingungen» siehst du «Temperaturen nach Höhe» mit acht Höhen.',
    'Type a height for the start: below the table you see the air at the start and the button «Use for «Temperature at the start»».': 'Gib eine Höhe für den Start ein: Unter der Tabelle siehst du die Luft am Start und den Knopf «Für «Temperatur am Start» übernehmen».',
    'Type a height for the peak: the hints show the 0 °C line and, depending on the numbers, a warm or cold peak.': 'Gib eine Höhe für den Gipfel ein: Die Hinweise zeigen die Nullgradgrenze und, je nach Zahlen, einen warmen oder kalten Gipfel.',
  },
};
