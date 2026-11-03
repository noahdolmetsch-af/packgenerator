// «Abgleich vergleichen» (Noah 03.11.2026 «a»): see what the server or this device lacks, and fill it in
export default {
  title: 'Compare the sync with the server',
  lead: 'A new button shows which entries are missing here or on the server, and fills them in.',
  points: [{ text: 'Under «Phone and computer», «Compare with the server» names what is missing, for example a bike', go: { href: '#/me/data', where: 'Me › Data and backup › Phone and computer, only when the sync is on.' } }],
  small: [{ box: 'new', text: 'Filling in only adds, nothing is deleted' }],
  test: ['Open Me › Data and backup › Phone and computer and tap «Compare with the server».', 'It shows how many entries the server and this device hold, and names what is missing on either side.'],
  since: [],
  de: {
    'Compare the sync with the server': 'Den Abgleich mit dem Server vergleichen',
    'A new button shows which entries are missing here or on the server, and fills them in.': 'Ein neuer Knopf zeigt, welche Einträge hier oder auf dem Server fehlen, und ergänzt sie.',
    'Under «Phone and computer», «Compare with the server» names what is missing, for example a bike': 'Unter «Handy und Computer» nennt «Mit dem Server vergleichen», was fehlt, zum Beispiel ein Velo',
    'Me › Data and backup › Phone and computer, only when the sync is on.': 'Ich › Daten und Backup › Handy und Computer, nur wenn der Abgleich eingeschaltet ist.',
    'Filling in only adds, nothing is deleted': 'Ergänzen fügt nur hinzu, nichts wird gelöscht',
    'Open Me › Data and backup › Phone and computer and tap «Compare with the server».': 'Öffne Ich › Daten und Backup › Handy und Computer und tippe «Mit dem Server vergleichen».',
    'It shows how many entries the server and this device hold, and names what is missing on either side.': 'Es zeigt, wie viele Einträge Server und Gerät haben, und nennt, was auf einer Seite fehlt.',
  },
};
