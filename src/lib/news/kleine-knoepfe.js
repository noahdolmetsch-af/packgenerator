// Klick-Rundgang 2 (Noah 27.10.2026 «3 und dann 1», «1a»): small buttons on the phone get a 44 px tap area,
// list ticks and fold titles too; English words left in the German app are German now
export default {
  title: 'Easier to tap',
  lead: 'Small buttons on the phone react to a bigger tap.',
  points: [
    { text: 'Stars, arrows, chips and list ticks can be tapped a little beside them' },
    { text: 'The sample race and bags speak German: «Hüfttasche», «Hotels früh buchen»' },
  ],
  small: [{ box: 'nicer', text: 'They look as before; only the area you can tap is bigger' }],
  test: [
    'On the phone open Material › Einkauf and tap a little beside a star: it switches.',
    'Open Material › Vorrat and tap just under a tick: it ticks.',
  ],
  since: [],
  de: {
    'Easier to tap': 'Leichter zu tippen',
    'Small buttons on the phone react to a bigger tap.': 'Kleine Knöpfe am Handy reagieren auf einen grösseren Bereich.',
    'Stars, arrows, chips and list ticks can be tapped a little beside them': 'Sterne, Pfeile, Chips und Listen-Häkchen lassen sich auch knapp daneben tippen',
    'The sample race and bags speak German: «Hüfttasche», «Hotels früh buchen»': 'Muster-Rennen und Taschen sprechen Deutsch: «Hüfttasche», «Hotels früh buchen»',
    'They look as before; only the area you can tap is bigger': 'Sie sehen gleich aus, nur die Tippfläche ist grösser',
    'On the phone open Material › Einkauf and tap a little beside a star: it switches.': 'Öffne am Handy Material › Einkauf und tippe knapp neben einen Stern: er schaltet um.',
    'Open Material › Vorrat and tap just under a tick: it ticks.': 'Öffne Material › Vorrat und tippe knapp unter ein Häkchen: es wird gesetzt.',
  },
};
