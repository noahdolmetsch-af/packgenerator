// «Wochenrückblick verbessern» (Noah 01.11.2026 «1a 2a 3c 4a 5c»): Fehler behoben, Detailseite je Beobachtung, mehr Kacheln, Notiz und Wochenziel
export default {
  title: 'Week in review: fixed and fuller',
  lead: 'The numbers now match your week, and there is more to see.',
  points: [
    { text: 'Hours count your Aktiv minutes too, and a running week is compared with the same days of the weeks before', go: { href: '#/flow/review', steps: [{ sel: '[data-wr="five"]' }] } },
    { text: 'Every observation opens «All numbers behind it»', go: { href: '#/flow/review', steps: [{ text: 'All numbers behind it' }] } },
    { text: 'New tiles: body values, heart rate zones, km per bike, weather and appointments', go: { href: '#/flow/review', steps: [{ sel: '[data-wr="body"]' }] } },
  ],
  small: [
    { box: 'new', text: 'My note and a goal for next week', go: { href: '#/flow/review', steps: [{ sel: '[data-wr="note"]' }] } },
    { box: 'new', text: 'Two new kinds of observations: body values, weather and moving', go: { href: '#/flow/review', steps: [{ sel: '[data-wr="obs"]' }] } },
    { box: 'nicer', text: 'The observations are fixed only after Sunday, so a late ride still counts' },
  ],
  test: ['Open Aktiv › Week › Week in review: «Hours» no longer says 0 h when you noted minutes in Aktiv, and the change names «the same days of the week before».', 'Under «3 observations» tap «All numbers behind it»: the chart, the numbers and how it was worked out.', 'Scroll down: «Body this week», «Weather and appointments» and «My note and my goal»; write a note and a goal for next week.'],
  since: [],
  de: {
    'Week in review: fixed and fuller': 'Wochenrückblick: korrigiert und voller',
    'The numbers now match your week, and there is more to see.': 'Die Zahlen passen jetzt zu deiner Woche, und es gibt mehr zu sehen.',
    'Hours count your Aktiv minutes too, and a running week is compared with the same days of the weeks before': 'Stunden zählen auch deine Aktiv-Minuten, und eine laufende Woche wird mit den gleichen Tagen der Wochen davor verglichen',
    'Every observation opens «All numbers behind it»': 'Jede Beobachtung öffnet «Alle Zahlen dahinter»',
    'New tiles: body values, heart rate zones, km per bike, weather and appointments': 'Neue Kacheln: Körperwerte, Pulszonen, km pro Velo, Wetter und Termine',
    'My note and a goal for next week': 'Meine Notiz und ein Ziel für die nächste Woche',
    'Two new kinds of observations: body values, weather and moving': 'Zwei neue Arten von Beobachtungen: Körperwerte, Wetter und Bewegung',
    'The observations are fixed only after Sunday, so a late ride still counts': 'Die Beobachtungen werden erst nach Sonntag festgehalten, so zählt auch eine spät synchronisierte Fahrt',
    'Open Aktiv › Week › Week in review: «Hours» no longer says 0 h when you noted minutes in Aktiv, and the change names «the same days of the week before».': 'Öffne Aktiv › Woche › Wochenrückblick: «Stunden» sagt nicht mehr 0 h, wenn du in Aktiv Minuten notiert hast, und die Veränderung nennt «die gleichen Tage der Woche davor».',
    'Under «3 observations» tap «All numbers behind it»: the chart, the numbers and how it was worked out.': 'Tippe unter «3 Beobachtungen» auf «Alle Zahlen dahinter»: das Diagramm, die Zahlen und wie gerechnet wurde.',
    'Scroll down: «Body this week», «Weather and appointments» and «My note and my goal»; write a note and a goal for next week.': 'Scrolle nach unten: «Körper diese Woche», «Wetter und Termine» und «Meine Notiz und mein Ziel»; schreibe eine Notiz und ein Ziel für die nächste Woche.',
  },
};
