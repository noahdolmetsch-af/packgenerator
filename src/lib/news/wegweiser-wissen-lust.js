// «Wegweiser statt Katalog» PR 12 (Noah 01.11.2026 «1-5a»): «Good to know» for every function of Dreams, Compass, Free time and Inspiration
export default {
  title: 'Good to know, right on the page',
  lead: 'Each function of Dreams, Compass, Free time and Inspiration now brings one short piece of knowledge.',
  points: [
    {
      text: '«What you can do here» shows «Good to know» under each function: a tip from experience, not a repeat of the name',
      go: { href: '#/trips/dreams', steps: [{ sel: '[data-seiteninhalt-know]' }] },
    },
  ],
  small: [],
  test: [
    'Open Trips › Dreams: in «What you can do here» each function has a line «Good to know».',
    'Open Me › Free time › What am I up for?: the card shows «Good to know» there too.',
  ],
  since: [],
  de: {
    'Good to know, right on the page': 'Gut zu wissen, direkt auf der Seite',
    'Each function of Dreams, Compass, Free time and Inspiration now brings one short piece of knowledge.': 'Jede Funktion von Träume, Kompass, Freie Zeit und Inspiration bringt jetzt ein kurzes Stück Wissen mit.',
    '«What you can do here» shows «Good to know» under each function: a tip from experience, not a repeat of the name': '«Was du hier tun kannst» zeigt unter jeder Funktion «Gut zu wissen»: ein Tipp aus der Erfahrung, keine Wiederholung des Namens',
    'Open Trips › Dreams: in «What you can do here» each function has a line «Good to know».': 'Öffne Touren › Träume: in «Was du hier tun kannst» hat jede Funktion eine Zeile «Gut zu wissen».',
    'Open Me › Free time › What am I up for?: the card shows «Good to know» there too.': 'Öffne Ich › Freie Zeit › Worauf hab ich Lust?: auch dort zeigt die Karte «Gut zu wissen».',
  },
};
