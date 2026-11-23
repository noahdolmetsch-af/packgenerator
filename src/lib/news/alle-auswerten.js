// «Alles, was du angelegt hast» auf Auswerten (Noah 23.11.2026, Thread «Analyse-Seite viel besser machen»)
export default {
  title: 'Everything you created, on Analysis',
  lead: 'Analysis now lists every activity of Active for the period you chose, also daily habits and ones with 0 times.',
  points: [
    { text: 'Under «Last 7 days» a closed line «Everything you created» opens the list of every activity of the chosen period, with its times, goal and measured time', go: { href: '#/auswerten', steps: [{ sel: '[data-alle-fold]' }], where: 'Analysis, under «Last 7 days».' } },
  ],
  small: [{ box: 'new', text: 'A Strava session without a tick shows there too, marked «not counted yet»' }],
  test: [
    'Open Analysis and choose a period (week, month or year) at the top.',
    'Under «Last 7 days» open the closed line «Everything you created»: every activity stands there with its times, also a daily habit like push-ups.',
    'Open the line «… activities without a time in this period»: it names the ones that were not there.',
  ],
  since: [],
  de: {
    'Everything you created, on Analysis': 'Alles, was du angelegt hast, auf Auswerten',
    'Analysis now lists every activity of Active for the period you chose, also daily habits and ones with 0 times.': 'Auswerten zeigt jetzt jede Aktivität aus Aktiv für den gewählten Zeitraum, auch tägliche Gewohnheiten und solche mit 0 Mal.',
    'Under «Last 7 days» a closed line «Everything you created» opens the list of every activity of the chosen period, with its times, goal and measured time': 'Unter «Letzte 7 Tage» öffnet eine geschlossene Zeile «Alles, was du angelegt hast» die Liste jeder Aktivität des gewählten Zeitraums, mit Mal, Ziel und gemessener Zeit',
    'Analysis, under «Last 7 days».': 'Auswerten, unter «Letzte 7 Tage».',
    'A Strava session without a tick shows there too, marked «not counted yet»': 'Eine Strava-Einheit ohne Haken steht dort auch, mit «noch nicht gezählt»',
    'Open Analysis and choose a period (week, month or year) at the top.': 'Öffne Auswerten und wähle oben einen Zeitraum (Woche, Monat oder Jahr).',
    'Under «Last 7 days» open the closed line «Everything you created»: every activity stands there with its times, also a daily habit like push-ups.': 'Öffne unter «Letzte 7 Tage» die geschlossene Zeile «Alles, was du angelegt hast»: jede Aktivität steht dort mit ihren Mal, auch eine tägliche Gewohnheit wie Liegestütze.',
    'Open the line «… activities without a time in this period»: it names the ones that were not there.': 'Öffne die Zeile «… Aktivitäten ohne Mal in diesem Zeitraum»: sie nennt die, die nicht dabei waren.',
  },
};
