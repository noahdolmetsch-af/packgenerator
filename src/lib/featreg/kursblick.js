// «Kursblick» (Noah 22.11.2026 «ja», Bauplan Welle K-A): the small app for the daily prices of gold and the SMI
export default {
  features: [
    { id: 'f.kursblick', group: 'data', title: 'Kursblick', text: 'Gold in francs per kilogram against your reference day, what a sale would bring after the dealer deduction, the SMI, and the shares, funds, coins, metals and currencies you follow, with the close of the day before, any period you choose and a comparison of up to five.', href: '#/kurse', words: 'kursblick märkte fonds etf krypto bitcoin währung vergleich gold goldpreis kurs smi börse aktien verkauf barren händler abschlag referenz franken kilo preis', moment: 'alltag' },
  ],
  howto: { 'f.kursblick': ['Open Kursblick, or the link at the end of the currency tool.', 'See the gold price, the change since your reference day and the sale value.', 'Pick a period, from the previous day to 40 years, and read the change.'] },
  handbook: {
    'f.kursblick': {
      on: 'Needs a network once a day; the last prices stay on the device.',
      steps: ['Open Kursblick, or the link at the end of the currency tool.', 'See the gold price, the change since your reference day and the sale value.', 'Pick a period, from the previous day to 40 years, and read the change.'],
      example: 'Example: gold CHF 98 000 per kg, a sale after 2 % deduction brings CHF 96 040.',
    },
  },
  home: { 'f.kursblick': '#/kurse' },
};
