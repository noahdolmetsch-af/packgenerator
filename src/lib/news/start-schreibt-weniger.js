// «Start schreibt weniger» (Noah 11.11.2026 «1-4 umsetzen», Messung 10.11.): the start-up step for trips wrote trips again at every start
export default {
  title: 'Quieter start',
  lead: 'At every start the app no longer saves your trips again when nothing changed.',
  points: [{ text: 'Trips are only saved at the start when something about them really changes', go: null }],
  small: [{ box: 'new', text: 'Less work at the start, fewer folder backups and sync rounds triggered by it' }],
  test: ['Open the app twice in a row: Heute shows the same trips both times.', 'Open a trip from Touren: its packing list is as you left it.'],
  since: [],
  de: {
    'Quieter start': 'Ruhigerer Start',
    'At every start the app no longer saves your trips again when nothing changed.': 'Beim Start speichert die App deine Touren nicht mehr neu, wenn sich nichts geändert hat.',
    'Trips are only saved at the start when something about them really changes': 'Touren werden beim Start nur noch gespeichert, wenn sich wirklich etwas an ihnen ändert',
    'Less work at the start, fewer folder backups and sync rounds triggered by it': 'Weniger Arbeit beim Start, weniger davon ausgelöste Ordner-Backups und Abgleich-Runden',
    'Open the app twice in a row: Heute shows the same trips both times.': 'Öffne die App zweimal hintereinander: Heute zeigt beide Male dieselben Touren.',
    'Open a trip from Touren: its packing list is as you left it.': 'Öffne eine Tour aus Touren: ihre Packliste ist so, wie du sie verlassen hast.',
  },
};
