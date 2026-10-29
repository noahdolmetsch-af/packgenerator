// Mini-Tools «Spontan-Einladung» (Noah 28.10.2026 «1b 2a 3a», idea 5)
export default {
  title: 'Quick invite',
  lead: '«Are you riding with me tomorrow?» as one link with meeting point, route and weather.',
  points: [{ text: 'Me › Mini tools › Quick invite: pick the day, add the meeting point, send the link', href: '#/me/mini', go: 'f.miniinvite' }],
  small: [
    { box: 'new', go: 'f.miniinvite', text: 'People tap «I am in», «Maybe» or «Not this time» in the browser' },
    { box: 'new', go: 'f.miniinvite', text: 'The weather of your home place comes along by itself' },
  ],
  test: [
    'Open Me › Mini tools › Quick invite, tap «Tomorrow», write a meeting point and tap «Make the link».',
    'Open the link in a private window, write a name and tap «I am in».',
    'Back in the app tap «Look for new answers»: the name is under «In».',
  ],
  since: ['f.miniinvite'],
  de: {
    'Quick invite': 'Spontan-Einladung',
    '«Are you riding with me tomorrow?» as one link with meeting point, route and weather.': '«Fährst du morgen mit?» als ein Link mit Treffpunkt, Route und Wetter.',
    'Me › Mini tools › Quick invite: pick the day, add the meeting point, send the link': 'Ich › Mini-Tools › Spontan-Einladung: Tag wählen, Treffpunkt dazu, Link schicken',
    'People tap «I am in», «Maybe» or «Not this time» in the browser': 'Die Leute tippen im Browser «Ich bin dabei», «Vielleicht» oder «Diesmal nicht»',
    'The weather of your home place comes along by itself': 'Das Wetter deines Wohnorts kommt von selbst dazu',
    'Open Me › Mini tools › Quick invite, tap «Tomorrow», write a meeting point and tap «Make the link».': 'Öffne Ich › Mini-Tools › Spontan-Einladung, tipp «Morgen», schreib einen Treffpunkt und tipp «Link machen».',
    'Open the link in a private window, write a name and tap «I am in».': 'Öffne den Link in einem privaten Fenster, schreib einen Namen und tipp «Ich bin dabei».',
    'Back in the app tap «Look for new answers»: the name is under «In».': 'Zurück in der App tipp «Neue Antworten holen»: der Name steht unter «Dabei».',
  },
};
