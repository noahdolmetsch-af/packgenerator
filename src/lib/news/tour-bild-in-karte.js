// Das Bild in «Meine Tour» (Noah 17.11.2026 «1-5a», Startseite ruhiger, Entwurf A): das gemalte Bild sitzt oben in der Tourkarte
export default {
  title: 'The picture sits in «My tour»',
  lead: 'The drawn landscape no longer stands alone above the greeting: it is the top of the card «My tour».',
  points: [{ text: 'The picture of your next tour is the top of the card «My tour»', go: { href: '#/', steps: [{ sel: '[data-section="meinetour"] [data-heutebild]' }], where: 'Shows on Today while a tour is planned: the card «My tour».' } }],
  small: [{ box: 'new', text: 'The weather line of the picture stays; the words about the days to go stand in the card' }],
  test: [
    'Open Today with a planned tour: the picture is the top of the card «My tour», under the greeting.',
    'Tap the picture: your tour opens. Hide «My tour» under «Customise the start page»: the picture is back at the top of Today.',
  ],
  since: [],
  de: {
    'The picture sits in «My tour»': 'Das Bild steht in «Meine Tour»',
    'The drawn landscape no longer stands alone above the greeting: it is the top of the card «My tour».': 'Die gemalte Landschaft steht nicht mehr allein über dem Gruss: Sie ist der obere Teil der Karte «Meine Tour».',
    'The picture of your next tour is the top of the card «My tour»': 'Das Bild deiner nächsten Tour ist der obere Teil der Karte «Meine Tour»',
    'Shows on Today while a tour is planned: the card «My tour».': 'Erscheint auf Heute, solange eine Tour geplant ist: die Karte «Meine Tour».',
    'The weather line of the picture stays; the words about the days to go stand in the card': 'Die Wetterzeile im Bild bleibt; die Worte zu den Tagen bis zur Tour stehen in der Karte',
    'Open Today with a planned tour: the picture is the top of the card «My tour», under the greeting.': 'Öffne Heute mit einer geplanten Tour: Das Bild ist der obere Teil der Karte «Meine Tour», unter dem Gruss.',
    'Tap the picture: your tour opens. Hide «My tour» under «Customise the start page»: the picture is back at the top of Today.': 'Tippe auf das Bild: Deine Tour öffnet sich. Blende «Meine Tour» unter «Startseite anpassen» aus: Das Bild ist wieder ganz oben auf Heute.',
  },
};
