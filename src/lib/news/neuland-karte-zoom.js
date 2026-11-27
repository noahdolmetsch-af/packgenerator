// «Neuland-Seite verbessern» (Noah 27.11.2026 «1 2 3 4 5 6 7», Paket 1 und 2: die Karte und die Liste)
export default {
  title: 'New ground: a map you can zoom',
  lead: 'The map in New ground zooms in, shows the names of the places and fills the screen if you like.',
  points: [
    { text: 'Zoom with + and −, a pinch, Ctrl and the mouse wheel, or a double tap; drag to move the map', go: { href: '#/neuland', steps: [{ sel: '[data-zoom-in]' }] } },
    { text: 'The pin next to an entry shows it on the map, and the names appear as you zoom in', go: { href: '#/neuland', steps: [{ sel: '[data-nl-locate]' }] } },
  ],
  small: [{ box: 'nicer', text: 'The list under the map shows the 10 newest entries first, then «Show all»; the map can fill the whole screen' }],
  test: [
    'Open New ground and choose «Alpine passes»: tap + on the map three times, it zooms in and names appear.',
    'Tap the pin next to a pass in the list: the map jumps to it and marks it.',
    'Tap the arrows in the map buttons: the map fills the screen; Escape or the cross closes it.',
  ],
  since: [],
  de: {
    'New ground: a map you can zoom': 'Neuland: eine Karte, die du zoomen kannst',
    'The map in New ground zooms in, shows the names of the places and fills the screen if you like.': 'Die Karte in Neuland zoomt hinein, zeigt die Namen der Orte und füllt auf Wunsch den ganzen Bildschirm.',
    'Zoom with + and −, a pinch, Ctrl and the mouse wheel, or a double tap; drag to move the map': 'Zoome mit + und −, mit zwei Fingern, Ctrl und Mausrad oder doppeltem Tippen; zieh, um die Karte zu verschieben',
    'The pin next to an entry shows it on the map, and the names appear as you zoom in': 'Die Nadel neben einem Eintrag zeigt ihn auf der Karte, und beim Hineinzoomen erscheinen die Namen',
    'The list under the map shows the 10 newest entries first, then «Show all»; the map can fill the whole screen': 'Die Liste unter der Karte zeigt zuerst die 10 neuesten Einträge, dann «Alle zeigen»; die Karte kann den ganzen Bildschirm füllen',
    'Open New ground and choose «Alpine passes»: tap + on the map three times, it zooms in and names appear.': 'Öffne Neuland und wähle «Alpenpässe»: tippe dreimal auf + in der Karte, sie zoomt hinein und Namen erscheinen.',
    'Tap the pin next to a pass in the list: the map jumps to it and marks it.': 'Tippe in der Liste auf die Nadel neben einem Pass: die Karte springt dorthin und markiert ihn.',
    'Tap the arrows in the map buttons: the map fills the screen; Escape or the cross closes it.': 'Tippe auf die Pfeile bei den Karten-Knöpfen: die Karte füllt den Bildschirm; Escape oder das Kreuz schliesst sie.',
  },
};
