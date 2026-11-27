// «Kursblick» Übungsdepot (Noah 24.11.2026 «2a»): the close of the chosen day is filled in when a buy or a sale is written down
export default {
  title: 'Kursblick: the close of the day fills in the price',
  lead: 'When you write down a buy or a sale, Kursblick now fills in the closing price of the day you choose. You can still change it.',
  points: [
    { text: 'Pick a title and a day (also one in the past, like the day you bought gold): the price field starts with that day\'s close in francs', go: { href: '#/kurse/portfolio', steps: [{ sel: '.kseg' }] } },
    { text: 'On a weekend or a holiday the last trading day before it counts, and the text says so', go: { href: '#/kurse/portfolio', steps: [{ sel: '.kseg' }] } },
    { text: 'Shares in dollars or euros are worked out with the exchange rate of the same day, not today\'s', go: { href: '#/kurse/portfolio', steps: [{ sel: '.kseg' }] } },
  ],
  small: [{ box: 'new', text: 'If you type a price yourself, it stays; «Use this close» brings the close back' }],
  test: ['Open Kursblick › «Portfolio», add a practice portfolio and tap «Write down a buy or a sale».', 'Write the title NESN.SW and pick a day last month: after a moment the price field shows that day\'s close.', 'Pick a Sunday: the text says it uses the last trading day before it. Type your own price: it stays.'],
  since: [],
  de: {
    'Kursblick: the close of the day fills in the price': 'Kursblick: der Schlusskurs des Tages füllt den Preis ein',
    'When you write down a buy or a sale, Kursblick now fills in the closing price of the day you choose. You can still change it.': 'Wenn du einen Kauf oder Verkauf einträgst, setzt Kursblick jetzt den Schlusskurs des Tages ein, den du wählst. Du kannst ihn weiter ändern.',
    'Pick a title and a day (also one in the past, like the day you bought gold): the price field starts with that day\'s close in francs': 'Wähle einen Titel und einen Tag (auch einen vergangenen, etwa den Tag, an dem du Gold gekauft hast): Das Preisfeld beginnt mit dem Schlusskurs dieses Tages in Franken',
    'On a weekend or a holiday the last trading day before it counts, and the text says so': 'An einem Wochenende oder Feiertag gilt der letzte Handelstag davor, und der Text sagt es',
    'Shares in dollars or euros are worked out with the exchange rate of the same day, not today\'s': 'Aktien in Dollar oder Euro werden mit dem Wechselkurs desselben Tages gerechnet, nicht mit dem heutigen',
    'If you type a price yourself, it stays; «Use this close» brings the close back': 'Wenn du selbst einen Preis schreibst, bleibt er; «Diesen Schlusskurs nehmen» holt den Schlusskurs zurück',
    'Open Kursblick › «Portfolio», add a practice portfolio and tap «Write down a buy or a sale».': 'Öffne Kursblick › «Depot», leg ein Übungsdepot an und tippe auf «Kauf oder Verkauf eintragen».',
    'Write the title NESN.SW and pick a day last month: after a moment the price field shows that day\'s close.': 'Schreib den Titel NESN.SW und wähle einen Tag im letzten Monat: Nach einem Moment zeigt das Preisfeld den Schlusskurs dieses Tages.',
    'Pick a Sunday: the text says it uses the last trading day before it. Type your own price: it stays.': 'Wähle einen Sonntag: Der Text sagt, dass der letzte Handelstag davor gilt. Schreib einen eigenen Preis: Er bleibt.',
  },
};
