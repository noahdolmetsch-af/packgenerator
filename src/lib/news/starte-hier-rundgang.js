// «Starte hier» starts the Rundgang der Stärken (Noah 23.11.2026 «1-5a»)
export default {
  title: 'Start here: the tour of the strengths',
  lead: 'On an empty Today the line «Tour, 2 minutes» now starts the tour of the strengths with the sample race.',
  points: [
    { text: 'Empty Today, «Start here»: «New here? Tour, 2 minutes» starts the four questions about what the app can do', go: { href: '#/', steps: [{ sel: '[data-tourline]' }], where: 'Today, with no data yet' } },
    { text: 'The tour of the app with your own data or the example trip is still in Me › Handbook, under the small tours', go: { href: '#/me/handbook', steps: [{ sel: '[data-hb-tour]' }], where: 'Me › Handbook' } },
  ],
  small: [],
  test: [
    'On an empty app open Today: the card «Start here» has the line «New here? Tour, 2 minutes».',
    'Tap «Start ›»: the first question of the tour appears over the sample race.',
    'Open Me › Handbook: the tour of the app is under the small tours.',
  ],
  since: [],
  de: {
    'Start here: the tour of the strengths': 'Starte hier: der Rundgang der Stärken',
    'On an empty Today the line «Tour, 2 minutes» now starts the tour of the strengths with the sample race.': 'Auf einem leeren Heute startet die Zeile «Rundgang, 2 Minuten» jetzt den Rundgang der Stärken mit dem Muster-Rennen.',
    'Empty Today, «Start here»: «New here? Tour, 2 minutes» starts the four questions about what the app can do': 'Leeres Heute, «Starte hier»: «Neu hier? Rundgang, 2 Minuten» startet die vier Fragen dazu, was die App kann',
    'Today, with no data yet': 'Heute, noch ohne Daten',
    'The tour of the app with your own data or the example trip is still in Me › Handbook, under the small tours': 'Der Rundgang durch die App mit eigenen Daten oder der Beispiel-Tour bleibt in Ich › Handbuch, unter den kleinen Rundgängen',
    'Me › Handbook': 'Ich › Handbuch',
    'On an empty app open Today: the card «Start here» has the line «New here? Tour, 2 minutes».': 'Öffne in einer leeren App Heute: Die Karte «Starte hier» hat die Zeile «Neu hier? Rundgang, 2 Minuten».',
    'Tap «Start ›»: the first question of the tour appears over the sample race.': 'Tippe auf «Start ›»: Die erste Frage des Rundgangs erscheint über dem Muster-Rennen.',
    'Open Me › Handbook: the tour of the app is under the small tours.': 'Öffne Ich › Handbuch: Der Rundgang durch die App steht bei den kleinen Rundgängen.',
  },
};
