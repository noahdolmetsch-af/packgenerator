// #1158 «Notfall-Karte zum Ausdrucken fürs Portemonnaie» (Noah 28.10.2026 «a) bauen»): the emergency card as a
// small card in credit-card size to print, with its lines and the QR code
export default {
  title: 'Emergency card for the wallet',
  lead: 'Print your emergency card in credit-card size.',
  points: [{ text: 'Emergency QR: «Print a wallet card» prints the lines and the code on a small card', href: '#/mountain/qr' }],
  small: [{ box: 'new', text: 'It helps when the phone is empty or broken' }],
  test: ['Open Mountain and emergency › Emergency QR and save your card.', 'Tap «Print a wallet card»: the print window shows one small card with the code.'],
  since: [],
  de: {
    'Emergency card for the wallet': 'Notfall-Karte fürs Portemonnaie',
    'Print your emergency card in credit-card size.': 'Drucke deine Notfall-Karte in Kreditkartengrösse.',
    'Emergency QR: «Print a wallet card» prints the lines and the code on a small card': 'Notfall-QR: «Portemonnaie-Karte drucken» druckt die Angaben und den Code auf eine kleine Karte',
    'It helps when the phone is empty or broken': 'Sie hilft, wenn das Handy leer oder kaputt ist',
    'Open Mountain and emergency › Emergency QR and save your card.': 'Öffne Berg und Notfall › Notfall-QR und speichere deine Karte.',
    'Tap «Print a wallet card»: the print window shows one small card with the code.': 'Tippe «Portemonnaie-Karte drucken»: Das Druckfenster zeigt eine kleine Karte mit dem Code.',
  },
};
