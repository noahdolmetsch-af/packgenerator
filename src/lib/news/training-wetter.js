// «Training verbessern» 3b (Noah 3.11.2026 «3b»): weather in the week suggestion
export default {
  title: 'Weather in the week suggestion',
  lead: 'When rain is forecast for your home place, the long session moves to a drier day. Other rides on a rainy day carry the hint «Rain: indoors?».',
  points: [{ text: 'See the rain hint in «Suggestion for this week»', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }] } }],
  small: [],
  test: [
    'Set your home place under Me › Settings › Home place (if not done), then open Aktiv › Training › «Suggestion for this week».',
    'On a rainy day a ride shows «Rain: indoors?»; the long session sits on a drier day, and the reasons say so.',
  ],
  since: [],
  de: {
    'Weather in the week suggestion': 'Wetter im Wochenvorschlag',
    'When rain is forecast for your home place, the long session moves to a drier day. Other rides on a rainy day carry the hint «Rain: indoors?».': 'Ist für deinen Wohnort Regen angesagt, rutscht die lange Einheit auf einen trockeneren Tag. Andere Fahrten an einem Regentag tragen den Hinweis «Regen: drinnen?».',
    'See the rain hint in «Suggestion for this week»': 'Schau den Regenhinweis bei «Vorschlag für diese Woche» an',
    'Set your home place under Me › Settings › Home place (if not done), then open Aktiv › Training › «Suggestion for this week».': 'Trage deine Heimat unter Ich › Einstellungen › Heimat ein (falls nicht schon getan) und öffne Aktiv › Training › «Vorschlag für diese Woche».',
    'On a rainy day a ride shows «Rain: indoors?»; the long session sits on a drier day, and the reasons say so.': 'An einem Regentag steht bei einer Fahrt «Regen: drinnen?»; die lange Einheit liegt auf einem trockeneren Tag, und die Begründung sagt es.',
  },
};
