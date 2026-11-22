// «KI entfernen, Schritt 4» (Noah 20.11.2026 «a»): Gemini versteht in der Suche keine Sätze mehr
export default {
  title: 'The search no longer sends sentences to Gemini',
  lead: 'Spoken and typed commands are understood by the app\'s own rules only.',
  points: [
    { text: 'No more «Let Gemini understand it» in the search; commands the app knows run as before, with Undo', go: { href: '#/me/suche', where: 'Me › Search: the settings of the search.' } },
    { text: 'Me › Search has no switch «Gemini understands sentences» any more', go: null },
  ],
  small: [],
  test: [
    'Open the search and type «Remind me Friday to pump the tyres»: the app shows its own commands, with no offer «Let Gemini understand it».',
    'Open Me › Search: there is no switch «Gemini understands sentences».',
  ],
  since: [],
  de: {
    'The search no longer sends sentences to Gemini': 'Die Suche schickt keine Sätze mehr an Gemini',
    'Spoken and typed commands are understood by the app\'s own rules only.': 'Gesprochene und getippte Befehle versteht nur noch die App mit ihren eigenen Regeln.',
    'No more «Let Gemini understand it» in the search; commands the app knows run as before, with Undo': 'Kein «Gemini verstehen lassen» mehr in der Suche; Befehle, die die App kennt, laufen wie bisher, mit Rückgängig',
    'Me › Search: the settings of the search.': 'Ich › Suche: die Einstellungen der Suche.',
    'Me › Search has no switch «Gemini understands sentences» any more': 'Ich › Suche hat keinen Schalter «Gemini versteht Sätze» mehr',
    'Open the search and type «Remind me Friday to pump the tyres»: the app shows its own commands, with no offer «Let Gemini understand it».': 'Öffne die Suche und tippe «Erinnere mich Freitag an Reifen pumpen»: die App zeigt ihre eigenen Befehle, ohne Angebot «Gemini verstehen lassen».',
    'Open Me › Search: there is no switch «Gemini understands sentences».': 'Öffne Ich › Suche: es gibt keinen Schalter «Gemini versteht Sätze».',
  },
};
