// «Meilensteine aktiver machen» PR 3 (Noah 01.11.2026 «3a»): the star window with sayings, fitting stage names and the tone switch
export default {
  title: 'A livelier new star',
  lead: 'The star window now has a saying, a stage name that fits your sport and the next star. The tone is yours: Off, Calm or Funny',
  points: [
    { text: 'The «New star» window shows a saying, a stage name that fits the sport and how far the next star is', go: { href: '#/', steps: [{ sel: '[data-section="acts"]' }], where: 'Appears after a tick that reaches a new star.' } },
    { text: 'The tone switch «Off · Calm · Funny» is in the star window and on every sport page; it also sets the words of «Not for a while»', go: { href: '#/flow/sports', where: 'Open a sport under Active › My sports: «Tone of the app».' } },
  ],
  test: ['Open a sport under Active › My sports: «Tone of the app» shows Off, Calm and Funny.', 'Pick «Calm» and then «Off» and see the choice stay.'],
  since: [],
  de: {
    'A livelier new star': 'Ein lebendigerer neuer Stern',
    'The star window now has a saying, a stage name that fits your sport and the next star. The tone is yours: Off, Calm or Funny': 'Das Stern-Fenster hat jetzt einen Spruch, einen Stufen-Namen, der zu deiner Sportart passt, und den nächsten Stern. Den Ton bestimmst du: Aus, Ruhig oder Lustig',
    'The «New star» window shows a saying, a stage name that fits the sport and how far the next star is': 'Das Fenster «Neuer Stern» zeigt einen Spruch, einen Stufen-Namen, der zur Sportart passt, und wie weit der nächste Stern ist',
    'Appears after a tick that reaches a new star.': 'Erscheint nach einem Haken, der einen neuen Stern bringt.',
    'The tone switch «Off · Calm · Funny» is in the star window and on every sport page; it also sets the words of «Not for a while»': 'Der Ton-Regler «Aus · Ruhig · Lustig» ist im Stern-Fenster und auf jeder Sportart-Seite; er bestimmt auch die Worte von «Schon lange nicht»',
    'Open a sport under Active › My sports: «Tone of the app».': 'Öffne eine Sportart unter Aktiv › Meine Sportarten: «Ton der App».',
    'Open a sport under Active › My sports: «Tone of the app» shows Off, Calm and Funny.': 'Öffne eine Sportart unter Aktiv › Meine Sportarten: «Ton der App» zeigt Aus, Ruhig und Lustig.',
    'Pick «Calm» and then «Off» and see the choice stay.': 'Wähle «Ruhig» und dann «Aus» und sieh, dass die Wahl bleibt.',
  },
};
