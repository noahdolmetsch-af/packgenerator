// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 17: the curves after the ride (elevation, heart rate, power) follow the same rules as the other charts
export default {
  title: 'After the ride: the curves you can point at',
  lead: 'The elevation, heart rate and power curves of a ride show exact values per moment and a table.',
  points: [
    { text: 'Point at the curve for the time and the value; tap it for the moment', href: '#/live', go: { href: '#/live', where: 'Live › end a ride › the curves under «Ø power»: Elevation profile, Heart rate and Power.' } },
    { text: '«As table» lists the values along the ride', href: '#/live', go: { href: '#/live', where: 'Live › end a ride › a curve › «As table».' } },
  ],
  test: [
    'Finish a ride with Live and open the curves after it: point at the elevation curve, the time and the metres appear above it.',
    'Tap the curve: a window shows the value at that moment, the average and the highest value; «Earlier one» and «Later one» walk along the ride.',
    'Tap «As table»: the times are listed with their values.',
  ],
  since: [],
  de: {
    'After the ride: the curves you can point at': 'Nach der Fahrt: die Kurven zum Antippen',
    'The elevation, heart rate and power curves of a ride show exact values per moment and a table.': 'Die Kurven von Höhe, Puls und Leistung einer Fahrt zeigen genaue Werte pro Moment und eine Tabelle.',
    'Point at the curve for the time and the value; tap it for the moment': 'Zeig auf die Kurve für Zeit und Wert; tippe sie an für den Moment',
    '«As table» lists the values along the ride': '«Als Tabelle» listet die Werte entlang der Fahrt',
    'Live › end a ride › the curves under «Ø power»: Elevation profile, Heart rate and Power.': 'Live › Fahrt beenden › die Kurven unter «Ø Leistung»: Höhenprofil, Puls und Leistung.',
    'Live › end a ride › a curve › «As table».': 'Live › Fahrt beenden › eine Kurve › «Als Tabelle».',
    'Finish a ride with Live and open the curves after it: point at the elevation curve, the time and the metres appear above it.': 'Beende eine Fahrt mit Live und schau die Kurven danach an: zeig auf die Höhenkurve, Zeit und Meter stehen darüber.',
    'Tap the curve: a window shows the value at that moment, the average and the highest value; «Earlier one» and «Later one» walk along the ride.': 'Tippe die Kurve an: ein Fenster zeigt den Wert in diesem Moment, den Durchschnitt und den höchsten Wert; «Der davor» und «Der danach» führen durch die Fahrt.',
    'Tap «As table»: the times are listed with their values.': 'Tippe «Als Tabelle»: die Zeiten stehen mit ihren Werten da.',
  },
};
