// «Bestätigung an die Kunden» (Noah 05.11.2026 «5c», 09.11.2026 «mit bestätigungsmail»): Besammlung, Abholung und Regen einmal schreiben, die Nachricht ist fertig
export default {
  title: 'Confirmation with meeting point and rain rule',
  lead: 'When you confirm a booking, the message to the customer is ready: lesson, place, meeting point, pick-up and what happens when it rains.',
  points: [
    { text: 'Write the meeting point, the pick-up and the rain rule once; empty lines are left out', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, card «Confirmation to the customers».' } },
    { text: 'After you confirm a request, and later with «Confirmation» in the list of a lesson, your message app opens with the text and a subject for the e-mail', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, a time with a booking, «Confirmation».' } },
  ],
  small: [],
  test: [
    'Open a tennis offer, tap «Add details» on the card «Confirmation to the customers», write a meeting point and save: the sample shows it.',
    'Open a time with a booking and tap «Confirmation»: the mail opens with your text.',
  ],
  since: [],
  de: {
    'Confirmation with meeting point and rain rule': 'Bestätigung mit Besammlung und Regen-Regel',
    'When you confirm a booking, the message to the customer is ready: lesson, place, meeting point, pick-up and what happens when it rains.': 'Wenn du eine Buchung bestätigst, ist die Nachricht an die Kunden fertig: Stunde, Ort, Besammlung, Abholung und was bei Regen gilt.',
    'Write the meeting point, the pick-up and the rain rule once; empty lines are left out': 'Schreibe Besammlung, Abholung und Regen-Regel einmal; leere Zeilen fehlen in der Nachricht',
    'After you confirm a request, and later with «Confirmation» in the list of a lesson, your message app opens with the text and a subject for the e-mail': 'Nach dem Bestätigen einer Anfrage, und später mit «Bestätigung» in der Liste einer Stunde, öffnet sich deine Nachrichten-App mit dem Text und einem Betreff für die E-Mail',
    'Tennis › Offers, one offer, card «Confirmation to the customers».': 'Tennis › Angebote, ein Angebot, Karte «Bestätigung an die Kunden».',
    'Tennis › Offers, one offer, a time with a booking, «Confirmation».': 'Tennis › Angebote, ein Angebot, eine Zeit mit Buchung, «Bestätigung».',
    'Open a tennis offer, tap «Add details» on the card «Confirmation to the customers», write a meeting point and save: the sample shows it.': 'Öffne ein Tennis-Angebot, tippe auf der Karte «Bestätigung an die Kunden» auf «Angaben ergänzen», schreibe eine Besammlung und speichere: Das Beispiel zeigt sie.',
    'Open a time with a booking and tap «Confirmation»: the mail opens with your text.': 'Öffne eine Zeit mit Buchung und tippe auf «Bestätigung»: Die Mail öffnet sich mit deinem Text.',
  },
};
