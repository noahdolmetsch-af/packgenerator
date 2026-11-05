// «Persönliche Experimente» (Noah 04.11.2026, Persönliches Lernen Idee 2): a try can read values of your rides
export default {
  title: 'Experiments with ride values',
  lead: 'A try can now ask about your rides, for example «Do I ride more comfortably with a higher cadence?». It reads how hard the rides felt, cadence, speed or watts per kilo, and puts the days of the try next to the days before. It only describes; it never says why.',
  points: [
    { text: 'New values for a try: how hard the rides felt, cadence, speed, watts per kilo', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-metric]' }], where: 'Ich › Ruhig › Versuche, the form of a new try.' } },
    { text: 'A second value next to the first, and a ready example about cadence', go: { href: '#/me/ruhig/versuche', steps: [{ sel: '[data-exp-q]' }], where: 'Ich › Ruhig › Versuche; the example sits under the form.' } },
  ],
  small: [{ box: 'new', text: 'The examples stay under the form after your first try' }],
  test: [
    'Open Ich › Ruhig › Versuche and tap the example «Do I ride more comfortably with a higher cadence?».',
    'The form now holds a value and a second one to compare, and the try runs for 14 days.',
    'Start it: once rides with an answer exist, the card shows before and during for each value.',
  ],
  since: [],
  de: {
    'Experiments with ride values': 'Experimente mit Fahrt-Werten',
    'A try can now ask about your rides, for example «Do I ride more comfortably with a higher cadence?». It reads how hard the rides felt, cadence, speed or watts per kilo, and puts the days of the try next to the days before. It only describes; it never says why.': 'Ein Versuch kann jetzt nach deinen Fahrten fragen, zum Beispiel «Fahre ich mit höherer Kadenz angenehmer?». Er liest, wie anstrengend die Fahrten waren, die Kadenz, das Tempo oder die Watt pro Kilo, und stellt die Tage des Versuchs neben die Tage davor. Er beschreibt nur und sagt nie, warum.',
    'New values for a try: how hard the rides felt, cadence, speed, watts per kilo': 'Neue Werte für einen Versuch: wie anstrengend die Fahrten waren, Kadenz, Tempo, Watt pro Kilo',
    'Ich › Ruhig › Versuche, the form of a new try.': 'Ich › Ruhig › Versuche, das Formular eines neuen Versuchs.',
    'A second value next to the first, and a ready example about cadence': 'Ein zweiter Wert neben dem ersten und ein fertiges Beispiel zur Kadenz',
    'Ich › Ruhig › Versuche; the example sits under the form.': 'Ich › Ruhig › Versuche; das Beispiel steht unter dem Formular.',
    'The examples stay under the form after your first try': 'Die Beispiele bleiben nach deinem ersten Versuch unter dem Formular',
    'Open Ich › Ruhig › Versuche and tap the example «Do I ride more comfortably with a higher cadence?».': 'Öffne Ich › Ruhig › Versuche und tippe auf das Beispiel «Fahre ich mit höherer Kadenz angenehmer?».',
    'The form now holds a value and a second one to compare, and the try runs for 14 days.': 'Das Formular hat jetzt einen Wert und einen zweiten zum Vergleichen, und der Versuch läuft 14 Tage.',
    'Start it: once rides with an answer exist, the card shows before and during for each value.': 'Starte ihn: sobald Fahrten mit einer Antwort da sind, zeigt die Karte für jeden Wert davor und währenddessen.',
  },
};
