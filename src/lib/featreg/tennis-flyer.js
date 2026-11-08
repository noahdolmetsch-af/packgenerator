// «Flyer für Tennisstunden» (Noah 05.11.2026 «1a 2a+b 3a 4a», 07.11.2026 «ok Flyer», «modular ja»)
export default {
  features: [
    { id: 'f.tennisflyer', group: 'active', title: 'Tennis flyer', text: 'Make a flyer for your lessons from an offer: choose the parts, add your own photo, get a picture in 16:9, A4 or square with a QR code to the sign-up page, in German and English.', href: '#/me/tennis/flyer', words: 'flyer tennis stunden plakat aushang anmeldung qr code foto bild whatsapp a4 quadrat schnupperstunde ferienkurs einzelstunden stufen vorlage poster sign-up', moment: 'koerper' },
  ],
  howto: { 'f.tennisflyer': ['Open Tennis › Flyer, or «Make a flyer» on an offer.', 'Pick the kind and the parts, change texts, swap the photo.', 'Tap «Save», «Share» or «Prepare e-mail».'] },
  handbook: {
    'f.tennisflyer': {
      on: 'Needs an offer for lessons (Tennis › Offers).',
      steps: ['Open Tennis › Flyer, or «Make a flyer» on an offer.', 'Pick the kind and the parts, change texts, swap the photo.', 'Tap «Save», «Share» or «Prepare e-mail».'],
      example: 'Example: group lessons with two levels, German and English, 16:9 for the screen and a square for WhatsApp.',
    },
  },
  home: { 'f.tennisflyer': '#/me/tennis/flyer' },
};
