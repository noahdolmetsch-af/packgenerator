// «Frag die App merkt sich Fragen» (S6, Noah 21.11.2026 «5a»): questions without an answer stay on this device
export default {
  title: 'The app keeps questions it could not answer',
  lead: 'A question the app cannot answer yet is no longer lost: it stays in a list on this device.',
  points: [
    { text: 'Under «Ask the app», a closed list shows the questions without an answer; tap one to ask it again, or remove it with Undo', go: { href: '#/assistent', steps: [{ sel: '[data-as="open"]' }], where: 'Assistant › Ask the app › the list «Questions without an answer» (shows after a question the app could not answer)' } },
  ],
  small: [{ box: 'new', text: 'The list stays only on this device, never in the backup or the sync' }],
  test: ['Open the Assistant and ask something the app cannot know, like «When is full moon on Mars?»: under the answer a closed list «One question without an answer» appears.', 'Open it and tap «Remove»: the question goes. Tap «Undo» within a few seconds: it is back.'],
  since: [],
  de: {
    'The app keeps questions it could not answer': 'Die App merkt sich Fragen, die sie nicht beantworten konnte',
    'A question the app cannot answer yet is no longer lost: it stays in a list on this device.': 'Eine Frage, die die App noch nicht beantworten kann, geht nicht mehr verloren: Sie bleibt in einer Liste auf diesem Gerät.',
    'Under «Ask the app», a closed list shows the questions without an answer; tap one to ask it again, or remove it with Undo': 'Unter «Frag die App» zeigt eine zugeklappte Liste die Fragen ohne Antwort; tippe eine an, um sie nochmals zu stellen, oder entferne sie mit Rückgängig',
    'Assistant › Ask the app › the list «Questions without an answer» (shows after a question the app could not answer)': 'Assistent › Frag die App › die Liste «Fragen ohne Antwort» (erscheint nach einer Frage, die die App nicht beantworten konnte)',
    'The list stays only on this device, never in the backup or the sync': 'Die Liste bleibt nur auf diesem Gerät, nie im Backup oder Sync',
    'Open the Assistant and ask something the app cannot know, like «When is full moon on Mars?»: under the answer a closed list «One question without an answer» appears.': 'Öffne den Assistenten und frage etwas, das die App nicht wissen kann, etwa «Wann ist Vollmond auf dem Mars?»: Unter der Antwort erscheint eine zugeklappte Liste «Eine Frage ohne Antwort».',
    'Open it and tap «Remove»: the question goes. Tap «Undo» within a few seconds: it is back.': 'Öffne sie und tippe «Entfernen»: Die Frage ist weg. Tippe innert weniger Sekunden «Rückgängig»: Sie ist wieder da.',
  },
};
