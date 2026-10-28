// «Genaue Werte» (Noah 27.10.2026 «die Diagramme sollen exakte Daten zeigen»): the charts of the tour page read off round steps
export default {
  title: 'Exact axes on the tour page',
  lead: 'The charts of a tour have round, labelled steps, so you can read every value off.',
  points: [{ text: 'Speed profile, height profile and the resting heart rate dots: round steps with grid lines, the unit at the top', go: 'f.tourpage' }],
  small: [],
  test: [
    'Open a ride under Touren › Fahrten: the speed profile counts 0, 20, 40 km/h (or 0, 10, 20 …) with a line at each step.',
    'Under «Werte» › «Ruhepuls (Fitbit)»: both axes of the dots go in even steps, no more «113» or «127».',
  ],
  since: [],
  de: {
    'Exact axes on the tour page': 'Genaue Achsen auf der Tour-Seite',
    'The charts of a tour have round, labelled steps, so you can read every value off.': 'Die Diagramme einer Tour haben runde, beschriftete Stufen. So kannst du jeden Wert ablesen.',
    'Speed profile, height profile and the resting heart rate dots: round steps with grid lines, the unit at the top': 'Geschwindigkeitsprofil, Höhenprofil und die Ruhepuls-Punkte: runde Stufen mit Gitterlinien, die Einheit oben',
    'Open a ride under Touren › Fahrten: the speed profile counts 0, 20, 40 km/h (or 0, 10, 20 …) with a line at each step.': 'Öffne eine Fahrt unter Touren › Fahrten: Das Geschwindigkeitsprofil zählt 0, 20, 40 km/h (oder 0, 10, 20 …) mit einer Linie bei jeder Stufe.',
    'Under «Werte» › «Ruhepuls (Fitbit)»: both axes of the dots go in even steps, no more «113» or «127».': 'Unter «Werte» › «Ruhepuls (Fitbit)»: Beide Achsen der Punkte gehen in gleichen Stufen, kein «113» oder «127» mehr.',
  },
};
