// «Velos: ein Wort pro Ding» (Noah 23.11.2026 «1-5 a»): the same name for the same thing on the card and in the care
export default {
  title: 'Bikes: one word for one thing',
  lead: 'The bike card and the care page now say the same: «parts without a start value». The grey hint on a card says what to do, and «Repair kit» is called «Reparaturset» in German like everywhere else.',
  points: [{ text: 'On a bike card the line says «7 parts without a start value» and «enter km, then the app can calculate»', go: { href: '#/bikes', steps: [{ sel: '[data-bike-cards]' }], where: 'Bikes › Setup: the grey line on a bike card that has no km or start values yet.' } }],
  small: [],
  test: ['Open Bikes: a card with missing start values says «parts without a start value», the same words as on the care page.', 'A bike without km says «enter km, then the app can calculate».', 'Open a bike’s sheets: the one with tools and spares is called «Reparaturset».'],
  since: [],
  de: {
    'Bikes: one word for one thing': 'Velos: ein Wort für eine Sache',
    'The bike card and the care page now say the same: «parts without a start value». The grey hint on a card says what to do, and «Repair kit» is called «Reparaturset» in German like everywhere else.': 'Die Velo-Karte und die Pflege sagen jetzt dasselbe: «Teile ohne Startwert». Der graue Hinweis auf einer Karte sagt, was zu tun ist, und das «Repair-Kit» heisst überall «Reparaturset».',
    'On a bike card the line says «7 parts without a start value» and «enter km, then the app can calculate»': 'Auf einer Velo-Karte steht «7 Teile ohne Startwert» und «km eintragen, dann kann die App rechnen»',
    'Bikes › Setup: the grey line on a bike card that has no km or start values yet.': 'Velos › Setup: die graue Zeile auf einer Velo-Karte, die noch keine km oder Startwerte hat.',
    'Open Bikes: a card with missing start values says «parts without a start value», the same words as on the care page.': 'Öffne Velos: eine Karte mit fehlenden Startwerten sagt «Teile ohne Startwert», dieselben Wörter wie in der Pflege.',
    'A bike without km says «enter km, then the app can calculate».': 'Ein Velo ohne km sagt «km eintragen, dann kann die App rechnen».',
    'Open a bike’s sheets: the one with tools and spares is called «Reparaturset».': 'Öffne die Blätter eines Velos: das mit Werkzeug und Ersatz heisst «Reparaturset».',
  },
};
