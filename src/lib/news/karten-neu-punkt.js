// «Karten wieder aufklappen» Teil 2 (Noah 05.11.2026 «c»): a folded card says how many functions are new on its page
export default {
  title: 'New things on a folded card',
  lead: 'When a page gets new functions after you folded its card, the folded line says how many.',
  points: [
    {
      text: 'The folded line shows «n new»',
      go: { href: '#/trips/dreams', where: 'Shows on the folded line of a page that got new functions after you folded its card.' },
    },
  ],
  small: [],
  test: [
    'Fold a card on any page. Nothing is marked, because you have seen all of it.',
    'After an update that adds a function to that page, the folded line shows «n new». Opening or folding the card again clears it.',
  ],
  since: [],
  de: {
    'New things on a folded card': 'Neues auf einer eingeklappten Karte',
    'When a page gets new functions after you folded its card, the folded line says how many.': 'Wenn eine Seite neue Funktionen bekommt, nachdem du ihre Karte eingeklappt hast, sagt die Zeile, wie viele.',
    'The folded line shows «n new»': 'Die eingeklappte Zeile zeigt «n neu»',
    'Shows on the folded line of a page that got new functions after you folded its card.': 'Zeigt sich auf der eingeklappten Zeile einer Seite, die nach dem Einklappen neue Funktionen bekam.',
    'Fold a card on any page. Nothing is marked, because you have seen all of it.': 'Klappe auf einer Seite die Karte ein. Es ist nichts markiert, denn du hast alles gesehen.',
    'After an update that adds a function to that page, the folded line shows «n new». Opening or folding the card again clears it.': 'Nach einem Update, das dieser Seite eine Funktion bringt, zeigt die Zeile «n neu». Aufklappen oder wieder Einklappen löscht es.',
  },
};
