// «Tippfehler-Frage» Teil 2 bis 4 (Warteliste 6; Noah 22.11.2026 «1-5 a»): the quiet line also under gear weight, the km counter and an own length
export default {
  title: 'The quiet question for more numbers',
  lead: 'The quiet line that asks «Did you mean …?» now also stands under the weight of a piece of gear, the km of the counter and an own length in minutes.',
  points: [
    { text: 'Gear weight: 32000 g asks «Did you mean 320 g?»', go: { href: '#/gear', where: 'Gear › add a new item › Weight: under the field, after you leave it.' } },
    { text: 'Log km: a counter reading far above the last one asks which one you mean', go: null },
  ],
  small: [],
  test: [
    'Open Gear, add a new item, type 32000 in the weight and leave the field: the line asks «Did you mean 320 g?».',
    'Tap «Yes, 320 g»: the field shows 320.',
  ],
  since: [],
  de: {
    'The quiet question for more numbers': 'Die leise Frage bei mehr Zahlen',
    'The quiet line that asks «Did you mean …?» now also stands under the weight of a piece of gear, the km of the counter and an own length in minutes.': 'Die leise Zeile «Meintest du …?» steht jetzt auch unter dem Gewicht eines Gegenstands, dem Kilometerstand und einer eigenen Dauer in Minuten.',
    'Gear weight: 32000 g asks «Did you mean 320 g?»': 'Material-Gewicht: 32000 g fragt «Meintest du 320 g?»',
    'Gear › add a new item › Weight: under the field, after you leave it.': 'Material › Gegenstand neu › Gewicht: unter dem Feld, wenn du es verlässt.',
    'Log km: a counter reading far above the last one asks which one you mean': 'Kilometer eintragen: ein Zählerstand weit über dem letzten fragt, welchen du meinst',
    'Open Gear, add a new item, type 32000 in the weight and leave the field: the line asks «Did you mean 320 g?».': 'Material öffnen, einen Gegenstand neu anlegen, 32000 im Gewicht tippen und das Feld verlassen: die Zeile fragt «Meintest du 320 g?».',
    'Tap «Yes, 320 g»: the field shows 320.': '«Ja, 320 g» antippen: das Feld zeigt 320.',
  },
};
