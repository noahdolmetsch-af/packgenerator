// «Teilnehmerliste» (Noah 05.11.2026 «5c», 09.11.2026 «ja»): pro Zeit wer kommt, freie Plätze, Warteliste, Anmeldeschluss
export default {
  title: 'Participant list for every time',
  lead: 'In an offer, one card lists every coming time with the people who come, the free places and the waiting list. You can write a registration deadline and copy the list.',
  points: [
    { text: 'The card «Participant list» shows names, free places and the waiting list of every coming time; a tap opens the time', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, card «Participant list».' } },
    { text: 'Write a registration deadline as your note and copy the list (names only) for a message or a note', go: { href: '#/me/tennis', where: 'Tennis › Offers, one offer, card «Participant list», «Register by» and «Copy the list».' } },
  ],
  small: [],
  test: [
    'Open a tennis offer with a booked time: the card «Participant list» shows the name, «1 of 1» and «full».',
    'Put somebody on the waiting list of that time: the list shows the name under «Waiting list».',
    'Tap «Copy the list» and paste it somewhere: names only, no phone numbers.',
  ],
  since: [],
  de: {
    'Participant list for every time': 'Teilnehmerliste für jede Zeit',
    'In an offer, one card lists every coming time with the people who come, the free places and the waiting list. You can write a registration deadline and copy the list.': 'In einem Angebot zeigt eine Karte jede kommende Zeit mit den Personen, die kommen, den freien Plätzen und der Warteliste. Du kannst einen Anmeldeschluss notieren und die Liste kopieren.',
    'The card «Participant list» shows names, free places and the waiting list of every coming time; a tap opens the time': 'Die Karte «Teilnehmerliste» zeigt Namen, freie Plätze und Warteliste jeder kommenden Zeit; ein Tipp öffnet die Zeit',
    'Write a registration deadline as your note and copy the list (names only) for a message or a note': 'Schreibe einen Anmeldeschluss als Notiz und kopiere die Liste (nur Namen) für eine Nachricht oder eine Notiz',
    'Tennis › Offers, one offer, card «Participant list».': 'Tennis › Angebote, ein Angebot, Karte «Teilnehmerliste».',
    'Tennis › Offers, one offer, card «Participant list», «Register by» and «Copy the list».': 'Tennis › Angebote, ein Angebot, Karte «Teilnehmerliste», «Anmeldeschluss» und «Liste kopieren».',
    'Open a tennis offer with a booked time: the card «Participant list» shows the name, «1 of 1» and «full».': 'Öffne ein Tennis-Angebot mit einer gebuchten Zeit: Die Karte «Teilnehmerliste» zeigt den Namen, «1 von 1» und «voll».',
    'Put somebody on the waiting list of that time: the list shows the name under «Waiting list».': 'Setze jemanden auf die Warteliste dieser Zeit: Die Liste zeigt den Namen unter «Warteliste».',
    'Tap «Copy the list» and paste it somewhere: names only, no phone numbers.': 'Tippe auf «Liste kopieren» und füge sie irgendwo ein: nur Namen, keine Telefonnummern.',
  },
};
