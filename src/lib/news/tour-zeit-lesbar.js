// Tour-Seite (Noah 27.10.2026 «1a»): the total time and the pauses readable, and the jump bar marks the part you read
export default {
  title: 'Easier to read on the tour page',
  lead: 'The total time reads in hours and minutes, and the jump bar shows where you are.',
  points: [{ text: 'Total time and pauses read «2 h 02 min 18 s» instead of «00:02:02:18»' }],
  small: [{ box: 'nicer', text: 'On a computer the jump bar marks the part you are reading, no longer «Gear» at the top' }],
  test: [
    'Open a finished ride under Touren › Fahrten: under «Werte» the elapsed time reads like «2 h 02 min 18 s».',
    'On a computer with «Alles auf einer Seite»: at the top «Übersicht» is marked, scrolling down marks «Werte», then «Analyse».',
  ],
  since: [],
  de: {
    'Easier to read on the tour page': 'Die Tour-Seite liest sich leichter',
    'The total time reads in hours and minutes, and the jump bar shows where you are.': 'Die Gesamtzeit steht in Stunden und Minuten, und die Sprungleiste zeigt, wo du bist.',
    'Total time and pauses read «2 h 02 min 18 s» instead of «00:02:02:18»': 'Gesamtzeit und Pausen heissen «2 h 02 min 18 s» statt «00:02:02:18»',
    'On a computer the jump bar marks the part you are reading, no longer «Gear» at the top': 'Am Computer markiert die Sprungleiste den Teil, den du liest, nicht mehr oben «Gepäck»',
    'Open a finished ride under Touren › Fahrten: under «Werte» the elapsed time reads like «2 h 02 min 18 s».': 'Öffne eine Fahrt unter Touren › Fahrten: Unter «Werte» steht die verstrichene Zeit wie «2 h 02 min 18 s».',
    'On a computer with «Alles auf einer Seite»: at the top «Übersicht» is marked, scrolling down marks «Werte», then «Analyse».': 'Am Computer mit «Alles auf einer Seite»: Oben ist «Übersicht» markiert, beim Scrollen «Werte», dann «Analyse».',
  },
};
