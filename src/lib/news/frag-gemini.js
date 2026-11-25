// «Frag Gemini» (Noah 23.11.2026 «Ideen 1-4, 1a 2a 3a 4b»): a free question to Gemini by text, voice or photo, read aloud
export default {
  title: 'Ask Gemini',
  lead: 'The Assistant has a third tab: ask Gemini by voice, text or photo and have the answer read aloud.',
  points: [
    { text: 'Assistant › «Ask Gemini»: a question by text, voice or photo, with «Read aloud»', go: { href: '#/assistent/gemini', steps: [{ sel: '[data-gemini-q]' }] } },
    { text: '«Do it for me» turns a sentence into a to-do, list, note or value, after you check it', go: { href: '#/assistent/gemini', steps: [{ sel: '[data-gemini-do]' }] } },
  ],
  small: [
    { box: 'new', text: 'Every answer of «Ask the app» has «Read aloud» too', go: { href: '#/assistent', steps: [{ sel: '[data-as-tab="gemini"]' }] } },
    { box: 'new', text: 'In the look back, «Sort with Gemini» cuts a spoken report into points', go: null },
  ],
  test: ['Open the Assistant and tap «Ask Gemini». Type a question and tap «Ask Gemini».', 'Tap «Read aloud» under the answer to hear it.', 'Type «Remind me on Friday to pump the tyres», tap «Do it for me» and check «I would do this».'],
  since: ['f.askgemini'],
  de: {
    'Ask Gemini': 'Frag Gemini',
    'The Assistant has a third tab: ask Gemini by voice, text or photo and have the answer read aloud.': 'Der Assistent hat einen dritten Reiter: frag Gemini per Stimme, Text oder Foto und lass dir die Antwort vorlesen.',
    'Assistant › «Ask Gemini»: a question by text, voice or photo, with «Read aloud»': 'Assistent › «Frag Gemini»: eine Frage per Text, Stimme oder Foto, mit «Vorlesen»',
    '«Do it for me» turns a sentence into a to-do, list, note or value, after you check it': '«Mach es für mich» macht aus einem Satz ein To-do, eine Liste, eine Notiz oder einen Wert, nachdem du es geprüft hast',
    'Every answer of «Ask the app» has «Read aloud» too': 'Jede Antwort von «Frag die App» hat auch «Vorlesen»',
    'In the look back, «Sort with Gemini» cuts a spoken report into points': 'Im Rückblick gliedert «Mit Gemini gliedern» einen gesprochenen Bericht in Punkte',
    'Open the Assistant and tap «Ask Gemini». Type a question and tap «Ask Gemini».': 'Öffne den Assistenten und tipp «Frag Gemini». Tipp eine Frage und tipp «Frag Gemini».',
    'Tap «Read aloud» under the answer to hear it.': 'Tipp unter der Antwort «Vorlesen», um sie zu hören.',
    'Type «Remind me on Friday to pump the tyres», tap «Do it for me» and check «I would do this».': 'Schreib «Erinnere mich am Freitag daran, die Reifen aufzupumpen», tipp «Mach es für mich» und prüf «Ich würde das tun».',
  },
};
