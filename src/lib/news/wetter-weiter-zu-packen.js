// Nachtlauf 27.11.2026: the Weather page had no way on without a network; «Pack for the day» now stands in the line «Next:»
export default {
  title: 'Weather: a way on to packing',
  lead: 'The quiet line «Next:» at the end of Weather now also leads to «Pack for the day».',
  points: [
    { text: 'The line «Next:» at the end of Weather has a third step: «Pack for the day»', go: { href: '#/wetter', steps: [{ sel: '[data-wx-next-pack]' }], where: 'Scroll to the end of Weather: in the line «Next:» tap «Pack for the day».' } },
  ],
  small: [],
  test: [
    'Open Weather and scroll to the end of the first part: the line «Next:» names «Plan a ride», «Radar and cameras» and «Pack for the day».',
    'Tap «Pack for the day»: the packing page opens.',
  ],
  since: [],
  de: {
    'Weather: a way on to packing': 'Wetter: ein Weg weiter zum Packen',
    'The quiet line «Next:» at the end of Weather now also leads to «Pack for the day».': 'Die leise Zeile «Als Nächstes:» am Ende von Wetter führt jetzt auch zu «Packen für den Tag».',
    'The line «Next:» at the end of Weather has a third step: «Pack for the day»': 'Die Zeile «Als Nächstes:» am Ende von Wetter hat einen dritten Schritt: «Packen für den Tag»',
    'Scroll to the end of Weather: in the line «Next:» tap «Pack for the day».': 'Scrolle ans Ende von Wetter: tippe in der Zeile «Als Nächstes:» auf «Packen für den Tag».',
    'Open Weather and scroll to the end of the first part: the line «Next:» names «Plan a ride», «Radar and cameras» and «Pack for the day».': 'Öffne Wetter und scrolle ans Ende des ersten Teils: die Zeile «Als Nächstes:» nennt «Fahrt planen», «Radar und Kameras» und «Packen für den Tag».',
    'Tap «Pack for the day»: the packing page opens.': 'Tippe auf «Packen für den Tag»: die Packen-Seite öffnet sich.',
  },
};
