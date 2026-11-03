// «Heute-Check» step 3 (Noah 30.10.2026 «1-5a», thread «Tagescheck optimieren»): «All answers» is a tab of the daily check
export default {
  title: 'All answers in the daily check',
  lead: 'Your history of answers is one tap away from the questionnaire.',
  points: [
    { text: 'On the questionnaire page «All answers» opens your history, and «Today» leads back', go: { href: '#/check/morning', steps: [{ text: 'All answers' }] } },
  ],
  small: [{ box: 'new', text: 'The same history as under Me › Data, now inside the daily check' }],
  test: [
    'Open Today, tap the tile «Today\'s check» and then «Open questionnaire».',
    'Tap «All answers»: your history shows. Tap «Today» to go back.',
  ],
  since: [],
  de: {
    'All answers in the daily check': 'Alle Antworten im Tagescheck',
    'Your history of answers is one tap away from the questionnaire.': 'Dein Verlauf der Antworten ist einen Tipp vom Fragebogen entfernt.',
    'On the questionnaire page «All answers» opens your history, and «Today» leads back': 'Auf der Fragebogen-Seite öffnet «Alle Antworten» deinen Verlauf, und «Heute» führt zurück',
    'The same history as under Me › Data, now inside the daily check': 'Derselbe Verlauf wie unter Ich › Daten, jetzt im Tagescheck',
    "Open Today, tap the tile «Today's check» and then «Open questionnaire».": 'Öffne Heute, tippe auf die Kachel «Heute-Check» und dann auf «Fragebogen öffnen».',
    'Tap «All answers»: your history shows. Tap «Today» to go back.': 'Tippe auf «Alle Antworten»: dein Verlauf erscheint. Tippe auf «Heute», um zurückzugehen.',
  },
};
