// «Seitentitel im Tab» (Noah 23.11.2026 «2a»): the browser tab says where you are, with the time of a running timer or ride in front
export default {
  title: 'The tab says where you are',
  lead: 'The title of the browser tab now follows the page, and a running timer or ride shows its time there.',
  points: [
    { text: 'Every page names itself in the browser tab, e.g. «Jura-Runde · Touren»; Today stays «Pack Generator»', go: { href: '#/week', where: 'Look at the title of the browser tab on any page.' } },
    { text: 'While a timer, a meditation or a ride runs, its time stands first in the tab: «▶ 12:34 · Meditation»', go: { href: '#/timer', where: 'Start a timer on this page and look at the browser tab, also from another page.' } },
  ],
  small: [{ box: 'new', text: 'A screen reader says the new page once after a change of page' }],
  test: [
    'Open «Week» and look at the title of the browser tab: it names the page and its place.',
    'Open Today: the tab says «Pack Generator».',
    'Start a timer on the timer page, open another page and look at the tab: the time stands in front.',
  ],
  since: [],
  de: {
    'The tab says where you are': 'Der Tab sagt, wo du bist',
    'The title of the browser tab now follows the page, and a running timer or ride shows its time there.': 'Der Titel des Browser-Tabs folgt jetzt der Seite, und ein laufender Timer oder eine laufende Fahrt zeigt dort ihre Zeit.',
    'Every page names itself in the browser tab, e.g. «Jura-Runde · Touren»; Today stays «Pack Generator»': 'Jede Seite nennt sich im Browser-Tab, z. B. «Jura-Runde · Touren»; Heute bleibt «Pack Generator»',
    'Look at the title of the browser tab on any page.': 'Schau auf den Titel des Browser-Tabs, auf irgendeiner Seite.',
    'While a timer, a meditation or a ride runs, its time stands first in the tab: «▶ 12:34 · Meditation»': 'Solange ein Timer, eine Meditation oder eine Fahrt läuft, steht ihre Zeit vorn im Tab: «▶ 12:34 · Meditation»',
    'Start a timer on this page and look at the browser tab, also from another page.': 'Starte auf dieser Seite einen Timer und schau auf den Browser-Tab, auch von einer anderen Seite aus.',
    'A screen reader says the new page once after a change of page': 'Ein Bildschirmleser nennt die neue Seite einmal nach einem Seitenwechsel',
    'Open «Week» and look at the title of the browser tab: it names the page and its place.': 'Öffne «Woche» und schau auf den Titel des Browser-Tabs: Er nennt die Seite und ihren Ort.',
    'Open Today: the tab says «Pack Generator».': 'Öffne Heute: Der Tab sagt «Pack Generator».',
    'Start a timer on the timer page, open another page and look at the tab: the time stands in front.': 'Starte auf der Timer-Seite einen Timer, öffne eine andere Seite und schau auf den Tab: Die Zeit steht vorn.',
  },
};
