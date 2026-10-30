// Mini-Tools «Fair auslosen» (Noah 28.10.2026 «1b 2a 3a», idea 9)
export default {
  title: 'Fair draw',
  lead: 'Who cooks, who rides in front, who sleeps where: drawn fairly, on this device.',
  points: [{ text: 'Me › Mini tools › Fair draw: add the people, tap «Draw now»', href: '#/me/mini/los', go: 'f.minilos' }],
  small: [
    { box: 'new', go: 'f.minilos', text: 'Whoever was drawn less often comes first' },
    { box: 'new', go: 'f.minilos', text: 'Groups for tents or rooms that try not to repeat last time' },
  ],
  test: [
    'Open Me › Mini tools › Fair draw and tap «Who cooks?».',
    'Add three names and tap «Draw now»: one name stands big on top.',
    'Tap «Draw again» twice: three different names, because each comes once before anyone twice.',
  ],
  since: ['f.minilos'],
  de: {
    'Who cooks, who rides in front, who sleeps where: drawn fairly, on this device.': 'Wer kocht, wer fährt vorne, wer schläft wo: fair ausgelost, auf diesem Gerät.',
    'Me › Mini tools › Fair draw: add the people, tap «Draw now»': 'Ich › Mini-Tools › Fair auslosen: Personen dazu, «Jetzt auslosen» tippen',
    'Whoever was drawn less often comes first': 'Wer seltener dran war, kommt zuerst',
    'Groups for tents or rooms that try not to repeat last time': 'Gruppen für Zelte oder Zimmer, möglichst anders als letztes Mal',
    'Open Me › Mini tools › Fair draw and tap «Who cooks?».': 'Öffne Ich › Mini-Tools › Fair auslosen und tipp «Wer kocht?».',
    'Add three names and tap «Draw now»: one name stands big on top.': 'Füge drei Namen hinzu und tipp «Jetzt auslosen»: ein Name steht gross oben.',
    'Tap «Draw again» twice: three different names, because each comes once before anyone twice.': 'Tipp zweimal «Nochmals auslosen»: drei verschiedene Namen, weil alle einmal dran sind, bevor jemand zweimal kommt.',
  },
};
