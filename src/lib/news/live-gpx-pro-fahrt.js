// Noah 28.10.2026 «bei jedem Betätigen der Buttons den jeweiligen Use Case berücksichtigen» (answer a «Ohne Route starten»).
export default {
  title: 'Each ride its own GPX',
  lead: 'A trip without a route starts on the live map without one. Your last GPX is only offered.',
  points: [{ text: 'A trip without a route no longer gets an old GPX', href: '#/live', go: 'f.live' }],
  small: [{ box: 'nicer', text: '«Load for this ride» takes your last GPX for this ride', go: 'f.live' }],
  test: ['Plan a new trip without a GPX and open its live map: there is no route, and «Load for this ride» offers your last GPX.', 'Tap «Load for this ride»: the route is there for this trip only.'],
  since: [],
  de: {
    'Each ride its own GPX': 'Jede Fahrt ihre eigene GPX',
    'A trip without a route starts on the live map without one. Your last GPX is only offered.': 'Eine Tour ohne Route startet auf der Live-Karte ohne Route. Deine letzte GPX wird nur angeboten.',
    'A trip without a route no longer gets an old GPX': 'Eine Tour ohne Route bekommt keine alte GPX mehr',
    '«Load for this ride» takes your last GPX for this ride': '«Für diese Fahrt laden» nimmt deine letzte GPX für diese Fahrt',
    'Plan a new trip without a GPX and open its live map: there is no route, and «Load for this ride» offers your last GPX.': 'Eine neue Tour ohne GPX planen und ihre Live-Karte öffnen: Es gibt keine Route, und «Für diese Fahrt laden» bietet deine letzte GPX an.',
    'Tap «Load for this ride»: the route is there for this trip only.': '«Für diese Fahrt laden» antippen: Die Route gilt jetzt nur für diese Tour.',
  },
};
