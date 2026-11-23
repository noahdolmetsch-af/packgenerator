// «Daten behalten» (Noah 22.11.2026 «3a», Thread «Sync»): ein Tipp auf «Daten behalten», den der Browser ablehnt, sagt es jetzt
export default {
  title: 'You see what «Keep my data» did',
  lead: 'When the browser turns the request down, the app tells you and says what helps.',
  points: [{ text: 'After a tap on «Keep my data», a short message says if the browser keeps the data now or not', go: { href: '#/', where: 'Today: the line «Is everything in order?» shows «Keep my data» only while the browser does not keep your data yet.' } }],
  small: [{ box: 'nicer', text: 'The little «?» on that line explains: home screen icon and daily use help' }],
  test: [
    'Open Today on a device where the line «Data not kept yet» shows (it only shows with data and when the browser does not keep it).',
    'Tap «Keep my data»: a message says what the browser answered.',
    'Open the «?» on the line: it names the home screen icon and the backup file.',
  ],
  since: [],
  de: {
    'You see what «Keep my data» did': 'Du siehst, was «Daten behalten» bewirkt hat',
    'When the browser turns the request down, the app tells you and says what helps.': 'Lehnt der Browser die Bitte ab, sagt dir das die App und nennt, was hilft.',
    'After a tap on «Keep my data», a short message says if the browser keeps the data now or not': 'Nach einem Tipp auf «Daten behalten» sagt eine kurze Meldung, ob der Browser die Daten jetzt behält oder nicht',
    'Today: the line «Is everything in order?» shows «Keep my data» only while the browser does not keep your data yet.': 'Heute: Die Zeile «Ist alles in Ordnung?» zeigt «Daten behalten» nur, solange der Browser deine Daten noch nicht behält.',
    'The little «?» on that line explains: home screen icon and daily use help': 'Das kleine «?» an der Zeile erklärt: Symbol auf dem Startbildschirm und tägliche Nutzung helfen',
    'Open Today on a device where the line «Data not kept yet» shows (it only shows with data and when the browser does not keep it).': 'Öffne Heute auf einem Gerät, wo die Zeile «Daten noch nicht gesichert» steht (sie erscheint nur mit Daten und wenn der Browser sie nicht behält).',
    'Tap «Keep my data»: a message says what the browser answered.': 'Tippe «Daten behalten»: Eine Meldung sagt, was der Browser geantwortet hat.',
    'Open the «?» on the line: it names the home screen icon and the backup file.': 'Öffne das «?» an der Zeile: Es nennt das Symbol auf dem Startbildschirm und die Backup-Datei.',
  },
};
