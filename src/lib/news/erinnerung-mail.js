// «Erinnerung an die Kunden» (Noah 04.11.2026 «2a»/«2b», 08.11.2026): ein fertiger Text mit Ort und Absage-Regel, eigener Text, Schalter
export default {
  title: 'Reminder with place and cancel rule',
  lead: 'The reminder for tomorrow\'s lesson now says where and until when people can cancel. The mail has a subject.',
  points: [
    { text: 'The ready reminder names the place and the cancel rule; the e-mail comes with a subject', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, card «Reminder to the customers».' } },
    { text: 'Write your own reminder text with words like {Name} and {Zeit}, or switch the reminder off', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, card «Reminder to the customers».' } },
  ],
  small: [],
  test: [
    'Open a tennis offer: the card «Reminder to the customers» shows the ready text.',
    'Tap «Own text», write a text with {Name} and {Zeit}, save: the sample changes.',
  ],
  since: [],
  de: {
    'Reminder with place and cancel rule': 'Erinnerung mit Ort und Absage-Regel',
    'The reminder for tomorrow\'s lesson now says where and until when people can cancel. The mail has a subject.': 'Die Erinnerung an die Stunde von morgen sagt jetzt, wo sie ist und bis wann man absagen kann. Die Mail hat einen Betreff.',
    'The ready reminder names the place and the cancel rule; the e-mail comes with a subject': 'Die fertige Erinnerung nennt Ort und Absage-Regel; die E-Mail kommt mit Betreff',
    'Write your own reminder text with words like {Name} and {Zeit}, or switch the reminder off': 'Schreibe einen eigenen Erinnerungstext mit Wörtern wie {Name} und {Zeit}, oder schalte die Erinnerung aus',
    'Tennis › Offers, one offer, card «Reminder to the customers».': 'Tennis › Angebote, ein Angebot, Karte «Erinnerung an die Kunden».',
    'Open a tennis offer: the card «Reminder to the customers» shows the ready text.': 'Öffne ein Tennis-Angebot: Die Karte «Erinnerung an die Kunden» zeigt den fertigen Text.',
    'Tap «Own text», write a text with {Name} and {Zeit}, save: the sample changes.': 'Tippe auf «Eigener Text», schreibe einen Text mit {Name} und {Zeit}, speichere: Das Beispiel ändert sich.',
  },
};
