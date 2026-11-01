// «Backup-Datei vor jedem Update» (Noah 31.10.2026 «2a»): after an update the data also lands as a file in the downloads folder
export default {
  title: 'Backup file before every update',
  lead: 'After an update the app also saves a backup file in your downloads folder.',
  points: [{ text: 'Ich › App maintenance: «Also save a backup file before every update» (on, you can switch it off)', go: null }],
  small: [],
  test: ['Open Ich › App maintenance: the switch «Also save a backup file before every update» is on.', 'After the next update the file pack-generator-… .json is in your downloads folder (the browser may ask once).'],
  since: [],
  de: {
    'Backup file before every update': 'Backup-Datei vor jedem Update',
    'After an update the app also saves a backup file in your downloads folder.': 'Nach einem Update speichert die App auch eine Backup-Datei in deinem Download-Ordner.',
    'Ich › App maintenance: «Also save a backup file before every update» (on, you can switch it off)': 'Ich › App-Wartung: «Vor jedem Update auch eine Backup-Datei speichern» (an, du kannst es ausschalten)',
    'Open Ich › App maintenance: the switch «Also save a backup file before every update» is on.': 'Öffne Ich › App-Wartung: Der Schalter «Vor jedem Update auch eine Backup-Datei speichern» ist an.',
    'After the next update the file pack-generator-… .json is in your downloads folder (the browser may ask once).': 'Nach dem nächsten Update liegt die Datei pack-generator-….json im Download-Ordner (der Browser fragt eventuell einmal).',
  },
};
