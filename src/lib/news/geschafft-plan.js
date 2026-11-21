// «Geplant und gemacht» (Noah 19.11.2026 «4a»): the page «Geschafft» shows the planned session next to what was done
export default {
  title: 'Planned and done side by side',
  lead: 'After a tick, «Done» shows the session you had planned for that day next to what you did.',
  points: [
    { text: 'The page «Done» shows «Planned 60 min, done 62 min» when a session was planned for that day', go: { href: '#/flow/geschafft', where: 'Active › Done, after ticking a sport you had planned for that day (a session in Training › My week or from TrainingPeaks).' } },
    { text: '«This week» shows the hours planned against the hours done, and a ride shows the planned zone next to the zone it spent most time in', go: { href: '#/flow/geschafft', where: 'Active › Done, under «This week» and in the card «This time» (needs a plan with hours, and for the zones a zone in the plan and a pulse from Strava).' } },
  ],
  small: [
    { box: 'new', text: 'Only both numbers, never «too short» or «on target»' },
  ],
  test: [
    'Plan a session for today in Training › My week (for example a ride, 60 min).',
    'Tick the same sport on Active, with 62 minutes (a ride from Strava or the stopwatch).',
    'Open «Done»: the line says «Planned 60 min, done 62 min».',
    'Under «This week» stands «Planned … h, done … h»; with a zone in the plan and a pulse from Strava, a second line names both zones.',
  ],
  since: [],
  de: {
    'Planned and done side by side': 'Geplant und gemacht nebeneinander',
    'After a tick, «Done» shows the session you had planned for that day next to what you did.': 'Nach dem Abhaken zeigt «Geschafft» die Einheit, die du für den Tag geplant hattest, neben dem, was du gemacht hast.',
    'The page «Done» shows «Planned 60 min, done 62 min» when a session was planned for that day': 'Die Seite «Geschafft» zeigt «Geplant 60 Min, gemacht 62 Min», wenn für den Tag eine Einheit geplant war',
    'Active › Done, after ticking a sport you had planned for that day (a session in Training › My week or from TrainingPeaks).': 'Aktiv › Geschafft, nach dem Abhaken einer Sportart, die du für den Tag geplant hattest (eine Einheit in Training › Meine Woche oder aus TrainingPeaks).',
    'Active › Done, under «This week» and in the card «This time» (needs a plan with hours, and for the zones a zone in the plan and a pulse from Strava).': 'Aktiv › Geschafft, unter «Diese Woche» und in der Karte «Dieses Mal» (braucht einen Plan mit Stunden, für die Zonen eine Zone im Plan und einen Puls aus Strava).',
    'Only both numbers, never «too short» or «on target»': 'Nur beide Zahlen, nie «zu kurz» oder «im Ziel»',
    'Plan a session for today in Training › My week (for example a ride, 60 min).': 'Plane in Training › Meine Woche eine Einheit für heute (zum Beispiel eine Fahrt, 60 Min).',
    'Tick the same sport on Active, with 62 minutes (a ride from Strava or the stopwatch).': 'Hake dieselbe Sportart in Aktiv ab, mit 62 Minuten (eine Fahrt aus Strava oder die Stoppuhr).',
    '«This week» shows the hours planned against the hours done, and a ride shows the planned zone next to the zone it spent most time in': '«Diese Woche» zeigt die geplanten Stunden neben den gemachten, und eine Fahrt zeigt die geplante Zone neben der Zone, in der sie die meiste Zeit war',
    'Under «This week» stands «Planned … h, done … h»; with a zone in the plan and a pulse from Strava, a second line names both zones.': 'Unter «Diese Woche» steht «Geplant … h, gemacht … h»; hat der Plan eine Zone und gibt es einen Puls aus Strava, nennt eine zweite Zeile beide Zonen.',
    'Open «Done»: the line says «Planned 60 min, done 62 min».': 'Öffne «Geschafft»: Die Zeile sagt «Geplant 60 Min, gemacht 62 Min».',
  },
};
