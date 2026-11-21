// «Höchste Tage» (Noah 07.11.2026 «alle A–F», Idee E): the three highest days of the range, named with what was recorded
export default {
  title: 'Your highest days, with names',
  lead: 'A new card lists the three highest days of the range and says what was recorded on them.',
  points: [{ text: 'See what you did on your highest days: trip, workout or ride', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-top-days]' }], where: 'Analyse › a value (e.g. Cardio load) › the card «Highest days» above «Per weekday».' } }],
  small: [{ box: 'new', text: 'A tap on a day opens it with all its values' }],
  test: ['Open Analyse › Cardio load (3 months): the card «Highest days» lists three days with their value.', 'Under each day stands the trip, the Fitbit workout or the ride of that day; tap a day to open it.'],
  since: [],
  de: {
    'Your highest days, with names': 'Deine höchsten Tage, mit Namen',
    'A new card lists the three highest days of the range and says what was recorded on them.': 'Eine neue Karte nennt die drei höchsten Tage des Zeitraums und sagt, was an ihnen erfasst wurde.',
    'See what you did on your highest days: trip, workout or ride': 'Sieh, was du an deinen höchsten Tagen gemacht hast: Tour, Training oder Fahrt',
    'Analyse › a value (e.g. Cardio load) › the card «Highest days» above «Per weekday».': 'Analyse › ein Wert (z. B. Cardio-Belastung) › die Karte «Höchste Tage» über «Pro Wochentag».',
    'A tap on a day opens it with all its values': 'Ein Tipp auf einen Tag öffnet ihn mit allen Werten',
    'Open Analyse › Cardio load (3 months): the card «Highest days» lists three days with their value.': 'Öffne Analyse › Cardio-Belastung (3 Monate): die Karte «Höchste Tage» nennt drei Tage mit ihrem Wert.',
    'Under each day stands the trip, the Fitbit workout or the ride of that day; tap a day to open it.': 'Unter jedem Tag steht die Tour, das Fitbit-Training oder die Fahrt dieses Tages; tippe einen Tag, um ihn zu öffnen.',
  },
};
