// «Sicherung prüfen» (Noah 02.11.2026 «1a»): dry run of a backup file + a second copy outside the device
export default {
  features: [
    { id: 'f.backupcheck', group: 'data', title: 'Check your backup', text: 'Check a backup file without changing anything, and keep a second copy outside this device.', href: '#/me/data', words: 'sicherung prüfen backup test probelauf datei heil zweite kopie ausser haus cloud mail verloren', moment: 'app' },
  ],
  howto: { 'f.backupcheck': ['Open Me › Data and backup › «Back up with a file».', 'Tap «Check backup» and choose a file: it says if it is good, or what is wrong.', 'Send a backup to yourself, then tap «I did it just now».'] },
  handbook: { 'f.backupcheck': { on: null, steps: ['Open Me › Data and backup › «Back up with a file».', 'Tap «Check backup» and choose a file: it says if it is good, or what is wrong.', 'Send a backup to yourself, then tap «I did it just now».'], example: 'Example: file from last month → «This backup is good. 5 trips, 2 bikes».' } },
  home: { 'f.backupcheck': '#/me/data' },
};
