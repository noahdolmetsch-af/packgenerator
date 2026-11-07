// «Impulse: Heute nicht» (Noah 05.11.2026 «Touren 2a und b», Thread «Bauen: Freie Zeit Teil 1»)
export default {
  title: 'Impulses: not today',
  lead: 'An impulse that does not fit can rest for a while and stays out of your suggestions.',
  points: [{ text: 'Impulses: tap «Not today» on an idea', go: { href: '#/flow/impulse', steps: [{ sel: '[data-not-today]' }] } }],
  small: [{ box: 'new', text: 'A resting idea is marked in the list and can come back at once' }],
  test: ['Open the impulses and tap «Not today» on the idea of the day: another idea takes its place.', 'Open the resting idea in the list and tap «Bring back now».'],
  since: [],
  de: {
    'Impulses: not today': 'Impulse: Heute nicht',
    'An impulse that does not fit can rest for a while and stays out of your suggestions.': 'Ein Impuls, der gerade nicht passt, kann eine Weile ruhen und fehlt in deinen Vorschlägen.',
    'Impulses: tap «Not today» on an idea': 'Impulse: «Heute nicht» bei einer Idee antippen',
    'A resting idea is marked in the list and can come back at once': 'Eine ruhende Idee ist in der Liste markiert und kommt auf Wunsch sofort zurück',
    'Open the impulses and tap «Not today» on the idea of the day: another idea takes its place.': 'Öffne die Impulse und tippe bei der Idee des Tages auf «Heute nicht»: Eine andere Idee rückt nach.',
    'Open the resting idea in the list and tap «Bring back now».': 'Öffne die ruhende Idee in der Liste und tippe auf «Jetzt zurückholen».',
  },
};
