// Kontakt-QR-Code step 3 (Noah 27.10.2026 «3a»): payment details (TWINT, Swiss QR bill) on the contact card,
// off at the start, kept apart; the person who scans sees them only after a tap
export default {
  title: 'Pay me back',
  lead: 'Your contact card can carry TWINT and a QR bill, apart from the rest.',
  points: [{ text: 'Tick «Add payment details» on your contact card', href: '#/me/freunde?tab=card', go: { href: '#/me/freunde?tab=card', steps: [{ sel: '[data-contact-card]' }] } }],
  small: [{ box: 'new', text: 'Whoever scans sees TWINT and the QR bill only after a tap', go: null }],
  test: [
    'Open Me › With friends › Contact card: under «Payment» tick «Add payment details» (your account from Me › Pay).',
    'Scan the code with a second phone: the page shows a box «Payment»; only «Show payment details» opens TWINT and the QR bill.',
  ],
  since: [],
  de: {
    'Pay me back': 'Zahl mir zurück',
    'Your contact card can carry TWINT and a QR bill, apart from the rest.': 'Deine Kontaktkarte kann TWINT und eine QR-Rechnung mitgeben, getrennt vom Rest.',
    'Tick «Add payment details» on your contact card': 'Auf der Kontaktkarte «Zahlungsangaben mitgeben» ankreuzen',
    'Whoever scans sees TWINT and the QR bill only after a tap': 'Wer scannt, sieht TWINT und die QR-Rechnung erst nach einem Tipp',
    'Open Me › With friends › Contact card: under «Payment» tick «Add payment details» (your account from Me › Pay).':
      'Öffne Ich › Mit Freunden › Kontaktkarte: Unter «Zahlung» «Zahlungsangaben mitgeben» ankreuzen (dein Konto aus Ich › Bezahlen).',
    'Scan the code with a second phone: the page shows a box «Payment»; only «Show payment details» opens TWINT and the QR bill.':
      'Scanne den Code mit einem zweiten Handy: Die Seite zeigt ein Feld «Zahlung»; erst «Zahlungsangaben zeigen» öffnet TWINT und die QR-Rechnung.',
  },
};
