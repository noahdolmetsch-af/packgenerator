// «Kursblick» Depot (Noah 23.11.2026 «kurskäufe und verkäufe loggen … fiktive käufe … digitaler twin», «ok freigabe»): the journal
export default {
  title: 'Kursblick: your buys and sales in portfolios',
  lead: 'Kursblick now lets you write down every buy and sale in portfolios, real ones and practice ones that are made up.',
  points: [
    { text: 'New tab «Portfolio»: write down buys, sales, dividends and splits one by one (day, pieces or grams, price, fee); it shows what you hold, the average price and your profit', go: { href: '#/kurse/portfolio', steps: [{ sel: '[data-eintrag-neu]' }] } },
    { text: 'Practice portfolios: buy and sell in a made-up portfolio to follow what would have happened; it never counts for anything else', go: { href: '#/kurse/portfolio', steps: [{ sel: '[data-depot-neu]' }] } },
    { text: 'Take over what you entered under «My numbers» as «opening» entries; «My numbers» stays as it was', go: { href: '#/kurse/portfolio', steps: [{ sel: '[data-depots]' }] } },
  ],
  small: [{ box: 'new', text: 'Everything stays on your devices; only the symbols of titles go to the price service' }],
  test: ['Open Kursblick › «Portfolio», tap «Add a portfolio», write a name and save.', 'Tap «Write down», choose a day, write 10 grams and a price per gram, and save: the value, the average price and the profit show.', 'Add a second portfolio of the kind «Practice (made up)»: it carries the mark «Practice».'],
  since: [],
  de: {
    'Kursblick: your buys and sales in portfolios': 'Kursblick: deine Käufe und Verkäufe in Depots',
    'Kursblick now lets you write down every buy and sale in portfolios, real ones and practice ones that are made up.': 'Kursblick lässt dich jetzt jeden Kauf und Verkauf in Depots eintragen, in echten und in erfundenen Übungsdepots.',
    'New tab «Portfolio»: write down buys, sales, dividends and splits one by one (day, pieces or grams, price, fee); it shows what you hold, the average price and your profit': 'Neuer Reiter «Depot»: Trag Käufe, Verkäufe, Dividenden und Splits einzeln ein (Tag, Stück oder Gramm, Preis, Gebühr); er zeigt, was du hältst, den Durchschnittspreis und deinen Gewinn',
    'Practice portfolios: buy and sell in a made-up portfolio to follow what would have happened; it never counts for anything else': 'Übungsdepots: Kauf und Verkauf in einem erfundenen Depot, um zu verfolgen, was passiert wäre; es zählt nie für etwas anderes',
    'Take over what you entered under «My numbers» as «opening» entries; «My numbers» stays as it was': 'Übernimm, was du unter «Meine Zahlen» eingetragen hast, als «Eröffnung»; «Meine Zahlen» bleibt, wie es war',
    'Everything stays on your devices; only the symbols of titles go to the price service': 'Alles bleibt auf deinen Geräten; nur die Symbole der Titel gehen zum Kursdienst',
    'Open Kursblick › «Portfolio», tap «Add a portfolio», write a name and save.': 'Öffne Kursblick › «Depot», tippe auf «Depot hinzufügen», schreib einen Namen und speichere.',
    'Tap «Write down», choose a day, write 10 grams and a price per gram, and save: the value, the average price and the profit show.': 'Tippe auf «Eintragen», wähle einen Tag, schreib 10 Gramm und einen Preis pro Gramm und speichere: Wert, Durchschnittspreis und Gewinn erscheinen.',
    'Add a second portfolio of the kind «Practice (made up)»: it carries the mark «Practice».': 'Füge ein zweites Depot der Art «Übung (erfunden)» hinzu: Es trägt das Zeichen «Übung».',
  },
};
