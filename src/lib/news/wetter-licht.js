// «Wetter neu» PR 4 (Noah 04.11.2026 «5 alle»): sunrise, sunset and the lights on the weather page
export default {
  title: 'Sunrise, sunset and the lights',
  lead: 'The weather page shows sunrise, sunset, the length of the daylight and when to switch the lights on.',
  points: [{ text: 'On the weather page, under «Now», the card «Light for your ride» for today and tomorrow', go: { href: '#/wetter', steps: [{ sel: '[data-wx-light]' }] } }],
  small: [{ box: 'new', text: 'In «Plan» the best time says when you are back after sunset' }],
  test: [
    'Open Weather (Me › Weather): under «Now» you see «Light for your ride» with sunrise and sunset of today and tomorrow.',
    'Each day says «Lights on from …», half an hour before sunset. It is a suggestion.',
  ],
  since: [],
  de: {
    'Sunrise, sunset and the lights': 'Sonnenauf- und -untergang und das Licht',
    'The weather page shows sunrise, sunset, the length of the daylight and when to switch the lights on.': 'Die Wetterseite zeigt Sonnenauf- und -untergang, wie lange es hell ist und wann du das Licht einschaltest.',
    'On the weather page, under «Now», the card «Light for your ride» for today and tomorrow': 'Auf der Wetterseite unter «Jetzt» die Karte «Licht für die Fahrt» für heute und morgen',
    'In «Plan» the best time says when you are back after sunset': 'In «Planen» sagt die beste Zeit, wenn du nach Sonnenuntergang zurück bist',
    'Open Weather (Me › Weather): under «Now» you see «Light for your ride» with sunrise and sunset of today and tomorrow.': 'Öffne Wetter (Ich › Wetter): unter «Jetzt» siehst du «Licht für die Fahrt» mit Sonnenauf- und -untergang von heute und morgen.',
    'Each day says «Lights on from …», half an hour before sunset. It is a suggestion.': 'Jeder Tag sagt «Licht an ab …», eine halbe Stunde vor Sonnenuntergang. Das ist ein Vorschlag.',
  },
};
