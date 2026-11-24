// «Aktionen in Auswerten» (Noah 23.11.2026 «1-5a», 1a), Teil 2: «Jetzt nicht» bei den Tipps in Ideen sagt es und hat «Rückgängig»
export default {
  title: 'Not now says so, with Undo',
  lead: 'On «Ideas», «Not now» on a tip now shows a note «rests for 7 days» with «Undo».',
  points: [
    { text: 'On «Ideas», «Not now» on a tip says that it rests for 7 days, and «Undo» brings it back at once', go: { href: '#/flow/ideen', where: 'Look at «For your balance»: tap «Not now» under a tip (it shows once the app has days with values).' } },
  ],
  small: [],
  test: [
    'Open «Ideas» and tap «Not now» under a tip: a note says «… rests for 7 days.».',
    'Tap «Undo» in the note: the tip is back.',
  ],
  since: [],
  de: {
    'Not now says so, with Undo': '«Jetzt nicht» sagt es und hat «Rückgängig»',
    'On «Ideas», «Not now» on a tip now shows a note «rests for 7 days» with «Undo».': 'In «Ideen» zeigt «Jetzt nicht» bei einem Tipp jetzt einen Hinweis «ruht 7 Tage» mit «Rückgängig».',
    'On «Ideas», «Not now» on a tip says that it rests for 7 days, and «Undo» brings it back at once': 'In «Ideen» sagt «Jetzt nicht» bei einem Tipp, dass er 7 Tage ruht, und «Rückgängig» holt ihn sofort zurück',
    'Look at «For your balance»: tap «Not now» under a tip (it shows once the app has days with values).': 'Schau unter «Für deine Balance»: Tippe bei einem Tipp auf «Jetzt nicht» (es erscheint, sobald die App Tage mit Werten hat).',
    'Open «Ideas» and tap «Not now» under a tip: a note says «… rests for 7 days.».': 'Öffne «Ideen» und tippe bei einem Tipp auf «Jetzt nicht»: Ein Hinweis sagt «… ruht 7 Tage.».',
    'Tap «Undo» in the note: the tip is back.': 'Tippe im Hinweis auf «Rückgängig»: Der Tipp ist wieder da.',
  },
};
