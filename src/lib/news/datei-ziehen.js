// «Datei auf das Fenster ziehen» (Noah 23.11.2026 «1a 2a 3a 4a 5a», Punkt 3): on a computer a file dragged onto the window opens the right page
export default {
  title: 'Drag a file onto the window',
  lead: 'On a computer a ride, a backup, a photo or a PDF can be dropped onto the app; a sheet asks what should happen.',
  points: [
    { text: 'Drag a GPX or TCX ride, a backup (.json), a photo or a PDF onto the window: «Drop to open» shows, then a sheet offers the right way', go: { href: '#/me/data', where: 'Computer only: drag a file from the desktop onto the window of the app.' } },
  ],
  small: [{ box: 'new', text: 'Nothing is kept before you choose; «Cancel» is the default' }],
  test: [
    'On a computer drag a GPX file from a folder over the window: «Drop to open» shows.',
    'Drop it: the sheet says «A recorded ride» or «A planned route» and offers one way; «Cancel» has the focus.',
    'Tap «Cancel»: nothing changes. Drop it again and tap the suggestion: the page that reads the file opens.',
  ],
  since: [],
  de: {
    'Drag a file onto the window': 'Datei auf das Fenster ziehen',
    'On a computer a ride, a backup, a photo or a PDF can be dropped onto the app; a sheet asks what should happen.': 'Am Computer lassen sich eine Fahrt, ein Backup, ein Foto oder ein PDF auf die App ziehen; ein Blatt fragt, was geschehen soll.',
    'Drag a GPX or TCX ride, a backup (.json), a photo or a PDF onto the window: «Drop to open» shows, then a sheet offers the right way': 'Ziehe eine GPX- oder TCX-Fahrt, ein Backup (.json), ein Foto oder ein PDF auf das Fenster: «Loslassen zum Öffnen» erscheint, dann bietet ein Blatt den passenden Weg an',
    'Computer only: drag a file from the desktop onto the window of the app.': 'Nur am Computer: Ziehe eine Datei vom Desktop auf das Fenster der App.',
    'Nothing is kept before you choose; «Cancel» is the default': 'Nichts wird behalten, bevor du wählst; «Abbrechen» ist voreingestellt',
    'On a computer drag a GPX file from a folder over the window: «Drop to open» shows.': 'Ziehe am Computer eine GPX-Datei aus einem Ordner über das Fenster: «Loslassen zum Öffnen» erscheint.',
    'Drop it: the sheet says «A recorded ride» or «A planned route» and offers one way; «Cancel» has the focus.': 'Lass sie los: Das Blatt sagt «Eine aufgezeichnete Fahrt» oder «Eine geplante Strecke» und bietet einen Weg an; «Abbrechen» hat den Fokus.',
    'Tap «Cancel»: nothing changes. Drop it again and tap the suggestion: the page that reads the file opens.': 'Tippe auf «Abbrechen»: Nichts ändert sich. Lass sie noch einmal los und tippe auf den Vorschlag: Die Seite, die die Datei liest, öffnet sich.',
  },
};
