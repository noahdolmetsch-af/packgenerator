// «Bewegung beim Seitenwechsel» 4 «Ruhiges Einblenden» (Noah 03.11.2026 «b», Paket A): after a slow load the page fades in over the grey placeholders
export default {
  title: 'Slow pages fade in',
  lead: 'When a page needs a moment to load, its content now fades in softly instead of blinking.',
  points: [{ text: 'Open a page for the first time on a slow connection: the grey bars show, then the content fades in over them', href: '#/gear', go: { href: '#/gear', where: 'Shows when a page loads for the first time and takes longer than a third of a second.' } }],
  small: [{ box: 'new', text: 'A page that opens at once stays as it was; with «Reduce motion» on the device or Motion «Off» the content just appears', go: { href: '#/me/look', where: 'Shows in Me › Appearance under Handling.' } }],
  test: ['Hard to see on a fast connection: a page you opened before shows at once, as before.', 'On a slow connection or the first time after an update, the grey bars show and the page fades in over them.'],
  since: [],
  de: {
    'Slow pages fade in': 'Langsame Seiten blenden sanft ein',
    'When a page needs a moment to load, its content now fades in softly instead of blinking.': 'Braucht eine Seite einen Moment zum Laden, blendet ihr Inhalt jetzt sanft ein, statt aufzublitzen.',
    'Open a page for the first time on a slow connection: the grey bars show, then the content fades in over them': 'Öffne eine Seite zum ersten Mal bei langsamer Verbindung: die grauen Balken erscheinen, dann blendet der Inhalt darüber ein',
    'Shows when a page loads for the first time and takes longer than a third of a second.': 'Zeigt sich, wenn eine Seite zum ersten Mal lädt und länger als eine Drittelsekunde braucht.',
    'A page that opens at once stays as it was; with «Reduce motion» on the device or Motion «Off» the content just appears': 'Eine Seite, die sofort aufgeht, bleibt wie sie war; mit «Bewegung reduzieren» am Gerät oder Bewegung «Aus» erscheint der Inhalt einfach',
    'Hard to see on a fast connection: a page you opened before shows at once, as before.': 'Bei schneller Verbindung kaum zu sehen: eine Seite, die du schon geöffnet hast, erscheint sofort wie bisher.',
    'On a slow connection or the first time after an update, the grey bars show and the page fades in over them.': 'Bei langsamer Verbindung oder beim ersten Mal nach einem Update erscheinen die grauen Balken, und die Seite blendet darüber ein.',
  },
};
