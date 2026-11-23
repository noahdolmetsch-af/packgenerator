// «Diagramme überall verbessern» (Noah 23.11.2026 «fehler?»): a short note where the usual range is missing because of too few values
export default {
  title: 'Why the usual range is missing',
  lead: 'Where a body value curve has too few values for «Your usual range», a short line under the chart now says so.',
  points: [
    { text: 'Under the curve: «Too few values for your usual range (from 10 values)»', go: { href: '#/flow/stats/hr', where: 'Auswerten › Body › Body values › Pulse: range «7 days».' } },
  ],
  test: [
    'Open Body values, the tab «Pulse» and the range «7 days»: a quiet line under the chart says that the usual range needs 10 values.',
    'Switch to the range «4 wk.»: the line is gone and the band lies behind the curve (if you have 10 days with a value).',
  ],
  since: [],
  de: {
    'Why the usual range is missing': 'Warum die übliche Spanne fehlt',
    'Where a body value curve has too few values for «Your usual range», a short line under the chart now says so.': 'Hat eine Kurve der Körperwerte zu wenige Werte für «Deine übliche Spanne», sagt das jetzt eine kurze Zeile unter dem Diagramm.',
    'Under the curve: «Too few values for your usual range (from 10 values)»': 'Unter der Kurve: «Zu wenige Werte für deine übliche Spanne (ab 10 Werten)»',
    'Auswerten › Body › Body values › Pulse: range «7 days».': 'Auswerten › Körper › Körperwerte › Puls: Zeitraum «7 Ta.».',
    'Open Body values, the tab «Pulse» and the range «7 days»: a quiet line under the chart says that the usual range needs 10 values.': 'Öffne die Körperwerte, den Reiter «Puls» und den Zeitraum «7 Ta.»: eine ruhige Zeile unter dem Diagramm sagt, dass die übliche Spanne 10 Werte braucht.',
    'Switch to the range «4 wk.»: the line is gone and the band lies behind the curve (if you have 10 days with a value).': 'Wechsle auf den Zeitraum «4 Wo.»: die Zeile ist weg und das Band liegt hinter der Kurve (wenn du 10 Tage mit Wert hast).',
  },
};
