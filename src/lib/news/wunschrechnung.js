// «Wunschstunde wird zur Rechnung» (Noah 08.11.2026 «1a», Anfrageformular Teil 3)
export default {
  title: 'A confirmed wish lesson goes to the invoice',
  lead: 'After you confirmed a wish time and the lesson is over, the invoice is prepared with the price the parents saw.',
  points: [
    { text: 'A confirmed wish request shows its total price and where the invoice will come', go: { href: '#/me', steps: [{ sel: '[data-me-row="tennis"]' }] } },
    { text: 'When the lesson is over, it appears under «Lesson done? Write the invoice» with the amount per child times the children', go: null },
  ],
  small: [],
  test: [
    'Open Me › Tennis › your offer › «Wish requests». Confirm a wish time: the list «Confirmed» names the total price.',
    'After the lesson (the next day at the earliest), the same offer shows the card «Lesson done? Write the invoice». Tap «Prepare invoice»: amount and purpose are filled in, you check and send it yourself.',
  ],
  since: [],
  de: {
    'A confirmed wish lesson goes to the invoice': 'Eine bestätigte Wunschstunde kommt auf die Rechnung',
    'After you confirmed a wish time and the lesson is over, the invoice is prepared with the price the parents saw.': 'Hast du eine Wunschzeit bestätigt und die Stunde ist vorbei, wird die Rechnung mit dem Preis vorbereitet, den die Eltern gesehen haben.',
    'A confirmed wish request shows its total price and where the invoice will come': 'Eine bestätigte Wunschanfrage zeigt den Gesamtpreis und wo die Rechnung kommt',
    'When the lesson is over, it appears under «Lesson done? Write the invoice» with the amount per child times the children': 'Ist die Stunde vorbei, erscheint sie unter «Stunde vorbei? Rechnung schreiben» mit dem Betrag pro Kind mal Kinderzahl',
    'Open Me › Tennis › your offer › «Wish requests». Confirm a wish time: the list «Confirmed» names the total price.': 'Öffne Ich › Tennis › dein Angebot › «Wunschanfragen». Bestätige eine Wunschzeit: die Liste «Bestätigt» nennt den Gesamtpreis.',
    'After the lesson (the next day at the earliest), the same offer shows the card «Lesson done? Write the invoice». Tap «Prepare invoice»: amount and purpose are filled in, you check and send it yourself.': 'Nach der Stunde (frühestens am nächsten Tag) zeigt dasselbe Angebot die Karte «Stunde vorbei? Rechnung schreiben». Tippe auf «Rechnung vorbereiten»: Betrag und Zweck sind ausgefüllt, du prüfst und sendest sie selbst.',
  },
};
