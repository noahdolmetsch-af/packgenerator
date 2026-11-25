// «Lange Tour-Namen» (Gesamttest Runde 2, Fund C6, genauer beschrieben am 25.11.2026): a long trip name in Analysis › a value › «Trips in this range» wraps instead of ending in «…»
export default {
  title: 'Analysis: long trip names wrap',
  lead: 'In the list «Trips in this range» a long trip name now breaks into a second line, so you can read all of it.',
  points: [
    { text: 'A long trip name in «Trips in this range» wraps into a second line instead of ending in «…»', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-trip-list]' }], where: 'Analysis › Analyse › a value (for example Cardio load), the card «Trips in this range» (it shows once you have trips in the range).' } },
  ],
  small: [],
  test: [
    'Open Analysis › Analyse › Cardio load (3 months) on a phone and look at the card «Trips in this range».',
    'A trip with a long name shows its whole name over two lines; the value stays on the right.',
  ],
  since: [],
  de: {
    'Analysis: long trip names wrap': 'Analyse: lange Tour-Namen brechen um',
    'In the list «Trips in this range» a long trip name now breaks into a second line, so you can read all of it.': 'In der Liste «Touren in diesem Zeitraum» bricht ein langer Tour-Name jetzt in eine zweite Zeile um, so kannst du ihn ganz lesen.',
    'A long trip name in «Trips in this range» wraps into a second line instead of ending in «…»': 'Ein langer Tour-Name in «Touren in diesem Zeitraum» bricht in eine zweite Zeile um, statt auf «…» zu enden',
    'Analysis › Analyse › a value (for example Cardio load), the card «Trips in this range» (it shows once you have trips in the range).': 'Auswerten › Analyse › ein Wert (zum Beispiel Cardio-Belastung), die Karte «Touren in diesem Zeitraum» (sie erscheint, sobald Touren im Zeitraum liegen).',
    'Open Analysis › Analyse › Cardio load (3 months) on a phone and look at the card «Trips in this range».': 'Öffne am Handy Auswerten › Analyse › Cardio-Belastung (3 Monate) und schau die Karte «Touren in diesem Zeitraum» an.',
    'A trip with a long name shows its whole name over two lines; the value stays on the right.': 'Eine Tour mit langem Namen zeigt ihren ganzen Namen über zwei Zeilen; der Wert bleibt rechts.',
  },
};
