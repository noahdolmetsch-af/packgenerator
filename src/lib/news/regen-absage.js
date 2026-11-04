// «Regen-Absage» (Noah 04.11.2026 «1a»): beim Absagen einer Stunde schlägt die Nachricht freie Ersatzzeiten vor
export default {
  title: 'Cancel for rain, offer other times',
  lead: 'When you cancel a lesson, the message to the person already lists the next free times.',
  points: [{ text: 'Cancel a time with bookings: the prepared message names up to three free times to choose from', go: { href: '#/me/offers', steps: [{ text: 'New offer' }], where: 'Me › Offers › your offer › a booked time › Cancel the time.' } }],
  small: [],
  test: [
    'Open an offer with at least two free times and one booked time, tap the booked time and «Cancel the time».',
    'After «Yes, cancel» the message shows the next free times; tap «Write» to send it yourself.',
  ],
  since: [],
  de: {
    'Cancel for rain, offer other times': 'Bei Regen absagen, andere Zeiten anbieten',
    'When you cancel a lesson, the message to the person already lists the next free times.': 'Wenn du eine Stunde absagst, nennt die Nachricht an die Person schon die nächsten freien Zeiten.',
    'Cancel a time with bookings: the prepared message names up to three free times to choose from': 'Sage eine gebuchte Zeit ab: die vorbereitete Nachricht nennt bis zu drei freie Zeiten zur Auswahl',
    'Me › Offers › your offer › a booked time › Cancel the time.': 'Ich › Angebote › dein Angebot › eine gebuchte Zeit › Zeit absagen.',
    'Open an offer with at least two free times and one booked time, tap the booked time and «Cancel the time».': 'Öffne ein Angebot mit mindestens zwei freien Zeiten und einer gebuchten Zeit, tippe die gebuchte Zeit und «Zeit absagen».',
    'After «Yes, cancel» the message shows the next free times; tap «Write» to send it yourself.': 'Nach «Ja, absagen» zeigt die Nachricht die nächsten freien Zeiten; tippe «Schreiben», um sie selbst zu senden.',
  },
};
