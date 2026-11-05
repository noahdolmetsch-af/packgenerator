// «Abo» (Noah 04.11.2026 «5b»): fester Monatspreis pro Kunde, die Monatsrechnung mit einem Tipp vorbereitet
export default {
  title: 'Subscription for a customer',
  lead: 'Give a customer a fixed price per month and prepare the month\'s invoice with one tap.',
  points: [{ text: 'In the customer list set a price per month; «Prepare this month\'s invoice» opens the invoice form with name, price and the month', go: { href: '#/me/offers/customers', steps: [{ text: 'Open a customer and look at the subscription' }], where: 'Me › Offers › Customers › a customer › Subscription.' } }],
  small: [],
  test: [
    'Open a customer, enter 200 as the price per month and save: the list shows «Subscription 200 CHF per month».',
    'Tap «Prepare this month\'s invoice»: the invoice form opens with the name, 200 and «Subscription» with the month.',
  ],
  since: [],
  de: {
    'Subscription for a customer': 'Abo für einen Kunden',
    'Give a customer a fixed price per month and prepare the month\'s invoice with one tap.': 'Gib einem Kunden einen festen Preis pro Monat und bereite die Monatsrechnung mit einem Tipp vor.',
    'In the customer list set a price per month; «Prepare this month\'s invoice» opens the invoice form with name, price and the month': 'Lege in der Kundenliste einen Preis pro Monat fest; «Rechnung für diesen Monat vorbereiten» öffnet das Rechnungsformular mit Name, Preis und Monat',
    'Open a customer and look at the subscription': 'Öffne einen Kunden und schau das Abo an',
    'Me › Offers › Customers › a customer › Subscription.': 'Ich › Angebote › Kunden › ein Kunde › Abo.',
    'Open a customer, enter 200 as the price per month and save: the list shows «Subscription 200 CHF per month».': 'Öffne einen Kunden, gib 200 als Preis pro Monat ein und speichere: die Liste zeigt «Abo 200 CHF pro Monat».',
    'Tap «Prepare this month\'s invoice»: the invoice form opens with the name, 200 and «Subscription» with the month.': 'Tippe «Rechnung für diesen Monat vorbereiten»: das Rechnungsformular öffnet sich mit Name, 200 und «Abo» mit dem Monat.',
  },
};
