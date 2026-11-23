// «Bilder bei jeder Neuheit» (Noah 23.11.2026 «1b 2a 3a 4b 5a»): the pictures of the places show in «What is new», with a slider before / after
export default {
  title: 'Pictures in What is new',
  lead: 'Many updates now show a picture of the new place, with a slider between before and after.',
  points: [
    {
      text: 'A picture of the place with a slider: drag to see how it looked before',
      go: { href: '#/me/news', steps: [{ sel: '[data-news-bild]' }], where: 'Shows in an update that has a picture, at the top of its card.' },
    },
    {
      text: 'Pictures of last night’s updates are there too',
      go: { href: '#/me/news', steps: [{ sel: '[data-news-bild]' }], where: 'Shows in an update that has a picture, at the top of its card.' },
    },
  ],
  small: [{ box: 'new', text: 'A picture seen once stays on the device, so the card reads the same offline', go: null }],
  test: [
    'Open Me › What is new: the newest updates show a picture of the place above their lines.',
    'Drag the slider (or press the arrow keys on it): left is before, right is after.',
    'Tap «Try it» of an update: it opens the place and lights it, as before.',
  ],
  since: [],
  de: {
    'Pictures in What is new': 'Bilder in «Was ist neu»',
    'Many updates now show a picture of the new place, with a slider between before and after.': 'Viele Updates zeigen jetzt ein Bild der neuen Stelle, mit einem Schieber zwischen vorher und nachher.',
    'A picture of the place with a slider: drag to see how it looked before': 'Ein Bild der Stelle mit Schieber: ziehen, um zu sehen, wie es vorher aussah',
    'Pictures of last night’s updates are there too': 'Auch die Updates der letzten Nacht haben Bilder',
    'Shows in an update that has a picture, at the top of its card.': 'Erscheint in einem Update mit Bild, oben in seiner Karte.',
    'A picture seen once stays on the device, so the card reads the same offline': 'Ein einmal gesehenes Bild bleibt auf dem Gerät, die Karte sieht offline gleich aus',
    'Open Me › What is new: the newest updates show a picture of the place above their lines.': 'Öffne Ich › Was ist neu: die neuesten Updates zeigen über ihren Zeilen ein Bild der Stelle.',
    'Drag the slider (or press the arrow keys on it): left is before, right is after.': 'Ziehe den Schieber (oder drücke die Pfeiltasten darauf): links ist vorher, rechts nachher.',
    'Tap «Try it» of an update: it opens the place and lights it, as before.': 'Tippe bei einem Update auf «Ausprobieren»: es öffnet die Stelle und leuchtet sie an, wie bisher.',
  },
};
