// Live-Navigation «Wege zur Auswahl» (Noah 31.10.2026 «1-5 a», Schritt 5): two or three ways to choose from
export default {
  title: 'Choose your way to the goal',
  lead: 'If the bike router knows more than one way to your goal, you see them side by side and choose.',
  points: [
    { text: 'Two or three ways to a goal with km, time and climb, the shortest, fastest and flattest marked', href: '#/live', go: 'f.live' },
    { text: 'Tap «Take this way»: it becomes the way to your goal', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'With only one way, the app plans it at once as before', go: 'f.live' }],
  test: ['On the live map open «⋯ › Plan a new way to …» and tap «Plan» at a stop: the ways appear side by side.', 'Tap «Take this way» at one of them: the box on top shows its km and climb.'],
  since: [],
  de: {
    'Choose your way to the goal': 'Wähle deinen Weg zum Ziel',
    'If the bike router knows more than one way to your goal, you see them side by side and choose.': 'Kennt der Velo-Router mehr als einen Weg zu deinem Ziel, siehst du sie nebeneinander und wählst.',
    'Two or three ways to a goal with km, time and climb, the shortest, fastest and flattest marked': 'Zwei bis drei Wege zu einem Ziel mit km, Zeit und Höhenmetern, der kürzeste, schnellste und flachste markiert',
    'Tap «Take this way»: it becomes the way to your goal': '«Diesen Weg nehmen» antippen: Er wird der Weg zu deinem Ziel',
    'With only one way, the app plans it at once as before': 'Gibt es nur einen Weg, plant die App ihn wie bisher sofort',
    'On the live map open «⋯ › Plan a new way to …» and tap «Plan» at a stop: the ways appear side by side.': 'Auf der Live-Karte «⋯ › Neu planen zu …» öffnen und bei einem Stopp «Planen» tippen: Die Wege erscheinen nebeneinander.',
    'Tap «Take this way» at one of them: the box on top shows its km and climb.': 'Bei einem «Diesen Weg nehmen» tippen: Der Kasten oben zeigt seine km und Höhenmeter.',
  },
};
