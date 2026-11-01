// «Eigener Link» (Noah 1.11.2026 «4a»): öffnest du den Link deiner eigenen Frage, führt ein Hinweis zu den Antworten
export default {
  title: 'Your own link',
  lead: 'If you open the link of your own question, a bar takes you to the answers.',
  points: [{ text: 'Open the link of your own question: «This is your own question. To the answers»', go: { href: '#/me/mini', where: 'Open the link of a question you made, on the same device: the bar is on top of the page.' } }],
  small: [],
  test: [
    'Make a Mini-Tools question and open its link in a new tab of the same browser.',
    'On top you see «This is your own question.»; «To the answers» opens the result.',
  ],
  since: [],
  de: {
    'Your own link': 'Dein eigener Link',
    'If you open the link of your own question, a bar takes you to the answers.': 'Öffnest du den Link deiner eigenen Frage, führt dich ein Hinweis zu den Antworten.',
    'Open the link of your own question: «This is your own question. To the answers»': 'Den Link deiner eigenen Frage öffnen: «Das ist deine eigene Frage. Zu den Antworten»',
    'Open the link of a question you made, on the same device: the bar is on top of the page.': 'Öffne den Link einer Frage, die du gemacht hast, auf demselben Gerät: der Hinweis steht oben auf der Seite.',
    'Make a Mini-Tools question and open its link in a new tab of the same browser.': 'Mach eine Mini-Tools-Frage und öffne ihren Link in einem neuen Tab desselben Browsers.',
    'On top you see «This is your own question.»; «To the answers» opens the result.': 'Oben steht «Das ist deine eigene Frage.»; «Zu den Antworten» öffnet das Ergebnis.',
  },
};
