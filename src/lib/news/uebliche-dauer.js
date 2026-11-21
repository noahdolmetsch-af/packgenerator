// «Übliche Dauer» (Noah 21.11.2026 «2b», Thread «Sportjahr», S1): how long one session of a sport usually takes
export default {
  title: 'Usual duration per sport',
  lead: 'Set how long a session of a sport usually takes. Where no time was measured, the evaluation will estimate with it and say «ca.».',
  points: [
    { text: 'Each sport has a «Usual duration» (without a setting: 60 minutes), in the editor of the sport', go: { href: '#/flow/sports', where: 'Shows in the editor of a sport: Active › My sports, tap a sport, then «Edit».' } },
    { text: 'My sports has a fold «Usual duration» to set all sports in steps of 15 minutes', go: { href: '#/flow/sports', steps: [{ sel: '[data-usual-list] summary' }] } },
  ],
  small: [{ box: 'new', text: 'Nothing is written into your ticks; a measured time always counts first', go: { href: '#/flow/sports', steps: [{ sel: '[data-usual-list] summary' }] } }],
  test: ['On Active › My sports open the fold «Usual duration» and tap «+» next to a sport once.', 'Tap a sport, then «Edit»: «Usual duration» shows the new value; tap «Standard» and save.'],
  since: [],
  de: {
    'Shows in the editor of a sport: Active › My sports, tap a sport, then «Edit».': 'Steht im Bearbeiten-Fenster einer Sportart: Aktiv › Meine Sportarten, Sportart antippen, dann «Bearbeiten».',
    'Usual duration per sport': 'Übliche Dauer je Sportart',
    'Set how long a session of a sport usually takes. Where no time was measured, the evaluation will estimate with it and say «ca.».': 'Stelle ein, wie lange eine Einheit einer Sportart üblicherweise dauert. Wo keine Zeit gemessen wurde, schätzt die Auswertung damit und schreibt «ca.».',
    'Each sport has a «Usual duration» (without a setting: 60 minutes), in the editor of the sport': 'Jede Sportart hat eine «Übliche Dauer» (ohne Einstellung: 60 Minuten), im Bearbeiten-Fenster der Sportart',
    'My sports has a fold «Usual duration» to set all sports in steps of 15 minutes': 'In Meine Sportarten stellt eine Zeile «Übliche Dauer» alle Sportarten in 15-Minuten-Schritten ein',
    'Nothing is written into your ticks; a measured time always counts first': 'In deine Haken wird nichts geschrieben; eine gemessene Zeit zählt immer zuerst',
    'On Active › My sports open the fold «Usual duration» and tap «+» next to a sport once.': 'Öffne auf Aktiv › Meine Sportarten die Zeile «Übliche Dauer» und tippe bei einer Sportart einmal auf «+».',
    'Tap a sport, then «Edit»: «Usual duration» shows the new value; tap «Standard» and save.': 'Tippe eine Sportart an, dann «Bearbeiten»: «Übliche Dauer» zeigt den neuen Wert; tippe «Standard» und speichere.',
  },
};
