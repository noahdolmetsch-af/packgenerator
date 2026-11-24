// «Zuletzt gelöscht» für To-dos und Einträge in Mein Tag (Noah 23.11.2026 «1a», Folge von «Zuletzt gelöscht»)
export default {
  title: 'Recently deleted holds to-dos and My day too',
  lead: 'A deleted to-do, birthday, plant or entry of My day waits 30 days as well.',
  points: [
    { text: 'Delete a to-do or an entry in My day: it stands in Me › Data › «Recently deleted» with the kind «To-dos» or «My day», «Back» puts it at the end of its list', go: 'f.trash' },
    { text: 'On a computer ⌘ Z (Ctrl Z) takes the last delete back here too', go: 'f.trash' },
  ],
  small: [{ box: 'new', text: 'The filter above the list has two new kinds: To-dos and My day', go: 'f.trash' }],
  test: ['Open My day › To-dos, tap a to-do, delete it, then open Me › Data › «Recently deleted»: it stands there as «To-dos».', 'Tap «Back»: the to-do is in the list again.', 'Delete an entry in My day (Day) and bring it back the same way.'],
  since: [],
  de: {
    'Recently deleted holds to-dos and My day too': '«Zuletzt gelöscht» hält auch To-dos und Mein Tag',
    'A deleted to-do, birthday, plant or entry of My day waits 30 days as well.': 'Ein gelöschtes To-do, ein Geburtstag, eine Pflanze oder ein Eintrag in Mein Tag wartet auch 30 Tage.',
    'Delete a to-do or an entry in My day: it stands in Me › Data › «Recently deleted» with the kind «To-dos» or «My day», «Back» puts it at the end of its list': 'Lösche ein To-do oder einen Eintrag in Mein Tag: er steht in Ich › Daten › «Zuletzt gelöscht» mit der Art «To-dos» oder «Mein Tag», «Zurück» legt ihn ans Ende seiner Liste',
    'On a computer ⌘ Z (Ctrl Z) takes the last delete back here too': 'Am Computer nimmt ⌘ Z (Strg Z) auch hier das letzte Löschen zurück',
    'The filter above the list has two new kinds: To-dos and My day': 'Der Filter über der Liste hat zwei neue Arten: To-dos und Mein Tag',
    'Open My day › To-dos, tap a to-do, delete it, then open Me › Data › «Recently deleted»: it stands there as «To-dos».': 'Öffne Mein Tag › To-dos, tippe ein To-do an, lösche es und öffne dann Ich › Daten › «Zuletzt gelöscht»: es steht dort als «To-dos».',
    'Tap «Back»: the to-do is in the list again.': 'Tippe «Zurück»: das To-do ist wieder in der Liste.',
    'Delete an entry in My day (Day) and bring it back the same way.': 'Lösche einen Eintrag in Mein Tag (Tag) und hol ihn genauso zurück.',
  },
};
