// «Deine Gewohnheiten» (Noah 27.10.2026 «1a 2a und b 3b», thread «Heute ruhiger»): the card on top of Heute shows up
// to three chosen habits (activities of Aktiv or items of «Das tut mir gut»), not only meditation (src/lib/home/HabitCards.svelte)
export default {
  title: 'Your habits on top of Today',
  lead: 'Not only meditation.',
  points: [
    { text: 'The pencil on the card on top of Today chooses up to three habits: activities of Aktiv or items of «What does me good»', go: { href: '#/', where: 'Shows on top of Today once you choose habits.' } },
    { text: 'Each shows your last 7 days and ticks with one tap; meditation still starts its session', go: { href: '#/', where: 'Shows on top of Today once you choose habits.' } },
  ],
  small: [{ box: 'nicer', text: 'Move them with arrows or drag, also under «Customise the start page»; every change can be undone', go: { href: '#/', where: 'Shows on top of Today once you choose habits.' } }],
  test: [
    'Open Today and tap the pencil on the meditation card: the window «Which habits on top of Today?» opens.',
    'Add an activity (e.g. stretching) and an item of «What does me good», then «Done»: Today shows three cards; tap «Tick off» on the new one.',
  ],
  since: [],
  de: {
    'Your habits on top of Today': 'Deine Gewohnheiten oben auf Heute',
    'Not only meditation.': 'Nicht nur Meditation.',
    'The pencil on the card on top of Today chooses up to three habits: activities of Aktiv or items of «What does me good»': 'Mit dem Stift auf der Karte oben auf Heute wählst du bis zu drei Gewohnheiten: Aktivitäten aus Aktiv oder Punkte aus «Das tut mir gut»',
    'Each shows your last 7 days and ticks with one tap; meditation still starts its session': 'Jede zeigt deine letzten 7 Tage und wird mit einem Tipp abgehakt; Meditation startet weiter ihre Sitzung',
    'Move them with arrows or drag, also under «Customise the start page»; every change can be undone': 'Mit Pfeilen oder Ziehen ordnen, auch unter «Startseite anpassen»; alles lässt sich rückgängig machen',
    'Open Today and tap the pencil on the meditation card: the window «Which habits on top of Today?» opens.': 'Öffne Heute und tippe den Stift auf der Meditationskarte: das Fenster «Welche Gewohnheiten oben auf Heute?» geht auf.',
    'Add an activity (e.g. stretching) and an item of «What does me good», then «Done»: Today shows three cards; tap «Tick off» on the new one.': 'Füge eine Aktivität (z. B. Dehnen) und einen Punkt aus «Das tut mir gut» hinzu, dann «Fertig»: Heute zeigt drei Karten; tippe bei der neuen «Abhaken».',
  },
};
