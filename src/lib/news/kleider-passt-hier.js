// Inhalt zuerst (Noah 21.11.2026 «5a»): der Weg zu «Kleiderschrank einrichten» steht unten statt als Zeile oben
export default {
  title: 'Wardrobe: content first',
  lead: 'The way to «Set up wardrobe» now sits at the end of the wardrobe, so the page starts with your clothes.',
  points: [{ text: 'The line above the clothes is gone; «Set up wardrobe» is under «Fits here» at the end of the page', go: { href: '#/wardrobe', steps: [{ sel: '[data-passt-hier="wardrobe"]' }] } }],
  test: ['Open the wardrobe: it starts with your clothes, no line above them.', 'Scroll to the end and tap «Set up wardrobe» under «Fits here».'],
  de: {
    'Wardrobe: content first': 'Kleiderschrank: Inhalt zuerst',
    'The way to «Set up wardrobe» now sits at the end of the wardrobe, so the page starts with your clothes.': 'Der Weg zu «Kleiderschrank einrichten» steht jetzt am Ende des Kleiderschranks, damit die Seite mit deinen Kleidern beginnt.',
    'The line above the clothes is gone; «Set up wardrobe» is under «Fits here» at the end of the page': 'Die Zeile über den Kleidern ist weg; «Kleiderschrank einrichten» steht am Seitenende unter «Passt hier»',
    'Open the wardrobe: it starts with your clothes, no line above them.': 'Öffne den Kleiderschrank: er beginnt mit deinen Kleidern, keine Zeile darüber.',
    'Scroll to the end and tap «Set up wardrobe» under «Fits here».': 'Scrolle ans Ende und tippe unter «Passt hier» auf «Kleiderschrank einrichten».',
  },
};
