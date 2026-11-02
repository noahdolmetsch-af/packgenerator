// Live-Navigation «Neuer Weg» (Noah 31.10.2026 «1-5 a», Schritt 4): off the way to a goal a new way from here
export default {
  title: 'A new way when you leave the way to your goal',
  lead: 'If you ride off the way to your goal, the app plans a new way from where you are to the same goal.',
  points: [
    { text: 'Off the way to a goal, the app plans a new way to the same goal by itself', href: '#/live', go: 'f.live' },
    { text: '«Undo» brings the old way back', href: '#/live', go: 'f.live' },
  ],
  small: [{ box: 'new', text: 'It waits a few seconds first and tries again after a minute if the router does not answer', go: 'f.live' }],
  test: ['On the live map choose a goal and tap «Go there»: ride on a side road, away from the line.', 'After a few seconds a new line from where you are to the goal appears, with «Undo» for the old one.'],
  since: [],
  de: {
    'A new way when you leave the way to your goal': 'Ein neuer Weg, wenn du vom Weg zum Ziel abkommst',
    'If you ride off the way to your goal, the app plans a new way from where you are to the same goal.': 'Fährst du vom Weg zu deinem Ziel ab, plant die App von dort, wo du bist, einen neuen Weg zum gleichen Ziel.',
    'Off the way to a goal, the app plans a new way to the same goal by itself': 'Vom Weg zum Ziel abgekommen, plant die App selbst einen neuen Weg zum gleichen Ziel',
    '«Undo» brings the old way back': '«Rückgängig» holt den alten Weg zurück',
    'It waits a few seconds first and tries again after a minute if the router does not answer': 'Sie wartet zuerst ein paar Sekunden und versucht es nach einer Minute nochmals, wenn der Router nicht antwortet',
    'On the live map choose a goal and tap «Go there»: ride on a side road, away from the line.': 'Auf der Live-Karte ein Ziel wählen und «Hinfahren» tippen: auf eine Nebenstrasse fahren, weg von der Linie.',
    'After a few seconds a new line from where you are to the goal appears, with «Undo» for the old one.': 'Nach ein paar Sekunden erscheint eine neue Linie von dir zum Ziel, mit «Rückgängig» für die alte.',
  },
};
