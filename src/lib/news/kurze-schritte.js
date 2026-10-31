// «Kurze Schritte» (Noah 26.10.2026 23:16 «1b nur die schrittleiste (mobile und computer)»): the step bar of a trip
// shows the short names Plan · Pack · Live · Review · Analyse; buttons and texts keep their words
export default {
  title: 'Short steps',
  lead: 'The step bar of a tour says Plan · Pack · Live · Review · Analyse.',
  points: [{ text: 'Step bar with short names, on the phone and the computer', href: '#/trips', go: { href: '#/pack', steps: [{ sel: 'nav.stepbar' }], where: 'Shows on top of a trip you plan or pack.' } }],
  small: [{ box: 'nicer', text: 'Buttons keep their words, for example «Continue to Pack»' }],
  test: ['Open a tour: the bar above says Plan · Pack · Live · Review · Analyse.', 'The buttons keep their words, for example «Continue to Pack».'],
  since: [],
  de: {
    'Short steps': 'Kurze Schritte',
    'The step bar of a tour says Plan · Pack · Live · Review · Analyse.': 'Die Schrittleiste einer Tour heisst jetzt Plan · Pack · Live · Review · Analyse.',
    'Step bar with short names, on the phone and the computer': 'Schrittleiste mit kurzen Namen, auf dem Handy und am Computer',
    'Buttons keep their words, for example «Continue to Pack»': 'Die Knöpfe behalten ihre Wörter, zum Beispiel «Weiter zu Packen»',
    'Open a tour: the bar above says Plan · Pack · Live · Review · Analyse.': 'Öffne eine Tour: Die Leiste oben zeigt Plan · Pack · Live · Review · Analyse.',
    'The buttons keep their words, for example «Continue to Pack».': 'Die Knöpfe behalten ihre Wörter, zum Beispiel «Weiter zu Packen».',
  },
};
