// «Ein kaputter Eintrag blockiert den Abgleich nicht mehr» (Noah 21.11.2026 «1-5a», Punkt 5)
export default {
  title: 'One bad entry no longer stops the sync',
  lead: 'An entry this device cannot save is skipped and reported. Everything after it still arrives.',
  points: [{ text: 'Me › Data and backup says how many entries were skipped', go: { href: '#/me/data', where: 'Shows only when an entry from the other device could not be saved: a line under «Sync automatically».' } }],
  small: [],
  test: [
    'Open Me › Data and backup with the sync on: no line about skipped entries while all is well.',
    'Tap «Sync now»: the round ends with «last synced» as before.',
  ],
  since: [],
  de: {
    'One bad entry no longer stops the sync': 'Ein kaputter Eintrag stoppt den Abgleich nicht mehr',
    'An entry this device cannot save is skipped and reported. Everything after it still arrives.': 'Ein Eintrag, den dieses Gerät nicht speichern kann, wird übersprungen und gemeldet. Alles danach kommt trotzdem an.',
    'Me › Data and backup says how many entries were skipped': 'Ich › Daten und Backup sagt, wie viele Einträge übersprungen wurden',
    'Shows only when an entry from the other device could not be saved: a line under «Sync automatically».': 'Erscheint nur, wenn ein Eintrag vom anderen Gerät nicht gespeichert werden konnte: eine Zeile unter «Automatisch abgleichen».',
    'Open Me › Data and backup with the sync on: no line about skipped entries while all is well.': 'Öffne Ich › Daten und Backup bei eingeschaltetem Abgleich: Solange alles gut ist, steht keine Zeile über übersprungene Einträge da.',
    'Tap «Sync now»: the round ends with «last synced» as before.': 'Tippe auf «Jetzt abgleichen»: Die Runde endet wie bisher mit «zuletzt abgeglichen».',
  },
};
