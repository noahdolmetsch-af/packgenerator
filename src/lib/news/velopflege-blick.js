// «Velopflege: Auf einen Blick» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Thread «Velopflege zum Inspektions-Begleiter machen»)
export default {
  title: 'Bike care at a glance',
  lead: 'On top of a bike\'s care page: how far the chain has come and how far it will go, the last service and the last check with day and price.',
  points: [
    { text: 'The chain: km done, km left, about when it runs out, the last measurement', go: { href: '#/bikes?tab=care', where: 'Shows at the top of a bike\'s care page, under «At a glance».', steps: [{ sel: '[data-glance-chain]' }] } },
    { text: 'The last service and the last check with day, price and what the check found', go: { href: '#/bikes?tab=care', where: 'Shows at the top of a bike\'s care page, under «At a glance».', steps: [{ sel: '[data-glance-service]' }] } },
  ],
  small: [{ box: 'new', text: 'The costs of the year in one tile, split into bike shop and parts' }],
  test: [
    'Bikes › Care: the first block of a bike is «At a glance» with the chain, the last service, the last check and the costs.',
    'Tap «Record the chain» to write a measurement; the tile changes when you save.',
  ],
  since: [],
  de: {
    'Bike care at a glance': 'Velopflege auf einen Blick',
    'On top of a bike\'s care page: how far the chain has come and how far it will go, the last service and the last check with day and price.': 'Oben auf der Pflege-Seite eines Velos: wie weit die Kette gekommen ist und wie weit sie noch geht, der letzte Service und der letzte Check mit Tag und Preis.',
    'The chain: km done, km left, about when it runs out, the last measurement': 'Die Kette: geleistete km, Rest-km, etwa wann sie fällig wird, die letzte Messung',
    'Shows at the top of a bike\'s care page, under «At a glance».': 'Steht oben auf der Pflege-Seite eines Velos, unter «Auf einen Blick».',
    'The last service and the last check with day, price and what the check found': 'Der letzte Service und der letzte Check mit Tag, Preis und was der Check gefunden hat',
    'The costs of the year in one tile, split into bike shop and parts': 'Die Kosten des Jahres in einer Kachel, getrennt nach Werkstatt und Teilen',
    'Bikes › Care: the first block of a bike is «At a glance» with the chain, the last service, the last check and the costs.': 'Velos › Pflege: Der erste Block eines Velos ist «Auf einen Blick» mit Kette, letztem Service, letztem Check und den Kosten.',
    'Tap «Record the chain» to write a measurement; the tile changes when you save.': 'Tippe auf «Kette erfassen», um eine Messung einzutragen; die Kachel ändert sich nach dem Speichern.',
  },
};
