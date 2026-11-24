// «Zuletzt gelöscht» (Noah 23.11.2026 «1a», Thread «Papierkorb, Tab-Titel und Ziehen bauen»): everything you delete waits 30 days
export default {
  title: 'Recently deleted',
  lead: 'What you delete waits 30 days and comes back with what belonged to it.',
  points: [
    { text: 'Open Me › Data › «Recently deleted»: a deleted bike, tour, gear item or document stands there, «Back» brings it back with its rides, care entries or lines', go: 'f.trash' },
    { text: 'On a computer ⌘ Z (Ctrl Z) takes the last delete back, when no field is active', go: 'f.trash' },
  ],
  small: [
    { box: 'new', text: 'The trash of the notes stands in the same list and stays as it was', go: 'f.trash' },
    { box: 'new', text: 'After 30 days the app asks once whether to empty it; nothing goes by itself', go: 'f.trash' },
  ],
  test: ['Delete a gear item in Gear, then open Me › Data › «Recently deleted»: it stands there with its days left.', 'Tap «Back»: the item is there again in Gear.', 'Filter by kind and see that the empty list says «Nothing deleted in the last 30 days».'],
  since: ['f.trash'],
  de: {
    'Recently deleted': 'Zuletzt gelöscht',
    'What you delete waits 30 days and comes back with what belonged to it.': 'Was du löschst, wartet 30 Tage und kommt mit dem zurück, was dazugehörte.',
    'Open Me › Data › «Recently deleted»: a deleted bike, tour, gear item or document stands there, «Back» brings it back with its rides, care entries or lines': 'Öffne Ich › Daten › «Zuletzt gelöscht»: ein gelöschtes Velo, eine Tour, ein Material oder ein Dokument steht dort, «Zurück» bringt es mit seinen Fahrten, Pflegeeinträgen oder Zeilen zurück',
    'On a computer ⌘ Z (Ctrl Z) takes the last delete back, when no field is active': 'Am Computer nimmt ⌘ Z (Strg Z) das letzte Löschen zurück, wenn kein Feld aktiv ist',
    'The trash of the notes stands in the same list and stays as it was': 'Der Papierkorb der Notizen steht in derselben Liste und bleibt, wie er war',
    'After 30 days the app asks once whether to empty it; nothing goes by itself': 'Nach 30 Tagen fragt die App einmal, ob sie leeren soll; nichts verschwindet von allein',
    'Delete a gear item in Gear, then open Me › Data › «Recently deleted»: it stands there with its days left.': 'Lösche in Material ein Teil, öffne dann Ich › Daten › «Zuletzt gelöscht»: es steht dort mit seinen Resttagen.',
    'Tap «Back»: the item is there again in Gear.': 'Tippe «Zurück»: das Teil ist wieder in Material.',
    'Filter by kind and see that the empty list says «Nothing deleted in the last 30 days».': 'Filtere nach Art; die leere Liste sagt «Nichts gelöscht in den letzten 30 Tagen».',
  },
};
