// «Anzeige am Handy» (UX-Test 08.11.2026): six display slips, no new function
export default {
  title: 'Six display slips fixed',
  lead: 'Cut-off words, a wrong «Sorted» line and an empty page that spoke of the wrong thing now read right.',
  points: [
    { text: 'The empty Shopping page says «No wishes yet» with a button «Add a wish», not «No gear yet»', go: { href: '#/gear?view=wish', where: 'Shows on Gear › Shopping while the wishlist and the inventory are both empty.' } },
    { text: 'On the wishlist the line says «Sorted: most needed first», which is how it is sorted', go: { href: '#/gear?view=wish', where: 'Shows on Gear › Shopping, above the list, once you have items.' } },
  ],
  small: [
    { box: 'new', text: '«Stop asking» in the weight tile on Today stays reachable on a narrow phone' },
    { box: 'new', text: 'The signposts page no longer shows English words before each sign' },
    { box: 'new', text: 'The button «+ Sport of trips» stays on one line' },
  ],
  test: [
    'Open Gear › Shopping with an empty app: the card says «Noch keine Wünsche» and has «Wunsch hinzufügen».',
    'Open Touren › Berg › Wegweiser: no English word stands before the signs.',
  ],
  since: [],
  de: {
    'Six display slips fixed': 'Sechs Anzeige-Fehler behoben',
    'Cut-off words, a wrong «Sorted» line and an empty page that spoke of the wrong thing now read right.': 'Abgeschnittene Wörter, eine falsche «Sortiert»-Zeile und eine leere Seite, die vom Falschen sprach, stimmen jetzt.',
    'The empty Shopping page says «No wishes yet» with a button «Add a wish», not «No gear yet»': 'Die leere Seite Einkauf sagt «Noch keine Wünsche» mit dem Knopf «Wunsch hinzufügen», nicht «Noch kein Material»',
    'Shows on Gear › Shopping while the wishlist and the inventory are both empty.': 'Steht unter Material › Einkauf, solange Wunschliste und Bestand leer sind.',
    'On the wishlist the line says «Sorted: most needed first», which is how it is sorted': 'Auf der Wunschliste steht «Sortiert: Wichtigstes zuerst», so ist sie auch geordnet',
    'Shows on Gear › Shopping, above the list, once you have items.': 'Steht unter Material › Einkauf über der Liste, sobald du Teile hast.',
    '«Stop asking» in the weight tile on Today stays reachable on a narrow phone': '«Nicht mehr fragen» in der Gewichts-Kachel auf Heute bleibt am schmalen Handy erreichbar',
    'The signposts page no longer shows English words before each sign': 'Die Wegweiser-Seite zeigt keine englischen Wörter mehr vor jedem Wegweiser',
    'The button «+ Sport of trips» stays on one line': 'Der Knopf «+ Sportart der Touren» bleibt in einer Zeile',
    'Open Gear › Shopping with an empty app: the card says «Noch keine Wünsche» and has «Wunsch hinzufügen».': 'Öffne Material › Einkauf in einer leeren App: die Karte sagt «Noch keine Wünsche» und hat «Wunsch hinzufügen».',
    'Open Touren › Berg › Wegweiser: no English word stands before the signs.': 'Öffne Touren › Berg › Wegweiser: kein englisches Wort steht vor den Wegweisern.',
  },
};
