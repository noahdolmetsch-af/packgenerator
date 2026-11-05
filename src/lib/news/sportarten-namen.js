// «Sportarten umbenennen» (Noah 05.11.2026): Fahrrad, Gravel, Cross Country and Downhill had no entry, so nothing was saved
export default {
  title: 'Bike sports renamed',
  lead: 'Renaming, hiding and deleting now work for Fahrrad, Gravel, Cross Country and Downhill too, and the new name shows on every page.',
  points: [
    { text: 'Renaming a sport of trips changes its name in the list, in «New trip» and on the trip pages', go: { href: '#/flow/sports', steps: [{ sel: '[data-trip-sports] [data-row-menu]' }] } },
  ],
  small: [],
  test: [
    'Open Aktiv › My sports. Under «Sports of your trips» tap «⋯» at Gravel and choose «Rename».',
    'Type a new name and confirm: the list shows it at once. Reload the page: it stays.',
    'Tap «New trip»: the sport chips show the new name.',
  ],
  since: [],
  de: {
    'Bike sports renamed': 'Sportarten umbenennen klappt jetzt bei allen',
    'Renaming, hiding and deleting now work for Fahrrad, Gravel, Cross Country and Downhill too, and the new name shows on every page.': 'Umbenennen, Ausblenden und Löschen klappt jetzt auch bei Fahrrad, Gravel, Cross Country und Downhill, und der neue Name steht überall.',
    'Renaming a sport of trips changes its name in the list, in «New trip» and on the trip pages': 'Ein umbenannter Sport der Touren heisst überall gleich: in der Liste, bei «Neue Tour» und auf den Tour-Seiten',
    'Open Aktiv › My sports. Under «Sports of your trips» tap «⋯» at Gravel and choose «Rename».': 'Öffne Aktiv › Meine Sportarten. Tippe unter «Sportarten deiner Touren» bei Gravel auf «⋯» und wähle «Umbenennen».',
    'Type a new name and confirm: the list shows it at once. Reload the page: it stays.': 'Gib einen neuen Namen ein und bestätige: die Liste zeigt ihn sofort. Lade die Seite neu: er bleibt.',
    'Tap «New trip»: the sport chips show the new name.': 'Tippe auf «Neue Tour»: die Sport-Chips zeigen den neuen Namen.',
  },
};
