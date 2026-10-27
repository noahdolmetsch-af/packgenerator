// «Eigenes Diagramm» D4 (Noah 27.10.2026 «3a und b möglich»): filters for the whole diagram and per value
export default {
  title: 'Filters for your diagram',
  lead: 'Choose which days count: weekdays, with or without an activity, trips, how you felt, without outliers.',
  points: [
    { text: 'One filter for the whole diagram, and on wish one more for a single value (the small funnel next to its name)', href: '#/auswerten/analyse' },
    { text: 'Days left out stay a gap, so the time stays true; you see how many days fit', href: '#/auswerten/analyse' },
    { text: 'Mark the days of an activity with a dot under every row; trips as a band on or off', href: '#/auswerten/analyse' },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse, tap «Filter» in «Eigenes Diagramm».',
    'Switch off Sa and So, choose «ohne Sauna», tap «… Tage zeigen»: the rows get gaps on those days.',
    'Tap the funnel next to «Velo» and choose «nur Tour-Tage»: only that row changes.',
  ],
  since: [],
  de: {
    'Filters for your diagram': 'Filter für dein Diagramm',
    'Choose which days count: weekdays, with or without an activity, trips, how you felt, without outliers.':
      'Wähle, welche Tage zählen: Wochentage, mit oder ohne Aktivität, Touren, wie es dir ging, ohne Ausreisser.',
    'One filter for the whole diagram, and on wish one more for a single value (the small funnel next to its name)':
      'Ein Filter für das ganze Diagramm und auf Wunsch ein zusätzlicher für einen einzelnen Wert (der kleine Trichter neben seinem Namen)',
    'Days left out stay a gap, so the time stays true; you see how many days fit': 'Ausgeblendete Tage bleiben als Lücke, damit die Zeit stimmt; du siehst, wie viele Tage passen',
    'Mark the days of an activity with a dot under every row; trips as a band on or off': 'Tage einer Aktivität mit einem Punkt unter jeder Zeile markieren; Touren als Band ein- oder ausschalten',
    'Open Auswerten › Analyse, tap «Filter» in «Eigenes Diagramm».': 'Öffne Auswerten › Analyse und tippe in «Eigenes Diagramm» auf «Filter».',
    'Switch off Sa and So, choose «ohne Sauna», tap «… Tage zeigen»: the rows get gaps on those days.': 'Schalte Sa und So aus, wähle «ohne Sauna», tippe «… Tage zeigen»: Die Zeilen haben an diesen Tagen Lücken.',
    'Tap the funnel next to «Velo» and choose «nur Tour-Tage»: only that row changes.': 'Tippe auf den Trichter neben «Velo» und wähle «nur Tour-Tage»: Nur diese Zeile ändert sich.',
  },
};
