// «Weitere Fragen» (Noah 23.11.2026 «Beides», Thread «Mehr Fragen in «Wi gaht's?» zurückholen»): Zufallsfrage und jede andere Frage auf der Morgen-Seite
export default {
  title: 'More questions again',
  lead: 'The morning page has a random question, and a closed line «More questions» offers every other question.',
  points: [
    { text: 'A random question stands under the morning questions; skip it or choose «Never again»', go: { href: '#/check/morning', steps: [{ sel: '[data-random]' }], where: 'Today › Wi gaht\'s? in the morning: a random question under the others.' } },
    { text: '«More questions» opens every other question for one answer, without switching it on', go: { href: '#/check/morning', steps: [{ sel: '[data-more-toggle]' }] } },
  ],
  small: [{ box: 'fixed', text: 'The morning and the evening page both have «More questions»' }],
  test: [
    'Open Today › Wi gaht\'s? in the morning: under the last question stands a random question.',
    'Tap «More questions», answer «Sofa or saddle», reload: the answer is still there.',
    'Open Me › Your questions: «Sofa or saddle» is still off.',
  ],
  since: [],
  de: {
    'More questions again': 'Wieder mehr Fragen',
    'The morning page has a random question, and a closed line «More questions» offers every other question.': 'Die Morgen-Seite hat eine Zufallsfrage, und eine zugeklappte Zeile «Weitere Fragen» bietet jede andere Frage an.',
    'A random question stands under the morning questions; skip it or choose «Never again»': 'Unter den Morgenfragen steht eine Zufallsfrage; überspringe sie oder wähle «Nie mehr»',
    'Today › Wi gaht\'s? in the morning: a random question under the others.': 'Heute › «Wi gaht\'s?» am Morgen: eine Zufallsfrage unter den anderen.',
    '«More questions» opens every other question for one answer, without switching it on': '«Weitere Fragen» zeigt jede andere Frage für eine Antwort, ohne sie einzuschalten',
    'The morning and the evening page both have «More questions»': 'Die Morgen- und die Abend-Seite haben beide «Weitere Fragen»',
    'Open Today › Wi gaht\'s? in the morning: under the last question stands a random question.': 'Öffne Heute › «Wi gaht\'s?» am Morgen: unter der letzten Frage steht eine Zufallsfrage.',
    'Tap «More questions», answer «Sofa or saddle», reload: the answer is still there.': 'Tippe «Weitere Fragen», beantworte «Sofa oder Sattel», lade neu: die Antwort steht noch da.',
    'Open Me › Your questions: «Sofa or saddle» is still off.': 'Öffne Ich › Deine Fragen: «Sofa oder Sattel» ist weiter aus.',
  },
};
