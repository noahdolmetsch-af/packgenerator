// «Heute ruhiger» part 3 (Noah 26.10.2026 «3a 4a», mockup H3; «ok teil 3» 27.10.2026): Heute in areas with a heading
// (src/lib/home/sections.js), «New», «Tried it yet?» and the tip side by side under «Discover»; switch under «Customise the start page»
export default {
  title: 'Today in areas',
  lead: 'Now, your body, your week, on the road.',
  points: [
    // on Today itself, so no «Try it» address (0.121.0: '#/' would do nothing)
    { text: 'Today: the tiles stand in areas with a heading' },
    { text: '«New», «Tried it yet?» and the tip side by side under «Discover»' },
  ],
  small: [{ box: 'nicer', text: 'Customise the start page: switch the areas off if you like' }],
  test: [
    'Open Today: the headings Now, Your body, Your week, On the road and bikes, Open quickly.',
    'Customise the start page: the switch «Show the tiles in areas» turns the headings off and on.',
  ],
  since: [],
  de: {
    'Today in areas': 'Heute in Bereichen',
    'Now, your body, your week, on the road.': 'Jetzt, dein Körper, deine Woche, unterwegs.',
    'Today: the tiles stand in areas with a heading': 'Heute: die Kacheln stehen in Bereichen mit Überschrift',
    '«New», «Tried it yet?» and the tip side by side under «Discover»': '«Neu», «Schon probiert?» und der Tipp nebeneinander unter «Entdecken»',
    'Customise the start page: switch the areas off if you like': 'Startseite anpassen: die Bereiche lassen sich ausschalten',
    'Open Today: the headings Now, Your body, Your week, On the road and bikes, Open quickly.': 'Öffne Heute: die Überschriften Jetzt, Dein Körper, Deine Woche, Unterwegs und Velos, Schnell öffnen.',
    'Customise the start page: the switch «Show the tiles in areas» turns the headings off and on.': 'Startseite anpassen: der Schalter «Kacheln in Bereichen» schaltet die Überschriften aus und ein.',
  },
};
