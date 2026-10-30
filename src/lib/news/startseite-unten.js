// «Neuer Schwung» PR 1 (Noah 26.10.2026 «3a»): «Customise the start page» moves to the quiet block at the very
// bottom of Today, on a computer too (was a button at the top right); weather and «What do I wear?» in the date line
export default {
  title: 'A calmer top on Today',
  lead: 'Customising the start page now waits at the very bottom.',
  points: [{ text: '«Customise the start page» is at the very bottom of Today, next to «All areas»', go: { href: '#/', steps: [{ sel: '[data-intro="custom"]' }] } }],
  small: [{ box: 'nicer', text: 'Weather and «What do I wear?» sit in the date line; your name is set under Me › Appearance', go: { href: '#/', steps: [{ sel: '[data-wear-open]' }] } }],
  test: ['Scroll Heute to the very bottom: «Startseite anpassen» stands next to «Alle Bereiche».', 'Tap it: the tiles can be moved and removed as before.'],
  since: [],
  de: {
    'A calmer top on Today': 'Oben auf Heute ist mehr Ruhe',
    'Customising the start page now waits at the very bottom.': '«Startseite anpassen» wartet jetzt ganz unten.',
    '«Customise the start page» is at the very bottom of Today, next to «All areas»': '«Startseite anpassen» steht ganz unten auf Heute, neben «Alle Bereiche»',
    'Weather and «What do I wear?» sit in the date line; your name is set under Me › Appearance': 'Wetter und «Was ziehe ich an?» stehen in der Datumszeile; deinen Namen setzt du unter Ich › Darstellung',
    'Scroll Heute to the very bottom: «Startseite anpassen» stands next to «Alle Bereiche».': 'Scrolle Heute ganz nach unten: «Startseite anpassen» steht neben «Alle Bereiche».',
    'Tap it: the tiles can be moved and removed as before.': 'Tippe darauf: Kacheln verschieben und entfernen geht wie bisher.',
  },
};
