// «Was ziehe ich an? selbst anpassen» Schritt 3 «Deine Regel» (Noah 27.10.2026 «4a … kann aber trotzdem übergangen
// werden», dann «2a und b möglich»): the simple choice «Ich friere schnell / normal / Mir wird schnell warm» first,
// the border per layer with − and + behind «Genauer»; the lighter or the warmer piece first; Today and Pack use the
// same rule; every layer can still be added or left out
export default {
  title: 'Your own rule',
  lead: 'You decide how warm you dress.',
  points: [{ text: 'Simple: «I get cold quickly», «normally» or «I get warm quickly»', go: 'f.wear' }],
  small: [
    { box: 'new', text: 'More exact: from when each layer comes, with − and +', go: 'f.wear' },
    { box: 'nicer', text: 'Pack uses the same rule', go: null },
  ],
  test: ['On Today open «What do I wear?», then «Why so?»: under «Your rule» tap «I get cold quickly»; the line on top says «feels» 2 °C colder.', 'Open «More exact» and tap + at Feet twice: on a cool day the overshoes come.'],
  since: [],
  de: {
    'Your own rule': 'Deine eigene Regel',
    'You decide how warm you dress.': 'Du bestimmst, wie warm du dich anziehst.',
    'Simple: «I get cold quickly», «normally» or «I get warm quickly»': 'Einfach: «Ich friere schnell», «normal» oder «Mir wird schnell warm»',
    'More exact: from when each layer comes, with − and +': 'Genauer: ab wann jede Schicht kommt, mit − und +',
    'Pack uses the same rule': 'Packen nutzt dieselbe Regel',
    'On Today open «What do I wear?», then «Why so?»: under «Your rule» tap «I get cold quickly»; the line on top says «feels» 2 °C colder.': 'Öffne auf Heute «Was ziehe ich an?», dann «Warum so?»: Tippe unter «Deine Regel» auf «Ich friere schnell»; die Zeile oben zeigt «gefühlt» 2 °C kälter.',
    'Open «More exact» and tap + at Feet twice: on a cool day the overshoes come.': 'Öffne «Genauer» und tippe bei Füsse zweimal auf +: An einem kühlen Tag kommen die Überschuhe.',
  },
};
