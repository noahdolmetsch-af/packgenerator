// «Zusammenlegen: Suche findet auch die Vorschläge» (Durchklick Etappe 2, Frage 3a, Noah 05.11.2026)
export default {
  title: 'Merge: the search also finds the suggestions',
  lead: 'In the merge window the search no longer says «No item found» while a suggestion above has the word.',
  points: [{ text: 'Merge: a suggestion that fits the search shows in the results too, with its «Suggestion» tag', go: { href: '#/gear', steps: [{ sel: '[data-gear-search], input[type=search]' }] } }],
  small: [],
  test: ['Open a part, then «Mehr › Zusammenlegen mit …». Type the name of a suggested part into «Alle Teile durchsuchen»: it shows in the results with the tag «Vorschlag».', 'Tap it in the results: the same part is also ticked in the suggestions above.'],
  since: [],
  de: {
    'Merge: the search also finds the suggestions': 'Zusammenlegen: Die Suche findet auch die Vorschläge',
    'In the merge window the search no longer says «No item found» while a suggestion above has the word.': 'Im Zusammenlegen-Fenster sagt die Suche nicht mehr «Kein Teil gefunden», wenn ein Vorschlag darüber das Wort enthält.',
    'Merge: a suggestion that fits the search shows in the results too, with its «Suggestion» tag': 'Zusammenlegen: Ein Vorschlag, der zur Suche passt, steht auch in den Treffern, mit dem Hinweis «Vorschlag»',
    'Open a part, then «Mehr › Zusammenlegen mit …». Type the name of a suggested part into «Alle Teile durchsuchen»: it shows in the results with the tag «Vorschlag».': 'Öffne ein Teil und dann «Mehr › Zusammenlegen mit …». Tippe den Namen eines vorgeschlagenen Teils in «Alle Teile suchen»: Es steht mit dem Hinweis «Vorschlag» in den Treffern.',
    'Tap it in the results: the same part is also ticked in the suggestions above.': 'Tippe es in den Treffern an: Dasselbe Teil ist auch bei den Vorschlägen darüber angehakt.',
  },
};
