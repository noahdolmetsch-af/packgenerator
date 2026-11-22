// «Diagramme besser machen» (Noah 21.11.2026), Schritt 1: charts are never flatter than 140 px, and with few columns the labels under them are bigger
export default {
  title: 'Charts that are easier to read',
  lead: 'Every chart is at least a bit taller, and the labels under a chart with few bars are bigger.',
  points: [
    { text: 'Taller charts and bigger labels under the bars', href: '#/auswerten/sportjahr', go: { href: '#/auswerten/sportjahr', where: 'Auswerten › Sports year › year: the chart «Hours per month».' } },
  ],
  test: [
    'Open the Sports year, choose «Year»: the chart is taller than before and the letters under the bars are easier to read.',
    'Tap a bar: the window still opens as before.',
  ],
  since: [],
  de: {
    'Charts that are easier to read': 'Diagramme, die sich besser lesen lassen',
    'Every chart is at least a bit taller, and the labels under a chart with few bars are bigger.': 'Jedes Diagramm ist mindestens etwas höher, und die Beschriftung unter einem Diagramm mit wenigen Balken ist grösser.',
    'Taller charts and bigger labels under the bars': 'Höhere Diagramme und grössere Beschriftung unter den Balken',
    'Auswerten › Sports year › year: the chart «Hours per month».': 'Auswerten › Sportjahr › Jahr: das Diagramm «Stunden pro Monat».',
    'Open the Sports year, choose «Year»: the chart is taller than before and the letters under the bars are easier to read.': 'Öffne das Sportjahr, wähle «Jahr»: das Diagramm ist höher als vorher und die Buchstaben unter den Balken sind besser lesbar.',
    'Tap a bar: the window still opens as before.': 'Tippe einen Balken an: das Fenster öffnet sich wie vorher.',
  },
};
