// «Wohnort und Wetter pro Tour» (Noah 01.11.2026 «1a»): the tour weather says which place it is for
export default {
  title: 'Which place is the weather for?',
  lead: 'The weather line of a tour now names its place.',
  points: [{ text: 'On a tour the weather says «Weather for …» with the place it was asked for', go: 'f.weather' }],
  small: [{ box: 'new', text: 'Without a place of its own, a tour says that it uses your home place' }],
  test: [
    'Open a planned tour that has a route or a place and look at «Weather for this tour».',
    'Above the numbers it says «Weather for …» with the name of the place.',
  ],
  since: [],
  de: {
    'Which place is the weather for?': 'Für welchen Ort gilt das Wetter?',
    'The weather line of a tour now names its place.': 'Die Wetterzeile einer Tour nennt jetzt ihren Ort.',
    'On a tour the weather says «Weather for …» with the place it was asked for': 'Bei einer Tour steht «Wetter für …» mit dem Ort, für den gefragt wurde',
    'Without a place of its own, a tour says that it uses your home place': 'Hat eine Tour keinen eigenen Ort, steht dort, dass dein Wohnort gilt',
    'Open a planned tour that has a route or a place and look at «Weather for this tour».': 'Öffne eine geplante Tour mit Route oder Ort und schau bei «Wetter für diese Tour».',
    'Above the numbers it says «Weather for …» with the name of the place.': 'Über den Zahlen steht «Wetter für …» mit dem Namen des Ortes.',
  },
};
