// «Das fällt auf» nach der Tour (Plan «ganze App», Schritt 7b, Noah 23.11.2026 «a»): ein Satz aus der Fahrt
export default {
  title: 'This stood out',
  lead: 'After a tour with a saved debrief, the Tour path says in one sentence what stood out.',
  points: [{ text: 'Planned against ridden km, things that stayed unused, things that were missing: one sentence and «Why?»', go: { href: '#/trips/pfad', where: 'Shows on the Tour path of a tour whose debrief is saved, under the four phases.' } }],
  small: [{ box: 'new', text: 'It only shows after the debrief and says nothing when nothing stands out' }],
  test: [
    'Open the Tour path of a tour with a saved debrief (Touren › the tour › «Step n of 4»).',
    'Under the phases stands «This stood out» with one sentence, for example the ridden against the planned kilometres.',
    'Tap «Why?»: the rule behind the sentence opens.',
  ],
  since: [],
  de: {
    'This stood out': 'Das fällt auf',
    'After a tour with a saved debrief, the Tour path says in one sentence what stood out.': 'Nach einer Tour mit gespeichertem Rückblick sagt der Tour-Pfad in einem Satz, was auffiel.',
    'Planned against ridden km, things that stayed unused, things that were missing: one sentence and «Why?»': 'Geplante gegen gefahrene km, ungebrauchte Teile, fehlende Teile: ein Satz und «Warum?»',
    'Shows on the Tour path of a tour whose debrief is saved, under the four phases.': 'Erscheint im Tour-Pfad einer Tour mit gespeichertem Rückblick, unter den vier Phasen.',
    'It only shows after the debrief and says nothing when nothing stands out': 'Er erscheint erst nach dem Rückblick und schweigt, wenn nichts auffällt',
    'Open the Tour path of a tour with a saved debrief (Touren › the tour › «Step n of 4»).': 'Öffne den Tour-Pfad einer Tour mit gespeichertem Rückblick (Touren › die Tour › «Schritt n von 4»).',
    'Under the phases stands «This stood out» with one sentence, for example the ridden against the planned kilometres.': 'Unter den Phasen steht «Das fällt auf» mit einem Satz, zum Beispiel die gefahrenen gegen die geplanten Kilometer.',
    'Tap «Why?»: the rule behind the sentence opens.': 'Tippe «Warum?»: Die Regel hinter dem Satz öffnet sich.',
  },
};
