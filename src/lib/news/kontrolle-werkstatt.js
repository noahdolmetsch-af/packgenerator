// Noah 21.11.2026 «Kontrolle zur Werkstatt» (Thread «App-Landkarte», Festlegung im Thread «Training erfassen»)
export default {
  title: 'After the inspection: where the points went',
  lead: 'After «Done» on an inspection, the page shows links to the points and to the wishlist.',
  points: [{ text: 'Inspection page: «See 2 points» and «See wishlist» after «Done»', go: { href: '#/bikes?tab=care&view=inspect', where: 'Shows on Bikes › Care › a bike › Inspection, right after you finished a check that made problems or wishes.' } }],
  small: [],
  test: ['Start a quick check, mark one point «Bike shop» and tap «Done».', 'Above the start buttons tap «See 1 point»: the care page of the bike opens with the problem.'],
  since: [],
  de: {
    'After the inspection: where the points went': 'Nach der Inspektion: wohin die Punkte gingen',
    'After «Done» on an inspection, the page shows links to the points and to the wishlist.': 'Nach «Fertig» bei einer Inspektion zeigt die Seite Links zu den Punkten und zur Wunschliste.',
    'Inspection page: «See 2 points» and «See wishlist» after «Done»': 'Inspektion: «2 Punkte ansehen» und «Wunschliste ansehen» nach «Fertig»',
    'Shows on Bikes › Care › a bike › Inspection, right after you finished a check that made problems or wishes.': 'Zeigt sich auf Velos › Pflege › ein Velo › Inspektion, direkt nachdem du eine Kontrolle beendet hast, die Probleme oder Wünsche ergab.',
    'Start a quick check, mark one point «Bike shop» and tap «Done».': 'Starte einen Kurzcheck, markiere einen Punkt mit «Velomech» und tippe «Fertig».',
    'Above the start buttons tap «See 1 point»: the care page of the bike opens with the problem.': 'Tippe über den Start-Knöpfen auf «1 Punkt ansehen»: Die Pflege-Seite des Velos öffnet sich mit dem Problem.',
  },
};
