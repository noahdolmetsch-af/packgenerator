// «Muster-Taschen» (Noah 23.11.2026 «1-5a», Rundgang der Stärken, Station 3)
export default {
  title: 'Example bags in the sample race',
  lead: 'The sample race now shows what lies in which bag: three drawn example bags with label, contents and weight.',
  points: [
    { text: 'Race mode of the sample race: the box «What lies where» lists three example bags; a tap shows the picture', go: { href: '#/race/race-sample/ride', steps: [{ sel: '[data-race-box="ride-bags"]' }], where: 'Trips › Races › Sample race › On the way' } },
    { text: '«Delete the sample» takes the example bags away too; your own photos stay', go: null },
  ],
  small: [{ box: 'new', text: 'The tour of the strengths shows the bags at station 3' }],
  test: [
    'Open Trips › Races › Sample race › On the way: the box «What lies where» lists three bags marked «Example».',
    'Tap a bag: its drawn picture opens with the name, the contents and the weight.',
    'Tap «Reset the sample»: the three bags are as new again.',
  ],
  since: [],
  de: {
    'Example bags in the sample race': 'Beispiel-Taschen im Muster-Rennen',
    'The sample race now shows what lies in which bag: three drawn example bags with label, contents and weight.': 'Das Muster-Rennen zeigt jetzt, was in welcher Tasche liegt: drei gezeichnete Beispiel-Taschen mit Etikett, Inhalt und Gewicht.',
    'Race mode of the sample race: the box «What lies where» lists three example bags; a tap shows the picture': 'Rennmodus des Muster-Rennens: Der Kasten «Was liegt wo?» nennt drei Beispiel-Taschen; ein Tipp zeigt das Bild',
    '«Delete the sample» takes the example bags away too; your own photos stay': '«Muster löschen» nimmt die Beispiel-Taschen mit weg; deine eigenen Fotos bleiben',
    'The tour of the strengths shows the bags at station 3': 'Der Rundgang der Stärken zeigt die Taschen bei Station 3',
    'Trips › Races › Sample race › On the way': 'Touren › Rennen › Muster-Rennen › Unterwegs',
    'Open Trips › Races › Sample race › On the way: the box «What lies where» lists three bags marked «Example».': 'Öffne Touren › Rennen › Muster-Rennen › Unterwegs: Der Kasten «Was liegt wo?» nennt drei Taschen mit der Marke «Beispiel».',
    'Tap a bag: its drawn picture opens with the name, the contents and the weight.': 'Tippe auf eine Tasche: Ihr gezeichnetes Bild öffnet sich mit Name, Inhalt und Gewicht.',
    'Tap «Reset the sample»: the three bags are as new again.': 'Tippe auf «Muster zurücksetzen»: Die drei Taschen sind wieder wie neu.',
  },
};
