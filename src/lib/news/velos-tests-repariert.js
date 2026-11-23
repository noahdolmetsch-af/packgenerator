// «Velos: Prüfungen repariert» (23.11.2026): the star of the standard bike is back (on its card), the tour of Bikes closes the «?» window
export default {
  title: 'Bikes: star and tour back',
  lead: 'The star of your standard bike is on its card again, and the tour of Bikes starts cleanly.',
  points: [
    { text: 'The first bike card has the star of the standard bike again', go: { href: '#/bikes', steps: [{ sel: '[data-velo-card] .sv-star' }], where: 'Bikes and gear › Bikes, the first card.' } },
    { text: 'The tour of Bikes from the «?» window closes the window and starts', go: { href: '#/bikes', steps: [{ sel: '[data-help-open]' }], where: 'The «?» at the top.' } },
  ],
  small: [],
  test: [
    'Open «Bikes and gear»: the first bike card has a star (with two or more bikes).',
    'Tap «?», then «Start ›» at the tour: the window closes and the tour begins.',
  ],
  since: [],
  de: {
    'Bikes: star and tour back': 'Velos: Stern und Rundgang zurück',
    'The star of your standard bike is on its card again, and the tour of Bikes starts cleanly.': 'Der Stern deines Standard-Velos steht wieder auf seiner Karte, und der Rundgang durch Velos startet sauber.',
    'The first bike card has the star of the standard bike again': 'Die erste Velokarte hat wieder den Stern des Standard-Velos',
    'Bikes and gear › Bikes, the first card.': 'Velos und Material › Velos, die erste Karte.',
    'The tour of Bikes from the «?» window closes the window and starts': 'Der Rundgang durch Velos aus dem «?»-Fenster schliesst das Fenster und startet',
    'The «?» at the top.': 'Das «?» oben.',
    'Open «Bikes and gear»: the first bike card has a star (with two or more bikes).': 'Öffne «Velos und Material»: Die erste Velokarte hat einen Stern (ab zwei Velos).',
    'Tap «?», then «Start ›» at the tour: the window closes and the tour begins.': 'Tippe auf «?» und beim Rundgang auf «Starten ›»: Das Fenster schliesst sich, der Rundgang beginnt.',
  },
};
