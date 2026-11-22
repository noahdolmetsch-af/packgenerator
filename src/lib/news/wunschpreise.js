// «Preis nach Kinderzahl und Ort» (Noah 08.11.2026 «1a»): Staffelpreise für Wunschanfragen
export default {
  title: 'The price follows the number of children',
  lead: 'In a wish offer the parents see the price at once: per child and in all, for 1 to 4 children, outdoors or in the hall.',
  points: [
    { text: 'A price table in the offer: «Price per child» by number of children, outdoors and hall, with the suggested numbers', go: { href: '#/me', steps: [{ sel: '[data-me-row="tennis"]' }] } },
    { text: 'You mark which of your places is a hall. If a hall is among the ticked places, the hall price counts until you confirm', go: null },
    { text: 'The request shows the price, and the message to the parents names it', go: null },
  ],
  small: [],
  test: [
    'Open Me › Tennis › your offer › «Change» next to «How booking works», choose «Wish time, I answer»: the table «Price per child» appears with the suggested numbers. Tick which place is a hall and save.',
    'Open the booking link: tick one place and change the number of children. The price per child and the total change with it.',
    'Tick a hall place as well: the hall price counts and the page says so.',
    'Send a test request: the card «Wish requests» shows the price, and the message after «Confirm» names it.',
  ],
  since: [],
  de: {
    'The price follows the number of children': 'Der Preis folgt der Zahl der Kinder',
    'In a wish offer the parents see the price at once: per child and in all, for 1 to 4 children, outdoors or in the hall.': 'In einem Wunsch-Angebot sehen die Eltern den Preis sofort: pro Kind und insgesamt, für 1 bis 4 Kinder, draussen oder in der Halle.',
    'A price table in the offer: «Price per child» by number of children, outdoors and hall, with the suggested numbers': 'Eine Preistabelle im Angebot: «Preis pro Kind» nach Zahl der Kinder, draussen und Halle, mit den vorgeschlagenen Zahlen',
    'You mark which of your places is a hall. If a hall is among the ticked places, the hall price counts until you confirm': 'Du markierst, welcher deiner Orte eine Halle ist. Ist eine Halle unter den angekreuzten Orten, gilt der Hallenpreis, bis du bestätigst',
    'The request shows the price, and the message to the parents names it': 'Die Anfrage zeigt den Preis, und die Nachricht an die Eltern nennt ihn',
    'Open Me › Tennis › your offer › «Change» next to «How booking works», choose «Wish time, I answer»: the table «Price per child» appears with the suggested numbers. Tick which place is a hall and save.': 'Öffne Ich › Tennis › dein Angebot › «Ändern» bei «So wird gebucht» und wähle «Wunschzeit, ich antworte»: die Tabelle «Preis pro Kind» erscheint mit den vorgeschlagenen Zahlen. Kreuze an, welcher Ort eine Halle ist, und speichere.',
    'Open the booking link: tick one place and change the number of children. The price per child and the total change with it.': 'Öffne den Buchungslink: kreuze einen Ort an und ändere die Zahl der Kinder. Der Preis pro Kind und das Total ändern sich mit.',
    'Tick a hall place as well: the hall price counts and the page says so.': 'Kreuze auch einen Hallen-Ort an: der Hallenpreis gilt, und die Seite sagt es.',
    'Send a test request: the card «Wish requests» shows the price, and the message after «Confirm» names it.': 'Sende eine Testanfrage: die Karte «Wunschanfragen» zeigt den Preis, und die Nachricht nach «Bestätigen» nennt ihn.',
  },
};
