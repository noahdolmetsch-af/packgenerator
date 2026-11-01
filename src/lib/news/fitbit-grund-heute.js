// Fitbit: the line on Heute names the reason of a failed fetch (too slow, no connection, busy) instead of one sentence for everything
export default {
  title: 'Fitbit says why a fetch failed',
  lead: 'Today names the reason when Fitbit could not be fetched.',
  points: [{ text: 'The Fitbit line on Today says whether it was too slow, there was no connection or Google was busy', href: '#/me/fitbit', go: 'f.fitbit' }],
  test: ['Today: when a Fitbit fetch fails, the body card says why.', 'Tap «To Fitbit»: the page shows the same reason and «Try again».'],
  since: [],
  de: {
    'Fitbit says why a fetch failed': 'Fitbit sagt, warum das Holen nicht klappte',
    'Today names the reason when Fitbit could not be fetched.': 'Heute nennt den Grund, wenn Fitbit nicht geholt werden konnte.',
    'The Fitbit line on Today says whether it was too slow, there was no connection or Google was busy': 'Die Fitbit-Zeile auf Heute sagt, ob es zu langsam war, keine Verbindung bestand oder Google ausgelastet war',
    'Today: when a Fitbit fetch fails, the body card says why.': 'Heute: Klappt das Holen von Fitbit nicht, nennt die Körper-Karte den Grund.',
    'Tap «To Fitbit»: the page shows the same reason and «Try again».': 'Tippe «Zu Fitbit»: Die Seite zeigt denselben Grund und «Nochmal versuchen».',
  },
};
