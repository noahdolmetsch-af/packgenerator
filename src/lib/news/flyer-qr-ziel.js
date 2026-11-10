// «Wohin der QR-Code führt» (Noah 10.11.2026): der QR-Code im Flyer kann auf eine eigene Seite zeigen
export default {
  title: 'You choose where the flyer\'s QR code leads',
  lead: 'The QR code on your tennis flyer can lead to your own page instead of the sign-up page, for example to your website.',
  points: [
    { text: 'New field «Where the QR code leads» in the sign-up band: type your address, the QR code and the printed address follow', go: { href: '#/me/tennis/flyer', steps: [{ text: 'Flyer' }], where: 'Tennis › Flyer, part «Sign-up band with QR code».' } },
    { text: 'Left empty, nothing changes: the QR code leads to the sign-up page of your offer', go: null },
  ],
  small: [],
  test: [
    'Open Tennis › Flyer and switch on «Sign-up band with QR code». Type an address in «Where the QR code leads», for example example.ch/f: the text below says that it is your own page.',
    'Type something that is no address: a hint says that the QR code leads to the sign-up page. Empty the field: the QR code leads to the sign-up page again.',
  ],
  since: [],
  de: {
    'You choose where the flyer\'s QR code leads': 'Du bestimmst, wohin der QR-Code des Flyers führt',
    'The QR code on your tennis flyer can lead to your own page instead of the sign-up page, for example to your website.': 'Der QR-Code auf deinem Tennis-Flyer kann auf deine eigene Seite führen statt zur Anmeldeseite, zum Beispiel auf deine Webseite.',
    'New field «Where the QR code leads» in the sign-up band: type your address, the QR code and the printed address follow': 'Neues Feld «Wohin der QR-Code führt» im Anmeldeband: gib deine Adresse ein, der QR-Code und die gedruckte Adresse folgen',
    'Tennis › Flyer, part «Sign-up band with QR code».': 'Tennis › Flyer, Teil «Anmeldeband mit QR-Code».',
    'Left empty, nothing changes: the QR code leads to the sign-up page of your offer': 'Bleibt das Feld leer, ändert sich nichts: der QR-Code führt zur Anmeldeseite deines Angebots',
    'Open Tennis › Flyer and switch on «Sign-up band with QR code». Type an address in «Where the QR code leads», for example example.ch/f: the text below says that it is your own page.': 'Öffne Tennis › Flyer und schalte «Anmeldeband mit QR-Code» ein. Gib bei «Wohin der QR-Code führt» eine Adresse ein, zum Beispiel example.ch/f: der Text darunter sagt, dass es deine eigene Seite ist.',
    'Type something that is no address: a hint says that the QR code leads to the sign-up page. Empty the field: the QR code leads to the sign-up page again.': 'Gib etwas ein, das keine Adresse ist: ein Hinweis sagt, dass der QR-Code zur Anmeldeseite führt. Leere das Feld: der QR-Code führt wieder zur Anmeldeseite.',
  },
};
