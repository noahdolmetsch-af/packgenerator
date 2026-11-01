// Noah 1.11.2026 «1a»: no backup file in the downloads folder after an update unless switched on
export default {
  title: 'No download after an update',
  lead: 'After an update the app no longer saves a big backup file by itself. You can switch it on again.',
  points: [{ text: '«Backup file before every update» is off by default', go: { href: '#/me/data', where: 'In «Daten und Backup», in the block «Before updates».' } }],
  small: [],
  test: ['Open «Daten und Backup» and look at «Before updates».', 'The switch «Also save a backup file before every update» is off.'],
  since: [],
  de: {
    'No download after an update': 'Kein Download nach einem Update',
    'After an update the app no longer saves a big backup file by itself. You can switch it on again.': 'Nach einem Update speichert die App nicht mehr von selbst eine grosse Backup-Datei. Du kannst es wieder einschalten.',
    '«Backup file before every update» is off by default': '«Backup-Datei vor jedem Update» ist standardmässig aus',
    'In «Daten und Backup», in the block «Before updates».': 'In «Daten und Backup», im Block «Vor Updates».',
    'Open «Daten und Backup» and look at «Before updates».': 'Öffne «Daten und Backup» und schau bei «Vor Updates».',
    'The switch «Also save a backup file before every update» is off.': 'Der Schalter «Vor jedem Update auch eine Backup-Datei speichern» ist aus.',
  },
};
