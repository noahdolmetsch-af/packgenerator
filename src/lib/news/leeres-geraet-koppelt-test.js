// Nachttest fürs leere Gerät (Noah 22.11.2026 «5a», Thread «Sync»): ein geleertes Gerät koppelt vom Startfenster aus und bekommt alles
export default {
  title: 'Emptied device test',
  lead: 'The nightly check now also pairs an emptied device from the start window and checks it gets all the data. Nothing changes in the app.',
  points: [{ text: 'Nothing new to see: only an automatic check was added', go: { href: '#/me/data', where: 'Ich › Data and backup › Phone and computer.' } }],
  small: [],
  test: [
    'Open Ich › Data and backup and look at «Phone and computer».',
    'Pair a second device with the code, as before: both devices show the same counts.',
  ],
  since: [],
  de: {
    'Emptied device test': 'Test für ein geleertes Gerät',
    'The nightly check now also pairs an emptied device from the start window and checks it gets all the data. Nothing changes in the app.': 'Die nächtliche Prüfung koppelt jetzt auch ein geleertes Gerät vom Startfenster aus und prüft, dass es alle Daten bekommt. In der App ändert sich nichts.',
    'Nothing new to see: only an automatic check was added': 'Nichts Neues zu sehen: nur eine automatische Prüfung wurde ergänzt',
    'Ich › Data and backup › Phone and computer.': 'Ich › Daten und Backup › Handy und Computer.',
    'Open Ich › Data and backup and look at «Phone and computer».': 'Öffne Ich › Daten und Backup und sieh dir «Handy und Computer» an.',
    'Pair a second device with the code, as before: both devices show the same counts.': 'Kopple ein zweites Gerät mit dem Code, wie bisher: beide Geräte zeigen die gleichen Zahlen.',
  },
};
