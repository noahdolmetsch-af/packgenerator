// «Nie abgeschnitten» (Noah 24.11.2026 «a und b»): every window fits the screen, head and foot stay put, a soft edge shows that more follows
export default {
  title: 'Windows never cut off',
  lead: 'Every window now fits the screen. Its title and its buttons stay in place, only the middle scrolls, and a soft edge shows when there is more below.',
  points: [{ text: 'Open «+ New» › «Add bike» in a small browser window: the buttons stay at the bottom', go: { href: '#/bikes', steps: [{ sel: '[data-new-bike]' }], where: 'The + New menu, «Add bike».' } }],
  small: [{ box: 'new', text: 'Windows: title and main button always in view' }],
  test: ['Make the browser window low (about 700 px) and open «Add bike» from the «New» menu: the title stays at the top and the main button stays at the bottom, the form scrolls between.', 'Open a long window (for example «Add bike»): a soft edge at the bottom shows that there is more.'],
  since: [],
  de: {
    'Windows never cut off': 'Fenster nie abgeschnitten',
    'Every window now fits the screen. Its title and its buttons stay in place, only the middle scrolls, and a soft edge shows when there is more below.': 'Jedes Fenster passt jetzt in den Bildschirm. Titel und Knöpfe bleiben stehen, nur die Mitte scrollt, und ein weicher Rand zeigt, wenn unten noch mehr kommt.',
    'Open «+ New» › «Add bike» in a small browser window: the buttons stay at the bottom': 'Öffne «+ Neu» › «Velo hinzufügen» in einem kleinen Browserfenster: die Knöpfe bleiben unten stehen',
    'The + New menu, «Add bike».': 'Das Menü + Neu, «Velo hinzufügen».',
    'Windows: title and main button always in view': 'Fenster: Titel und Hauptknopf immer im Blick',
    'Make the browser window low (about 700 px) and open «Add bike» from the «New» menu: the title stays at the top and the main button stays at the bottom, the form scrolls between.': 'Mach das Browserfenster niedrig (etwa 700 px) und öffne «Velo hinzufügen» im Menü «Neu»: der Titel bleibt oben, der Hauptknopf bleibt unten, das Formular scrollt dazwischen.',
    'Open a long window (for example «Add bike»): a soft edge at the bottom shows that there is more.': 'Öffne ein langes Fenster (zum Beispiel «Velo hinzufügen»): ein weicher Rand unten zeigt, dass es mehr gibt.',
  },
};
