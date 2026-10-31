// «Pfad auf jeder Seite» Schritt 3 (Noah 28.10.2026 «1a und c und d alle»): Explorer mode
export default {
  title: 'Explorer mode',
  lead: 'A switch that turns a tap on a tile into «Where does this come from?» instead of opening it.',
  points: [
    { text: 'Switch on «Explorer mode» in Me › Look › Handling: a bar at the top says it is on, and a tap on a tile with an «i» shows where it comes from', go: { href: '#/me/look', steps: [{ sel: 'input[data-op="explore"]' }] } },
  ],
  small: [{ box: 'new', text: 'The bar at the top switches the mode off again; tabs and buttons work as always' }],
  test: ['Switch on «Explorer mode» in Me › Look › Handling.', 'Open Today and tap «This week» anywhere: the sheet «Where does this come from?» opens instead of the week. Then switch the mode off in the bar.'],
  since: [],
  de: {
    'Explorer mode': 'Entdecker-Modus',
    'A switch that turns a tap on a tile into «Where does this come from?» instead of opening it.': 'Ein Schalter: Ein Tipp auf eine Kachel zeigt «Woher kommt das?», statt sie zu öffnen.',
    'Switch on «Explorer mode» in Me › Look › Handling: a bar at the top says it is on, and a tap on a tile with an «i» shows where it comes from': 'Schalte in Ich › Darstellung › Bedienung den «Entdecker-Modus» ein: Ein Balken oben sagt, dass er an ist, und ein Tipp auf eine Kachel mit «i» zeigt, woher sie kommt',
    'The bar at the top switches the mode off again; tabs and buttons work as always': 'Der Balken oben schaltet den Modus wieder aus; Reiter und Knöpfe gehen wie immer',
    'Switch on «Explorer mode» in Me › Look › Handling.': 'Schalte in Ich › Darstellung › Bedienung den «Entdecker-Modus» ein.',
    'Open Today and tap «This week» anywhere: the sheet «Where does this come from?» opens instead of the week. Then switch the mode off in the bar.': 'Öffne Heute und tippe irgendwo auf «Diese Woche»: Das Fenster «Woher kommt das?» öffnet sich statt der Woche. Schalte den Modus dann im Balken aus.',
  },
};
