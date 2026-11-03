// «Sicherung prüfen» (Noah 02.11.2026 «1a»): a dry run of a backup file, and a hint for a second copy outside the device
export default {
  title: 'Check your backup',
  lead: 'Look into a backup file before you need it, and keep a second copy outside this device.',
  points: [
    { text: 'Under Backup tap «Check backup» and choose a file', href: '#/me/data', go: 'f.backupcheck' },
    { text: 'Under the buttons it says if a second copy outside the device exists', href: '#/me/data', go: 'f.backupcheck' },
  ],
  small: [],
  test: [
    'Open Me › Data and backup, at the top «Everything in order?».',
    'Tap «Check backup» and choose a backup file: it says if the file is whole. Nothing is changed.',
  ],
  since: ['f.backupcheck'],
  de: {
    'Check your backup': 'Sicherung prüfen',
    'Look into a backup file before you need it, and keep a second copy outside this device.': 'Schau in eine Sicherungsdatei, bevor du sie brauchst, und halte eine zweite Kopie ausser Haus.',
    'Under Backup tap «Check backup» and choose a file': 'Unter Sicherung «Sicherung prüfen» antippen und eine Datei wählen',
    'Under the buttons it says if a second copy outside the device exists': 'Unter den Knöpfen steht, ob es eine zweite Kopie ausser Haus gibt',
    'Open Me › Data and backup, at the top «Everything in order?».': 'Öffne Ich › Daten und Backup, oben «Alles in Ordnung?».',
    'Tap «Check backup» and choose a backup file: it says if the file is whole. Nothing is changed.': 'Tippe «Sicherung prüfen» und wähle eine Sicherungsdatei: Es steht, ob die Datei heil ist. Nichts wird geändert.',
  },
};
