// «Frag Gemini» was four taps from Heute (the search shows the Assistant only under a question): Ich now has a row «Assistent»
export default {
  title: 'Assistant under Me',
  lead: 'Ich has a row «Assistant», so Ask Gemini is three taps from Heute.',
  points: [
    { text: 'Me › «Assistant»: the Assistant opens from the list, with Ask the app, Help me plan and Ask Gemini', go: { href: '#/me', steps: [{ sel: '[data-me-row="assistent"]' }] } },
  ],
  small: [],
  test: ['Tap «Me» in the bar and tap the row «Assistant».', 'Tap the third tab «Ask Gemini».'],
  since: [],
  de: {
    'Assistant under Me': 'Assistent unter Ich',
    'Ich has a row «Assistant», so Ask Gemini is three taps from Heute.': 'Unter Ich steht eine Zeile «Assistent»; so ist «Frag Gemini» drei Taps von Heute entfernt.',
    'Me › «Assistant»: the Assistant opens from the list, with Ask the app, Help me plan and Ask Gemini': 'Ich › «Assistent»: der Assistent öffnet sich aus der Liste, mit «Frag die App», «Hilf mir planen» und «Frag Gemini»',
    'Tap «Me» in the bar and tap the row «Assistant».': 'Tipp unten in der Leiste auf «Ich» und dann auf die Zeile «Assistent».',
    'Tap the third tab «Ask Gemini».': 'Tipp auf den dritten Reiter «Frag Gemini».',
  },
};
