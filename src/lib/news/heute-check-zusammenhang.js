// «Heute-Check» step 2 (Noah 30.10.2026 «1-5a», thread «Tagescheck optimieren»): «What goes together» is a tab of the daily check
export default {
  title: 'Insights in the daily check',
  lead: 'What goes together in your answers is one tap away from the questionnaire.',
  points: [
    { text: 'On the questionnaire page «What goes together» opens your insights, and «Today» leads back', go: { href: '#/check/morning', steps: [{ sel: '[data-tab-insights]' }] } },
  ],
  small: [{ box: 'new', text: 'The same insights as under Me › Insights, now inside the daily check' }],
  test: [
    'Open Today, tap the tile «Today\'s check» and then «Open questionnaire».',
    'Tap «What goes together»: your insights show. Tap «Today» to go back.',
  ],
  since: [],
  de: {
    'Insights in the daily check': 'Erkenntnisse im Tagescheck',
    'What goes together in your answers is one tap away from the questionnaire.': 'Was in deinen Antworten zusammenpasst, ist einen Tipp vom Fragebogen entfernt.',
    'On the questionnaire page «What goes together» opens your insights, and «Today» leads back': 'Auf der Fragebogen-Seite öffnet «Was zusammenpasst» deine Erkenntnisse, und «Heute» führt zurück',
    'The same insights as under Me › Insights, now inside the daily check': 'Dieselben Erkenntnisse wie unter Ich › Erkenntnisse, jetzt im Tagescheck',
    "Open Today, tap the tile «Today's check» and then «Open questionnaire».": 'Öffne Heute, tippe auf die Kachel «Heute-Check» und dann auf «Fragebogen öffnen».',
    'Tap «What goes together»: your insights show. Tap «Today» to go back.': 'Tippe auf «Was zusammenpasst»: deine Erkenntnisse erscheinen. Tippe auf «Heute», um zurückzugehen.',
  },
};
