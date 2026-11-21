// «Trainingspause zählt auch Haken» (Noah 21.11.2026, Thread «Fix letztes Training vor 5 Tagen trotz Haken»)
export default {
  title: 'Your ticks count as training',
  lead: 'The morning question after a training pause no longer ignores the sports you ticked off.',
  points: [
    { text: 'A sport you ticked off in Aktiv or in the weekly plan counts as a training day, like Strava and tennis', go: { href: '#/me/abfragen', steps: [{ sel: '[data-rule-val="pause"]' }] } },
  ],
  small: [{ box: 'new', text: 'The reason line «Your last logged training was n days ago» now counts from your last tick too' }],
  test: [
    'Tick off a sport on Aktiv (for example Yoga).',
    'Open Me › Your questions › Questions from your data: the rule «A pause from training» says it counts what you ticked off.',
    'The next morning check no longer asks «What kept you from training lately?» as long as your last tick is fewer days back than the rule says.',
  ],
  since: [],
  de: {
    'Your ticks count as training': 'Deine Haken zählen als Training',
    'The morning question after a training pause no longer ignores the sports you ticked off.': 'Die Morgenfrage nach einer Trainingspause übergeht die Sportarten, die du abgehakt hast, nicht mehr.',
    'A sport you ticked off in Aktiv or in the weekly plan counts as a training day, like Strava and tennis': 'Eine Sportart, die du in Aktiv oder im Wochenplan abgehakt hast, zählt als Trainingstag, wie Strava und Tennis',
    'The reason line «Your last logged training was n days ago» now counts from your last tick too': 'Die Zeile «Dein letztes erfasstes Training war vor n Tagen» zählt jetzt auch ab deinem letzten Haken',
    'Tick off a sport on Aktiv (for example Yoga).': 'Hake auf Aktiv eine Sportart ab (zum Beispiel Yoga).',
    'Open Me › Your questions › Questions from your data: the rule «A pause from training» says it counts what you ticked off.': 'Öffne Ich › Deine Abfragen › Fragen aus deinen Daten: die Regel «Pause vom Training» sagt, dass sie auch Abgehaktes zählt.',
    'The next morning check no longer asks «What kept you from training lately?» as long as your last tick is fewer days back than the rule says.': 'Der nächste Morgen-Check fragt nicht mehr «Was hat dich zuletzt vom Training abgehalten?», solange dein letzter Haken weniger Tage zurückliegt, als die Regel sagt.',
  },
};
