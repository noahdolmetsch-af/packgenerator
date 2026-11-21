// «Listen sehen bei jedem Besuch gleich aus» (Gesamttest 19.11.2026): Mini-Tools and Alerts did not load the shared list styles themselves
export default {
  title: 'Lists look right on every visit',
  lead: '«Mini tools» and «Alerts and news» looked unstyled when you opened them directly (reload, pinned link), and «Alerts and news» was wider than a very narrow phone. Now both look the same every time.',
  points: [
    {
      text: 'Me › Mini tools: the tools are rows with an icon, a title and one line, also after a reload',
      go: { href: '#/me/mini', steps: [{ sel: '[data-mt-tool="date"]' }] },
    },
    {
      text: 'Me › Alerts and news: your sources are rows, and the page fits a 320 px phone',
      go: { href: '#/me/hinweise', steps: [{ sel: '[data-alert-region]' }] },
    },
  ],
  small: [],
  test: [
    'Open Me › Mini tools, then reload the page (or open the pinned link): the seven tools stand as rows with an icon and a short line each, no bullets, no underlined text.',
    'Open Me › Alerts and news, then reload: under «Your sources» each feed is a row with its name and its address below. On a narrow phone the page does not move sideways.',
  ],
  since: [],
  de: {
    'Lists look right on every visit': 'Listen sehen bei jedem Besuch gleich aus',
    '«Mini tools» and «Alerts and news» looked unstyled when you opened them directly (reload, pinned link), and «Alerts and news» was wider than a very narrow phone. Now both look the same every time.': '«Mini-Tools» und «Hinweise und News» sahen ungestaltet aus, wenn man sie direkt öffnete (Neuladen, angepinnter Link), und «Hinweise und News» war breiter als ein sehr schmales Handy. Jetzt sehen beide jedes Mal gleich aus.',
    'Me › Mini tools: the tools are rows with an icon, a title and one line, also after a reload': 'Ich › Mini-Tools: Die Werkzeuge sind Zeilen mit Symbol, Titel und einer Zeile, auch nach dem Neuladen',
    'Me › Alerts and news: your sources are rows, and the page fits a 320 px phone': 'Ich › Hinweise und News: Deine Quellen sind Zeilen, und die Seite passt auf ein Handy mit 320 px',
    'Open Me › Mini tools, then reload the page (or open the pinned link): the seven tools stand as rows with an icon and a short line each, no bullets, no underlined text.': 'Öffne Ich › Mini-Tools und lade die Seite neu (oder öffne den angepinnten Link): Die sieben Werkzeuge stehen als Zeilen mit Symbol und kurzer Zeile da, ohne Punkte und ohne unterstrichenen Text.',
    'Open Me › Alerts and news, then reload: under «Your sources» each feed is a row with its name and its address below. On a narrow phone the page does not move sideways.': 'Öffne Ich › Hinweise und News und lade neu: Unter «Deine Quellen» ist jeder Feed eine Zeile mit Name und darunter der Adresse. Auf einem schmalen Handy lässt sich die Seite nicht zur Seite schieben.',
  },
};
