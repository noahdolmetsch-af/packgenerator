// «Zurück am Eingang» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»)
export default {
  title: 'Back never leaves the app',
  lead: 'Open a link into the app and tap Back: you land on Today, not outside the app.',
  points: [
    { text: 'A link or bookmark that opens a page deep in the app now has Today behind it, so Back leads to Today', go: { href: '#/', where: 'Open a bookmark of any page, then use the Back button.' } },
  ],
  small: [],
  test: [
    'Open a page of the app from a bookmark or a link (for example Me › Weight), not from Today.',
    'Use Back (arrow of the browser or phone): you are on Today.',
  ],
  since: [],
  de: {
    'Back never leaves the app': 'Zurück führt nie aus der App hinaus',
    'Open a link into the app and tap Back: you land on Today, not outside the app.': 'Öffne einen Link in die App und tippe Zurück: Du landest auf Heute und nicht ausserhalb der App.',
    'A link or bookmark that opens a page deep in the app now has Today behind it, so Back leads to Today': 'Hinter einem Link oder Lesezeichen, das eine Seite tief in der App öffnet, steht jetzt Heute, darum führt Zurück auf Heute',
    'Open a bookmark of any page, then use the Back button.': 'Ein Lesezeichen einer Seite öffnen, dann auf Zurück tippen.',
    'Open a page of the app from a bookmark or a link (for example Me › Weight), not from Today.': 'Öffne eine Seite der App über ein Lesezeichen oder einen Link (zum Beispiel Ich › Gewicht), nicht über Heute.',
    'Use Back (arrow of the browser or phone): you are on Today.': 'Tippe auf Zurück (Pfeil des Browsers oder Handys): Du bist auf Heute.',
  },
};
