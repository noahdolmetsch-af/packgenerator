// «Eine Fahrt = ein Eintrag» (Noah 27.11.2026 «1a 2a 3a 4a», Thread «Wie war's? nach Fitbit-Aktivität reparieren»): Garmin via Strava and Fitbit never count one ride twice
export default {
  title: 'One ride, one entry',
  lead: 'When Garmin (via Strava) and your Fitbit both recorded the same ride, the app counts it once: Garmin wins, the chest strap measures better.',
  points: [
    { text: '«How was it?» and «Count?» do not ask about a workout of your watch that Strava has as well, even when the watch started late or cut the ride into pieces', go: 'f.feel' },
    { text: 'A plain walk that the watch recognised by itself is never asked and never counted', go: 'f.feel' },
  ],
  small: [{ box: 'new', text: 'The card for a watch workout no longer promises help for the plans; it says the answer stays on this device', go: 'f.feel' }],
  test: ['On Active (a ride that Strava and Fitbit both have): only one card «How was it?», from Strava.', 'A walk that your watch recognised by itself does not show a card.'],
  since: [],
  de: {
    'One ride, one entry': 'Eine Fahrt, ein Eintrag',
    'When Garmin (via Strava) and your Fitbit both recorded the same ride, the app counts it once: Garmin wins, the chest strap measures better.': 'Haben Garmin (über Strava) und dein Fitbit dieselbe Fahrt aufgezeichnet, zählt die App sie nur einmal: Garmin gewinnt, der Brustgurt misst besser.',
    '«How was it?» and «Count?» do not ask about a workout of your watch that Strava has as well, even when the watch started late or cut the ride into pieces': '«Wie war’s?» und «Zählen?» fragen nicht nach einem Training deiner Uhr, das Strava auch hat, auch wenn die Uhr zu spät gestartet ist oder die Fahrt in Stücke geteilt hat',
    'A plain walk that the watch recognised by itself is never asked and never counted': 'Ein einfacher Spaziergang, den die Uhr von selbst erkannt hat, wird nie gefragt und nie gezählt',
    'The card for a watch workout no longer promises help for the plans; it says the answer stays on this device': 'Die Karte für ein Training der Uhr verspricht nicht mehr Hilfe für die Pläne; sie sagt, dass die Antwort auf diesem Gerät bleibt',
    'On Active (a ride that Strava and Fitbit both have): only one card «How was it?», from Strava.': 'Auf Aktiv (bei einer Fahrt, die Strava und Fitbit beide haben): nur eine Karte «Wie war’s?», von Strava.',
    'A walk that your watch recognised by itself does not show a card.': 'Ein Spaziergang, den deine Uhr von selbst erkannt hat, zeigt keine Karte.',
  },
};
