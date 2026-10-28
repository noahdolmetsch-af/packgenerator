// «Bereiche anpassen» (Noah 27.10.2026 «1a 2a», thread «Heute ruhiger»): the areas of Heute moved with arrows and drag,
// renamed and hidden with Undo (src/lib/home/AreasEdit.svelte, sections.js AREAS_KEY)
export default {
  title: 'Your own areas on Today',
  lead: 'Move, rename, hide.',
  points: [
    { text: 'Customise the start page: move the areas of Today with the arrows or drag' },
    { text: 'Give an area your own name or hide it; its tiles go to «Without area» or to another area' },
  ],
  small: [{ box: 'nicer', text: 'Every change can be undone, a hidden area comes back with «Show again»' }],
  test: [
    'Open Today, at the bottom «Customise the start page»: under «Areas of Today» move «Your body» up with the arrow.',
    'Tap the pencil at «Now», type a name, then tap the eye at «Your week» and «Hide»: Today shows the new order and name, the tiles of the week under «Without area».',
  ],
  since: [],
  de: {
    'Your own areas on Today': 'Eigene Bereiche auf Heute',
    'Move, rename, hide.': 'Verschieben, umbenennen, ausblenden.',
    'Customise the start page: move the areas of Today with the arrows or drag': 'Startseite anpassen: die Bereiche von Heute mit Pfeilen oder Ziehen verschieben',
    'Give an area your own name or hide it; its tiles go to «Without area» or to another area': 'Einen Bereich umbenennen oder ausblenden; seine Kacheln gehen nach «Ohne Bereich» oder in einen anderen Bereich',
    'Every change can be undone, a hidden area comes back with «Show again»': 'Alles lässt sich rückgängig machen, ein ausgeblendeter Bereich kommt mit «Wieder zeigen» zurück',
    'Open Today, at the bottom «Customise the start page»: under «Areas of Today» move «Your body» up with the arrow.': 'Öffne Heute, unten «Startseite anpassen»: unter «Bereiche von Heute» schiebst du «Dein Körper» mit dem Pfeil nach oben.',
    'Tap the pencil at «Now», type a name, then tap the eye at «Your week» and «Hide»: Today shows the new order and name, the tiles of the week under «Without area».': 'Tippe den Stift bei «Jetzt», gib einen Namen ein, dann das Auge bei «Deine Woche» und «Ausblenden»: Heute zeigt die neue Reihenfolge und den Namen, die Kacheln der Woche unter «Ohne Bereich».',
  },
};
