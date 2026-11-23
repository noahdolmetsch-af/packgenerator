// «Alles, was du angelegt hast» im Sportjahr (Noah 23.11.2026, Thread «Analyse-Seite viel besser machen»)
export default {
  title: 'Everything you created, in the Sports year',
  lead: 'The Sports year now also lists every activity of Active for the period, also daily habits and ones with 0 times.',
  points: [
    { text: 'Under «Rest and rituals» a closed line «Everything you created» opens the list of every activity of the chosen period, with its times, goal and measured time', go: { href: '#/auswerten/sportjahr', steps: [{ sel: '[data-alle-fold]' }], where: 'Analysis › Sports year, at the bottom.' } },
  ],
  small: [{ box: 'new', text: 'The hours of the Sports year stay as they are: the list counts times, not hours' }],
  test: [
    'Open Analysis › Sports year and choose a period (month, year or everything).',
    'At the bottom open the closed line «Everything you created»: every activity stands there with its times, also a daily habit like push-ups.',
    'Check that the hours at the top did not change.',
  ],
  since: [],
  de: {
    'Everything you created, in the Sports year': 'Alles, was du angelegt hast, im Sportjahr',
    'The Sports year now also lists every activity of Active for the period, also daily habits and ones with 0 times.': 'Das Sportjahr zeigt jetzt auch jede Aktivität aus Aktiv für den Zeitraum, auch tägliche Gewohnheiten und solche mit 0 Mal.',
    'Under «Rest and rituals» a closed line «Everything you created» opens the list of every activity of the chosen period, with its times, goal and measured time': 'Unter «Erholung und Rituale» öffnet eine geschlossene Zeile «Alles, was du angelegt hast» die Liste jeder Aktivität des gewählten Zeitraums, mit Mal, Ziel und gemessener Zeit',
    'Analysis › Sports year, at the bottom.': 'Auswerten › Sportjahr, ganz unten.',
    'The hours of the Sports year stay as they are: the list counts times, not hours': 'Die Stunden im Sportjahr bleiben, wie sie sind: die Liste zählt Mal, nicht Stunden',
    'Open Analysis › Sports year and choose a period (month, year or everything).': 'Öffne Auswerten › Sportjahr und wähle einen Zeitraum (Monat, Jahr oder Alles).',
    'At the bottom open the closed line «Everything you created»: every activity stands there with its times, also a daily habit like push-ups.': 'Öffne unten die geschlossene Zeile «Alles, was du angelegt hast»: jede Aktivität steht dort mit ihren Mal, auch eine tägliche Gewohnheit wie Liegestütze.',
    'Check that the hours at the top did not change.': 'Prüfe, dass die Stunden oben gleich geblieben sind.',
  },
};
