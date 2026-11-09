// «Ein Wort pro Sache: der Rest» (Noah «namen ok» 08.11.2026 und «können wir das ganze nicht alles als 1 PR machen?»): Namensliste Zeilen 2, 4, 6, 8, 10, 11, 19
export default {
  title: 'One word per thing',
  lead: 'Things that had two names now have one: «Erkenntnisse», «Leihliste», «Strom», «Rennen-Check», «Rundgang», «Update».',
  points: [
    { text: 'Your own findings are called «Erkenntnisse» everywhere, no more «Gelernt» or «Learnings»; the monthly letter is «Was die App gelernt hat»', go: { href: '#/debrief/learnings', where: 'Shows under Rückblick › Erkenntnisse and in Auswerten.' } },
    { text: 'Gear › «Leihliste» instead of «Ausgeliehen», and «Strom» instead of «Strombudget»', go: { href: '#/gear', where: 'Shows on Gear, in the tabs.' } },
  ],
  small: [{ box: 'new', text: '«Rennen-Check», «Rundgang» and «Update» replace «Rennen detailliert planen», «Einführung» and «Neuigkeiten»' }],
  test: [
    'Open Rückblick › Erkenntnisse: the page and the tab are both called «Erkenntnisse».',
    'Open Material: the tab with the lent things is called «Leihliste», the power page «Strom».',
    'Open Touren: the list of all races is called «Rennen-Check».',
  ],
  since: [],
  de: {
    'One word per thing': 'Ein Wort pro Sache',
    'Things that had two names now have one: «Erkenntnisse», «Leihliste», «Strom», «Rennen-Check», «Rundgang», «Update».': 'Sachen mit zwei Namen haben jetzt einen: «Erkenntnisse», «Leihliste», «Strom», «Rennen-Check», «Rundgang», «Update».',
    'Your own findings are called «Erkenntnisse» everywhere, no more «Gelernt» or «Learnings»; the monthly letter is «Was die App gelernt hat»': 'Deine eigenen Erkenntnisse heissen überall «Erkenntnisse», nicht mehr «Gelernt» oder «Learnings»; der Monatsbrief heisst «Was die App gelernt hat»',
    'Shows under Rückblick › Erkenntnisse and in Auswerten.': 'Steht unter Rückblick › Erkenntnisse und in Auswerten.',
    'Gear › «Leihliste» instead of «Ausgeliehen», and «Strom» instead of «Strombudget»': 'Material › «Leihliste» statt «Ausgeliehen» und «Strom» statt «Strombudget»',
    'Shows on Gear, in the tabs.': 'Steht auf Material, bei den Reitern.',
    '«Rennen-Check», «Rundgang» and «Update» replace «Rennen detailliert planen», «Einführung» and «Neuigkeiten»': '«Rennen-Check», «Rundgang» und «Update» ersetzen «Rennen detailliert planen», «Einführung» und «Neuigkeiten»',
    'Open Rückblick › Erkenntnisse: the page and the tab are both called «Erkenntnisse».': 'Öffne Rückblick › Erkenntnisse: Seite und Reiter heissen beide «Erkenntnisse».',
    'Open Material: the tab with the lent things is called «Leihliste», the power page «Strom».': 'Öffne Material: der Reiter mit den verliehenen Sachen heisst «Leihliste», die Strom-Seite «Strom».',
    'Open Touren: the list of all races is called «Rennen-Check».': 'Öffne Touren: die Liste aller Rennen heisst «Rennen-Check».',
  },
};
