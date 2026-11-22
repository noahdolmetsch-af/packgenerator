// «Zurück zu Heute» auf den alten Seiten (Noah 07.11.2026 «5a» des Wege-Entwurfs): the old value pages remember where you came from too
export default {
  title: 'Back to where you came from, on the old value pages too',
  lead: 'Open a value from Heute and the old page of that value now has «Back to Heute» at the top left, as in Analyse.',
  points: [{ text: 'On the old value pages, «Back to Heute» (or another page) brings you back', go: { href: '#/flow/stats/hr', steps: [{ sel: '[data-crumb-back]' }], where: 'Top left of a value page you opened from Heute.' } }],
  small: [],
  test: ['Open Heute, then a pulse value that opens its old page: at the top left it says «Back to Heute».', 'Tap it: you are on Heute again. Coming from Aktiv there is no second button, «‹ Aktiv» does the same.'],
  since: [],
  de: {
    'Back to where you came from, on the old value pages too': 'Zurück, wo du herkamst, auch auf den alten Wertseiten',
    'Open a value from Heute and the old page of that value now has «Back to Heute» at the top left, as in Analyse.': 'Öffnest du einen Wert von Heute aus, steht auch auf der alten Seite dieses Werts oben links «Zurück zu Heute», wie in der Analyse.',
    'On the old value pages, «Back to Heute» (or another page) brings you back': 'Auf den alten Wertseiten bringt dich «Zurück zu Heute» (oder einer anderen Seite) zurück',
    'Top left of a value page you opened from Heute.': 'Oben links auf einer Wertseite, die du von Heute aus geöffnet hast.',
    'Open Heute, then a pulse value that opens its old page: at the top left it says «Back to Heute».': 'Öffne Heute und dann einen Pulswert, der seine alte Seite öffnet: oben links steht «Zurück zu Heute».',
    'Tap it: you are on Heute again. Coming from Aktiv there is no second button, «‹ Aktiv» does the same.': 'Tippe darauf: du bist wieder auf Heute. Von Aktiv aus gibt es keinen zweiten Knopf, «‹ Aktiv» macht dasselbe.',
  },
};
