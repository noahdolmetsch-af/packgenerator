// «TSS vom Gerät in Form, Trainingseffekt in der Fahrtenliste» (Noah 28.10.2026 «1a», thread «Geräte und Datenquellen»)
export default {
  title: 'Your bike computer counts in Form',
  lead: 'The TSS from a FIT file is the load of that ride, and the ride list shows its training effect.',
  points: [
    { text: 'Form: the TSS of your bike computer counts first', href: '#/flow/form', go: { href: '#/flow/stats/load', where: 'Body values › Activity › Load: the day of the ride' } },
    { text: 'Saved rides: training effect and TSS in the list', href: '#/debrief/ride', go: { href: '#/debrief/ride', where: 'Trips › Rides: under the name of a ride from a FIT file' } },
  ],
  small: [{ box: 'nicer', text: 'A ride from a FIT file and from Strava counts only once', go: null }],
  test: [
    'Open Touren › Fahrten: a ride from a FIT file shows «Trainingseffekt 3,4 / 1,2 · TSS 118» under its name.',
    'Open Auswerten › Körperwerte › Aktivität › Belastung: that day shows the TSS of the ride.',
  ],
  since: [],
  de: {
    'Body values › Activity › Load: the day of the ride': 'Körperwerte › Aktivität › Belastung: der Tag der Fahrt',
    'Trips › Rides: under the name of a ride from a FIT file': 'Touren › Fahrten: unter dem Namen einer Fahrt aus einer FIT-Datei',
    'Your bike computer counts in Form': 'Dein Velocomputer zählt in der Form',
    'The TSS from a FIT file is the load of that ride, and the ride list shows its training effect.': 'Die TSS aus einer FIT-Datei ist die Belastung dieser Fahrt, und die Fahrtenliste zeigt ihren Trainingseffekt.',
    'Form: the TSS of your bike computer counts first': 'Form: die TSS deines Velocomputers zählt zuerst',
    'Saved rides: training effect and TSS in the list': 'Gespeicherte Fahrten: Trainingseffekt und TSS in der Liste',
    'A ride from a FIT file and from Strava counts only once': 'Eine Fahrt aus FIT-Datei und Strava zählt nur einmal',
    'Open Touren › Fahrten: a ride from a FIT file shows «Trainingseffekt 3,4 / 1,2 · TSS 118» under its name.': 'Öffne Touren › Fahrten: eine Fahrt aus einer FIT-Datei zeigt unter dem Namen «Trainingseffekt 3,4 / 1,2 · TSS 118».',
    'Open Auswerten › Körperwerte › Aktivität › Belastung: that day shows the TSS of the ride.': 'Öffne Auswerten › Körperwerte › Aktivität › Belastung: dieser Tag zeigt die TSS der Fahrt.',
  },
};
