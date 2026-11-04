// «Kundenliste» (Noah 03.11.2026 «1a 2a 3a und b»): eigene Liste der Kunden mit eigenem Preis
export default {
  title: 'Your customers',
  lead: 'A list of the people who book you, with their lessons, open invoices and an own price.',
  points: [{ text: 'Confirm a request and the person lands in your customer list; give them an own price per lesson', go: { href: '#/me/offers/customers', steps: [{ text: 'Customers' }], where: 'Me › Offers › Customers.' } }],
  small: [],
  test: [
    'Open Me › Offers › Customers and add a customer with an own price, for example 50.',
    'Confirm a request from that person, then write the invoice after the lesson: the draft uses the own price.',
  ],
  since: [],
  de: {
    'Your customers': 'Deine Kunden',
    'A list of the people who book you, with their lessons, open invoices and an own price.': 'Eine Liste der Leute, die bei dir buchen, mit ihren Stunden, offenen Rechnungen und einem eigenen Preis.',
    'Confirm a request and the person lands in your customer list; give them an own price per lesson': 'Bestätige eine Anfrage und die Person kommt in deine Kundenliste; gib ihr einen eigenen Preis pro Stunde',
    'Customers': 'Kunden',
    'Me › Offers › Customers.': 'Ich › Angebote › Kunden.',
    'Open Me › Offers › Customers and add a customer with an own price, for example 50.': 'Öffne Ich › Angebote › Kunden und füge einen Kunden mit eigenem Preis hinzu, zum Beispiel 50.',
    'Confirm a request from that person, then write the invoice after the lesson: the draft uses the own price.': 'Bestätige eine Anfrage dieser Person und schreibe nach der Stunde die Rechnung: der Entwurf nimmt den eigenen Preis.',
  },
};
