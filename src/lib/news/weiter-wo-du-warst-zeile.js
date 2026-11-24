// «Weiter, wo du warst»: die Zeile auf Heute führt auch zur laufenden Fahrt und zu Begonnenem (Noah 23.11.2026 «1-5a»)
export default {
  title: 'Where you left off, on Today',
  lead: 'The line on Today takes you back to a running ride and to what you began lately.',
  points: [
    { text: 'A running ride stands first: one tap opens the live view', go: { href: '#/', where: 'The line under the greeting on Today while a ride is recording.' } },
    { text: '«Not today any more» puts the line away for the day', go: { href: '#/', where: 'The small button under the line on Today.' } },
  ],
  small: [{ box: 'new', text: 'A trip without a date and a debrief you started show in the line for three days' }],
  test: [
    'Open Today. With a trip that waits, the line «Continue» stands under the greeting.',
    'Tap «Not today any more» under the line: it is gone, also after a reload.',
  ],
  since: [],
  de: {
    'Where you left off, on Today': 'Weiter, wo du warst, auf Heute',
    'The line on Today takes you back to a running ride and to what you began lately.': 'Die Zeile auf Heute führt dich zurück zu einer laufenden Fahrt und zu dem, was du zuletzt begonnen hast.',
    'A running ride stands first: one tap opens the live view': 'Eine laufende Fahrt steht zuerst: ein Tipp öffnet die Live-Ansicht',
    'The line under the greeting on Today while a ride is recording.': 'Die Zeile unter dem Gruss auf Heute, solange eine Fahrt aufzeichnet.',
    '«Not today any more» puts the line away for the day': '«Heute nicht mehr» legt die Zeile für den Tag weg',
    'The small button under the line on Today.': 'Der kleine Knopf unter der Zeile auf Heute.',
    'A trip without a date and a debrief you started show in the line for three days': 'Eine Tour ohne Datum und ein begonnener Rückblick stehen drei Tage in der Zeile',
    'Open Today. With a trip that waits, the line «Continue» stands under the greeting.': 'Öffne Heute. Wartet eine Tour, steht die Zeile «Weitermachen» unter dem Gruss.',
    'Tap «Not today any more» under the line: it is gone, also after a reload.': 'Tippe unter der Zeile «Heute nicht mehr»: Sie ist weg, auch nach dem Neuladen.',
  },
};
