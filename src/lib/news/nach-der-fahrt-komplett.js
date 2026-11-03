// Nachprüfung Bikepacking (Noah 27.10.2026): what was promised for «after the ride» on 20.10.2026 and still missing
export default {
  title: 'After the ride: height, laps and Strava values',
  lead: 'A ride without a route now has its climbing and elevation profile, and laps show their own pulse and power.',
  points: [
    { text: '«Your ride» shows the climbing from the phone’s GPS and the elevation profile above pulse and power', go: { href: '#/debrief/ride', where: 'Shows on the ride page after a recorded ride.' } },
    { text: 'Laps get their own Ø pulse and Ø power', go: { href: '#/debrief/ride', where: 'Shows on the ride page after a recorded ride.' } },
  ],
  small: [{ box: 'new', text: 'A Strava or Garmin ride at the same time fills in climbing, pulse and power the phone did not measure', go: { href: '#/debrief/ride', where: 'Shows on the ride page after a recorded ride.' } }],
  test: [
    'Ride with the live map without a route and end the ride: under «Deine Fahrt» are the Höhenmeter and the Höhenprofil.',
    'Tap «Neue Runde» during the ride: after the ride «Runden» lists each lap with km, time, Ø pulse and Ø power.',
  ],
  since: [],
  de: {
    'After the ride: height, laps and Strava values': 'Nach der Fahrt: Höhe, Runden und Strava-Werte',
    'A ride without a route now has its climbing and elevation profile, and laps show their own pulse and power.': 'Eine Fahrt ohne Strecke hat jetzt ihre Höhenmeter und ihr Höhenprofil, und Runden zeigen ihren eigenen Puls und ihre Leistung.',
    '«Your ride» shows the climbing from the phone’s GPS and the elevation profile above pulse and power': '«Deine Fahrt» zeigt die Höhenmeter aus dem GPS des Handys und das Höhenprofil über Puls und Leistung',
    'Laps get their own Ø pulse and Ø power': 'Runden haben ihren eigenen Ø-Puls und ihre Ø-Leistung',
    'A Strava or Garmin ride at the same time fills in climbing, pulse and power the phone did not measure': 'Eine Strava- oder Garmin-Fahrt zur selben Zeit ergänzt Höhenmeter, Puls und Leistung, die das Handy nicht gemessen hat',
    'Ride with the live map without a route and end the ride: under «Deine Fahrt» are the Höhenmeter and the Höhenprofil.': 'Fahre mit der Live-Karte ohne Strecke und beende die Fahrt: Unter «Deine Fahrt» stehen die Höhenmeter und das Höhenprofil.',
    'Tap «Neue Runde» during the ride: after the ride «Runden» lists each lap with km, time, Ø pulse and Ø power.': 'Tippe während der Fahrt auf «Neue Runde»: Nach der Fahrt zeigt «Runden» jede Runde mit km, Zeit, Ø-Puls und Ø-Leistung.',
  },
};
