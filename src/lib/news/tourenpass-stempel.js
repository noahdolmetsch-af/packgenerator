// «Tourenpass mit Stempel» (Noah 03.11.2026 «E und F», Paket E, Idee 18): a stamp for every trip you looked back on
export default {
  title: 'Tour pass with stamps',
  lead: 'After the look back of a trip you can press a stamp with place, day and km into your tour pass.',
  points: [{ text: 'Trips › Look back: saving a look back offers a stamp; your tour pass keeps them as a collection and you can add your own', go: 'f.tourpass' }],
  small: [{ box: 'new', go: 'f.tourpass', text: 'Every stamp can be changed and removed; nothing is stamped without your tap' }],
  test: [
    'Save the look back of a trip.',
    'Tap «Stamp» in the box «A stamp for your tour pass?».',
    'Open Trips › Look back › Tour pass: the stamp is in your collection.',
  ],
  since: ['f.tourpass'],
  de: {
    'Tour pass with stamps': 'Tourenpass mit Stempel',
    'After the look back of a trip you can press a stamp with place, day and km into your tour pass.': 'Nach dem Rückblick einer Tour kannst du einen Stempel mit Ort, Tag und km in deinen Tourenpass drücken.',
    'Trips › Look back: saving a look back offers a stamp; your tour pass keeps them as a collection and you can add your own': 'Touren › Rückblick: Beim Speichern eines Rückblicks wird ein Stempel angeboten; dein Tourenpass sammelt sie, und du kannst eigene hinzufügen',
    'Every stamp can be changed and removed; nothing is stamped without your tap': 'Jeder Stempel lässt sich ändern und entfernen; ohne dein Tippen wird nichts abgestempelt',
    'Save the look back of a trip.': 'Speichere den Rückblick einer Tour.',
    'Tap «Stamp» in the box «A stamp for your tour pass?».': 'Tippe in der Box «Ein Stempel für deinen Tourenpass?» auf «Abstempeln».',
    'Open Trips › Look back › Tour pass: the stamp is in your collection.': 'Öffne Touren › Rückblick › Tourenpass: Der Stempel ist in deiner Sammlung.',
  },
};
