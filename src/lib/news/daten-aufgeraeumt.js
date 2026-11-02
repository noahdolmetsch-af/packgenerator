// «Daten und Backup aufräumen» (Noah 01.11.2026 «1a 2a 3a 4a 5b» + alle fünf Ideen): three things first, the rest folded
export default {
  title: 'Data and backup, tidied up',
  lead: 'The page shows three things first: are your data safe, the sync, and one fold with the rest.',
  points: [
    { text: 'One status line instead of six dots; orange with «Back up now» when a backup is due', go: { href: '#/me/data', steps: [{ sel: '[data-section="status"]' }] } },
    { text: 'The sync comes first, the backup file and everything rare sit folded under «Back up with a file» and «More»', go: { href: '#/me/data', where: 'Me › Data and backup: the sync is on top, the folds are below it.' } },
    { text: 'Fitbit has its own page, the Google sign-in is gone from this page (code and QR couple the devices)', go: { href: '#/me/data', steps: [{ sel: '[data-row="fitbit-page"]' }] } },
  ],
  small: [
    { box: 'new', text: 'First time: «Do you need the app on two devices?». Yes shows the sync, No folds it', go: { href: '#/me/data', where: 'Shows once on Me › Data and backup, until you answer.' } },
    { box: 'new', text: '«Delete everything» offers a backup first', go: { href: '#/me/data', where: 'Me › Data and backup › More › Start fresh.' } },
    { box: 'new', text: '«Backup» now always means the file, «sync» the exchange between devices', go: null },
  ],
  test: [
    'Open Me › Data and backup: the status line is on top, with «Details» behind it.',
    'Open «More» and «Back up with a file»: the rare things are there.',
    'Tap «Details»: the six dots are still there.',
  ],
  since: [],
  de: {
    'Data and backup, tidied up': 'Daten und Backup, aufgeräumt',
    'The page shows three things first: are your data safe, the sync, and one fold with the rest.': 'Die Seite zeigt zuerst drei Dinge: Sind die Daten sicher, der Abgleich, und eine Faltstelle mit dem Rest.',
    'One status line instead of six dots; orange with «Back up now» when a backup is due': 'Eine Statuszeile statt sechs Punkten; orange mit «Jetzt sichern», wenn ein Backup fällig ist',
    'The sync comes first, the backup file and everything rare sit folded under «Back up with a file» and «More»': 'Der Abgleich steht zuerst, die Backup-Datei und alles Seltene sind zugeklappt unter «Mit einer Backup-Datei sichern» und «Mehr»',
    'Me › Data and backup: the sync is on top, the folds are below it.': 'Ich › Daten und Backup: Der Abgleich steht oben, die Faltstellen darunter.',
    'Fitbit has its own page, the Google sign-in is gone from this page (code and QR couple the devices)': 'Fitbit hat eine eigene Seite, die Google-Anmeldung ist auf dieser Seite weg (Code und QR koppeln die Geräte)',
    'First time: «Do you need the app on two devices?». Yes shows the sync, No folds it': 'Beim ersten Mal: «Brauchst du die App auf zwei Geräten?». Ja zeigt den Abgleich, Nein klappt ihn zu',
    'Shows once on Me › Data and backup, until you answer.': 'Erscheint auf Ich › Daten und Backup, bis du antwortest.',
    '«Delete everything» offers a backup first': '«Alles löschen» bietet zuerst ein Backup an',
    'Me › Data and backup › More › Start fresh.': 'Ich › Daten und Backup › Mehr › Neu beginnen.',
    '«Backup» now always means the file, «sync» the exchange between devices': '«Backup» heisst jetzt immer die Datei, «Abgleich» den Austausch zwischen den Geräten',
    'Open Me › Data and backup: the status line is on top, with «Details» behind it.': 'Öffne Ich › Daten und Backup: Oben steht die Statuszeile, dahinter «Einzelheiten».',
    'Open «More» and «Back up with a file»: the rare things are there.': 'Öffne «Mehr» und «Mit einer Backup-Datei sichern»: Dort liegt das Seltene.',
    'Tap «Details»: the six dots are still there.': 'Tippe auf «Einzelheiten»: Die sechs Punkte sind noch da.',
  },
};
