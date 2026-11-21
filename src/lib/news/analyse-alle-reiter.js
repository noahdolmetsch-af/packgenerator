// «Alle Reiter sichtbar» (Noah 08.11.2026 «1a», UI-Test der Analyse-Seite): the six parts of Analyse all on screen
export default {
  title: 'Analyse: all parts visible at once',
  lead: 'The six parts of Analyse (Overview, Own diagram, Comparisons, Records, Bikes, All values) no longer hide behind a swipe: on a phone they sit in two rows of three.',
  points: [
    { text: 'All six parts of Analyse are visible at once, on a phone in two rows of three', go: { href: '#/auswerten/analyse', steps: [{ sel: '[role="tablist"]' }], where: 'Auswerten › Analyse, the row of parts under the period.' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse on a phone: all six parts are there, in two rows of three, without swiping.',
    'Tap «Records and runs»: the part opens and the page does not move sideways.',
  ],
  since: [],
  de: {
    'Analyse: all parts visible at once': 'Analyse: alle Reiter auf einen Blick',
    'The six parts of Analyse (Overview, Own diagram, Comparisons, Records, Bikes, All values) no longer hide behind a swipe: on a phone they sit in two rows of three.': 'Die sechs Teile der Analyse (Übersicht, Eigenes Diagramm, Vergleiche, Rekorde, Velos, Alle Werte) verstecken sich nicht mehr hinter einem Wisch: Am Handy stehen sie in zwei Zeilen zu je drei.',
    'All six parts of Analyse are visible at once, on a phone in two rows of three': 'Alle sechs Teile der Analyse sind auf einen Blick sichtbar, am Handy in zwei Zeilen zu je drei',
    'Auswerten › Analyse, the row of parts under the period.': 'Auswerten › Analyse, die Reihe der Teile unter dem Zeitraum.',
    'Open Auswerten › Analyse on a phone: all six parts are there, in two rows of three, without swiping.': 'Öffne am Handy Auswerten › Analyse: Alle sechs Teile sind da, in zwei Zeilen zu je drei, ohne zu wischen.',
    'Tap «Records and runs»: the part opens and the page does not move sideways.': 'Tippe auf «Rekorde und Serien»: Der Teil öffnet sich und die Seite rutscht nicht seitlich.',
  },
};
