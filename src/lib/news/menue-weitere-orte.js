// «Menü: Weitere Orte» (Noah 09.11.2026 «ja, 1-3», Durchklick Fund 2): a visible hint when the left menu is taller than the window
export default {
  title: 'Menu: «Show more places» shows what is below',
  lead: 'On a small laptop screen the left menu can be taller than the window. A button «Show more places» now shows there is more below and scrolls down.',
  points: [
    { text: 'A button «Show more places» at the bottom of the left menu scrolls to Active, Analyse, Bikes, Gear, Material and Inspiration', go: { href: '#/trips', where: 'Open «Trips» on a laptop window that is not very tall. The button sits at the bottom of the left menu.' } },
    { text: '«Assistant» and «Help» sit side by side and save one row', go: { href: '#/', where: 'Left menu, below the search field.' } },
  ],
  small: [],
  test: ['Open «Trips» on a laptop window that is not very tall: the button «Show more places» sits at the bottom of the menu.', 'Click «Show more places»: the menu scrolls down and the button disappears at the end.'],
  since: [],
  de: {
    'Menu: «Show more places» shows what is below': 'Menü: «Weitere Orte» zeigt, was darunter liegt',
    'On a small laptop screen the left menu can be taller than the window. A button «Show more places» now shows there is more below and scrolls down.': 'Auf einem kleinen Laptop-Bildschirm kann das linke Menü höher sein als das Fenster. Ein Knopf «Weitere Orte» zeigt jetzt, dass darunter mehr steht, und scrollt nach unten.',
    'A button «Show more places» at the bottom of the left menu scrolls to Active, Analyse, Bikes, Gear, Material and Inspiration': 'Ein Knopf «Weitere Orte» unten im linken Menü scrollt zu Aktiv, Auswerten, Velos, Ausrüstung, Material und Inspiration',
    'Open «Trips» on a laptop window that is not very tall. The button sits at the bottom of the left menu.': 'Öffne «Touren» in einem Laptop-Fenster, das nicht sehr hoch ist. Der Knopf steht unten im linken Menü.',
    '«Assistant» and «Help» sit side by side and save one row': '«Assistent» und «Hilfe» stehen nebeneinander und sparen eine Zeile',
    'Left menu, below the search field.': 'Linkes Menü, unter dem Suchfeld.',
    'Open «Trips» on a laptop window that is not very tall: the button «Show more places» sits at the bottom of the menu.': 'Öffne «Touren» in einem Laptop-Fenster, das nicht sehr hoch ist: unten im Menü steht der Knopf «Weitere Orte».',
    'Click «Show more places»: the menu scrolls down and the button disappears at the end.': 'Klicke «Weitere Orte»: das Menü scrollt nach unten und der Knopf verschwindet am Ende.',
  },
};
