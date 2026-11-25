// «Schmale Handys» (Gesamttest Runde 2, C3 und C6, Noah 25.11.2026 «Alle B und C weitergeben»): words stay whole at 320 px
export default {
  title: 'Narrow phones: words stay whole',
  lead: 'On a very narrow phone (320 px) the chips and tabs of Analysis and Body values and the session names of the training week no longer break in the middle of a word.',
  points: [
    { text: 'Analysis: «Vergleiche» stands on one line in the row of parts', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-tab="vergleiche"]' }], where: 'Analysis › Analyse, the row of parts under the card «30 days».' } },
    { text: 'Sport pages: «Höhenmeter» and the other tabs stay whole; the row scrolls sideways if the screen is too narrow', go: { href: '#/flow/stats/bike', steps: [{ sel: '[role="tablist"]' }], where: 'Analysis › Overview, a tile of a sport (for example Bike), the row under the title.' } },
    { text: 'Training › Week: a long word in a session name breaks at a syllable with a hyphen, not letter by letter', go: null },
  ],
  small: [{ box: 'nicer', text: 'The bottom bar names «Auswerten» in full at 320 px, also when it is the chosen place' }],
  test: [
    'Make the browser window 320 px wide (or use a small phone) and open Analysis › Analyse: «Vergleiche» is one word on one line.',
    'Open a sport page (Analysis › Overview, tap the Bike tile): in the row «Distance, Time, Climbing, Calories» the word «Höhenmeter» is whole.',
    'Open Week › Training: a long session name wraps at a syllable, not in the middle of a word.',
  ],
  since: [],
  de: {
    'Narrow phones: words stay whole': 'Schmale Handys: Wörter bleiben ganz',
    'On a very narrow phone (320 px) the chips and tabs of Analysis and Body values and the session names of the training week no longer break in the middle of a word.': 'Auf einem sehr schmalen Handy (320 px) brechen die Chips und Reiter von Analyse und Körperwerten und die Einheiten-Namen der Trainingswoche nicht mehr mitten im Wort um.',
    'Analysis: «Vergleiche» stands on one line in the row of parts': 'Analyse: «Vergleiche» steht in der Reihe der Teile in einer Zeile',
    'Analysis › Analyse, the row of parts under the card «30 days».': 'Auswerten › Analyse, die Reihe der Teile unter der Karte «30 Tage».',
    'Sport pages: «Höhenmeter» and the other tabs stay whole; the row scrolls sideways if the screen is too narrow': 'Sportseiten: «Höhenmeter» und die anderen Reiter bleiben ganz; die Reihe scrollt seitwärts, wenn der Bildschirm zu schmal ist',
    'Analysis › Overview, a tile of a sport (for example Bike), the row under the title.': 'Auswerten › Übersicht, eine Kachel einer Sportart (zum Beispiel Velo), die Reihe unter dem Titel.',
    'Training › Week: a long word in a session name breaks at a syllable with a hyphen, not letter by letter': 'Training › Woche: ein langes Wort in einem Einheiten-Namen trennt an einer Silbe mit Bindestrich, nicht Buchstabe für Buchstabe',
    'The bottom bar names «Auswerten» in full at 320 px, also when it is the chosen place': 'Die untere Leiste nennt «Auswerten» bei 320 px ganz, auch wenn es der gewählte Ort ist',
    'Make the browser window 320 px wide (or use a small phone) and open Analysis › Analyse: «Vergleiche» is one word on one line.': 'Mach das Browserfenster 320 px breit (oder nimm ein kleines Handy) und öffne Auswerten › Analyse: «Vergleiche» steht als ein Wort in einer Zeile.',
    'Open a sport page (Analysis › Overview, tap the Bike tile): in the row «Distance, Time, Climbing, Calories» the word «Höhenmeter» is whole.': 'Öffne Körperwerte › Herz und wähle eine Sportart mit den Reitern «Distanz, Zeit, Höhenmeter, Kalorien»: «Höhenmeter» steht ganz.',
    'Open Week › Training: a long session name wraps at a syllable, not in the middle of a word.': 'Öffne Woche › Training: ein langer Einheiten-Name bricht an einer Silbe um, nicht mitten im Wort.',
  },
};
