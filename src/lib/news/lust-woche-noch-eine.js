// «Worauf hab ich Lust: Woche und Noch eine» (Noah 05.11.2026 «Touren 2a und b», Thread «Bauen: Freie Zeit Teil 1»)
export default {
  title: 'What am I up for: your week and «Another one»',
  lead: 'The ideas now take the weather and your free time into account, and a button rolls one more idea.',
  points: [
    { text: 'Weather and free time from your week shape the ideas', go: { href: '#/me/frei/lust', steps: [{ sel: '[data-week]' }] } },
    { text: '«Another one» rolls one more idea', go: { href: '#/me/frei/lust', steps: [{ sel: '[data-more]' }] } },
  ],
  small: [{ box: 'new', text: 'Your own ideas can say «Outdoors» or «Inside»; the week switch is in the same box' }],
  test: ['Open «What am I up for?»: the box «Your week» shows the weather and the free time.', 'Tap «Another one»: one more idea appears.', 'Switch the week off with its tick box: the ideas ignore weather and time.'],
  since: [],
  de: {
    'What am I up for: your week and «Another one»': 'Worauf hab ich Lust: Woche und «Noch eine»',
    'The ideas now take the weather and your free time into account, and a button rolls one more idea.': 'Die Ideen berücksichtigen jetzt das Wetter und deine freie Zeit, und ein Knopf würfelt eine weitere Idee.',
    'Weather and free time from your week shape the ideas': 'Wetter und freie Zeit aus deiner Woche prägen die Ideen',
    '«Another one» rolls one more idea': '«Noch eine» würfelt eine weitere Idee',
    'Your own ideas can say «Outdoors» or «Inside»; the week switch is in the same box': 'Eigene Ideen können «Draussen» oder «Drinnen» sagen; der Wochen-Schalter steht im selben Kasten',
    'Open «What am I up for?»: the box «Your week» shows the weather and the free time.': 'Öffne «Worauf hab ich Lust?»: Der Kasten «Deine Woche» zeigt Wetter und freie Zeit.',
    'Tap «Another one»: one more idea appears.': 'Tippe auf «Noch eine»: Eine weitere Idee erscheint.',
    'Switch the week off with its tick box: the ideas ignore weather and time.': 'Schalte die Woche mit dem Häkchen aus: Die Ideen ignorieren Wetter und Zeit.',
  },
};
