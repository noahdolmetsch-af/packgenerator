// «Späte Absage und No-Show» (Noah 04.11.2026 «3a»): pro Stunde markieren, der Rechnungsentwurf passt den Betrag an
export default {
  title: 'Late cancel and no-show',
  lead: 'Mark a lesson that was cancelled late or missed; the invoice draft then counts half or the full price.',
  points: [{ text: 'After a lesson, choose «Cancelled late» (half price) or «No-show» (full price); the draft names the reason and you can still change the amount', go: { href: '#/me/offers', steps: [{ text: 'Open an offer with a lesson that is over' }], where: 'Me › Offers › your offer › the card «Lesson done? Write the invoice».' } }],
  small: [],
  test: [
    'Open an offer with a lesson that is over: in the card «Lesson done? Write the invoice» choose «No-show» for it.',
    'Tap «Prepare invoice»: the amount is the full price and the text names the reason. With «Cancelled late» it is half.',
  ],
  since: [],
  de: {
    'Late cancel and no-show': 'Späte Absage und No-Show',
    'Mark a lesson that was cancelled late or missed; the invoice draft then counts half or the full price.': 'Markiere eine Stunde, die spät abgesagt oder verpasst wurde; der Rechnungsentwurf zählt dann den halben oder vollen Preis.',
    'After a lesson, choose «Cancelled late» (half price) or «No-show» (full price); the draft names the reason and you can still change the amount': 'Wähle nach einer Stunde «Spät abgesagt» (halber Preis) oder «Nicht erschienen» (voller Preis); der Entwurf nennt den Grund und du kannst den Betrag weiter ändern',
    'Open an offer with a lesson that is over': 'Öffne ein Angebot mit einer vergangenen Stunde',
    'Me › Offers › your offer › the card «Lesson done? Write the invoice».': 'Ich › Angebote › dein Angebot › die Karte «Stunde vorbei? Rechnung schreiben».',
    'Open an offer with a lesson that is over: in the card «Lesson done? Write the invoice» choose «No-show» for it.': 'Öffne ein Angebot mit einer vergangenen Stunde: wähle in der Karte «Stunde vorbei? Rechnung schreiben» dafür «Nicht erschienen».',
    'Tap «Prepare invoice»: the amount is the full price and the text names the reason. With «Cancelled late» it is half.': 'Tippe «Rechnung vorbereiten»: der Betrag ist der volle Preis und der Text nennt den Grund. Bei «Spät abgesagt» ist es die Hälfte.',
  },
};
