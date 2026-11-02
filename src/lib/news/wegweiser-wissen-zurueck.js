// «Wegweiser statt Katalog» PR 14 (Noah 01.11.2026 «1-5a»): «What you can do here» with «Good to know» on the pages after a trip
export default {
  title: 'Looking back, with tips on the page',
  lead: 'Debriefs, logbook, learnings and letters now show what you can do there and one short tip each.',
  points: [
    {
      text: 'Debriefs, logbook, learnings, letters, meaning and skills show «What you can do here» with «Good to know»',
      go: { href: '#/debrief', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
  ],
  small: [],
  test: [
    'Open Trips › Debriefs: at the top is «What you can do here», each function with a line «Good to know».',
    'Open the logbook from there: the card shows its tip too; × folds it to one line.',
  ],
  since: [],
  de: {
    'Looking back, with tips on the page': 'Rückblick, mit Tipps direkt auf der Seite',
    'Debriefs, logbook, learnings and letters now show what you can do there and one short tip each.': 'Rückblicke, Logbuch, Gelerntes und Briefe zeigen jetzt, was du dort tun kannst, und je einen kurzen Tipp.',
    'Debriefs, logbook, learnings, letters, meaning and skills show «What you can do here» with «Good to know»': 'Rückblicke, Logbuch, Gelerntes, Briefe, Bedeutung und Können zeigen «Was du hier tun kannst» mit «Gut zu wissen»',
    'Open Trips › Debriefs: at the top is «What you can do here», each function with a line «Good to know».': 'Öffne Touren › Rückblick: oben steht «Was du hier tun kannst», jede Funktion mit einer Zeile «Gut zu wissen».',
    'Open the logbook from there: the card shows its tip too; × folds it to one line.': 'Öffne von dort das Logbuch: auch dort zeigt die Karte ihren Tipp; × klappt sie auf eine Zeile zu.',
  },
};
