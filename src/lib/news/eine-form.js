// UI-Test 26.10.2026 T3 «Form: eine Rechnung, ein Wort» (G2-02): Training and «Form und Erholung» read the same form (form.js shownForm/formWeeksOf), the sum is written out, «Müdigkeit» everywhere
export default {
  title: 'One form',
  lead: 'Training and «Form and recovery» show the same form number.',
  points: [{ text: 'Form = fitness − fatigue, written out under the chart', href: '#/flow/training' }],
  small: [{ box: 'nicer', text: 'One word: «fatigue» everywhere' }],
  test: ['Open Active › Training and scroll to «Fitness, fatigue and form»: under it the sum is written out.', 'Analyse › «Form and recovery» shows the same form number.'],
  since: [],
  de: {
    'One form': 'Eine Form',
    'Training and «Form and recovery» show the same form number.': 'Training und «Form und Erholung» zeigen dieselbe Form-Zahl.',
    'Form = fitness − fatigue, written out under the chart': 'Form = Fitness − Müdigkeit, ausgeschrieben unter der Kurve',
    'One word: «fatigue» everywhere': 'Ein Wort: überall «Müdigkeit»',
    'Open Active › Training and scroll to «Fitness, fatigue and form»: under it the sum is written out.': 'Öffne Aktiv › Training und scrolle zu «Fitness, Müdigkeit und Form»: Darunter steht die Rechnung.',
    'Analyse › «Form and recovery» shows the same form number.': 'Auswerten › «Form und Erholung» zeigt dieselbe Form-Zahl.',
  },
};
