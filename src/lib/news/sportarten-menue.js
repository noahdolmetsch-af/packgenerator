// «Meine Sportarten ändern» (Noah 02.11.2026 «2a»): the menu ⋯ in the list, new sports of trips in the list
export default {
  title: 'Change your sports in the list',
  lead: 'Rename, pause, move and delete a sport without leaving the list.',
  points: [
    { text: 'The menu ⋯ at every sport: rename, pause, move, delete (with Undo)', go: { href: '#/flow/sports', steps: [{ sel: '[data-my-sports] [data-row-menu]' }] } },
    { text: 'Sports of your trips: add, rename, hide and delete right there', go: { href: '#/flow/sports', steps: [{ sel: '[data-add-trip-sport]' }] } },
  ],
  small: [],
  test: [
    'Open Aktiv › Meine Sportarten and tap the ⋯ at a sport: Rename, Pause, Move, Delete.',
    'Rename a sport; «Undo» below brings the old name back.',
    'On the right under «Sports of your trips» tap «Sport of trips» and add one of your own.',
  ],
  since: [],
  de: {
    'Change your sports in the list': 'Sportarten direkt in der Liste ändern',
    'Rename, pause, move and delete a sport without leaving the list.': 'Sportart umbenennen, pausieren, verschieben und löschen, ohne die Liste zu verlassen.',
    'The menu ⋯ at every sport: rename, pause, move, delete (with Undo)': 'Das Menü ⋯ bei jeder Sportart: umbenennen, pausieren, verschieben, löschen (mit Rückgängig)',
    'Sports of your trips: add, rename, hide and delete right there': 'Sportarten deiner Touren: gleich dort hinzufügen, umbenennen, ausblenden und löschen',
    'Open Aktiv › Meine Sportarten and tap the ⋯ at a sport: Rename, Pause, Move, Delete.': 'Öffne Aktiv › Meine Sportarten und tippe bei einer Sportart auf ⋯: Umbenennen, Pause, Verschieben, Löschen.',
    'Rename a sport; «Undo» below brings the old name back.': 'Benenne eine Sportart um; «Rückgängig» unten bringt den alten Namen zurück.',
    'On the right under «Sports of your trips» tap «Sport of trips» and add one of your own.': 'Tippe rechts unter «Sportarten deiner Touren» auf «Sportart der Touren» und füge eine eigene hinzu.',
  },
};
