// «Analyse» own calculations (Noah 27.10.2026 «4a»: own, labelled calculations where Google gives nothing out)
export default {
  title: 'Own calculations in Analyse',
  lead: 'Where Google gives nothing out, the app now counts its own: sleep score, restlessness in sleep and cardio load, always marked «eigene Rechnung».',
  points: [
    { text: 'Sleep score 0–100 from duration, deep and REM sleep and calm', href: '#/auswerten/analyse' },
    { text: 'Restlessness: minutes awake per hour of sleep', href: '#/auswerten/analyse' },
    { text: 'Cardio load: minutes per pulse zone, weighted', href: '#/auswerten/analyse' },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse: the tiles «Schlafindex» and «Unruhe im Schlaf» say «eigene Rechnung».',
    'Tap «Schlafindex»: the page says how the app counts it.',
  ],
  since: [],
  de: {
    'Own calculations in Analyse': 'Eigene Rechnungen in Analyse',
    'Where Google gives nothing out, the app now counts its own: sleep score, restlessness in sleep and cardio load, always marked «eigene Rechnung».':
      'Wo Google nichts herausgibt, rechnet die App jetzt selbst: Schlafindex, Unruhe im Schlaf und Cardio-Belastung, immer mit «eigene Rechnung» angeschrieben.',
    'Sleep score 0–100 from duration, deep and REM sleep and calm': 'Schlafindex 0–100 aus Dauer, Tief- und REM-Schlaf und Ruhe',
    'Restlessness: minutes awake per hour of sleep': 'Unruhe: Minuten wach pro Stunde Schlaf',
    'Cardio load: minutes per pulse zone, weighted': 'Cardio-Belastung: Minuten pro Pulszone, gewichtet',
    'Open Auswerten › Analyse: the tiles «Schlafindex» and «Unruhe im Schlaf» say «eigene Rechnung».':
      'Öffne Auswerten › Analyse: Die Kacheln «Schlafindex» und «Unruhe im Schlaf» sagen «eigene Rechnung».',
    'Tap «Schlafindex»: the page says how the app counts it.': 'Tippe «Schlafindex» an: Die Seite sagt, wie die App ihn rechnet.',
  },
};
