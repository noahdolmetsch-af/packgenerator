// «Abend-Seite wie das Fenster» (Noah 04.11.2026 «2a», Thread «Planen: Tagescheck mit Fragen»): ein Fragebogen, zweite Hälfte
export default {
  title: 'The evening page asks what the window asks',
  lead: 'The page of the evening review shows the same questions as the window, and an answer counts in both.',
  points: [{ text: 'Evening review: satisfaction, the coolest thing, goal reached, outside, a mindful moment are the questions of «Your questions»', go: { href: '#/check/evening', steps: [{ sel: '[data-round-questions]' }], where: 'Today › Evening review: the questions at the top.' } }],
  small: [
    { box: 'nicer', text: 'A ride and a meditation of today fill in «outside» and «mindful moment» by themselves' },
    { box: 'fixed', text: 'The Sunday question is the same one as in the window; «Your 15 questions» keeps only «What are you looking forward to?»' },
  ],
  test: [
    'Open Today › Evening review: the questions are the ones of the window, with five steps for the happiness.',
    'Tap an answer, leave the page, come back: it is still marked.',
    'Open Me › Your questions: switch an evening question off: it is gone from the page too.',
  ],
  since: [],
  de: {
    'The evening page asks what the window asks': 'Die Abend-Seite fragt, was das Fenster fragt',
    'The page of the evening review shows the same questions as the window, and an answer counts in both.': 'Die Seite vom Abend-Rückblick zeigt dieselben Fragen wie das Fenster, und eine Antwort zählt in beiden.',
    'Evening review: satisfaction, the coolest thing, goal reached, outside, a mindful moment are the questions of «Your questions»': 'Abend-Rückblick: Zufriedenheit, Coolstes, Ziel erreicht, draussen, achtsamer Moment sind die Fragen aus «Deine Fragen»',
    'Today › Evening review: the questions at the top.': 'Heute › Abend-Rückblick: die Fragen oben.',
    'A ride and a meditation of today fill in «outside» and «mindful moment» by themselves': 'Eine Fahrt und eine Meditation von heute tragen «draussen» und «achtsamer Moment» selbst ein',
    'The Sunday question is the same one as in the window; «Your 15 questions» keeps only «What are you looking forward to?»': 'Die Sonntagsfrage ist dieselbe wie im Fenster; «Deine 15 Fragen» behält nur «Worauf freust du dich?»',
    'Open Today › Evening review: the questions are the ones of the window, with five steps for the happiness.': 'Öffne Heute › Abend-Rückblick: die Fragen sind die aus dem Fenster, die Zufriedenheit in fünf Stufen.',
    'Tap an answer, leave the page, come back: it is still marked.': 'Tippe eine Antwort, verlasse die Seite, komm zurück: sie ist noch markiert.',
    'Open Me › Your questions: switch an evening question off: it is gone from the page too.': 'Öffne Ich › Deine Fragen: Schalte eine Abendfrage aus: sie ist auch von der Seite weg.',
  },
};
