// «Bilder bei jeder Neuheit» PR 3 (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the card «N Neuheiten seit …» at the end of Heute
export default {
  title: 'All the news since you last looked',
  lead: 'At the end of Today one card counts every news item since you last looked, with pictures, and groups them by place.',
  points: [
    {
      text: 'The card «{n} news items since Friday» shows a few pictures and opens the news by place',
      go: { href: '#/', steps: [{ sel: '[data-neu-seit]' }], where: 'Shows at the end of Today as soon as there is news since you last looked.' },
    },
    {
      text: 'In the window each place opens to its news, one picture each, and «Try it» leads to the place',
      go: { href: '#/', steps: [{ sel: '[data-neu-seit]' }], where: 'Shows at the end of Today as soon as there is news since you last looked; «See the news by place» opens the window.' },
    },
  ],
  small: [{ box: 'new', text: 'Closing the card or the window counts the news as seen, on this device only', go: null }],
  test: [
    'Open Today and scroll to the end: after an update a card says how many news items there are since you last looked.',
    'Tap «See the news by place»: the window groups the news by place, each with a count.',
    'Open a place, then tap «Try it» of a news item: the page opens and the spot lights up.',
    'Close the window: the card is gone until the next update.',
  ],
  since: [],
  de: {
    'All the news since you last looked': 'Alle Neuheiten seit deinem letzten Besuch',
    'At the end of Today one card counts every news item since you last looked, with pictures, and groups them by place.': 'Am Ende von Heute zählt eine Karte jede Neuheit seit deinem letzten Besuch, mit Bildern, und ordnet sie nach Ort.',
    'The card «{n} news items since Friday» shows a few pictures and opens the news by place': 'Die Karte «{n} Neuheiten seit Freitag» zeigt ein paar Bilder und öffnet die Neuheiten nach Ort',
    'In the window each place opens to its news, one picture each, and «Try it» leads to the place': 'Im Fenster öffnet sich jeder Ort mit seinen Neuheiten, je ein Bild, und «Ausprobieren» führt an die Stelle',
    'Shows at the end of Today as soon as there is news since you last looked.': 'Erscheint am Ende von Heute, sobald es Neuheiten seit deinem letzten Besuch gibt.',
    'Shows at the end of Today as soon as there is news since you last looked; «See the news by place» opens the window.': 'Erscheint am Ende von Heute, sobald es Neuheiten seit deinem letzten Besuch gibt; «Neuheiten nach Ort ansehen» öffnet das Fenster.',
    'Closing the card or the window counts the news as seen, on this device only': 'Karte oder Fenster schliessen zählt die Neuheiten als gesehen, nur auf diesem Gerät',
    'Open Today and scroll to the end: after an update a card says how many news items there are since you last looked.': 'Öffne Heute und scrolle ans Ende: nach einem Update sagt eine Karte, wie viele Neuheiten es seit deinem letzten Besuch gibt.',
    'Tap «See the news by place»: the window groups the news by place, each with a count.': 'Tippe auf «Neuheiten nach Ort ansehen»: das Fenster ordnet die Neuheiten nach Ort, jeder mit einer Zahl.',
    'Open a place, then tap «Try it» of a news item: the page opens and the spot lights up.': 'Öffne einen Ort und tippe bei einer Neuheit auf «Ausprobieren»: die Seite öffnet sich und die Stelle leuchtet.',
    'Close the window: the card is gone until the next update.': 'Schliesse das Fenster: die Karte ist weg bis zum nächsten Update.',
  },
};
