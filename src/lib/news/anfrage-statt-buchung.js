// «Anfrage statt Sofortbuchung» (Noah 03.11.2026 «1b 2b 5a»): Tennis-Stunden werden angefragt, Noah antwortet innert 24 h
export default {
  title: 'Requests instead of instant booking',
  lead: 'People can now ask for a time with a note and a place, and you answer within 24 hours.',
  points: [
    { text: 'Each offer is either «Request, I answer» or «Booked at once»; tennis starts as a request', go: { href: '#/me/offers', steps: [{ text: 'New offer' }], where: 'Me › Offers › your offer › How booking works › Change.' } },
    { text: 'You can offer several places; the person chooses place and time and can add a note', go: { href: '#/me/offers', steps: [{ text: 'New offer' }], where: 'Me › Offers › your offer › How booking works › Change › Places to choose from.' } },
    { text: 'Open requests show on Today and on the time; «Confirm» or «Decline» prepares the message to send', go: { href: '#/me/offers', steps: [{ text: 'New offer' }], where: 'Me › Offers › your offer, tap a time with requests.' } },
  ],
  small: [],
  test: [
    'Open Me › Offers, start «Tennis lesson» and open a time. Under «How booking works» it says «request, you answer within 24 h».',
    'Open the link of the offer: the page asks for place, time, name and an optional note and has a button «Send request».',
    'Back in the app tap the time: your request is there with «Confirm» and «Decline».',
  ],
  since: [],
  de: {
    'Requests instead of instant booking': 'Anfrage statt Sofortbuchung',
    'People can now ask for a time with a note and a place, and you answer within 24 hours.': 'Leute können jetzt eine Zeit mit Bemerkung und Ort anfragen, und du antwortest innert 24 Stunden.',
    'Each offer is either «Request, I answer» or «Booked at once»; tennis starts as a request': 'Jedes Angebot ist entweder «Anfrage, ich antworte» oder «Sofort gebucht»; Tennis startet als Anfrage',
    'Me › Offers › your offer › How booking works › Change.': 'Ich › Angebote › dein Angebot › So wird gebucht › Ändern.',
    'You can offer several places; the person chooses place and time and can add a note': 'Du kannst mehrere Orte anbieten; die Person wählt Ort und Zeit und kann eine Bemerkung schreiben',
    'Me › Offers › your offer › How booking works › Change › Places to choose from.': 'Ich › Angebote › dein Angebot › So wird gebucht › Ändern › Orte zur Auswahl.',
    'Open requests show on Today and on the time; «Confirm» or «Decline» prepares the message to send': 'Offene Anfragen siehst du auf Heute und bei der Zeit; «Bestätigen» oder «Ablehnen» bereitet die Nachricht vor',
    'Me › Offers › your offer, tap a time with requests.': 'Ich › Angebote › dein Angebot, tippe auf eine Zeit mit Anfragen.',
    'Open Me › Offers, start «Tennis lesson» and open a time. Under «How booking works» it says «request, you answer within 24 h».': 'Öffne Ich › Angebote, starte «Tennis-Lektion» und gib eine Zeit frei. Unter «So wird gebucht» steht «Anfrage, du antwortest innert 24 h».',
    'Open the link of the offer: the page asks for place, time, name and an optional note and has a button «Send request».': 'Öffne den Link des Angebots: die Seite fragt nach Ort, Zeit, Name und einer freiwilligen Bemerkung und hat den Knopf «Anfrage senden».',
    'Back in the app tap the time: your request is there with «Confirm» and «Decline».': 'Tippe in der App auf die Zeit: die Anfrage ist da mit «Bestätigen» und «Ablehnen».',
  },
};
