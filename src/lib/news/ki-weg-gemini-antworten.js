// «KI entfernen, Schritt 5» (Noah 20.11.2026 «a»): keine Gemini-Antworten mehr in Suche, Assistent und Fragen
export default {
  title: 'No more Gemini answers in the search and the assistant',
  lead: 'The app answers from your data, the AI on this device answers, or you ask further elsewhere.',
  points: [
    { text: 'No more «Ask Gemini here» under an answer; «Ask further at» with Claude, ChatGPT and more stays', go: { href: '#/assistent', where: 'Assistant: ask a question.' } },
    { text: 'A spoken question is no longer sent to Gemini by itself; the app answers, or you ask further', go: null },
    { text: 'Me › Search and Dictation settings have no Gemini switches any more', go: { href: '#/me/suche', where: 'Me › Search: the settings of the search.' } },
  ],
  small: [],
  test: [
    'Open the Assistant and ask «What do I need for a rainy weekend?»: under the answer there is «Ask further at», but no «Ask Gemini here».',
    'Open Me › Search: there are no switches «Gemini (free)» and «Gemini answers a spoken question by itself».',
    'Open Me › Dictation: there is no row «Gemini in the app».',
  ],
  since: [],
  de: {
    'No more Gemini answers in the search and the assistant': 'Keine Gemini-Antworten mehr in Suche und Assistent',
    'The app answers from your data, the AI on this device answers, or you ask further elsewhere.': 'Eine Frage bekommt die eigene Antwort der App, die KI im Gerät, oder du fragst woanders weiter.',
    'No more «Ask Gemini here» under an answer; «Ask further at» with Claude, ChatGPT and more stays': 'Kein «Gemini hier fragen» mehr unter einer Antwort; «Weiter fragen bei» mit Claude, ChatGPT und mehr bleibt',
    'Assistant: ask a question.': 'Assistent: eine Frage stellen.',
    'A spoken question is no longer sent to Gemini by itself; the app answers, or you ask further': 'Eine gesprochene Frage geht nicht mehr von selbst an Gemini; die App antwortet, oder du fragst weiter',
    'Me › Search and Dictation settings have no Gemini switches any more': 'Ich › Suche und Diktat haben keine Gemini-Schalter mehr',
    'Me › Search: the settings of the search.': 'Ich › Suche: die Einstellungen der Suche.',
    'Open the Assistant and ask «What do I need for a rainy weekend?»: under the answer there is «Ask further at», but no «Ask Gemini here».': 'Öffne den Assistenten und frage «Was brauche ich für ein verregnetes Wochenende?»: unter der Antwort steht «Weiter fragen bei», aber kein «Gemini hier fragen».',
    'Open Me › Search: there are no switches «Gemini (free)» and «Gemini answers a spoken question by itself».': 'Öffne Ich › Suche: es gibt keine Schalter «Gemini (gratis)» und «Gemini antwortet auf eine gesprochene Frage von selbst».',
    'Open Me › Dictation: there is no row «Gemini in the app».': 'Öffne Ich › Diktat: es gibt keine Zeile «Gemini in der App».',
  },
};
