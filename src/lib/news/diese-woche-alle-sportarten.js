// «Diese Woche» für alle Sportarten (Noah 22.11.2026 «1a 2a 3a 4a 5a», Thread «Alle Sportarten und Erholung», Schritt E)
export default {
  title: 'Every sport counts in «This week»',
  lead: 'The card «This week» on Today now counts a Strava sport without a tick as a day, like a ride or a ticked activity.',
  points: [
    { text: 'The card «This week» shows a dot and the name for a Strava sport without a tick (for example running) and counts its day as active', go: { href: '#/', steps: [{ sel: '[data-section="week"]' }], where: 'Today, the card «This week».' } },
  ],
  small: [
    { box: 'new', text: '«In focus»: the number of sessions of a ticked sport is smaller, so it never gets cut off', go: { href: '#/auswerten', where: 'Evaluate › Im Fokus.' } },
  ],
  test: [
    'Open Today: in the card «This week» a day with a Strava run without a tick shows a dot and «Laufen», and the line above counts that day as active.',
    'Open Evaluate: the card of a ticked sport in «Im Fokus» shows «2 Sitzungen» in full, with the time next to it.',
  ],
  since: [],
  de: {
    'Every sport counts in «This week»': 'Jede Sportart zählt in «Diese Woche»',
    'The card «This week» on Today now counts a Strava sport without a tick as a day, like a ride or a ticked activity.': 'Die Karte «Diese Woche» auf Heute zählt jetzt auch eine Strava-Sportart ohne Haken als Tag, wie eine Fahrt oder eine abgehakte Aktivität.',
    'The card «This week» shows a dot and the name for a Strava sport without a tick (for example running) and counts its day as active': 'Die Karte «Diese Woche» zeigt für eine Strava-Sportart ohne Haken (zum Beispiel Laufen) einen Punkt und den Namen und zählt den Tag als aktiv',
    '«In focus»: the number of sessions of a ticked sport is smaller, so it never gets cut off': '«Im Fokus»: die Zahl der Einheiten einer abgehakten Sportart ist kleiner, damit nichts abgeschnitten wird',
    'Open Today: in the card «This week» a day with a Strava run without a tick shows a dot and «Laufen», and the line above counts that day as active.': 'Öffne Heute: in der Karte «Diese Woche» zeigt ein Tag mit einem Strava-Lauf ohne Haken einen Punkt und «Laufen», und die Zeile darüber zählt den Tag als aktiv.',
    'Open Evaluate: the card of a ticked sport in «Im Fokus» shows «2 Sitzungen» in full, with the time next to it.': 'Öffne Auswerten: die Karte einer abgehakten Sportart in «Im Fokus» zeigt «2 Sitzungen» ganz, daneben die Zeit.',
  },
};
