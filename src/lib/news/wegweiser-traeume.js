// «Wegweiser statt Katalog» PR 6 (Noah 01.11.2026 «1a 2a 3a 4a 5a», plan «1-26» approved): «Fits here» on Dreams and New ground
export default {
  title: 'Free-time pages next to your dreams',
  lead: 'Travel wishes, what you are up for and a first night outside now sit where you dream and collect.',
  points: [
    {
      text: 'Dreams: «Fits here» with travel wishes, what am I up for and what matters to me',
      go: { href: '#/trips/dreams', steps: [{ sel: '[data-passt-hier="dreams"]' }], where: 'Under «Your dreams» on Trips › Dreams.' },
    },
    {
      text: 'New ground: «Fits here» with the first night outside and your own discovery bingo',
      go: { href: '#/neuland', steps: [{ sel: '[data-passt-hier="neuland"]' }], where: 'At the end of Trips › Look back › New ground.' },
    },
  ],
  small: [{ box: 'new', text: 'A tap opens the page and lets the function light up briefly', go: 'f.freinacht' }],
  test: [
    'Open Trips › Dreams: under «Your dreams» is «Fits here» with three buttons.',
    'Open New ground and tap «First night» at the end: the page of the first night opens.',
  ],
  since: [],
  de: {
    'Free-time pages next to your dreams': 'Freie-Zeit-Seiten neben deinen Träumen',
    'Travel wishes, what you are up for and a first night outside now sit where you dream and collect.': 'Reise-Wünsche, Lust und eine erste Nacht draussen stehen jetzt dort, wo du träumst und sammelst.',
    'Dreams: «Fits here» with travel wishes, what am I up for and what matters to me': 'Träume: «Passt hier» mit Reise-Wünschen, Lust und Was mir wesentlich ist',
    'Under «Your dreams» on Trips › Dreams.': 'Unter «Deine Träume» bei Touren › Träume.',
    'New ground: «Fits here» with the first night outside and your own discovery bingo': 'Neuland: «Passt hier» mit der ersten Nacht draussen und deinem eigenen Entdeckerbingo',
    'At the end of Trips › Look back › New ground.': 'Am Ende von Touren › Rückblick › Neuland.',
    'A tap opens the page and lets the function light up briefly': 'Ein Tipp öffnet die Seite und lässt die Funktion kurz leuchten',
    'Open Trips › Dreams: under «Your dreams» is «Fits here» with three buttons.': 'Öffne Touren › Träume: unter «Deine Träume» steht «Passt hier» mit drei Knöpfen.',
    'Open New ground and tap «First night» at the end: the page of the first night opens.': 'Öffne Neuland und tippe am Ende auf «Erste Nacht»: die Seite der ersten Nacht öffnet sich.',
  },
};
