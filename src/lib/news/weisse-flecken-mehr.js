// «Weisse Flecken ausbauen» (Noah 27.11.2026 «1b 2a 3a 4a 5b» auf die Frage «Neuland oder Weisse Flecken?»)
export default {
  title: 'White spots: further, and where it is newest',
  lead: 'White spots nearby reach up to 100 km, or a radius you type, and say in which direction most is new.',
  points: [
    { text: 'The radius has 10, 25, 50, 75 and 100 km, or type your own (5 to 200 km)', go: { href: '#/trips/dreams?spots=1', steps: [{ sel: '[data-ws-radius]' }] } },
    { text: '«Where is the most new?» lists the directions with the most municipalities you have never been to', go: { href: '#/trips/dreams?spots=1', steps: [{ sel: '[data-white-spots]' }] } },
  ],
  small: [{ box: 'new', text: 'New ground › Municipalities has a link to White spots nearby, and the other way round; a place 50 km away or more hints at «Train there, bike home»' }],
  test: [
    'Open Trips › Dreams and scroll to «White spots nearby»: choose 100 km, the map grows.',
    'Type 60 in the field «Other radius»: the line above the map says 60 km.',
    'Under the map: «Where is the most new?» with the directions and how many places are open.',
  ],
  since: [],
  de: {
    'White spots: further, and where it is newest': 'Weisse Flecken: weiter hinaus und wo am meisten neu ist',
    'White spots nearby reach up to 100 km, or a radius you type, and say in which direction most is new.': 'Weisse Flecken in der Nähe reichen bis 100 km oder so weit, wie du eintippst, und sagen, in welcher Richtung am meisten neu ist.',
    'The radius has 10, 25, 50, 75 and 100 km, or type your own (5 to 200 km)': 'Der Umkreis hat 10, 25, 50, 75 und 100 km, oder tippe einen eigenen ein (5 bis 200 km)',
    '«Where is the most new?» lists the directions with the most municipalities you have never been to': '«Wo gibt es am meisten Neues?» nennt die Richtungen mit den meisten Gemeinden, in denen du noch nie warst',
    'New ground › Municipalities has a link to White spots nearby, and the other way round; a place 50 km away or more hints at «Train there, bike home»': 'Neuland › Gemeinden führt zu den Weissen Flecken und zurück; ein Ort ab 50 km Entfernung weist auf «Zug hin, Velo heim» hin',
    'Open Trips › Dreams and scroll to «White spots nearby»: choose 100 km, the map grows.': 'Öffne Touren › Träume und scrolle zu «Weisse Flecken in der Nähe»: wähle 100 km, die Karte wird grösser.',
    'Type 60 in the field «Other radius»: the line above the map says 60 km.': 'Tippe 60 ins Feld «Anderer Umkreis»: die Zeile über der Karte sagt 60 km.',
    'Under the map: «Where is the most new?» with the directions and how many places are open.': 'Unter der Karte: «Wo gibt es am meisten Neues?» mit den Richtungen und wie viele Orte offen sind.',
  },
};
