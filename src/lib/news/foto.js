// «Verbesserungs-Logbuch» (Noah 21.11.2026 «freigabe», «2b»): the photo of the page, step 3 of 4
export default {
  title: 'A photo with every entry',
  lead: 'When you note something with «Improve», the app takes a photo of the whole page, the block in orange.',
  points: [
    { text: 'The photo is made with the tap on the block and kept small on your device and in your backup', go: 'f.logbuch' },
    { text: 'In the improvement log a small picture shows with the entry; a tap shows it big; «Save the pictures» puts them in files for the chat', go: { href: '#/me/logbuch', steps: [{ sel: '[data-lb-images]' }], where: 'Me › Improvement log › Order for the chat. «Save the pictures» shows once an entry has a photo.' } },
  ],
  small: [{ box: 'new', text: 'Maps and some charts can come out empty; then the entry says «Photo not possible»', go: 'f.logbuch' }],
  test: ['Tap «Improve» on a page, tap a block, write one sentence and save.', 'Open Me › Improvement log: the entry shows a small picture of the page with the block in orange.'],
  since: [],
  de: {
    'A photo with every entry': 'Ein Foto zu jedem Eintrag',
    'When you note something with «Improve», the app takes a photo of the whole page, the block in orange.': 'Wenn du etwas mit «Verbessern» festhältst, macht die App ein Foto der ganzen Seite, auch des Teils unten, der Block orange umrandet.',
    'The photo is made with the tap on the block and kept small on your device and in your backup': 'Das Foto entsteht mit dem Tipp auf den Block und bleibt klein auf deinem Gerät und in deinem Backup',
    'In the improvement log a small picture shows with the entry; a tap shows it big; «Save the pictures» puts them in files for the chat': 'Im Verbesserungs-Logbuch steht ein kleines Bild beim Eintrag; ein Tipp zeigt es gross; «Bilder speichern» legt sie als Dateien für den Chat ab',
    'Me › Improvement log › Order for the chat. «Save the pictures» shows once an entry has a photo.': 'Ich › Verbesserungs-Logbuch › Auftrag für den Chat. «Bilder speichern» erscheint, sobald ein Eintrag ein Foto hat.',
    'Maps and some charts can come out empty; then the entry says «Photo not possible»': 'Karten und manche Diagramme können leer sein; steht beim Eintrag «Foto nicht möglich», dann hat es nicht geklappt',
    'Tap «Improve» on a page, tap a block, write one sentence and save.': 'Tippe auf einer Seite auf «Verbessern», tippe einen Block an, schreib einen Satz und speichere.',
    'Open Me › Improvement log: the entry shows a small picture of the page with the block in orange.': 'Öffne Ich › Verbesserungs-Logbuch: der Eintrag zeigt ein kleines Bild der Seite mit dem Block in Orange.',
  },
};
