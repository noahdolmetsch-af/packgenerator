// «Gut zu wissen» über die Suche ausblenden (Noah 28.10.2026 «b», thread «Heute ruhiger»): the search commands
// «Gut zu wissen ausblenden» / «Tipps einblenden» switch the tip line on top of the pages (src/lib/pageinfo/switchtips.js)
export default {
  title: 'Hide «Good to know» from the search',
  lead: 'One sentence instead of a setting.',
  points: [
    { text: 'Type «Gut zu wissen ausblenden» in the search: the tip line on top of the pages is gone, with Undo', go: null },
    { text: '«Tipps einblenden» shows it again; «Gut zu wissen» alone offers both', go: null },
  ],
  test: [
    'Open Velos or Ich, tap the magnifier and type «Gut zu wissen ausblenden», then tap the row: the line «Gut zu wissen» under the title is gone.',
    'Tap «Rückgängig»: the line is back. Then type «Tipps einblenden» once you have hidden it again: it shows again on every page.',
  ],
  since: [],
  de: {
    'Hide «Good to know» from the search': '«Gut zu wissen» über die Suche ausblenden',
    'One sentence instead of a setting.': 'Ein Satz statt einer Einstellung.',
    'Type «Gut zu wissen ausblenden» in the search: the tip line on top of the pages is gone, with Undo': 'Tippe «Gut zu wissen ausblenden» in die Suche: die Tipp-Zeile oben auf den Seiten ist weg, mit Rückgängig',
    '«Tipps einblenden» shows it again; «Gut zu wissen» alone offers both': '«Tipps einblenden» zeigt sie wieder; «Gut zu wissen» allein bietet beides an',
    'Open Velos or Ich, tap the magnifier and type «Gut zu wissen ausblenden», then tap the row: the line «Gut zu wissen» under the title is gone.': 'Öffne Velos oder Ich, tippe die Lupe und schreibe «Gut zu wissen ausblenden», dann tippe die Zeile: die Zeile «Gut zu wissen» unter dem Titel ist weg.',
    'Tap «Rückgängig»: the line is back. Then type «Tipps einblenden» once you have hidden it again: it shows again on every page.': 'Tippe «Rückgängig»: die Zeile ist zurück. Blende sie nochmals aus und schreibe dann «Tipps einblenden»: sie ist auf jeder Seite wieder da.',
  },
};
