// «Velo mit langem Namen» (Durchklick Etappe 4, Befund E4-001, Noah 05.11.2026)
export default {
  title: 'Bike care: a long bike name fits the screen',
  lead: 'On a phone, «Bike care» no longer gets wider than the screen when a bike has a long name.',
  points: [{ text: 'Bike care: a long bike name breaks inside its badge and chip', go: { href: '#/bikes?tab=care', where: 'Shows in Bike care under «Problems» and in the row of bike chips.' } }],
  small: [],
  test: ['Give a bike a long name (Velos › ••• › Edit), for example 70 letters with spaces.', 'Open Bike care on a phone: the page does not move sideways; the name breaks into lines in the problem list and in the bike chips.'],
  since: [],
  de: {
    'Bike care: a long bike name fits the screen': 'Velopflege: Ein langer Velo-Name passt auf den Bildschirm',
    'On a phone, «Bike care» no longer gets wider than the screen when a bike has a long name.': 'Auf dem Handy wird die Velopflege nicht mehr breiter als der Bildschirm, wenn ein Velo einen langen Namen hat.',
    'Bike care: a long bike name breaks inside its badge and chip': 'Velopflege: Ein langer Velo-Name bricht in seiner Marke und seinem Knopf um',
    'Shows in Bike care under «Problems» and in the row of bike chips.': 'Zu sehen in der Velopflege unter «Probleme» und in der Reihe der Velo-Knöpfe.',
    'Give a bike a long name (Velos › ••• › Edit), for example 70 letters with spaces.': 'Gib einem Velo einen langen Namen (Velos › ••• › Bearbeiten), zum Beispiel 70 Buchstaben mit Leerzeichen.',
    'Open Bike care on a phone: the page does not move sideways; the name breaks into lines in the problem list and in the bike chips.': 'Öffne die Velopflege auf dem Handy: Die Seite verschiebt sich nicht seitwärts; der Name bricht in der Problemliste und in den Velo-Knöpfen in Zeilen um.',
  },
};
