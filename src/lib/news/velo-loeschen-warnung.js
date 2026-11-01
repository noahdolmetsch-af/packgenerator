// «Velos löschen» (Noah 1.11.2026 «1-5 a»): the delete window warns and offers «Retire instead»
export default {
  title: 'Deleting a bike: a clearer warning',
  lead: 'Before you delete a bike, the window now offers to retire it instead.',
  points: [{ text: 'The delete window says what goes with the bike and offers «Retire instead»', go: { href: '#/bikes', steps: [{ text: 'Edit' }, { text: 'Delete bike' }] } }],
  small: [],
  test: [
    'Open Bikes, tap «Edit» at a bike and then «Delete bike».',
    'The window lists trips and what goes with the bike; «Retire instead» hides it without deleting anything.',
  ],
  since: [],
  de: {
    'Deleting a bike: a clearer warning': 'Velo löschen: klarere Warnung',
    'Before you delete a bike, the window now offers to retire it instead.': 'Bevor du ein Velo löschst, bietet das Fenster jetzt an, es stattdessen auszumustern.',
    'The delete window says what goes with the bike and offers «Retire instead»': 'Das Lösch-Fenster sagt, was mit dem Velo geht, und bietet «Stattdessen ausmustern» an',
    'Open Bikes, tap «Edit» at a bike and then «Delete bike».': 'Öffne Velos, tippe bei einem Velo auf «Bearbeiten» und dann auf «Velo löschen».',
    'The window lists trips and what goes with the bike; «Retire instead» hides it without deleting anything.': 'Das Fenster nennt die Touren und was mit dem Velo geht; «Stattdessen ausmustern» blendet es aus, ohne etwas zu löschen.',
  },
};
