// «Pfad auf jeder Seite» Schritt 6 (Noah 28.10.2026 «1a und c und d alle»): date of the last change in Lists and types
export default {
  title: 'When a list was changed',
  lead: 'A list in Lists and types now says when you last changed it.',
  points: [
    { text: 'Above a list you changed stands «Last changed by you» with the date', go: { href: '#/me/lists?noteTopics', steps: [{ sel: 'main ul.rows' }] } },
    { text: 'Lists you changed earlier get their date with your next change', go: { href: '#/me/lists?noteTopics' } },
  ],
  small: [{ box: 'new', text: 'The date is saved inside the list and travels in backups' }],
  test: ['Open Me › Lists and types › Note topics and add an own topic: above the list «Last changed by you» appears with today\'s date.', 'Tap «Back to Standard»: the line is gone, because the list is the Standard again.'],
  since: [],
  de: {
    'When a list was changed': 'Wann eine Liste geändert wurde',
    'A list in Lists and types now says when you last changed it.': 'Eine Liste in Listen und Typen sagt jetzt, wann du sie zuletzt geändert hast.',
    'Above a list you changed stands «Last changed by you» with the date': 'Über einer geänderten Liste steht «Zuletzt von dir geändert» mit dem Datum',
    'Lists you changed earlier get their date with your next change': 'Listen, die du früher geändert hast, bekommen ihr Datum bei deiner nächsten Änderung',
    'The date is saved inside the list and travels in backups': 'Das Datum wird in der Liste gespeichert und reist in Backups mit',
    'Open Me › Lists and types › Note topics and add an own topic: above the list «Last changed by you» appears with today\'s date.': 'Öffne Ich › Listen und Typen › Themen der Notizen und füge ein eigenes Thema hinzu: Über der Liste erscheint «Zuletzt von dir geändert» mit dem heutigen Datum.',
    'Tap «Back to Standard»: the line is gone, because the list is the Standard again.': 'Tippe auf «Auf Standard zurücksetzen»: Die Zeile verschwindet, weil die Liste wieder Standard ist.',
  },
};
