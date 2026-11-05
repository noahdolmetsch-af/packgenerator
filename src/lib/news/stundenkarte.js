// «Stundenkarte» (Noah 04.11.2026 «5a»): 10er-Karte pro Kunde, die Stunden darauf brauchen keine eigene Rechnung
export default {
  title: 'Lesson card for a customer',
  lead: 'Give a customer a card of 10 lessons for one price; its lessons need no invoice of their own.',
  points: [{ text: 'In the customer list add a lesson card (number, price, start day); the card is sold with its own invoice and shows how many lessons are used', go: { href: '#/me/offers/customers', steps: [{ text: 'Open a customer and look at the lesson card' }], where: 'Me › Offers › Customers › a customer › Lesson card.' } }],
  small: [],
  test: [
    'Open a customer, enter 10 lessons and a price for the card and save: the list shows «Card: 0 of 10 used».',
    'Tap «Prepare invoice for the card»: the invoice form opens with the name, the price and «10-lesson card».',
  ],
  since: [],
  de: {
    'Lesson card for a customer': 'Stundenkarte für einen Kunden',
    'Give a customer a card of 10 lessons for one price; its lessons need no invoice of their own.': 'Gib einem Kunden eine Karte mit 10 Stunden zu einem Preis; ihre Stunden brauchen keine eigene Rechnung.',
    'In the customer list add a lesson card (number, price, start day); the card is sold with its own invoice and shows how many lessons are used': 'Lege in der Kundenliste eine Stundenkarte an (Anzahl, Preis, Starttag); die Karte wird mit einer eigenen Rechnung verkauft und zeigt, wie viele Stunden benutzt sind',
    'Open a customer and look at the lesson card': 'Öffne einen Kunden und schau die Stundenkarte an',
    'Me › Offers › Customers › a customer › Lesson card.': 'Ich › Angebote › Kunden › ein Kunde › Stundenkarte.',
    'Open a customer, enter 10 lessons and a price for the card and save: the list shows «Card: 0 of 10 used».': 'Öffne einen Kunden, gib 10 Stunden und einen Preis für die Karte ein und speichere: die Liste zeigt «Karte: 0 von 10 benutzt».',
    'Tap «Prepare invoice for the card»: the invoice form opens with the name, the price and «10-lesson card».': 'Tippe «Rechnung für die Karte vorbereiten»: das Rechnungsformular öffnet sich mit Name, Preis und «10er-Karte».',
  },
};
