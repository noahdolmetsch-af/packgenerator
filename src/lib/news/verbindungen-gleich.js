// UI-Test 26.10.2026 T9 «Verbindungen gleich» (G1-07, G1-10, G5-05): Google, Trello, Mail and Fitbit name the device key «unlock this device (once)» instead of «connect Strava first»; the Strava tile shows rides already in the app; Connections says «not connected on this device · last fetch»; Woche planen says whether Google Calendar is connected
export default {
  title: 'Connections the same everywhere',
  lead: 'Every page says the same about Strava, Fitbit and Google.',
  points: [{ text: 'Google, Trello and Mail ask to unlock this device once instead of «Connect Strava first»', href: '#/me/connections', go: 'f.connections' }, { text: 'Plan the week says whether your Google Calendar is connected and how many dates it has', href: '#/week/plan', go: 'f.weekplan' }],
  small: [{ box: 'nicer', text: 'The Strava tile on Today shows your last ride even before this device is connected', go: 'f.strava' }],
  test: ['Me › Connections: Strava and Fitbit say the same as on their own pages.', 'Plan the week, step 1: with Google Calendar on it says «From your Google Calendar: …».'],
  since: [],
  de: {
    'Connections the same everywhere': 'Verbindungen überall gleich',
    'Every page says the same about Strava, Fitbit and Google.': 'Jede Seite sagt dasselbe über Strava, Fitbit und Google.',
    'Google, Trello and Mail ask to unlock this device once instead of «Connect Strava first»': 'Google, Trello und Mail bitten, das Gerät einmal freizuschalten, statt «Zuerst Strava verbinden»',
    'Plan the week says whether your Google Calendar is connected and how many dates it has': 'Woche planen sagt, ob dein Google Kalender verbunden ist und wie viele Termine er hat',
    'The Strava tile on Today shows your last ride even before this device is connected': 'Die Strava-Kachel auf Heute zeigt deine letzte Fahrt, auch bevor dieses Gerät verbunden ist',
    'Me › Connections: Strava and Fitbit say the same as on their own pages.': 'Ich › Verbindungen: Strava und Fitbit sagen dasselbe wie auf ihren eigenen Seiten.',
    'Plan the week, step 1: with Google Calendar on it says «From your Google Calendar: …».': 'Woche planen, Schritt 1: Ist der Google Kalender an, steht «Aus deinem Google Kalender: …».',
  },
};
