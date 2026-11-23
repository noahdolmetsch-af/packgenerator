// Nutzersicht 4 + «Häufiges nach vorn» (Noah 23.11.2026 «1-5a», «5a»): das Neu-Menü beginnt mit dem, was man am häufigsten braucht
export default {
  title: 'The New menu starts with what you use most',
  lead: '«Plan a trip» and «Quick start» stand first, then To-do, List and the checks. «Weigh bags» is new. The quick field and the emergency moved to the bottom.',
  points: [
    { text: '«Plan a trip» and «Quick start» are the first rows of the New menu; To-do, List and the checks follow', go: { href: '#/', steps: [{ sel: 'button.plus' }], where: 'The plus button at the bottom.' } },
    { text: '«Weigh bags»: one tap from every page to the packing day, where each packed bag goes on the scale', go: { href: '#/', steps: [{ sel: 'button.plus' }, { sel: '[data-new-weigh]' }], where: 'New › Weigh bags.' } },
  ],
  small: [{ box: 'new', text: 'The quick field and the emergency (still red, now smaller) are at the end of the menu; nothing was removed' }],
  test: ['Tap the plus button: «Plan a trip» and «Quick start» stand at the top.', 'Scroll to the end: the quick field and the red emergency row are there.'],
  since: [],
  de: {
    'The New menu starts with what you use most': 'Das Neu-Menü beginnt mit dem, was du am meisten brauchst',
    '«Plan a trip» and «Quick start» stand first, then To-do, List and the checks. «Weigh bags» is new. The quick field and the emergency moved to the bottom.': '«Tour planen» und «Schnellstart» stehen zuerst, dann To-do, Liste und die Checks. «Taschen wiegen» ist neu. Das Textfeld und der Notfall stehen jetzt unten.',
    '«Plan a trip» and «Quick start» are the first rows of the New menu; To-do, List and the checks follow': '«Tour planen» und «Schnellstart» sind die ersten Zeilen im Neu-Menü; danach folgen To-do, Liste und die Checks',
    'The plus button at the bottom.': 'Der Plus-Knopf unten.',
    '«Weigh bags»: one tap from every page to the packing day, where each packed bag goes on the scale': '«Taschen wiegen»: ein Tipp von jeder Seite zum Packtag, wo jede gepackte Tasche auf die Waage kommt',
    'New › Weigh bags.': 'Neu › Taschen wiegen.',
    'The quick field and the emergency (still red, now smaller) are at the end of the menu; nothing was removed': 'Das Textfeld und der Notfall (weiter rot, jetzt kleiner) stehen am Ende des Menüs; nichts wurde entfernt',
    'Tap the plus button: «Plan a trip» and «Quick start» stand at the top.': 'Tippe auf den Plus-Knopf: «Tour planen» und «Schnellstart» stehen oben.',
    'Scroll to the end: the quick field and the red emergency row are there.': 'Scrolle ans Ende: das Textfeld und die rote Notfall-Zeile sind da.',
  },
};
