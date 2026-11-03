// «Rechnung zur Buchung» (Noah 03.11.2026 «3b»): nach der Stunde liegt die Rechnung als Entwurf bereit
export default {
  title: 'Invoice from the booking',
  lead: 'After a lesson, the invoice is ready as a draft: name, amount and lesson are filled in.',
  points: [
    { text: 'Lessons that are over show «Prepare invoice» on your offer', go: { href: '#/me/offers', steps: [{ text: 'New offer' }], where: 'Me › Offers › your offer, the card «Lesson done? Write the invoice».' } },
    { text: 'The invoice form opens filled in; you check it and send it yourself', go: { href: '#/me/pay/invoices/new', steps: [{ text: 'For whom?' }], where: 'Me › Pay › Invoices › New invoice.' } },
  ],
  small: [{ box: 'new', text: 'The lesson shows its invoice number once it is written' }],
  test: [
    'Open Me › Offers and a tennis offer with a confirmed lesson in the past: the card «Lesson done? Write the invoice» is there.',
    'Tap «Prepare invoice»: the form is filled with name, amount and the lesson. Nothing is sent until you tap «Send by e-mail».',
  ],
  since: [],
  de: {
    'Invoice from the booking': 'Rechnung zur Buchung',
    'After a lesson, the invoice is ready as a draft: name, amount and lesson are filled in.': 'Nach der Stunde liegt die Rechnung als Entwurf bereit: Name, Betrag und Stunde sind eingetragen.',
    'Lessons that are over show «Prepare invoice» on your offer': 'Vergangene Stunden zeigen bei deinem Angebot «Rechnung vorbereiten»',
    'Me › Offers › your offer, the card «Lesson done? Write the invoice».': 'Ich › Angebote › dein Angebot, die Karte «Stunde vorbei? Rechnung schreiben».',
    'The invoice form opens filled in; you check it and send it yourself': 'Das Rechnungsformular öffnet sich ausgefüllt; du prüfst es und sendest es selbst',
    'Me › Pay › Invoices › New invoice.': 'Ich › Bezahlen › Rechnungen › Neue Rechnung.',
    'The lesson shows its invoice number once it is written': 'Die Stunde zeigt ihre Rechnungsnummer, sobald die Rechnung geschrieben ist',
    'Open Me › Offers and a tennis offer with a confirmed lesson in the past: the card «Lesson done? Write the invoice» is there.': 'Öffne Ich › Angebote und ein Tennis-Angebot mit einer bestätigten Stunde in der Vergangenheit: die Karte «Stunde vorbei? Rechnung schreiben» ist da.',
    'Tap «Prepare invoice»: the form is filled with name, amount and the lesson. Nothing is sent until you tap «Send by e-mail».': 'Tippe auf «Rechnung vorbereiten»: das Formular ist mit Name, Betrag und Stunde gefüllt. Es wird nichts gesendet, bis du «Per E-Mail senden» tippst.',
  },
};
