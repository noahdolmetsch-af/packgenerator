// «Neue Werte sichtbar» (Noah 28.10.2026 «haben wir sichergestellt, dass VO2max … sinnvoll angezeigt wird?»):
// VO₂max from Fitbit or Apple Health as a tab of its own in Körperwerte › Körper, with its course over time
export default {
  title: 'VO2max in your body values',
  lead: 'Your VO2max from Fitbit or Apple Health now has a tab of its own, with its course over weeks and the year.',
  points: [{ text: 'Body values › Body › VO2max', href: '#/flow/stats/hr' }],
  small: [],
  test: [
    'Open Auswerten › Körperwerte, tap the group «Körper» and then «VO2max».',
    'Switch to «1 J»: every month shows the mean of its days; without a value the page says where it comes from.',
  ],
  since: [],
  de: {
    'VO2max in your body values': 'VO2max in deinen Körperwerten',
    'Your VO2max from Fitbit or Apple Health now has a tab of its own, with its course over weeks and the year.': 'Dein VO2max von Fitbit oder Apple Health hat jetzt einen eigenen Reiter, mit Verlauf über Wochen und das Jahr.',
    'Body values › Body › VO2max': 'Körperwerte › Körper › VO2max',
    'Open Auswerten › Körperwerte, tap the group «Körper» and then «VO2max».': 'Öffne Auswerten › Körperwerte, tippe auf die Gruppe «Körper» und dann auf «VO2max».',
    'Switch to «1 J»: every month shows the mean of its days; without a value the page says where it comes from.': 'Wechsle auf «1 J»: jeder Monat zeigt den Mittelwert seiner Tage; ohne Wert sagt die Seite, woher er kommt.',
  },
};
