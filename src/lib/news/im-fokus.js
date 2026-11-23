// «Im Fokus» für alle Sportarten (Noah 22.11.2026 «1a 2a 3a 4a 5a», Thread «Alle Sportarten und Erholung», Schritt D)
export default {
  title: 'Every sport you did, in focus',
  lead: 'On Evaluate, «Im Fokus» and «Last 7 days» now show the sports you ticked in Active next to the Strava sports.',
  points: [
    { text: '«Im Fokus» has a card for each sport you ticked (tennis, ice hockey, gym …): the sessions, the time, one bar per day and the last four weeks as dots', go: { href: '#/auswerten', steps: [{ sel: '[data-focus]' }], where: 'Evaluate, at the top, swipe the cards.' } },
    { text: '«Last 7 days» lists them with the count and the time; a tap opens the look back at that sport', go: { href: '#/auswerten', steps: [{ sel: '[data-last7]' }], where: 'Evaluate, «Last 7 days» (on a phone behind «Overview and last 7 days»).' } },
  ],
  small: [
    { box: 'new', text: 'The time reads «about» when it is the usual duration of the sport; a session that is already a Strava activity counts once, as the Strava sport', go: { href: '#/auswerten', where: 'Evaluate › Im Fokus.' } },
  ],
  test: [
    'Open Evaluate: next to the Strava sports «Im Fokus» shows a card for each sport you ticked in the last 7 days (for example tennis).',
    'Swipe to a ticked sport: it shows the sessions, the time (with «etwa» when it is the usual duration), seven bars and the four weeks as dots.',
    'Open «Last 7 days» (on a phone behind the row «Overview and last 7 days») and tap «Tennis»: the look back at tennis opens.',
  ],
  since: [],
  de: {
    'Every sport you did, in focus': 'Jede Sportart im Fokus',
    'On Evaluate, «Im Fokus» and «Last 7 days» now show the sports you ticked in Active next to the Strava sports.': 'In Auswerten zeigen «Im Fokus» und «Letzte 7 Tage» jetzt auch die Sportarten, die du in Aktiv abgehakt hast, neben den Strava-Sportarten.',
    '«Im Fokus» has a card for each sport you ticked (tennis, ice hockey, gym …): the sessions, the time, one bar per day and the last four weeks as dots': '«Im Fokus» hat für jede abgehakte Sportart eine Karte (Tennis, Eishockey, Gym …): die Einheiten, die Zeit, ein Balken pro Tag und die letzten vier Wochen als Punkte',
    'Evaluate, at the top, swipe the cards.': 'Auswerten, ganz oben, die Karten durchwischen.',
    '«Last 7 days» lists them with the count and the time; a tap opens the look back at that sport': '«Letzte 7 Tage» listet sie mit Anzahl und Zeit; ein Tipp öffnet den Rückblick auf diese Sportart',
    'Evaluate, «Last 7 days» (on a phone behind «Overview and last 7 days»).': 'Auswerten, «Letzte 7 Tage» (am Handy hinter «Überblick und letzte 7 Tage»).',
    'The time reads «about» when it is the usual duration of the sport; a session that is already a Strava activity counts once, as the Strava sport': 'Die Zeit steht mit «etwa», wenn es die übliche Dauer der Sportart ist; eine Einheit, die schon eine Strava-Aktivität ist, zählt einmal, als Strava-Sportart',
    'Evaluate › Im Fokus.': 'Auswerten › Im Fokus.',
    'Open Evaluate: next to the Strava sports «Im Fokus» shows a card for each sport you ticked in the last 7 days (for example tennis).': 'Öffne Auswerten: neben den Strava-Sportarten zeigt «Im Fokus» für jede Sportart, die du in den letzten 7 Tagen abgehakt hast, eine Karte (zum Beispiel Tennis).',
    'Swipe to a ticked sport: it shows the sessions, the time (with «etwa» when it is the usual duration), seven bars and the four weeks as dots.': 'Wische zu einer abgehakten Sportart: sie zeigt die Einheiten, die Zeit (mit «etwa», wenn es die übliche Dauer ist), sieben Balken und die vier Wochen als Punkte.',
    'Open «Last 7 days» (on a phone behind the row «Overview and last 7 days») and tap «Tennis»: the look back at tennis opens.': 'Öffne «Letzte 7 Tage» (am Handy hinter der Zeile «Überblick und letzte 7 Tage») und tippe auf «Tennis»: der Rückblick auf Tennis öffnet sich.',
  },
};
