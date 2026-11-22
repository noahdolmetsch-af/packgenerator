// «Verlauf mit Kosten» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Thread «Velopflege zum Inspektions-Begleiter machen», Schritt D)
export default {
  title: 'History with costs for each bike',
  lead: 'Workshop visits, checks and the parts you replaced now stand in one list with what each cost, filtered by kind and year, with the sum.',
  points: [
    { text: 'One history of the bike: service, checks and parts, newest first, with the price of each', go: { href: '#/bikes?tab=care', where: 'On a bike\'s care page, under the parts: «History».', steps: [{ sel: '[data-verlauf]' }] } },
    { text: 'Whole history with a filter, the years and the sum; it matches the costs on «At a glance»', go: { href: '#/bikes?tab=care', where: 'On a bike\'s care page: «See history» on the costs tile.', steps: [{ sel: '[data-glance-cost]' }] } },
  ],
  small: [{ box: 'new', text: 'The costs tile opens the history with one tap' }],
  test: [
    'Bikes › Care: under the parts stands «History» with the newest three entries and their prices.',
    'Tap «Whole history»: filter «Service» or «Parts», pick a year; the sum is the same as «Costs» on top.',
  ],
  since: [],
  de: {
    'History with costs for each bike': 'Verlauf mit Kosten für jedes Velo',
    'Workshop visits, checks and the parts you replaced now stand in one list with what each cost, filtered by kind and year, with the sum.': 'Werkstatt-Besuche, Checks und die Teile, die du ersetzt hast, stehen jetzt in einer Liste mit den Kosten, filterbar nach Art und Jahr, mit Summe.',
    'One history of the bike: service, checks and parts, newest first, with the price of each': 'Ein Verlauf des Velos: Service, Checks und Teile, das Neueste zuerst, mit dem Preis',
    'On a bike\'s care page, under the parts: «History».': 'Auf der Pflege-Seite eines Velos, unter den Teilen: «Verlauf».',
    'Whole history with a filter, the years and the sum; it matches the costs on «At a glance»': 'Ganzer Verlauf mit Filter, Jahren und Summe; sie stimmt mit den Kosten in «Auf einen Blick» überein',
    'On a bike\'s care page: «See history» on the costs tile.': 'Auf der Pflege-Seite eines Velos: «Verlauf ansehen» bei den Kosten.',
    'The costs tile opens the history with one tap': 'Die Kosten-Kachel öffnet den Verlauf mit einem Tipp',
    'Bikes › Care: under the parts stands «History» with the newest three entries and their prices.': 'Velos › Pflege: unter den Teilen steht «Verlauf» mit den neuesten drei Einträgen und ihren Preisen.',
    'Tap «Whole history»: filter «Service» or «Parts», pick a year; the sum is the same as «Costs» on top.': 'Tippe auf «Ganzer Verlauf»: Filter «Service» oder «Teile», wähle ein Jahr; die Summe ist dieselbe wie bei «Kosten» oben.',
  },
};
