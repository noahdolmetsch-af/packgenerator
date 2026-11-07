// «Gruppenstunden» (Noah 04.11.2026 «6a»): Plätze und Preis pro Person gab es schon pro Art; neu: Preis sichtbar, eine E-Mail an alle
export default {
  title: 'Group lessons: price per person and one e-mail to all',
  lead: 'In a group lesson you now see the price per person, and you can write one e-mail to everyone who booked.',
  points: [{ text: 'Open a group lesson: the sheet shows «n of m booked · 25 CHF per person» and, from two people on, «One e-mail to all participants» (the addresses go in bcc)', go: { href: '#/me/offers', steps: [{ text: 'Open an offer and tap a group time' }], where: 'Me › Offers › your offer › a group time.' } }],
  small: [],
  test: [
    'Open a group time that has been booked: the line under the title shows the price per person.',
    'With two people who gave e-mail addresses, tap «One e-mail to all participants»: your mail app opens with everyone in bcc.',
  ],
  since: [],
  de: {
    'Group lessons: price per person and one e-mail to all': 'Gruppenstunden: Preis pro Person und eine E-Mail an alle',
    'In a group lesson you now see the price per person, and you can write one e-mail to everyone who booked.': 'In einer Gruppenstunde siehst du jetzt den Preis pro Person und kannst allen, die gebucht haben, eine E-Mail schreiben.',
    'Open a group lesson: the sheet shows «n of m booked · 25 CHF per person» and, from two people on, «One e-mail to all participants» (the addresses go in bcc)': 'Öffne eine Gruppenstunde: das Blatt zeigt «n von m gebucht · 25 CHF pro Person» und ab zwei Personen «Eine E-Mail an alle Teilnehmenden» (die Adressen kommen in Bcc)',
    'Open an offer and tap a group time': 'Öffne ein Angebot und tippe eine Gruppenzeit an',
    'Me › Offers › your offer › a group time.': 'Ich › Angebote › dein Angebot › eine Gruppenzeit.',
    'Open a group time that has been booked: the line under the title shows the price per person.': 'Öffne eine gebuchte Gruppenzeit: die Zeile unter dem Titel zeigt den Preis pro Person.',
    'With two people who gave e-mail addresses, tap «One e-mail to all participants»: your mail app opens with everyone in bcc.': 'Tippe bei zwei Personen mit E-Mail-Adresse auf «Eine E-Mail an alle Teilnehmenden»: deine Mail-App öffnet sich mit allen in Bcc.',
  },
};
