// «Karte zoombar» (Noah 27.11.2026 zur Karte «Weisse Flecken in der Nähe») und «bei Mouseover erscheint der Name der Gemeinde / Kanton»
export default {
  title: 'White spots: zoom and names',
  lead: 'The map of white spots zooms like the New ground map, and a name shows when the mouse rests on a place.',
  points: [
    { text: 'Zoom the white spots map with + and −, Ctrl and the wheel, two fingers; the full screen fills the screen', go: { href: '#/trips/dreams?spots=1', steps: [{ sel: '[data-ws-map]' }] } },
    { text: 'On the computer, rest the mouse on a municipality of this map: its name shows', go: { href: '#/trips/dreams?spots=1', steps: [{ sel: '[data-ws-map]' }] } },
  ],
  small: [{ box: 'nicer', text: 'A tap on a place in the list zooms the white spots map there; the map is a little taller' }],
  test: [
    'Open Trips › Dreams, scroll to «White spots nearby» and tap + three times: the map zooms in.',
    'Tap «Never been» places in the list: the map jumps there and colours the place.',
    'On the computer, move the mouse over a municipality of the map: its name shows.',
  ],
  since: [],
  de: {
    'White spots: zoom and names': 'Weisse Flecken: Zoom und Namen',
    'The map of white spots zooms like the New ground map, and a name shows when the mouse rests on a place.': 'Die Karte der Weissen Flecken zoomt wie die Karte in Neuland, und ein Name erscheint, wenn die Maus auf einem Ort ruht.',
    'Zoom the white spots map with + and −, Ctrl and the wheel, two fingers; the full screen fills the screen': 'Zoome die Karte der Weissen Flecken mit + und −, Ctrl und Mausrad, zwei Fingern; der ganze Bildschirm füllt den Bildschirm',
    'On the computer, rest the mouse on a municipality of this map: its name shows': 'Am Computer: lass die Maus auf einer Gemeinde dieser Karte ruhen, ihr Name erscheint',
    'A tap on a place in the list zooms the white spots map there; the map is a little taller': 'Ein Tipp auf einen Ort in der Liste zoomt die Karte der Weissen Flecken dorthin; die Karte ist etwas höher',
    'Open Trips › Dreams, scroll to «White spots nearby» and tap + three times: the map zooms in.': 'Öffne Touren › Träume, scrolle zu «Weisse Flecken in der Nähe» und tippe dreimal auf +: die Karte zoomt hinein.',
    'Tap «Never been» places in the list: the map jumps there and colours the place.': 'Tippe in der Liste auf einen Ort «Noch nie besucht»: die Karte springt dorthin und färbt den Ort.',
    'On the computer, move the mouse over a municipality of the map: its name shows.': 'Fahre mit der Maus über eine Gemeinde: ihr Name erscheint; ebenso in Neuland auf der Karte.',
  },
};
