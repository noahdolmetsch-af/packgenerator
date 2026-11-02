// «Wegweiser statt Katalog» PR 4 (Noah 01.11.2026 «3a», Inhalte «1-5a»): «Next» after the debrief, «Fits here» on the saved debrief
export default {
  title: 'After the debrief, the next step',
  lead: 'A finished debrief now shows what usually comes next.',
  points: [
    { text: 'Trip costs has a line «Good to know»', go: 'f.tripcosts' },
    {
      text: 'Debrief finished: «Next» with «For next time» and trip costs',
      go: { href: '#/debrief', where: 'Shows right after «Done» on the debrief of a trip of several days.', play: 'after' },
    },
    {
      text: 'Saved debrief: «Fits here» with know-how, good decisions, meaning and the skill map',
      go: { href: '#/debrief', where: 'Shows at the end of a saved debrief.', play: 'after' },
    },
  ],
  test: [
    'Finish the debrief of a trip of several days: under «Learned» is «Next» with «For next time» and «Trip costs».',
    'Open the saved debrief again: at the end of the answers is «Fits here» with four small buttons.',
    'Tap «Trip costs»: the page opens with «Good to know» at the top.',
  ],
  since: [],
  de: {
    'After the debrief, the next step': 'Nach dem Rückblick der nächste Schritt',
    'A finished debrief now shows what usually comes next.': 'Ein fertiger Rückblick zeigt jetzt, was meistens als Nächstes kommt.',
    'Debrief finished: «Next» with «For next time» and trip costs': 'Rückblick fertig: «Als Nächstes» mit «Fürs nächste Mal» und Tour-Kosten',
    'Shows right after «Done» on the debrief of a trip of several days.': 'Erscheint gleich nach «Fertig» im Rückblick einer mehrtägigen Tour.',
    'Saved debrief: «Fits here» with know-how, good decisions, meaning and the skill map': 'Gespeicherter Rückblick: «Passt hier» mit Wissen statt Material, guten Entscheidungen, Bedeutung und Fähigkeiten-Karte',
    'Shows at the end of a saved debrief.': 'Erscheint am Ende eines gespeicherten Rückblicks.',
    'Trip costs has a line «Good to know»': 'Tour-Kosten hat eine Zeile «Gut zu wissen»',
    'Finish the debrief of a trip of several days: under «Learned» is «Next» with «For next time» and «Trip costs».': 'Schliesse den Rückblick einer mehrtägigen Tour ab: unter «Gelernt» steht «Als Nächstes» mit «Fürs nächste Mal» und «Tour-Kosten».',
    'Open the saved debrief again: at the end of the answers is «Fits here» with four small buttons.': 'Öffne den gespeicherten Rückblick wieder: am Ende der Antworten steht «Passt hier» mit vier kleinen Knöpfen.',
    'Tap «Trip costs»: the page opens with «Good to know» at the top.': 'Tippe auf «Tour-Kosten»: die Seite öffnet sich mit «Gut zu wissen» oben.',
  },
};
