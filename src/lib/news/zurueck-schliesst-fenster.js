// Durchklick Etappe 6 (Noah 05.11.2026, Befund E6-001): the back key closes three more windows first
export default {
  title: 'Back closes every window',
  lead: 'The back key closes an open window first; the page under it stays.',
  points: [
    { text: 'On Today, «Was ziehe ich an?» now closes with the back key and you stay on Today', go: { href: '#/', steps: [{ sel: '[data-wear-open]' }] } },
    { text: 'The ••• menu of a row in Material closes with the back key as well', go: null },
  ],
  small: [{ box: 'new', text: 'The big contact card (Mit Freunden) closes with the back key too', go: null }],
  test: [
    'Open Today, tap «Was ziehe ich an?», then press the back key of the phone or the browser: the window closes and you are still on Today.',
    'Open Material, tap ••• on a row, then press back: the menu closes and the list stays.',
  ],
  since: [],
  de: {
    'Back closes every window': 'Zurück schliesst jedes Fenster',
    'The back key closes an open window first; the page under it stays.': 'Die Zurück-Taste schliesst zuerst das offene Fenster; die Seite darunter bleibt.',
    'On Today, «Was ziehe ich an?» now closes with the back key and you stay on Today': 'Auf Heute schliesst «Was ziehe ich an?» jetzt mit der Zurück-Taste, und du bleibst auf Heute',
    'The ••• menu of a row in Material closes with the back key as well': 'Das ••• Menü einer Zeile in Material schliesst ebenfalls mit der Zurück-Taste',
    'The big contact card (Mit Freunden) closes with the back key too': 'Auch die grosse Kontaktkarte (Mit Freunden) schliesst mit der Zurück-Taste',
    'Open Today, tap «Was ziehe ich an?», then press the back key of the phone or the browser: the window closes and you are still on Today.': 'Öffne Heute, tippe auf «Was ziehe ich an?» und drücke dann die Zurück-Taste des Handys oder des Browsers: Das Fenster schliesst sich, und du bist noch auf Heute.',
    'Open Material, tap ••• on a row, then press back: the menu closes and the list stays.': 'Öffne Material, tippe bei einer Zeile auf ••• und drücke dann Zurück: Das Menü schliesst sich, und die Liste bleibt.',
  },
};
