// «Kleiderschrank einrichten» (Noah 21.11.2026 «1-5a 4b», Thread «Kleiderschrank wieder ins Zentrum rücken», Weg C)
export default {
  features: [
    { id: 'f.wardrobesetup', group: 'before', title: 'Set up wardrobe', text: 'Give every piece of clothing its temperature, layer and body zone, one piece after the other with one tap each, so that Today and the packing list can suggest the right clothes.', href: '#/wardrobe/setup', words: 'kleiderschrank einrichten kleider temperatur schicht zone zwiebel kälte warm kalt einordnen', moment: 'packen' },
  ],
  howto: { 'f.wardrobesetup': ['Open the wardrobe and tap «Set up wardrobe».', 'Check the suggested steps, layer and zone, then tap «Save and next».', 'Skip a piece you are unsure about; you can come back to it any time.'] },
  handbook: {
    'f.wardrobesetup': {
      on: 'Needs clothing in the wardrobe.',
      steps: ['Open the wardrobe and tap «Set up wardrobe».', 'Check the suggested steps, layer and zone, then tap «Save and next».', 'Skip a piece you are unsure about; you can come back to it any time.'],
      example: 'Example: a thin windbreaker gets «Cool» and «Mild» (5–20 °C), layer Mid, zone Upper body. Today then offers it at 8 °C.',
    },
  },
  home: { 'f.wardrobesetup': '#/wardrobe/setup' },
};
