// «Schnell öffnen» auf Heute (Noah 01.11.2026 «1a 2a 3b 4a 5a»): deine Quick-Links-Pins, gleich auf Heute änderbar
export default {
  title: 'Open quickly with your pins',
  lead: 'The tile «Open quickly» on Today shows your Quick Links pins.',
  points: [{ text: 'Open quickly: your pins on Today, with about 12 suggestions to start; the pencil changes them right there', go: { href: '#/', steps: [{ sel: '[data-pins-tile]' }] } }],
  small: [
    { box: 'new', text: 'Add any function, rename, unpin with Undo, order with arrows or drag, back to the suggestions', go: 'f.quicklinks' },
    { box: 'moved', text: 'The 8 small tiles of Today are replaced by this tile; they stay in «Add a tile»', go: 'f.quicklinks' },
  ],
  test: [
    'On Today scroll to «Open quickly»: your shortcuts stand there; tap «Weather» or «Quick start» to open it.',
    'Tap «Change shortcuts», then «Add a shortcut», search a function and tap it: it is in the list.',
    'Move a shortcut with the arrows, unpin another and tap «Undo» in the message.',
  ],
  since: [],
  de: {
    'Open quickly with your pins': 'Schnell öffnen mit deinen Pins',
    'The tile «Open quickly» on Today shows your Quick Links pins.': 'Die Kachel «Schnell öffnen» auf Heute zeigt deine Quick-Links-Pins.',
    'Open quickly: your pins on Today, with about 12 suggestions to start; the pencil changes them right there': 'Schnell öffnen: deine Pins auf Heute, am Anfang mit ca. 12 Vorschlägen; der Stift ändert sie gleich dort',
    'Add any function, rename, unpin with Undo, order with arrows or drag, back to the suggestions': 'Jede Funktion hinzufügen, umbenennen, lösen mit Rückgängig, mit Pfeilen oder Ziehen ordnen, zurück zu den Vorschlägen',
    'The 8 small tiles of Today are replaced by this tile; they stay in «Add a tile»': 'Die 8 kleinen Kacheln von Heute ersetzt diese Kachel; sie bleiben unter «Kachel hinzufügen»',
    'On Today scroll to «Open quickly»: your shortcuts stand there; tap «Weather» or «Quick start» to open it.': 'Scrolle auf Heute zu «Schnell öffnen»: deine Abkürzungen stehen dort; tippe auf eine, zum Beispiel «Schnellstart», um sie zu öffnen.',
    'Tap «Change shortcuts», then «Add a shortcut», search a function and tap it: it is in the list.': 'Tippe auf «Abkürzungen ändern», dann auf «Abkürzung hinzufügen», suche eine Funktion und tippe sie an: sie steht in der Liste.',
    'Move a shortcut with the arrows, unpin another and tap «Undo» in the message.': 'Verschiebe eine Abkürzung mit den Pfeilen, löse eine andere und tippe in der Meldung auf «Rückgängig».',
  },
};
