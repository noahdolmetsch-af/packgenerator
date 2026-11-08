// «Flyer für Tennisstunden» (Noah 07.11.2026 «ok Flyer», «modular ja»): Bausteine, Foto tauschen, drei Formate, QR-Code
export default {
  title: 'Flyer for your tennis lessons',
  lead: 'Make a flyer from an offer: pick the parts, swap the photo, share it as a picture or a prepared e-mail.',
  points: [
    { text: 'Open «Tennis › Flyer»: pick the kind, switch parts on or off, move them, write over any text', go: 'f.tennisflyer' },
    { text: 'Swap the photo from your gallery, camera or a file; it stays on this device', go: { href: '#/me/tennis/flyer', steps: [{ text: 'Flyer' }], where: 'Tennis › Flyer, section «Photo».' } },
    { text: 'Three formats (16:9, A4, square), German and English, one flyer per level; the QR code leads to the sign-up page', go: { href: '#/me/tennis/flyer', steps: [{ text: 'Flyer' }], where: 'Tennis › Flyer, section «Language and format».' } },
  ],
  small: [{ box: 'new', text: 'Keep your parts and texts as a template' }, { box: 'new', text: '«Make a flyer» also sits on every lesson offer', go: null }],
  test: [
    'Open Tennis › Flyer: the preview shows your offer with a QR code.',
    'Switch «Info cards» off and back on, and move «Table» one place down: the preview follows.',
    'Choose a photo under «Photo»: it shows in the preview. Tap «Save»: the pictures arrive in your downloads.',
  ],
  since: ['f.tennisflyer'],
  de: {
    'Flyer for your tennis lessons': 'Flyer für deine Tennisstunden',
    'Make a flyer from an offer: pick the parts, swap the photo, share it as a picture or a prepared e-mail.': 'Mach einen Flyer aus einem Angebot: Teile wählen, Foto tauschen, als Bild oder vorbereitete E-Mail teilen.',
    'Open «Tennis › Flyer»: pick the kind, switch parts on or off, move them, write over any text': 'Öffne «Tennis › Flyer»: Art wählen, Teile ein- oder ausschalten, verschieben, jeden Text überschreiben',
    'Swap the photo from your gallery, camera or a file; it stays on this device': 'Tausche das Foto aus Galerie, Kamera oder Datei; es bleibt auf diesem Gerät',
    'Tennis › Flyer, section «Photo».': 'Tennis › Flyer, Abschnitt «Foto».',
    'Three formats (16:9, A4, square), German and English, one flyer per level; the QR code leads to the sign-up page': 'Drei Formate (16:9, A4, Quadrat), Deutsch und Englisch, ein Flyer pro Stufe; der QR-Code führt zur Anmeldeseite',
    'Tennis › Flyer, section «Language and format».': 'Tennis › Flyer, Abschnitt «Sprache und Format».',
    'Keep your parts and texts as a template': 'Behalte deine Teile und Texte als Vorlage',
    '«Make a flyer» also sits on every lesson offer': '«Flyer erstellen» steht auch an jedem Stunden-Angebot',
    'Open Tennis › Flyer: the preview shows your offer with a QR code.': 'Öffne Tennis › Flyer: die Vorschau zeigt dein Angebot mit QR-Code.',
    'Switch «Info cards» off and back on, and move «Table» one place down: the preview follows.': 'Schalte «Infokarten» aus und wieder ein und schiebe «Tabelle» einen Platz nach unten: die Vorschau folgt.',
    'Choose a photo under «Photo»: it shows in the preview. Tap «Save»: the pictures arrive in your downloads.': 'Wähle unter «Foto» ein Bild: es erscheint in der Vorschau. Tippe «Speichern»: die Bilder landen in deinen Downloads.',
  },
};
