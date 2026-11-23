// «Alles, was du angelegt hast» im Wochenrückblick (Noah 23.11.2026, Thread «Analyse-Seite viel besser machen»)
export default {
  title: 'Everything you created, in the week review',
  lead: 'The week review now lists every activity of Active, also daily habits and sports without a goal.',
  points: [
    { text: 'The card «Everything you created» lists every activity with its times of the week: push-ups, stretching, ice hockey, climbing, yoga and your Strava sports without an activity of their own', go: { href: '#/flow/review', steps: [{ sel: '[data-alle="week"]' }], where: 'Active › Week › Week in review, under the numbers.' } },
    { text: 'Activities with no time this week stand in a closed list, the rituals stay a group of the card', go: { href: '#/flow/review', steps: [{ sel: '[data-alle-quiet]' }], where: 'Active › Week › Week in review, under the numbers.' } },
  ],
  small: [{ box: 'new', text: 'A Strava session without a tick is shown and marked «not counted yet»; it counts for no goal' }],
  test: [
    'Open Active › Week › Week in review: under the five numbers stands the card «Everything you created».',
    'Look for a daily habit (for example push-ups) or ice hockey: each has its times of the week.',
    'Open the closed line «… activities without a time this week»: it names the ones that were not there.',
  ],
  since: [],
  de: {
    'Everything you created, in the week review': 'Alles, was du angelegt hast, im Wochenrückblick',
    'The week review now lists every activity of Active, also daily habits and sports without a goal.': 'Der Wochenrückblick zeigt jetzt jede Aktivität aus Aktiv, auch tägliche Gewohnheiten und Sportarten ohne Ziel.',
    'The card «Everything you created» lists every activity with its times of the week: push-ups, stretching, ice hockey, climbing, yoga and your Strava sports without an activity of their own': 'Die Karte «Alles, was du angelegt hast» zeigt jede Aktivität mit ihren Malen der Woche: Liegestütze, Stretching, Eishockey, Klettern, Yoga und deine Strava-Sportarten ohne eigene Aktivität',
    'Active › Week › Week in review, under the numbers.': 'Aktiv › Woche › Wochenrückblick, unter den Zahlen.',
    'Activities with no time this week stand in a closed list, the rituals stay a group of the card': 'Aktivitäten ohne Mal diese Woche stehen in einer geschlossenen Liste, die Rituale bleiben eine Gruppe der Karte',
    'A Strava session without a tick is shown and marked «not counted yet»; it counts for no goal': 'Eine Strava-Einheit ohne Haken wird gezeigt und mit «noch nicht gezählt» markiert; sie zählt für kein Ziel',
    'Open Active › Week › Week in review: under the five numbers stands the card «Everything you created».': 'Öffne Aktiv › Woche › Wochenrückblick: unter den fünf Zahlen steht die Karte «Alles, was du angelegt hast».',
    'Look for a daily habit (for example push-ups) or ice hockey: each has its times of the week.': 'Suche eine tägliche Gewohnheit (zum Beispiel Liegestütze) oder Eishockey: jede hat ihre Mal der Woche.',
    'Open the closed line «… activities without a time this week»: it names the ones that were not there.': 'Öffne die geschlossene Zeile «… Aktivitäten ohne Mal diese Woche»: sie nennt die, die nicht dabei waren.',
  },
};
