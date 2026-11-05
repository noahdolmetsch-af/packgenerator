// Gruss «Wi gahts?» A (Noah 05.11.2026 «alle umsetzen», Thread «Planen: Tagescheck mit Fragen»): mehr Knöpfe, sofort speichern, gestern markiert
export default {
  title: 'More buttons behind the greeting, saved as you tap',
  lead: 'Tap the greeting on Today: besides the five faces there are more buttons for energy and feelings, and every tap is saved at once.',
  points: [{ text: 'Greeting: «More» opens about 17 more buttons (energy, feelings), as many as you like at once', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }, { sel: '[data-hello-more]' }], where: 'Today › the greeting at the top › «More».' } }],
  small: [
    { box: 'nicer', text: 'Every tap is saved at once, no «Save» needed; «Done» just closes' },
    { box: 'nicer', text: 'Yesterday’s answer is marked quietly with a dashed frame' },
  ],
  test: [
    'Open Today and tap the greeting at the top: the five faces are there, under them «More».',
    'Tap «More», choose «Calm» and «Grateful»: both stay marked. Tap «Done».',
    'Open Me › Data › History: «Wi gaht\'s?» shows your face and the feelings you chose.',
  ],
  since: [],
  de: {
    'More buttons behind the greeting, saved as you tap': 'Mehr Knöpfe hinter dem Gruss, gespeichert beim Tippen',
    'Tap the greeting on Today: besides the five faces there are more buttons for energy and feelings, and every tap is saved at once.': 'Tippe auf Heute den Gruss an: neben den fünf Gesichtern gibt es mehr Knöpfe für Energie und Gefühle, und jeder Tipp wird sofort gespeichert.',
    'Greeting: «More» opens about 17 more buttons (energy, feelings), as many as you like at once': 'Gruss: «Mehr» öffnet etwa 17 weitere Knöpfe (Energie, Gefühle), beliebig viele auf einmal',
    'Today › the greeting at the top › «More».': 'Heute › der Gruss oben › «Mehr».',
    'Every tap is saved at once, no «Save» needed; «Done» just closes': 'Jeder Tipp wird sofort gespeichert, kein «Speichern» nötig; «Fertig» schliesst nur',
    'Yesterday’s answer is marked quietly with a dashed frame': 'Die Antwort von gestern ist ruhig mit gestricheltem Rahmen markiert',
    'Open Today and tap the greeting at the top: the five faces are there, under them «More».': 'Öffne Heute und tippe oben auf den Gruss: die fünf Gesichter sind da, darunter «Mehr».',
    'Tap «More», choose «Calm» and «Grateful»: both stay marked. Tap «Done».': 'Tippe «Mehr», wähle «Ruhig» und «Dankbar»: beide bleiben markiert. Tippe «Fertig».',
    'Open Me › Data › History: «Wi gaht\'s?» shows your face and the feelings you chose.': 'Öffne Ich › Daten › Verlauf: «Wi gaht\'s?» zeigt dein Gesicht und die gewählten Gefühle.',
  },
};
