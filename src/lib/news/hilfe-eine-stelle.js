// «Hilfen neu» 4a (Noah 21.11.2026 «4a»): one place for help, at the top right of every page
export default {
  title: 'One place for help',
  lead: 'The assistant and the help sit at the top right of the page, like on the phone. The two rows are gone from the sidebar.',
  points: [
    { text: 'The «?» and the assistant are two round buttons at the top right of the page, on a computer too', go: { href: '#/', steps: [{ sel: '[data-help-open]' }], where: 'At the top right of the page: the «?» for the help of this page, next to it the assistant.' } },
  ],
  small: [],
  test: [
    'On a computer: the sidebar has no rows «Assistant» and «Help» any more.',
    'Top right of the page: tap «?» for the help of this page, tap the speech bubble for the assistant.',
  ],
  since: [],
  de: {
    'One place for help': 'Eine Stelle für Hilfe',
    'The assistant and the help sit at the top right of the page, like on the phone. The two rows are gone from the sidebar.': 'Assistent und Hilfe stehen oben rechts auf der Seite, wie auf dem Handy. Die zwei Zeilen in der Seitenleiste sind weg.',
    'The «?» and the assistant are two round buttons at the top right of the page, on a computer too': 'Das «?» und der Assistent sind zwei runde Knöpfe oben rechts auf der Seite, auch am Computer',
    'At the top right of the page: the «?» for the help of this page, next to it the assistant.': 'Oben rechts auf der Seite: das «?» für die Hilfe dieser Seite, daneben der Assistent.',
    'On a computer: the sidebar has no rows «Assistant» and «Help» any more.': 'Am Computer: die Seitenleiste hat keine Zeilen «Assistent» und «Hilfe» mehr.',
    'Top right of the page: tap «?» for the help of this page, tap the speech bubble for the assistant.': 'Oben rechts auf der Seite: «?» öffnet die Hilfe dieser Seite, die Sprechblase den Assistenten.',
  },
};
