// «Deine 15 Fragen» löst sich auf (Noah 04.11.2026 «1a», Thread «Planen: Tagescheck mit Fragen»): ein Fragebogen, dritter Schritt
export default {
  title: '«Your 15 questions» is part of «Your questions» now',
  lead: 'One list of questions instead of two: the tile and the page of the 15 questions are gone, everything is in «Your questions».',
  points: [{ text: 'The tile «Your 15 questions» and its page are gone: sleep, battery, mood, goal and the evening are asked as «Your questions»', go: { href: '#/check/morning', steps: [{ sel: '[data-ab-adjust]' }], where: 'Today › Morning check: «Adjust your questions» under the questions.' } }],
  small: [
    { box: 'nicer', text: 'The old address of the 15 questions leads to «Your questions»' },
    { box: 'fixed', text: 'The morning page no longer asks «What are you looking forward to?» twice: it is one question of «Your questions» (off at the start, you can switch it on)' },
  ],
  test: [
    'Open Today: the tile «Your 15 questions» is no longer there.',
    'Open Today › Morning check: the questions are the ones of the window; under them «Adjust your questions» leads to «Your questions».',
    'Open Me › Your questions: «What are you looking forward to most today?» is in the list; switch it on and it shows on the morning page too.',
  ],
  since: [],
  de: {
    '«Your 15 questions» is part of «Your questions» now': '«Deine 15 Fragen» ist jetzt Teil von «Deine Fragen»',
    'One list of questions instead of two: the tile and the page of the 15 questions are gone, everything is in «Your questions».': 'Eine Liste der Fragen statt zwei: Kachel und Seite der 15 Fragen sind weg, alles steht in «Deine Fragen».',
    'The tile «Your 15 questions» and its page are gone: sleep, battery, mood, goal and the evening are asked as «Your questions»': 'Die Kachel «Deine 15 Fragen» und ihre Seite sind weg: Schlaf, Akku, Stimmung, Ziel und der Abend werden als «Deine Fragen» gefragt',
    'Today › Morning check: «Adjust your questions» under the questions.': 'Heute › Morgen-Check: «Fragen anpassen» unter den Fragen.',
    'The old address of the 15 questions leads to «Your questions»': 'Die alte Adresse der 15 Fragen führt zu «Deine Fragen»',
    'The morning page no longer asks «What are you looking forward to?» twice: it is one question of «Your questions» (off at the start, you can switch it on)': 'Die Morgen-Seite fragt «Worauf freust du dich?» nicht mehr doppelt: es ist eine Frage aus «Deine Fragen» (am Start aus, du kannst sie einschalten)',
    'Open Today: the tile «Your 15 questions» is no longer there.': 'Öffne Heute: die Kachel «Deine 15 Fragen» ist nicht mehr da.',
    'Open Today › Morning check: the questions are the ones of the window; under them «Adjust your questions» leads to «Your questions».': 'Öffne Heute › Morgen-Check: die Fragen sind die aus dem Fenster; darunter führt «Fragen anpassen» zu «Deine Fragen».',
    'Open Me › Your questions: «What are you looking forward to most today?» is in the list; switch it on and it shows on the morning page too.': 'Öffne Ich › Deine Fragen: «Worauf freust du dich heute am meisten?» steht in der Liste; schalte sie ein, dann steht sie auch auf der Morgen-Seite.',
  },
};
