// «Reifenprofil als Verschleiss» (Noah 03.11.2026 «b», Paket C «Das Velo lebt», Idee 16)
export default {
  title: 'Tyre tread wears down',
  lead: 'On the wear page a small drawing of the tyre tread gets smoother with the km.',
  points: [
    { text: 'Bikes › Care › Wear: the tyres show their tread; the more km, the lower the blocks', go: { href: '#/bikes?tab=care&view=wear', where: 'Bikes › Care › Wear, on the row «Tyres + sealant» (needs a start point).' } },
    { text: 'The same drawing in the short wear view on the care page of a bike', go: { href: '#/bikes?tab=care', where: 'Bikes › Care › a bike › «Wear», when the tyres are among its three most worn parts.' } },
  ],
  small: [{ box: 'new', text: 'The drawing has a text («Tread: 25 % left»); the bar and the km say the same in numbers' }],
  test: ['Open Bikes › Care › Wear: the row «Tyres + sealant» shows a row of tread blocks.', 'A tyre with few km shows high blocks, one near its limit almost smooth ones.'],
  since: [],
  de: {
    'Tyre tread wears down': 'Reifenprofil wird glatter',
    'On the wear page a small drawing of the tyre tread gets smoother with the km.': 'Auf der Verschleissseite wird eine kleine Zeichnung des Reifenprofils mit den km glatter.',
    'Bikes › Care › Wear: the tyres show their tread; the more km, the lower the blocks': 'Velos › Pflege › Verschleiss: Die Reifen zeigen ihr Profil; je mehr km, desto flacher die Blöcke',
    'Bikes › Care › Wear, on the row «Tyres + sealant» (needs a start point).': 'Velos › Pflege › Verschleiss, in der Zeile «Reifen + Dichtmilch» (braucht einen Startwert).',
    'The same drawing in the short wear view on the care page of a bike': 'Dieselbe Zeichnung in der kurzen Verschleiss-Ansicht auf der Pflegeseite eines Velos',
    'Bikes › Care › a bike › «Wear», when the tyres are among its three most worn parts.': 'Velos › Pflege › ein Velo › «Verschleiss», wenn die Reifen zu den drei am meisten abgenutzten Teilen gehören.',
    'The drawing has a text («Tread: 25 % left»); the bar and the km say the same in numbers': 'Die Zeichnung hat einen Text («Profil: noch 25 %»); der Balken und die km sagen dasselbe in Zahlen',
    'Open Bikes › Care › Wear: the row «Tyres + sealant» shows a row of tread blocks.': 'Öffne Velos › Pflege › Verschleiss: Die Zeile «Reifen + Dichtmilch» zeigt eine Reihe Profilblöcke.',
    'A tyre with few km shows high blocks, one near its limit almost smooth ones.': 'Ein Reifen mit wenigen km zeigt hohe Blöcke, einer kurz vor der Grenze fast glatte.',
  },
};
