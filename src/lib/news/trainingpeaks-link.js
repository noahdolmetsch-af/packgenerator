// «TrainingPeaks-Link» (Noah 21.11.2026): his real calendar link was refused; the server now follows the redirects of
// TrainingPeaks, names the reason and the answer number, and the calendar file can be read by hand
export default {
  title: 'TrainingPeaks link: clearer answer, calendar file as a way out',
  lead: 'If TrainingPeaks does not give the calendar to the app, it now says why, and you can read the calendar file by hand.',
  points: [
    { text: 'The card «TrainingPeaks plan» says why a link does not work (with the answer number) instead of one general message', go: { href: '#/me/connections', where: 'Me › Connections › TrainingPeaks plan, when the link is tested or fetched again.' } },
    { text: 'New: «Choose the calendar file» reads a calendar file (.ics) from your device once, as a way out when the link does not work', go: { href: '#/me/connections', where: 'Me › Connections › TrainingPeaks plan, the block «Does the link not work?».' } },
  ],
  small: [{ box: 'new', text: 'The server follows up to three redirects of TrainingPeaks, only on trainingpeaks.com' }],
  test: [
    'Open Me › Connections › TrainingPeaks plan and paste your calendar link, tap «Test and add».',
    'If it does not work, the message names the reason and the answer number.',
    'Tap «Choose the calendar file» and pick the .ics file: the planned sessions stand in Training › My week with «TP».',
  ],
  since: [],
  de: {
    'TrainingPeaks link: clearer answer, calendar file as a way out': 'TrainingPeaks-Link: klarere Antwort, Kalender-Datei als Ausweg',
    'If TrainingPeaks does not give the calendar to the app, it now says why, and you can read the calendar file by hand.': 'Gibt TrainingPeaks der App den Kalender nicht, sagt sie jetzt warum, und du kannst die Kalender-Datei von Hand einlesen.',
    'The card «TrainingPeaks plan» says why a link does not work (with the answer number) instead of one general message': 'Die Karte «TrainingPeaks-Plan» sagt, warum ein Link nicht geht (mit der Antwortzahl), statt einer allgemeinen Meldung',
    'Me › Connections › TrainingPeaks plan, when the link is tested or fetched again.': 'Ich › Verbindungen › TrainingPeaks-Plan, beim Testen oder erneuten Abrufen des Links.',
    'New: «Choose the calendar file» reads a calendar file (.ics) from your device once, as a way out when the link does not work': 'Neu: «Kalender-Datei wählen» liest eine Kalender-Datei (.ics) von deinem Gerät einmal ein, als Ausweg, wenn der Link nicht geht',
    'Me › Connections › TrainingPeaks plan, the block «Does the link not work?».': 'Ich › Verbindungen › TrainingPeaks-Plan, der Block «Geht der Link nicht?».',
    'The server follows up to three redirects of TrainingPeaks, only on trainingpeaks.com': 'Der Server folgt bis zu drei Weiterleitungen von TrainingPeaks, nur auf trainingpeaks.com',
    'Open Me › Connections › TrainingPeaks plan and paste your calendar link, tap «Test and add».': 'Öffne Ich › Verbindungen › TrainingPeaks-Plan, füge deinen Kalender-Link ein und tippe «Testen und hinzufügen».',
    'If it does not work, the message names the reason and the answer number.': 'Geht es nicht, nennt die Meldung den Grund und die Antwortzahl.',
    'Tap «Choose the calendar file» and pick the .ics file: the planned sessions stand in Training › My week with «TP».': 'Tippe «Kalender-Datei wählen» und wähle die .ics-Datei: Die geplanten Einheiten stehen in Training › Meine Woche mit «TP».',
  },
};
