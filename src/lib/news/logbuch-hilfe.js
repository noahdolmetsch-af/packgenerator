// «Verbesserungs-Logbuch» (Noah 22.11.2026 «so lassen, immer zugeklappt»): the line «What you can do here» on the log page
export default {
  title: 'Help on the improvement log',
  lead: 'The improvement log has the closed line «What you can do here» like the other pages.',
  points: [{ text: 'On the improvement log page a closed line «What you can do here» opens the help with a tip', go: { href: '#/me/logbuch', steps: [{ sel: '[data-seiteninhalt-line]' }] } }],
  test: ['Open Me › Improvement log: under the title stands the closed line «What you can do here».', 'Tap it: the help opens with the improvement log and a tip.'],
  since: [],
  de: {
    'Help on the improvement log': 'Hilfe im Verbesserungs-Logbuch',
    'The improvement log has the closed line «What you can do here» like the other pages.': 'Das Verbesserungs-Logbuch hat wie die anderen Seiten die zugeklappte Zeile «Was du hier tun kannst».',
    'On the improvement log page a closed line «What you can do here» opens the help with a tip': 'Auf der Seite Verbesserungs-Logbuch öffnet eine zugeklappte Zeile «Was du hier tun kannst» die Hilfe mit einem Tipp',
    'Open Me › Improvement log: under the title stands the closed line «What you can do here».': 'Öffne Ich › Verbesserungs-Logbuch: unter dem Titel steht die zugeklappte Zeile «Was du hier tun kannst».',
    'Tap it: the help opens with the improvement log and a tip.': 'Tippe darauf: die Hilfe öffnet sich mit dem Verbesserungs-Logbuch und einem Tipp.',
  },
};
