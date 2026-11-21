// «Ordner-Backup seltener» (Noah 11.11.2026 «1-4 umsetzen», Messung 10.11.): the folder backup writes at most every 30 seconds
export default {
  title: 'Folder backup: calmer',
  lead: 'The backup into your folder (Mac) now writes at most every 30 seconds instead of after every save.',
  points: [{ text: 'Saving no longer starts a full backup each time; changes in between go into the next one', go: { href: '#/me/data' } }],
  small: [{ box: 'new', text: 'Folder backup waits 30 seconds between two writes, and writes at once when you leave the tab' }],
  test: ['Change a trip and save it a few times in a row: the page stays calm.', 'Open Ich › Daten: the folder backup still shows the time of its last write.'],
  since: [],
  de: {
    'Folder backup: calmer': 'Ordner-Backup: ruhiger',
    'The backup into your folder (Mac) now writes at most every 30 seconds instead of after every save.': 'Das Backup in deinen Ordner (Mac) schreibt jetzt höchstens alle 30 Sekunden statt nach jedem Speichern.',
    'Saving no longer starts a full backup each time; changes in between go into the next one': 'Speichern startet nicht mehr jedes Mal ein volles Backup; was dazwischen geändert wird, kommt ins nächste',
    'Folder backup waits 30 seconds between two writes, and writes at once when you leave the tab': 'Das Ordner-Backup wartet 30 Sekunden zwischen zwei Schreibvorgängen und schreibt sofort, wenn du den Tab verlässt',
    'Change a trip and save it a few times in a row: the page stays calm.': 'Ändere eine Tour und speichere mehrmals hintereinander: die Seite bleibt ruhig.',
    'Open Ich › Daten: the folder backup still shows the time of its last write.': 'Öffne Ich › Daten: das Ordner-Backup zeigt weiter die Zeit des letzten Schreibens.',
  },
};
