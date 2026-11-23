// «Bereit zur Abfahrt?» on a 320 px phone: the card made the page 1 px too wide since «Griffbereit»
export default {
  title: 'Ready to go? fits narrow phones again',
  lead: 'On a small phone the card «Ready to go?» no longer pushes the page sideways.',
  points: [{ text: 'The title line of the card wraps when the signs do not fit next to the title', go: null }],
  test: ['Open a planned trip in Pack on a narrow phone: the card «Ready to go?» is closed and the page does not move sideways.', 'Open the card: the lines are as wide as the page.'],
  since: [],
  de: {
    'Ready to go? fits narrow phones again': 'Bereit zur Abfahrt? passt wieder auf schmale Handys',
    'On a small phone the card «Ready to go?» no longer pushes the page sideways.': 'Auf einem kleinen Handy schiebt die Karte «Bereit zur Abfahrt?» die Seite nicht mehr zur Seite.',
    'The title line of the card wraps when the signs do not fit next to the title': 'Die Titelzeile der Karte bricht um, wenn die Zeichen nicht neben den Titel passen',
    'Open a planned trip in Pack on a narrow phone: the card «Ready to go?» is closed and the page does not move sideways.': 'Öffne auf einem schmalen Handy in Packen eine geplante Tour: die Karte «Bereit zur Abfahrt?» ist zu und die Seite lässt sich nicht zur Seite schieben.',
    'Open the card: the lines are as wide as the page.': 'Klappe die Karte auf: die Zeilen sind so breit wie die Seite.',
  },
};
