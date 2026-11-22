// «KI entfernen, Schritt 8» (Noah 20.11.2026 «a»): der kleine Server hat keine KI-Aufgabe mehr
export default {
  title: 'The server no longer asks any AI',
  lead: 'The small server has no job for Claude or Gemini any more, and the watcher no longer checks them.',
  points: [
    { text: 'The server part for Claude and Gemini is removed; nothing in the app calls it any more', go: null },
    { text: 'The daily check of the server no longer looks at AI credit or an AI test question', go: null },
    { text: 'Reminders on the phone only need the Strava connection now (the old helper code is not read any more)', go: { href: '#/me/push', where: 'Me › Reminders on the phone.' } },
  ],
  small: [],
  test: [
    'Open Me › Reminders on the phone: «Copy the address for cron-job.org» still gives an address when Strava is connected.',
    'Open Today: everything shows as before.',
  ],
  since: [],
  de: {
    'The server no longer asks any AI': 'Der Server fragt keine KI mehr',
    'The small server has no job for Claude or Gemini any more, and the watcher no longer checks them.': 'Der kleine Server hat keine Aufgabe für Claude oder Gemini mehr, und der Wächter prüft sie nicht mehr.',
    'The server part for Claude and Gemini is removed; nothing in the app calls it any more': 'Der Server-Teil für Claude und Gemini ist entfernt; nichts in der App ruft ihn mehr auf',
    'The daily check of the server no longer looks at AI credit or an AI test question': 'Die tägliche Prüfung des Servers schaut nicht mehr auf KI-Guthaben oder eine KI-Testfrage',
    'Reminders on the phone only need the Strava connection now (the old helper code is not read any more)': 'Erinnerungen auf dem Handy brauchen jetzt nur noch die Strava-Verbindung (der alte Helfer-Code wird nicht mehr gelesen)',
    'Me › Reminders on the phone.': 'Ich › Erinnerungen aufs Handy.',
    'Open Me › Reminders on the phone: «Copy the address for cron-job.org» still gives an address when Strava is connected.': 'Öffne Ich › Erinnerungen aufs Handy: «Adresse für cron-job.org kopieren» gibt weiter eine Adresse, wenn Strava verbunden ist.',
    'Open Today: everything shows as before.': 'Öffne Heute: alles zeigt sich wie vorher.',
  },
};
