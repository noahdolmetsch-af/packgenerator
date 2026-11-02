// «Beispiele auf leeren Seiten» (Noah 1.11.2026): Equipment, My setup and Care show a marked example while no bike exists
export default {
  title: 'Examples on empty bike pages',
  lead: 'Where no bike exists yet, Equipment, My setup and Care show a small marked example of how the page will look.',
  points: [{ text: 'An empty Equipment, My setup or Care page shows a card «Example» with made-up values, not your data', go: { href: '#/bikes?tab=care', steps: [{ sel: '[data-example]' }] } }],
  small: [{ box: 'fixed', text: 'Care no longer says «nothing due» in its header when there is no bike.', go: { href: '#/bikes?tab=care', where: 'Bikes › Care, header, with no bike.' } }],
  test: ['Without a bike open Bikes › Care: below «No bikes yet» a dashed card «Example» shows how it will look.', 'Add a bike: the example is gone.'],
  since: [],
  de: {
    'Examples on empty bike pages': 'Beispiele auf leeren Velo-Seiten',
    'Where no bike exists yet, Equipment, My setup and Care show a small marked example of how the page will look.': 'Wo es noch kein Velo gibt, zeigen Ausrüstung, Mein Setup und Pflege ein kleines, markiertes Beispiel, wie die Seite aussehen wird.',
    'An empty Equipment, My setup or Care page shows a card «Example» with made-up values, not your data': 'Eine leere Seite Teile, Mein Setup oder Pflege zeigt eine Karte «Beispiel» mit erfundenen Werten, nicht mit deinen Daten',
    'Bikes › Care, header, with no bike.': 'Velos › Pflege, Kopfzeile, ohne Velo.',
    'Care no longer says «nothing due» in its header when there is no bike.': 'Die Pflege sagt in der Kopfzeile nicht mehr «nichts fällig», wenn es kein Velo gibt.',
    'Without a bike open Bikes › Care: below «No bikes yet» a dashed card «Example» shows how it will look.': 'Öffne ohne Velo Velos › Pflege: unter «Noch keine Velos» zeigt eine gestrichelte Karte «Beispiel», wie es aussehen wird.',
    'Add a bike: the example is gone.': 'Lege ein Velo an: das Beispiel ist weg.',
  },
};
