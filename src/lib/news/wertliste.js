// «Wertliste» (Warteliste 7; Noah 22.11.2026 «1-5 a»): all velos and gear with their price, as a PDF for the insurance
export default {
  title: 'List of values for the insurance',
  lead: 'One page with all your velos and your gear and their prices, as a PDF for the insurance. Missing prices you type in right there.',
  points: [
    { text: 'Gear › List of values: the sum, filters («Only above CHF 50»), a tick for every row and a field for every missing price', go: { href: '#/gear/wertliste', steps: [{ sel: '[data-wl-sum]' }], where: 'Gear › List of values (also at the end of a bike\'s theft sheet).' } },
    { text: '«Make PDF» writes the list on your device; «Share or save», and a copy lies in Me › Documents › Insurance. Price paid, not the current value', go: null },
  ],
  small: [],
  test: [
    'Open Gear › Alles hier › List of values: the sum stands on top, rows without a price say «Price missing».',
    'Type a price in a row: the sum grows, «Undo» takes it back.',
    'Tap «Make PDF», then «Share or save»; check Me › Documents › Insurance.',
  ],
  since: ['f.wertliste'],
  de: {
    'List of values for the insurance': 'Wertliste für die Versicherung',
    'One page with all your velos and your gear and their prices, as a PDF for the insurance. Missing prices you type in right there.': 'Eine Seite mit allen deinen Velos und deinem Material samt Preisen, als PDF für die Versicherung. Fehlende Preise trägst du gleich dort nach.',
    'Gear › List of values: the sum, filters («Only above CHF 50»), a tick for every row and a field for every missing price': 'Material › Wertliste: die Summe, Filter («Nur über CHF 50»), ein Haken je Zeile und ein Feld für jeden fehlenden Preis',
    'Gear › List of values (also at the end of a bike\'s theft sheet).': 'Material › Wertliste (auch am Ende des Diebstahl-Blatts eines Velos).',
    '«Make PDF» writes the list on your device; «Share or save», and a copy lies in Me › Documents › Insurance. Price paid, not the current value': '«PDF erstellen» schreibt die Liste auf deinem Gerät; «Teilen oder speichern», und eine Kopie liegt in Ich › Dokumente › Versicherung. Preis laut Kauf, nicht der heutige Wert',
    'Open Gear › Alles hier › List of values: the sum stands on top, rows without a price say «Price missing».': 'Material › «Alles hier» › Wertliste öffnen: die Summe steht oben, Zeilen ohne Preis sagen «Preis fehlt».',
    'Type a price in a row: the sum grows, «Undo» takes it back.': 'Bei einer Zeile einen Preis eintippen: die Summe wächst, «Rückgängig» nimmt es zurück.',
    'Tap «Make PDF», then «Share or save»; check Me › Documents › Insurance.': '«PDF erstellen» antippen, dann «Teilen oder speichern»; Ich › Dokumente › Versicherung prüfen.',
  },
};
