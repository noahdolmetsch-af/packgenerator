// Noah 31.10.2026: a backup file from a mail could not be picked on the phone (the file picker greyed it out)
export default {
  title: 'Pick a backup file on the phone',
  lead: 'The backup picker no longer greys out files, and says how to save one from a mail.',
  points: [{ text: 'Import backup shows every file and explains Gmail attachments', go: { href: '#/me/data', steps: [{ text: 'Import backup' }] } }],
  small: [],
  test: ['Ich › Daten: under the backup buttons a line explains how to save a file from a mail.', 'Tap «Import backup»: the picker shows all files, also a .json from Downloads.'],
  since: [],
  de: {
    'Pick a backup file on the phone': 'Backup-Datei am Handy wählen',
    'The backup picker no longer greys out files, and says how to save one from a mail.': 'Die Backup-Auswahl graut keine Dateien mehr aus und sagt, wie du eine Datei aus einer Mail speicherst.',
    'Import backup shows every file and explains Gmail attachments': 'Backup importieren zeigt jede Datei und erklärt Gmail-Anhänge',
    'Ich › Daten: under the backup buttons a line explains how to save a file from a mail.': 'Ich › Daten: Unter den Backup-Knöpfen erklärt eine Zeile, wie du eine Datei aus einer Mail speicherst.',
    'Tap «Import backup»: the picker shows all files, also a .json from Downloads.': 'Tippe «Backup importieren»: Die Auswahl zeigt alle Dateien, auch eine .json aus Downloads.',
  },
};
