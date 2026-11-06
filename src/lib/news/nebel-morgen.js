// «Nebelgrenze am Morgen» (Noah 05.11.2026 «1a 2b 3a»): a push message at 07:00 from October to February about the fog line
export default {
  title: 'Fog line in the morning',
  lead: 'A message on your phone at 07:00: how high the low fog reaches and from where the sun shines.',
  points: [
    { text: 'From October to February you get «Low fog up to about 800 m, sun from 900 m», or «time to shine» without fog', go: { href: '#/me/push', where: 'Me › Push messages: the switch «Fog line in the morning» (on once push is on; needs your home place).' } },
    { text: 'With sun above the fog it suggests a ride of yours that goes above the fog', go: { href: '#/me/push', where: 'Me › Push messages: the message names a planned ride with a route near home that reaches above the fog.' } },
  ],
  small: [{ box: 'new', text: 'The switch can be turned off under «Fog line in the morning»' }],
  test: [
    'Open Me › Push messages: the switch «Fog line in the morning» is there and on once push is on.',
    'Switch it off and on again: the setting stays.',
  ],
  since: [],
  de: {
    'Fog line in the morning': 'Nebelgrenze am Morgen',
    'A message on your phone at 07:00: how high the low fog reaches and from where the sun shines.': 'Eine Nachricht aufs Handy um 07:00: wie hoch der Hochnebel reicht und ab wo die Sonne scheint.',
    'From October to February you get «Low fog up to about 800 m, sun from 900 m», or «time to shine» without fog': 'Von Oktober bis Februar bekommst du «Hochnebel bis ca. 800 m, ab 900 m Sonne», oder «time to shine» ohne Nebel',
    'Me › Push messages: the switch «Fog line in the morning» (on once push is on; needs your home place).': 'Ich › Push-Erinnerungen: der Schalter «Nebelgrenze am Morgen» (an, sobald Push an ist; braucht deinen Wohnort).',
    'With sun above the fog it suggests a ride of yours that goes above the fog': 'Bei Sonne über dem Nebel schlägt sie eine deiner Fahrten vor, die über den Nebel führt',
    'Me › Push messages: the message names a planned ride with a route near home that reaches above the fog.': 'Ich › Push-Erinnerungen: Die Nachricht nennt eine geplante Fahrt mit Route in der Nähe, die über den Nebel reicht.',
    'The switch can be turned off under «Fog line in the morning»': 'Der Schalter lässt sich unter «Nebelgrenze am Morgen» ausschalten',
    'Open Me › Push messages: the switch «Fog line in the morning» is there and on once push is on.': 'Öffne Ich › Push-Erinnerungen: Der Schalter «Nebelgrenze am Morgen» ist da und an, sobald Push an ist.',
    'Switch it off and on again: the setting stays.': 'Schalte ihn aus und wieder an: Die Einstellung bleibt.',
  },
};
