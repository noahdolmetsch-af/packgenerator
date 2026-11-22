// «Hilfen neu» 3b (Noah 22.11.2026 «1a 2a»): the tip line «Good to know» no longer stands under the page titles
export default {
  title: 'No tip line under the page titles',
  lead: 'The pages start with their content. The tips are still there, at the end of a page and in «Tips for this page».',
  points: [
    { text: 'The tip line under the page titles is off; switch it on in Own values if you like it', go: { href: '#/me/werte', steps: [{ sel: '[data-own-line]' }], where: 'Me › Own values › Suggestions: «Tip line under the page title».' } },
  ],
  small: [],
  test: [
    'Open Me: the page starts with its content, no tip line under the title.',
    'Open Me › Own values and switch on «Tip line under the page title»: the tip is back under the title.',
    'Switch it off again: at the end of the page «Tips for this page ›» still opens the tips.',
  ],
  since: [],
  de: {
    'No tip line under the page titles': 'Keine Tipp-Zeile unter den Seitentiteln',
    'The pages start with their content. The tips are still there, at the end of a page and in «Tips for this page».': 'Die Seiten beginnen mit ihrem Inhalt. Die Tipps gibt es weiter: am Seitenende und unter «Tipps für diese Seite».',
    'The tip line under the page titles is off; switch it on in Own values if you like it': 'Die Tipp-Zeile unter den Seitentiteln ist aus; schalte sie unter «Eigene Werte» ein, wenn du sie magst',
    'Me › Own values › Suggestions: «Tip line under the page title».': 'Ich › Eigene Werte › Vorschläge: «Tipp-Zeile unter dem Seitentitel».',
    'Open Me: the page starts with its content, no tip line under the title.': 'Öffne Ich: die Seite beginnt mit ihrem Inhalt, keine Tipp-Zeile unter dem Titel.',
    'Open Me › Own values and switch on «Tip line under the page title»: the tip is back under the title.': 'Öffne Ich › Eigene Werte und schalte «Tipp-Zeile unter dem Seitentitel» ein: der Tipp steht wieder unter dem Titel.',
    'Switch it off again: at the end of the page «Tips for this page ›» still opens the tips.': 'Schalte sie wieder aus: am Seitenende öffnet «Tipps für diese Seite ›» weiter die Tipps.',
  },
};
