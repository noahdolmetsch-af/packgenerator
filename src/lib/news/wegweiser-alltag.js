// «Wegweiser statt Katalog» PR 8 (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»): the everyday tools where the need comes up
export default {
  title: 'Everyday tools where you need them',
  lead: 'Picture tools in the Inbox, links at the documents, calmer modes at the week.',
  points: [
    {
      text: 'Inbox: «Fits here» with edit a picture, picture format, make video smaller and tool chains',
      go: { href: '#/inbox', steps: [{ sel: '[data-passt-hier="inbox"]' }], where: 'Shows at the end of the Inbox.' },
    },
    {
      text: 'Week and phone reminders: «Fits here» with workspace, calm view, my evening, reminder budget and «Not for me»',
      go: { href: '#/week', steps: [{ sel: '[data-passt-hier="woche"]' }], where: 'Shows at the end of «This week».' },
    },
  ],
  small: [
    { box: 'new', text: 'Documents: links and files and the QR code at the end', go: { href: '#/me/docs', steps: [{ sel: '[data-passt-hier="docs"]' }] } },
    { box: 'new', text: 'Remember: «Not seen for a while» in the top line', go: { href: '#/calendar', steps: [{ sel: '[data-merken-people]' }] } },
  ],
  test: [
    'Open the Inbox and scroll to the end: «Fits here» shows four picture and file tools.',
    'Open Plan › Week: at the end is «Fits here» with workspace, calm view and my evening.',
    'Open Remember: next to «Reminders» is «Not seen for a while».',
  ],
  since: [],
  de: {
    'Everyday tools where you need them': 'Alltags-Werkzeuge dort, wo du sie brauchst',
    'Picture tools in the Inbox, links at the documents, calmer modes at the week.': 'Bild-Werkzeuge im Eingang, Links bei den Dokumenten, ruhigere Ansichten bei der Woche.',
    'Inbox: «Fits here» with edit a picture, picture format, make video smaller and tool chains': 'Eingang: «Passt hier» mit Bild bearbeiten, Bildformat umwandeln, Video verkleinern und Werkzeug-Ketten',
    'Shows at the end of the Inbox.': 'Erscheint am Ende des Eingangs.',
    'Week and phone reminders: «Fits here» with workspace, calm view, my evening, reminder budget and «Not for me»': 'Woche und Erinnerungen aufs Handy: «Passt hier» mit Arbeitsraum, Ruhige Ansicht, Mein Abend, Erinnerungs-Budget und «Nicht für mich»',
    'Shows at the end of «This week».': 'Erscheint am Ende von «Diese Woche».',
    'Documents: links and files and the QR code at the end': 'Dokumente: Links und Dateien und der QR-Code am Ende',
    'Remember: «Not seen for a while» in the top line': 'Merken: «Lange nicht gesehen» in der obersten Zeile',
    'Open the Inbox and scroll to the end: «Fits here» shows four picture and file tools.': 'Öffne den Eingang und scrolle ans Ende: «Passt hier» zeigt vier Bild- und Datei-Werkzeuge.',
    'Open Plan › Week: at the end is «Fits here» with workspace, calm view and my evening.': 'Öffne Planen › Woche: am Ende steht «Passt hier» mit Arbeitsraum, Ruhige Ansicht und Mein Abend.',
    'Open Remember: next to «Reminders» is «Not seen for a while».': 'Öffne Merken: neben «Erinnerungen» steht «Lange nicht gesehen».',
  },
};
