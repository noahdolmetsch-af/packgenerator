// «Abgleich-Status» (Noah 03.11.2026): «Gleicht ab …» hing lange und sagte nichts
export default {
  title: 'A clear sync status',
  lead: 'The sync now says how long it runs, how far it is, and when it last worked.',
  points: [{ text: 'While syncing it shows the time and how many entries came or went', go: { href: '#/me/data', where: 'Me › Data and backup › Phone and computer, the line under «Sync automatically».' } }, { text: 'After a failure it names the reason and the last successful sync', go: { href: '#/me/data', where: 'Me › Data and backup › Phone and computer.' } }],
  small: [{ box: 'fixed', text: 'A call to the server without an answer ends after 90 seconds instead of hanging' }],
  test: ['Open Me › Data and backup › Phone and computer and tap «Sync now»: a line shows how long it runs.', 'When it is done, the line says when it last synced.'],
  since: [],
  de: {
    'A clear sync status': 'Ein klarer Abgleich-Status',
    'The sync now says how long it runs, how far it is, and when it last worked.': 'Der Abgleich sagt jetzt, wie lange er läuft, wie weit er ist und wann er zuletzt geklappt hat.',
    'While syncing it shows the time and how many entries came or went': 'Beim Abgleichen zeigt er die Zeit und wie viele Einträge gekommen oder gegangen sind',
    'Me › Data and backup › Phone and computer, the line under «Sync automatically».': 'Ich › Daten und Backup › Handy und Computer, die Zeile unter «Automatisch abgleichen».',
    'After a failure it names the reason and the last successful sync': 'Nach einem Fehler nennt er den Grund und den letzten erfolgreichen Abgleich',
    'Me › Data and backup › Phone and computer.': 'Ich › Daten und Backup › Handy und Computer.',
    'A call to the server without an answer ends after 90 seconds instead of hanging': 'Ein Aufruf des Servers ohne Antwort endet nach 90 Sekunden, statt zu hängen',
    'Open Me › Data and backup › Phone and computer and tap «Sync now»: a line shows how long it runs.': 'Öffne Ich › Daten und Backup › Handy und Computer und tippe «Jetzt abgleichen»: Eine Zeile zeigt, wie lange es läuft.',
    'When it is done, the line says when it last synced.': 'Ist es fertig, sagt die Zeile, wann zuletzt abgeglichen wurde.',
  },
};
