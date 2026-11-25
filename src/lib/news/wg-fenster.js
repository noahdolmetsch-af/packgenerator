// «Wi gaht's? am Abend» (Noah 24.11.2026, Screenshot «ganz leicht abgeschnitten»): the window opens only when asked, one question per screen
export default {
  title: 'Wi gaht\'s? window: calmer, one question at a time',
  lead: 'The window of «Wi gaht\'s?» no longer opens by itself and asks one question per screen.',
  points: [
    { text: 'The window opens when you tap «Start» on Today; it shows one question with «Next», and head and foot stay in the screen', go: { href: '#/', steps: [{ sel: '[data-row="check"]' }], where: 'Today › Up now › Wi gaht\'s? › Start.' } },
    { text: 'In the evening it no longer asks the questions of the morning (the dream, a short night)', go: { href: '#/me/abfragen', steps: [{ sel: '[data-area]' }], where: 'Under «Wi gaht\'s?» the questions with their times.' } },
    { text: 'The question «Do you notice that today too?» says what your data shows and comes only when the difference is clear', go: { href: '#/me/abfragen', steps: [{ sel: '[data-datenfragen]' }], where: 'Under «Wi gaht\'s?»: «The app asks you».' } },
  ],
  small: [{ box: 'fixed', text: 'The X no longer puts the questions away: it only closes the window' }],
  test: [
    'Open Today: the window does not open by itself; «Up now» says what waits.',
    'Tap «Start»: one question is on the screen, «Next» goes on, «Back» goes back, the last one has «Save».',
    'Tap the X: the window closes and «Start» is still there.',
  ],
  since: [],
  de: {
    'Wi gaht\'s? window: calmer, one question at a time': '«Wi gaht\'s?»-Fenster: ruhiger, eine Frage nach der anderen',
    'The window of «Wi gaht\'s?» no longer opens by itself and asks one question per screen.': 'Das Fenster von «Wi gaht\'s?» öffnet sich nicht mehr von selbst und stellt eine Frage pro Bildschirm.',
    'The window opens when you tap «Start» on Today; it shows one question with «Next», and head and foot stay in the screen': 'Das Fenster öffnet sich, wenn du auf Heute «Los» tippst; es zeigt eine Frage mit «Weiter», Kopf und Fusszeile bleiben im Bild',
    'Today › Up now › Wi gaht\'s? › Start.': 'Heute › Jetzt dran › «Wi gaht\'s?» › Los.',
    'In the evening it no longer asks the questions of the morning (the dream, a short night)': 'Am Abend fragt es nichts mehr vom Morgen (den Traum, eine kurze Nacht)',
    'The question «Do you notice that today too?» says what your data shows and comes only when the difference is clear': 'Die Frage «Merkst du das heute auch?» sagt, was deine Daten zeigen, und kommt nur bei klarem Unterschied',
    'The X no longer puts the questions away: it only closes the window': 'Das × legt die Fragen nicht mehr weg: Es schliesst nur das Fenster',
    'Open Today: the window does not open by itself; «Up now» says what waits.': 'Öffne Heute: Das Fenster öffnet sich nicht von selbst; «Jetzt dran» sagt, was wartet.',
    'Tap «Start»: one question is on the screen, «Next» goes on, «Back» goes back, the last one has «Save».': 'Tippe auf «Los»: Eine Frage steht im Bild, «Weiter» geht weiter, «Zurück» geht zurück, bei der letzten steht «Speichern».',
    'Under «Wi gaht\'s?» the questions with their times.': 'Unter «Wi gaht\'s?» die Fragen mit ihren Zeiten.',
    'Under «Wi gaht\'s?»: «The app asks you».': 'Unter «Wi gaht\'s?»: «Die App fragt dich».',
    'Tap the X: the window closes and «Start» is still there.': 'Tippe auf das ×: Das Fenster schliesst sich, «Los» steht weiter da.',
  },
};
