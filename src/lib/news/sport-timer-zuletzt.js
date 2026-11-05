// «Timer und Zuletzt genutzt» (Noah 03.11.2026 «5a»): every sport page has the block «Timer», «Meine Sportarten» shows the last three sports on top
export default {
  title: 'Timer on every sport, last used on top',
  lead: 'Every sport page has a block «Timer», and «My sports» shows the three sports you used last.',
  points: [{ text: 'A sport page has the block «Timer» that opens the stopwatch of this sport', go: { href: '#/flow/sport/act%3Agym', steps: [{ sel: '[data-sport-timer]' }] } }, { text: '«My sports» shows «Last used» with the last three sports on top', go: { href: '#/flow/sports', where: 'Active › My sports, on top, after you ticked off a sport.' } }],
  small: [{ box: 'new', text: 'The block «Timer» can be switched off under «Adjust blocks» like every other block' }],
  test: ['Open Active › My sports and open a sport (for example Gym): the block «Timer» is there.', 'Tap «Start the timer»: the stopwatch opens with this sport.'],
  since: [],
  de: {
    'Timer on every sport, last used on top': 'Timer auf jeder Sportart, Zuletzt genutzt oben',
    'Every sport page has a block «Timer», and «My sports» shows the three sports you used last.': 'Jede Sportseite hat einen Baustein «Timer», und «Meine Sportarten» zeigt die drei zuletzt genutzten Sportarten.',
    'A sport page has the block «Timer» that opens the stopwatch of this sport': 'Eine Sportseite hat den Baustein «Timer», der die Stoppuhr dieser Sportart öffnet',
    '«My sports» shows «Last used» with the last three sports on top': '«Meine Sportarten» zeigt oben «Zuletzt genutzt» mit den letzten drei Sportarten',
    'Active › My sports, on top, after you ticked off a sport.': 'Aktiv › Meine Sportarten, ganz oben, sobald du eine Sportart abgehakt hast.',
    'The block «Timer» can be switched off under «Adjust blocks» like every other block': 'Den Baustein «Timer» kannst du unter «Bausteine anpassen» ausschalten wie jeden anderen',
    'Open Active › My sports and open a sport (for example Gym): the block «Timer» is there.': 'Öffne Aktiv › Meine Sportarten und eine Sportart (zum Beispiel Gym): Der Baustein «Timer» ist da.',
    'Tap «Start the timer»: the stopwatch opens with this sport.': 'Tippe «Timer starten»: Die Stoppuhr öffnet sich mit dieser Sportart.',
  },
};
