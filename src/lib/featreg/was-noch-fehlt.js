// «Was die App noch wissen sollte» (Idee D3 «App denkt mit», Noah 02.11.2026 «3b»)
export default {
  features: [
    { id: 'f.needsknow', group: 'data', title: 'What the app still needs to know', text: 'A short list of what the app does not know yet, what each is for and where to fill it in: home place, bike weight, wear part start points, gear weights.', href: '#/me/hinweise', words: 'was die app noch wissen sollte fehlt lücken heimatort gewicht startpunkt hinweis tipp', moment: 'app' },
  ],
  howto: { 'f.needsknow': ['Open Me › Alerts and news.', 'On top: what the app still needs to know, each with what it is for.', 'Tap one to fill it in; it leaves the list once it is filled.'] },
  handbook: {
    'f.needsknow': {
      on: null,
      steps: ['Open Me › Alerts and news.', 'On top: what the app still needs to know, each with what it is for.', 'Tap one to fill it in; it leaves the list once it is filled.'],
      example: 'Example: 2 bikes without a weight → «Then the bike comparison can tell which bike is lighter for a trip.»',
    },
  },
  home: { 'f.needsknow': '#/me/hinweise' },
};
