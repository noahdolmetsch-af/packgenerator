// «Zahlarten pro Rechnung» (Noah 04.11.2026 «4a»): TWINT, Überweisung (QR-Rechnung) oder bar, pro Rechnung wählbar
export default {
  title: 'Cash as a way to pay',
  lead: 'Next to TWINT and the QR bill an invoice can now also say: pay in cash at the next lesson.',
  points: [{ text: 'In a new invoice tick «Cash» besides TWINT and the bank QR code; the invoice, the preview, the PDF and the mail then say «Pay in cash»', go: { href: '#/me/pay/invoices/new', steps: [{ text: 'Open a new invoice and look at the ways to pay' }], where: 'Me › Invoices › New invoice › Ways to pay.' } }],
  small: [],
  test: [
    'Open a new invoice: under the ways to pay tick «Cash» (you can also untick the others).',
    'Look at the preview: it shows «Pay in cash» with the amount.',
  ],
  since: [],
  de: {
    'Cash as a way to pay': 'Bar als Zahlart',
    'Next to TWINT and the QR bill an invoice can now also say: pay in cash at the next lesson.': 'Neben TWINT und QR-Rechnung kann eine Rechnung jetzt auch sagen: bar bei der nächsten Stunde zahlen.',
    'In a new invoice tick «Cash» besides TWINT and the bank QR code; the invoice, the preview, the PDF and the mail then say «Pay in cash»': 'Hake in einer neuen Rechnung «Bargeld» neben TWINT und Bank-QR an; Rechnung, Vorschau, PDF und Mail sagen dann «Bar zahlen»',
    'Open a new invoice and look at the ways to pay': 'Öffne eine neue Rechnung und schau die Zahlarten an',
    'Me › Invoices › New invoice › Ways to pay.': 'Ich › Rechnungen › Neue Rechnung › Zahlarten.',
    'Open a new invoice: under the ways to pay tick «Cash» (you can also untick the others).': 'Öffne eine neue Rechnung: hake bei den Zahlarten «Bargeld» an (die anderen kannst du abwählen).',
    'Look at the preview: it shows «Pay in cash» with the amount.': 'Schau die Vorschau an: sie zeigt «Bar zahlen» mit dem Betrag.',
  },
};
