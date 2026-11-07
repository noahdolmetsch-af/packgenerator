// «Gutscheine» (Noah 04.11.2026 «9a»): Betrag oder Stunden mit Code beim Kunden; die Rechnung zieht ihn ab
export default {
  title: 'Vouchers for customers',
  lead: 'Give a customer a voucher for an amount or for lessons; the invoice draft takes it off.',
  points: [{ text: 'Give a customer a voucher (an amount or a number of lessons, with a short code); when you prepare their invoice, it is taken off in the draft', go: { href: '#/me/offers/customers', steps: [{ text: 'Open a customer' }, { text: 'Under «Vouchers» choose amount or lessons, enter the value and tap «Add voucher»' }], where: 'Me › Offers › Customers › a customer › Vouchers.' } }],
  small: [],
  test: [
    'Open a customer, add a voucher of 25 CHF under «Vouchers» and save: the list shows «Voucher: 25 CHF, 25 left».',
    'Prepare the invoice for a lesson of that customer: the amount is 25 lower and the purpose names the voucher code.',
  ],
  since: [],
  de: {
    'Vouchers for customers': 'Gutscheine für Kunden',
    'Give a customer a voucher for an amount or for lessons; the invoice draft takes it off.': 'Gib einem Kunden einen Gutschein über einen Betrag oder Stunden; der Rechnungsentwurf zieht ihn ab.',
    'Give a customer a voucher (an amount or a number of lessons, with a short code); when you prepare their invoice, it is taken off in the draft': 'Gib einem Kunden einen Gutschein (ein Betrag oder eine Anzahl Stunden, mit kurzem Code); wenn du seine Rechnung vorbereitest, wird er im Entwurf abgezogen',
    'Open a customer': 'Öffne einen Kunden',
    'Under «Vouchers» choose amount or lessons, enter the value and tap «Add voucher»': 'Wähle unter «Gutscheine» Betrag oder Stunden, gib den Wert ein und tippe «Gutschein hinzufügen»',
    'Me › Offers › Customers › a customer › Vouchers.': 'Ich › Angebote › Kunden › ein Kunde › Gutscheine.',
    'Open a customer, add a voucher of 25 CHF under «Vouchers» and save: the list shows «Voucher: 25 CHF, 25 left».': 'Öffne einen Kunden, füge unter «Gutscheine» einen Gutschein über 25 CHF hinzu und speichere: die Liste zeigt «Gutschein: 25 CHF, noch 25».',
    'Prepare the invoice for a lesson of that customer: the amount is 25 lower and the purpose names the voucher code.': 'Bereite die Rechnung für eine Stunde dieses Kunden vor: der Betrag ist 25 tiefer und der Zweck nennt den Gutschein-Code.',
  },
};
