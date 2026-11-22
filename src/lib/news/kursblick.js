// «Kursblick» (Noah 22.11.2026 «1-4a», «ja»): the small app for the daily prices of gold and the SMI
export default {
  title: 'Your gold price every day',
  lead: 'The new small app «Kursblick» shows gold and the SMI, with the close of the day before.',
  points: [
    { text: 'Gold in francs per kilogram against your reference day, with what a sale would bring after a dealer deduction you can change', go: 'f.kursblick' },
    { text: 'Compare any period: the previous day, a week, up to 40 years, or your own number of days, weeks, months or years', go: 'f.kursblick' },
    { text: 'Every number says which day it is from and when it was fetched', go: 'f.kursblick' },
  ],
  small: [{ box: 'new', text: 'The small app also installs with its own icon on the phone', go: { href: '#/me/apps', steps: [{ sel: '[data-app="kursblick"]' }] } }],
  test: ['Open the currency tool in the Toolbox and tap «Kursblick» at its end.', 'Read the gold price and what a sale of 1 kg would bring; tap a period such as «Year» and see the change.', 'In Gold, change the dealer deduction and see the sale value change.'],
  since: ['f.kursblick'],
  de: {
    'Your gold price every day': 'Dein Goldpreis jeden Tag',
    'The new small app «Kursblick» shows gold and the SMI, with the close of the day before.': 'Die neue kleine App «Kursblick» zeigt Gold und den SMI, mit dem Schlusskurs vom Vortag.',
    'Gold in francs per kilogram against your reference day, with what a sale would bring after a dealer deduction you can change': 'Gold in Franken pro Kilogramm gegen deinen Referenztag, mit dem, was ein Verkauf nach einem Händlerabschlag brächte, den du ändern kannst',
    'Compare any period: the previous day, a week, up to 40 years, or your own number of days, weeks, months or years': 'Vergleiche jeden Zeitraum: Vortag, Woche, bis 40 Jahre oder deine eigene Zahl von Tagen, Wochen, Monaten oder Jahren',
    'Every number says which day it is from and when it was fetched': 'Jede Zahl sagt, von welchem Tag sie ist und wann sie geholt wurde',
    'The small app also installs with its own icon on the phone': 'Die kleine App lässt sich auch mit eigenem Symbol auf dem Handy installieren',
    'Open the currency tool in the Toolbox and tap «Kursblick» under «Fits here».': 'Öffne den Währungsrechner im Werkzeugkasten und tippe an seinem Ende auf «Kursblick».',
    'Read the gold price and what a sale of 1 kg would bring; tap a period such as «Year» and see the change.': 'Lies den Goldpreis und was ein Verkauf von 1 kg brächte; tippe auf einen Zeitraum wie «Jahr» und sieh die Veränderung.',
    'In Gold, change the dealer deduction and see the sale value change.': 'Ändere im Reiter Gold den Händlerabschlag und sieh, wie sich der Verkaufswert ändert.',
  },
};
