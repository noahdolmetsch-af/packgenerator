// «Zusammenlegen» (Noah 21.11.2026 «Ja, bauen»): zwei Sportarten werden eine, mit Rückgängig
export default {
  title: 'Merge two sports',
  lead: 'Gym and eGym are the same sport? «Merge» puts all ticks into one sport and takes the other from the lists.',
  points: [
    { text: 'Merge two sports into one: in the menu «⋯» of a sport, or at the hint «appears twice», with Undo', go: { href: '#/flow/sports', steps: [{ sel: '[data-sport-row]' }] } },
  ],
  small: [{ box: 'new', text: 'In «Edit sport» under «Pause or delete»: «Merge with another sport»' }],
  test: ['Open Active › My sports, tap «⋯» of a sport and «Merge …»: the window asks which sport stays and how many ticks go over.', 'Tap «Merge»: the first sport is gone from the list, its ticks count for the other. Tap «Undo» within a few seconds: everything is back.'],
  since: [],
  de: {
    'Merge two sports': 'Zwei Sportarten zusammenlegen',
    'Gym and eGym are the same sport? «Merge» puts all ticks into one sport and takes the other from the lists.': 'Gym und eGym sind dieselbe Sportart? «Zusammenlegen» legt alle Haken in eine Sportart und nimmt die andere aus den Listen.',
    'Merge two sports into one: in the menu «⋯» of a sport, or at the hint «appears twice», with Undo': 'Zwei Sportarten zu einer zusammenlegen: im Menü «⋯» einer Sportart oder beim Hinweis «kommt zweimal vor», mit Rückgängig',
    'In «Edit sport» under «Pause or delete»: «Merge with another sport»': 'Im Fenster einer Sportart unter «Pause oder löschen»: «Mit einer anderen Sportart zusammenlegen»',
    'Open Active › My sports, tap «⋯» of a sport and «Merge …»: the window asks which sport stays and how many ticks go over.': 'Öffne Aktiv › Meine Sportarten, tippe bei einer Sportart auf «⋯» und «Zusammenlegen …»: das Fenster fragt, welche Sportart bleibt und wie viele Haken mitgehen.',
    'Tap «Merge»: the first sport is gone from the list, its ticks count for the other. Tap «Undo» within a few seconds: everything is back.': 'Tippe «Zusammenlegen»: die erste Sportart ist aus der Liste weg, ihre Haken zählen für die andere. Tippe in ein paar Sekunden auf «Rückgängig»: alles ist zurück.',
  },
};
