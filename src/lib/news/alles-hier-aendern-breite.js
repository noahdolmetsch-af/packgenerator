// «Alles hier: Ändern passt aufs Handy» (Durchklick Etappe 5, Befund E5-001, Noah 05.11.2026)
export default {
  title: '«All here»: the Change list fits a phone',
  lead: 'On a phone, «Change» in «All here» no longer pushes the page wider than the screen.',
  points: [{ text: '«All here» › Change: each row fits the screen, «Hide» moves under the name if the row is full', go: { href: '#/flow', steps: [{ sel: '[data-all-here-edit]' }] } }],
  small: [],
  test: ['On a phone open Active and tap «Change» in «All here»: the page does not move sideways and every row shows its «Hide» button.', 'Tap «Hide» on a row, then «Undo»: the tile is back in the same place.'],
  since: [],
  de: {
    '«All here»: the Change list fits a phone': '«Alles hier»: Die Liste bei «Ändern» passt aufs Handy',
    'On a phone, «Change» in «All here» no longer pushes the page wider than the screen.': 'Auf dem Handy macht «Ändern» bei «Alles hier» die Seite nicht mehr breiter als den Bildschirm.',
    '«All here» › Change: each row fits the screen, «Hide» moves under the name if the row is full': '«Alles hier» › Ändern: Jede Zeile passt auf den Bildschirm, «Ausblenden» rutscht unter den Namen, wenn die Zeile voll ist',
    'On a phone open Active and tap «Change» in «All here»: the page does not move sideways and every row shows its «Hide» button.': 'Öffne auf dem Handy Aktiv und tippe bei «Alles hier» auf «Ändern»: Die Seite lässt sich nicht seitwärts schieben, und jede Zeile zeigt ihren Knopf «Ausblenden».',
    'Tap «Hide» on a row, then «Undo»: the tile is back in the same place.': 'Tippe bei einer Zeile auf «Ausblenden», dann auf «Rückgängig»: Die Kachel ist wieder an ihrem Platz.',
  },
};
