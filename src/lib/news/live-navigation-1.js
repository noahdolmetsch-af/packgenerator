// Navigation zum Ziel (Noah 27.10.2026 «1a 2a 3a 4a 5a», thread Live Navigation).
export default {
  title: 'Your goal by name',
  lead: 'When you ride to a place, the map names it, and you go there first; the way back is asked at the goal.',
  points: [
    { text: 'The goal has its name instead of «Other stop»', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'nicer', text: '«Only there» first; at the goal the app asks about the way back', go: 'f.live' }],
  test: ['On the live map tap a place and «Go there»: its name is at the top and «Only there» is chosen.', 'Ride to the goal: the app asks whether you want the way back to the route.'],
  since: [],
  de: {
    'Your goal by name': 'Dein Ziel mit Namen',
    'When you ride to a place, the map names it, and you go there first; the way back is asked at the goal.': 'Wenn du zu einem Ort fährst, steht sein Name da, und es geht zuerst nur hin; den Rückweg fragt die App am Ziel.',
    '«Only there» first; at the goal the app asks about the way back': 'Zuerst «Nur hin»; am Ziel fragt die App nach dem Rückweg',
    'The goal has its name instead of «Other stop»': 'Das Ziel hat seinen Namen statt «Anderer Stopp»',
    'On the live map tap a place and «Go there»: its name is at the top and «Only there» is chosen.': 'Auf der Live-Karte einen Ort antippen und «Hinfahren»: oben steht sein Name, «Nur hin» ist gewählt.',
    'Ride to the goal: the app asks whether you want the way back to the route.': 'Zum Ziel fahren: die App fragt, ob du den Weg zurück auf die Strecke willst.',
  },
};
