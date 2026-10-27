// Kontakt-QR-Code PR 1 (Noah 27.10.2026 «1a 2b 3a 4a 5a»): the contact card carries e-mail, WhatsApp, Strava, Komoot,
// web and address (the address only when ticked); the page the QR code opens shows a row for each way to reach you
// and «Save to contacts» (a contact file made on that phone)
export default {
  title: 'Scan me',
  lead: 'Your contact card now carries every way to reach you that you tick.',
  points: [{ text: 'Phone, WhatsApp, e-mail, Instagram, Strava, Komoot, web and address on one card', href: '#/me/freunde?tab=card' }],
  small: [{ box: 'new', text: 'Whoever scans it saves you to their contacts with one tap' }],
  test: [
    'Open Me › With friends › Contact card, fill in e-mail and Strava, then tick the address on: the text under the QR code lists what is on the card.',
    'Scan the QR code with a second phone: the page shows a row for each way to reach you and «Save to contacts».',
  ],
  since: [],
  de: {
    'Scan me': 'Scan mich',
    'Your contact card now carries every way to reach you that you tick.': 'Deine Kontaktkarte trägt jetzt jeden Weg zu dir, den du ankreuzt.',
    'Phone, WhatsApp, e-mail, Instagram, Strava, Komoot, web and address on one card': 'Telefon, WhatsApp, E-Mail, Instagram, Strava, Komoot, Webseite und Adresse auf einer Karte',
    'Whoever scans it saves you to their contacts with one tap': 'Wer sie scannt, speichert dich mit einem Tipp in den Kontakten',
    'Open Me › With friends › Contact card, fill in e-mail and Strava, then tick the address on: the text under the QR code lists what is on the card.':
      'Öffne Ich › Mit Freunden › Kontaktkarte, trag E-Mail und Strava ein und kreuze die Adresse an: Unter dem QR-Code steht, was auf der Karte ist.',
    'Scan the QR code with a second phone: the page shows a row for each way to reach you and «Save to contacts».':
      'Scanne den QR-Code mit einem zweiten Handy: Die Seite zeigt eine Zeile für jeden Weg zu dir und «In Kontakte speichern».',
  },
};
