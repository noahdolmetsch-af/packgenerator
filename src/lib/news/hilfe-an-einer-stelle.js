// «Hilfe an einer Stelle» (Noah 09.11.2026 «ja, 1-3», Durchklick-Fund 1): the «?» holds the help of every page, the card on the page is one line
export default {
  title: 'Help in one place',
  lead: 'The «?» at the top now holds the help of every page, also what the card «What you can do here» showed. On the page only one line stays.',
  points: [
    {
      text: 'The line «What you can do here» opens the «?» with the functions of the page, «Good to know» and «How it works»',
      go: { href: '#/notes', steps: [{ sel: '[data-seiteninhalt-line]' }] },
    },
    {
      text: 'Today has a help text in the «?» too',
      go: { href: '#/', steps: [{ sel: '[data-help-open]' }] },
    },
  ],
  small: [{ box: 'new', text: 'Appearance › Page cards is gone: there is no card to fold any more' }],
  test: [
    'Open Plan › Notes: behind the title «Notes» stands one line «What you can do here · Open the help». A tap on it opens the «?» window with the functions of the page.',
    'Open Today and tap the «?» at the top: a short text and the functions that live on Today. On other pages (Week, Diary, Bikes › Care) the «?» is no longer empty.',
  ],
  since: [],
  de: {
    'Help in one place': 'Hilfe an einer Stelle',
    'The «?» at the top now holds the help of every page, also what the card «What you can do here» showed. On the page only one line stays.': 'Das «?» oben enthält jetzt die Hilfe jeder Seite, auch das, was die Karte «Was du hier tun kannst» zeigte. Auf der Seite bleibt nur eine Zeile.',
    'The line «What you can do here» opens the «?» with the functions of the page, «Good to know» and «How it works»': 'Die Zeile «Was du hier tun kannst» öffnet das «?» mit den Funktionen der Seite, «Gut zu wissen» und «So geht\'s»',
    'Today has a help text in the «?» too': 'Auch Heute hat im «?» einen Hilfetext',
    'Appearance › Page cards is gone: there is no card to fold any more': 'Aussehen › Karten auf den Seiten entfällt: es gibt keine Karte mehr zum Einklappen',
    'Open Plan › Notes: behind the title «Notes» stands one line «What you can do here · Open the help». A tap on it opens the «?» window with the functions of the page.': 'Öffne Planen › Notizen: hinter dem Titel «Notizen» steht eine Zeile «Was du hier tun kannst · Hilfe öffnen». Ein Tipp darauf öffnet das «?»-Fenster mit den Funktionen der Seite.',
    'Open Today and tap the «?» at the top: a short text and the functions that live on Today. On other pages (Week, Diary, Bikes › Care) the «?» is no longer empty.': 'Öffne Heute und tippe oben auf das «?»: ein kurzer Text und die Funktionen, die auf Heute wohnen. Auf anderen Seiten (Woche, Tagebuch, Velos › Pflege) ist das «?» nicht mehr leer.',
  },
};
