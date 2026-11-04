// «Velos-Pflege einbauen» (Noah 03.11.2026 «3a»): a wear photo of the chain while you measure it
export default {
  title: 'Photo of the chain while measuring',
  lead: 'In «Measure the chain» you can take the wear photo right away; it goes to «Wear photos» for old next to new.',
  points: [{ text: 'In «Measure the chain»: «Photo of the chain»', go: { href: '#/bikes?tab=care', steps: [{ text: 'Measure the chain' }, { sel: '[data-measure-photo]' }] } }],
  small: [],
  test: [
    'Open Bikes › Care and tap «Measure the chain».',
    'Under the scale tap «Take photo» (on a computer «Choose photo»): «Photo saved.» appears with a link to the wear photos.',
  ],
  since: [],
  de: {
    'Photo of the chain while measuring': 'Foto der Kette beim Messen',
    'In «Measure the chain» you can take the wear photo right away; it goes to «Wear photos» for old next to new.': 'In «Kette messen» machst du das Verschleiss-Foto gleich mit; es kommt zu «Verschleiss-Fotos», damit du Alt neben Neu siehst.',
    'In «Measure the chain»: «Photo of the chain»': 'In «Kette messen»: «Foto der Kette»',
    'Open Bikes › Care and tap «Measure the chain».': 'Öffne Velos › Pflege und tippe auf «Kette messen».',
    'Under the scale tap «Take photo» (on a computer «Choose photo»): «Photo saved.» appears with a link to the wear photos.': 'Tippe unter der Skala auf «Foto machen» (am Computer «Foto wählen»): «Foto gespeichert.» erscheint mit einem Link zu den Verschleiss-Fotos.',
  },
};
