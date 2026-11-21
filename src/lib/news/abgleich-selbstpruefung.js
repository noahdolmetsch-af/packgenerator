// «Abgleich prüft sich selbst» (Noah 21.11.2026: Haken vom Computer fehlten am Handy): the sync counts and fills gaps by itself
export default {
  title: 'The sync checks itself',
  lead: 'After a round, this device and the server count their entries. A difference is looked for and filled in by itself, and a server that started again no longer leaves a device blind.',
  points: [{ text: 'Me › Data and backup shows «Checked … the same entries» as proof that nothing is missing', go: { href: '#/me/data', where: 'Me › Data and backup › Phone and computer. The line appears only when the sync is on.' } }],
  small: [],
  test: [
    'Open Me › Data and backup with the sync on, tap «Sync now».',
    'Under the line «On · last synced» a line «Checked …: … the same entries» appears.',
  ],
  since: [],
  de: {
    'Me › Data and backup › Phone and computer. The line appears only when the sync is on.': 'Ich › Daten und Backup › Handy und Computer. Die Zeile erscheint nur, wenn der Abgleich eingeschaltet ist.',
    'The sync checks itself': 'Der Abgleich prüft sich selbst',
    'After a round, this device and the server count their entries. A difference is looked for and filled in by itself, and a server that started again no longer leaves a device blind.': 'Nach einer Runde zählen dieses Gerät und der Server ihre Einträge. Ein Unterschied wird gesucht und von selbst ergänzt, und ein Server, der von vorn beginnt, lässt ein Gerät nicht mehr im Dunkeln.',
    'Me › Data and backup shows «Checked … the same entries» as proof that nothing is missing': 'Ich › Daten und Backup zeigt «Geprüft … gleich viele Einträge» als Beleg, dass nichts fehlt',
    'Open Me › Data and backup with the sync on, tap «Sync now».': 'Öffne Ich › Daten und Backup bei eingeschaltetem Abgleich und tippe auf «Jetzt abgleichen».',
    'Under the line «On · last synced» a line «Checked …: … the same entries» appears.': 'Unter der Zeile «Ein · zuletzt abgeglichen» steht eine Zeile «Geprüft …: … gleich viele Einträge».',
  },
};
