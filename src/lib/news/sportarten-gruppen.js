// «Meine Sportarten: Gruppen, Suche, Filter» (Noah 02.11.2026 «4a»)
export default {
  title: 'Groups, search and filter for your sports',
  lead: 'Put your sports into groups of your own, find one fast and show only what is open today.',
  points: [
    { text: 'Own groups for your sports (for example «Strength»): put a sport in with ⋯ or by dragging it onto the title, fold, rename, move or delete a group', go: { href: '#/flow/sports', where: 'The button «Group» stands above the list of sports.', steps: [{ sel: '[data-new-group]' }] } },
    { text: 'Search a sport by name and filter «Open today»', go: { href: '#/flow/sports', where: 'The search field stands above the list of sports.', steps: [{ sel: '[data-find-sport]' }] } },
  ],
  small: [],
  test: [
    'Open Aktiv › Meine Sportarten and tap «Group»; name it, for example «Strength».',
    'Tap ⋯ at a sport and choose the group; fold the group with its title.',
    'Type a few letters in the search field, then tap «Open today».',
  ],
  since: [],
  de: {
    'The button «Group» stands above the list of sports.': 'Der Knopf «Gruppe» steht über der Liste der Sportarten.',
    'The search field stands above the list of sports.': 'Das Suchfeld steht über der Liste der Sportarten.',
    'Groups, search and filter for your sports': 'Gruppen, Suche und Filter für deine Sportarten',
    'Put your sports into groups of your own, find one fast and show only what is open today.': 'Lege deine Sportarten in eigene Gruppen, finde eine schnell und zeige nur, was heute offen ist.',
    'Own groups for your sports (for example «Strength»): put a sport in with ⋯ or by dragging it onto the title, fold, rename, move or delete a group': 'Eigene Gruppen für deine Sportarten (zum Beispiel «Kraft»): mit ⋯ oder durch Ziehen auf den Titel eine Sportart hineinlegen, Gruppe einklappen, umbenennen, verschieben oder löschen',
    'Search a sport by name and filter «Open today»': 'Eine Sportart nach Namen suchen und «Heute offen» filtern',
    'Open Aktiv › Meine Sportarten and tap «Group»; name it, for example «Strength».': 'Öffne Aktiv › Meine Sportarten und tippe auf «Gruppe»; gib ihr einen Namen, zum Beispiel «Kraft».',
    'Tap ⋯ at a sport and choose the group; fold the group with its title.': 'Tippe bei einer Sportart auf ⋯ und wähle die Gruppe; klappe die Gruppe über ihren Titel ein.',
    'Type a few letters in the search field, then tap «Open today».': 'Tippe ein paar Buchstaben ins Suchfeld, dann auf «Heute offen».',
  },
};
