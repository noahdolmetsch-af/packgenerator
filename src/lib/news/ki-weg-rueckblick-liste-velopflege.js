// «KI entfernen, Schritt 2» (Noah 20.11.2026 «a»): kein Rückblick-Entwurf, keine Listenprüfung, keine KI-Vorschläge in der Velopflege
export default {
  title: 'No more AI drafts in debrief, packing list and bike care',
  lead: 'The debrief, the packing list and bike care work without Claude: your own notes, your own rules.',
  points: [
    { text: 'The debrief no longer has «Get a draft»; you write your learnings yourself', go: { href: '#/debrief', where: 'Debrief: the notes on the way and your own learnings.' } },
    { text: 'The packing list menu no longer has «Check the list»; the hints from your earlier tours stay', go: { href: '#/pack', where: 'Packing: the ••• menu of the list.' } },
    { text: 'Bike care shows «Due now» from your own km and intervals only', go: { href: '#/bikes?tab=care', where: 'Bikes › Care: the list «Due now».' } },
  ],
  small: [],
  test: [
    'Open a debrief and the «How was it?» part: there is no «Get a draft» button, the notes on the way are still there.',
    'Open Packing and the ••• menu of the list: there is no «Check the list».',
    'Open Bikes › Care: «Due now» shows only your own parts, without Claude suggestions.',
  ],
  since: [],
  de: {
    'No more AI drafts in debrief, packing list and bike care': 'Keine KI-Entwürfe mehr in Rückblick, Packliste und Velopflege',
    'The debrief, the packing list and bike care work without Claude: your own notes, your own rules.': 'Rückblick, Packliste und Velopflege arbeiten ohne Claude: deine Notizen, deine Regeln.',
    'The debrief no longer has «Get a draft»; you write your learnings yourself': 'Im Rückblick gibt es kein «Entwurf holen» mehr; deine Lernpunkte schreibst du selbst',
    'Debrief: the notes on the way and your own learnings.': 'Rückblick: die Notizen unterwegs und deine eigenen Lernpunkte.',
    'The packing list menu no longer has «Check the list»; the hints from your earlier tours stay': 'Im Menü der Packliste gibt es kein «Liste prüfen» mehr; die Hinweise aus deinen früheren Touren bleiben',
    'Packing: the ••• menu of the list.': 'Packen: das ••• Menü der Liste.',
    'Bike care shows «Due now» from your own km and intervals only': 'Die Velopflege zeigt «Jetzt fällig» nur aus deinen eigenen km und Intervallen',
    'Bikes › Care: the list «Due now».': 'Velos › Pflege: die Liste «Jetzt fällig».',
    'Open a debrief and the «How was it?» part: there is no «Get a draft» button, the notes on the way are still there.': 'Öffne einen Rückblick und den Teil «Wie war\'s?»: es gibt keinen Knopf «Entwurf holen», die Notizen unterwegs sind noch da.',
    'Open Packing and the ••• menu of the list: there is no «Check the list».': 'Öffne Packen und das ••• Menü der Liste: es gibt kein «Liste prüfen».',
    'Open Bikes › Care: «Due now» shows only your own parts, without Claude suggestions.': 'Öffne Velos › Pflege: «Jetzt fällig» zeigt nur deine eigenen Teile, ohne Claude-Vorschläge.',
  },
};
