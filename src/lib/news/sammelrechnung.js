// «Sammelrechnung» (Noah 03.11.2026): mehrere Stunden auf eine Rechnung, zum Beispiel am Monatsende
export default {
  title: 'One invoice for several lessons',
  lead: 'Tick several lessons that are over and put them on one invoice, for example at the end of the month.',
  points: [{ text: 'On your offer, tick lessons and tap «One invoice for N lessons»; the prices add up and the dates are listed', go: { href: '#/me/offers', steps: [{ text: 'New offer' }], where: 'Me › Offers › your offer, the card «Lesson done? Write the invoice».' } }],
  small: [],
  test: [
    'Open an offer with two or more confirmed lessons that are over: tick two of them under «Lesson done? Write the invoice».',
    'Tap «One invoice for 2 lessons»: the form shows the sum and both dates. Untick a lesson to leave it out.',
  ],
  since: [],
  de: {
    'One invoice for several lessons': 'Eine Rechnung für mehrere Stunden',
    'Tick several lessons that are over and put them on one invoice, for example at the end of the month.': 'Hake mehrere vergangene Stunden an und setze sie auf eine Rechnung, zum Beispiel am Monatsende.',
    'On your offer, tick lessons and tap «One invoice for N lessons»; the prices add up and the dates are listed': 'Hake bei deinem Angebot Stunden an und tippe «Eine Rechnung für N Stunden»; die Preise werden addiert und die Daten aufgelistet',
    'Me › Offers › your offer, the card «Lesson done? Write the invoice».': 'Ich › Angebote › dein Angebot, die Karte «Stunde vorbei? Rechnung schreiben».',
    'Open an offer with two or more confirmed lessons that are over: tick two of them under «Lesson done? Write the invoice».': 'Öffne ein Angebot mit zwei oder mehr bestätigten, vergangenen Stunden: hake zwei davon unter «Stunde vorbei? Rechnung schreiben» an.',
    'Tap «One invoice for 2 lessons»: the form shows the sum and both dates. Untick a lesson to leave it out.': 'Tippe «Eine Rechnung für 2 Stunden»: das Formular zeigt die Summe und beide Daten. Nimm einen Haken weg, um eine Stunde auszulassen.',
  },
};
