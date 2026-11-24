// «Wi gaht's?: Heute offen und Auswertung zuerst» (Noah 24.11.2026 «1-5a» und «ja», Thread «Wi gaht's? um Träume und Visionen erweitern»)
export default {
  title: 'Your questions: what is open today comes first',
  lead: 'The page «Your questions» starts with what is still open today and what your answers show; the settings come below.',
  points: [
    { text: 'On top: «Still open today» with «Start» (or «Answered today» with your values); then what your answers show', go: { href: '#/me/abfragen', steps: [{ sel: '[data-ab-today]' }] } },
    { text: 'Below that, under «Your questions»: edit questions, create your own and the areas', go: { href: '#/me/abfragen', steps: [{ sel: '[data-ab-questions]' }] } },
    { text: '«The app asks you» is a closed line now; one tap opens all rules', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen] > summary' }] } },
  ],
  small: [{ box: 'fixed', text: 'Nothing is gone: the rules, rounds and buttons only moved further down' }],
  test: [
    'Open Me › Your questions: «Still open today» and the analysis stand on top.',
    'Scroll down: «Your questions» with the two buttons, then the areas, then the closed line «The app asks you».',
    'Tap «The app asks you»: the rules open as before.',
  ],
  since: [],
  de: {
    'Your questions: what is open today comes first': 'Deine Fragen: zuerst, was heute offen ist',
    'The page «Your questions» starts with what is still open today and what your answers show; the settings come below.': 'Die Seite «Deine Fragen» beginnt mit dem, was heute noch offen ist, und mit dem, was deine Antworten zeigen; die Einstellungen stehen darunter.',
    'On top: «Still open today» with «Start» (or «Answered today» with your values); then what your answers show': 'Ganz oben: «Heute noch offen» mit «Starten» (oder «Heute beantwortet» mit deinen Werten); danach, was deine Antworten zeigen',
    'Below that, under «Your questions»: edit questions, create your own and the areas': 'Darunter, unter «Deine Fragen»: Fragen bearbeiten, eigene anlegen und die Bereiche',
    '«The app asks you» is a closed line now; one tap opens all rules': '«Die App fragt dich» ist jetzt eine geschlossene Zeile; ein Tipp öffnet alle Regeln',
    'Nothing is gone: the rules, rounds and buttons only moved further down': 'Nichts fällt weg: Regeln, Runden und Knöpfe stehen nur weiter unten',
    'Open Me › Your questions: «Still open today» and the analysis stand on top.': 'Öffne Ich › Deine Fragen: «Heute noch offen» und die Auswertung stehen ganz oben.',
    'Scroll down: «Your questions» with the two buttons, then the areas, then the closed line «The app asks you».': 'Scrolle nach unten: «Deine Fragen» mit den zwei Knöpfen, dann die Bereiche, dann die geschlossene Zeile «Die App fragt dich».',
    'Tap «The app asks you»: the rules open as before.': 'Tippe auf «Die App fragt dich»: die Regeln öffnen sich wie vorher.',
  },
};
