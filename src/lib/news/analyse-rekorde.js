// «Rekorde: Wann lesbar» (Noah 08.11.2026 «2a», UI-Test der Analyse-Seite): the date stands under the best value
export default {
  title: 'Records: the date is readable',
  lead: 'In the card «Records» the date now stands under the best value, so it is no longer cut off on a phone.',
  points: [
    { text: 'Records: the date stands small under the best value, nothing is cut off on a phone', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-records]' }], where: 'Auswerten › Analyse › Records and runs, card «Records».' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse › Records and runs on a phone and look at the card «Records».',
    'Every row shows its best value and, small underneath, when it was; nothing is cut off and the card does not swipe sideways.',
  ],
  since: [],
  de: {
    'Records: the date is readable': 'Rekorde: das Datum ist lesbar',
    'In the card «Records» the date now stands under the best value, so it is no longer cut off on a phone.': 'In der Karte «Rekorde» steht das Datum jetzt unter dem Bestwert, so ist es am Handy nicht mehr abgeschnitten.',
    'Records: the date stands small under the best value, nothing is cut off on a phone': 'Rekorde: das Datum steht klein unter dem Bestwert, am Handy wird nichts mehr abgeschnitten',
    'Auswerten › Analyse › Records and runs, card «Records».': 'Auswerten › Analyse › Rekorde und Serien, Karte «Rekorde».',
    'Open Auswerten › Analyse › Records and runs on a phone and look at the card «Records».': 'Öffne am Handy Auswerten › Analyse › Rekorde und Serien und schau die Karte «Rekorde» an.',
    'Every row shows its best value and, small underneath, when it was; nothing is cut off and the card does not swipe sideways.': 'Jede Zeile zeigt ihren Bestwert und klein darunter, wann er war; nichts ist abgeschnitten und die Karte wischt nicht seitlich.',
  },
};
