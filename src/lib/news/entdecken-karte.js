// «Heute als Begleiter» PR 5 (Noah 28.10.2026 «1a 2a 3a»): the card «Discover» on Today
export default {
  title: 'Discover on Today',
  lead: 'Once a day Today shows one function that fits your moment and that you never opened.',
  points: [{ text: 'Under «Your moment» stands «Discover»: one function you never opened, with «Try it», «Later» and «Not for me»', href: '#/features', go: { href: '#/', steps: [{ sel: '[data-section="discover"]' }], where: 'Shows on Today under «Your moment», while there is a function to discover.' } }],
  small: [{ box: 'new', text: 'Switch the card off under «Customise the start page»', go: null }],
  test: ['Open Today: under «Your moment» stands «Discover» with one function.', 'Tap «Not for me»: the card says it does not come again, and «Undo» brings it back.'],
  since: [],
  de: {
    'Discover on Today': 'Entdecken auf Heute',
    'Once a day Today shows one function that fits your moment and that you never opened.': 'Heute zeigt einmal am Tag eine Funktion, die zu deinem Moment passt und die du noch nie geöffnet hast.',
    'Under «Your moment» stands «Discover»: one function you never opened, with «Try it», «Later» and «Not for me»': 'Unter «Dein Moment» steht «Entdecken»: eine Funktion, die du noch nie geöffnet hast, mit «Ausprobieren», «Später» und «Nicht für mich»',
    'Shows on Today under «Your moment», while there is a function to discover.': 'Zeigt sich auf Heute unter «Dein Moment», solange es etwas zu entdecken gibt.',
    'Switch the card off under «Customise the start page»': 'Schalte die Karte unter «Startseite anpassen» aus',
    'Open Today: under «Your moment» stands «Discover» with one function.': 'Öffne Heute: Unter «Dein Moment» steht «Entdecken» mit einer Funktion.',
    'Tap «Not for me»: the card says it does not come again, and «Undo» brings it back.': 'Tippe auf «Nicht für mich»: Die Karte sagt, dass sie nicht mehr kommt, und «Rückgängig» holt sie zurück.',
  },
};
