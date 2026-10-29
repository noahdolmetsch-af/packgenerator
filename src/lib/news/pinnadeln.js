// «Quick Links» Schritt 2 (Noah 28.10.2026 «1a 2a», Idee 19): the pin on the cards and the short tour
export default {
  title: 'Pins on the cards',
  lead: 'Pin a card where you see it.',
  points: [{ text: 'A small pin at the top right of a card puts it into your Quick Links', href: '#/trips', go: 'f.pinmarks' }],
  small: [
    { box: 'new', text: 'A second tap takes it out again; switch the pins off in Quick Links', go: 'f.pinmarks' },
    { box: 'new', text: 'Short tour: Quick Links › «Tour of Quick Links»', go: 'f.pinmarks' },
  ],
  test: [
    'Open Trips and tap the small pin next to «Upload a ride» or another card.',
    'Open Quick Links: the card is in your first group.',
    'In Quick Links switch off «Pins on the cards»: the pins are gone from the pages.',
  ],
  since: ['f.pinmarks'],
  de: {
    'Pin a card where you see it.': 'Pinne eine Karte dort an, wo du sie siehst.',
    'A small pin at the top right of a card puts it into your Quick Links': 'Eine kleine Pinnadel oben rechts auf einer Karte legt sie in deine Quick Links',
    'A second tap takes it out again; switch the pins off in Quick Links': 'Ein zweiter Tipp nimmt sie wieder heraus; ausschalten in Quick Links',
    'Short tour: Quick Links › «Tour of Quick Links»': 'Kurzer Rundgang: Quick Links › «Rundgang Quick Links»',
    'Open Trips and tap the small pin next to «Upload a ride» or another card.': 'Öffne Touren und tippe auf die kleine Pinnadel bei «Fahrt hochladen» oder einer anderen Karte.',
    'Open Quick Links: the card is in your first group.': 'Öffne Quick Links: die Karte steht in deiner ersten Gruppe.',
    'In Quick Links switch off «Pins on the cards»: the pins are gone from the pages.': 'Schalte in Quick Links «Pinnadeln auf den Karten» aus: die Pinnadeln sind von den Seiten weg.',
  },
};
