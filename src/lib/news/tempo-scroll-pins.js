// Noah 2.11.2026 «die App reagiert zögerlich beim Scrollen»: the pins no longer measure while the page moves
export default {
  title: 'Smoother scrolling',
  lead: 'Scrolling is lighter: the small pins wait until the page stands still.',
  points: [{ text: 'The pins on cards appear a moment after you stop scrolling', go: null }],
  small: [],
  test: ['Scroll Today up and down with a finger.', 'Stop: the small pins appear on the cards after a moment.'],
  since: [],
  de: {
    'Smoother scrolling': 'Ruhigeres Scrollen',
    'Scrolling is lighter: the small pins wait until the page stands still.': 'Scrollen ist leichter: Die kleinen Pins warten, bis die Seite still steht.',
    'The pins on cards appear a moment after you stop scrolling': 'Die Pins auf den Karten erscheinen einen Moment, nachdem du aufhörst zu scrollen',
    'Scroll Today up and down with a finger.': 'Scrolle Heute mit dem Finger auf und ab.',
    'Stop: the small pins appear on the cards after a moment.': 'Halte an: Die kleinen Pins erscheinen nach einem Moment auf den Karten.',
  },
};
