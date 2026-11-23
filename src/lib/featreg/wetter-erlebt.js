// «Erlebtes Wetter im Rückblick» (Noah 22.11.2026 «a»; Thread «Wetter besser machen», Teil E)
export default {
  features: [
    { id: 'f.wxlived', group: 'after', title: 'Weather that came', text: 'In the debrief of a tour the answer «Weather» is filled in from what really came (free data from Open-Meteo, the days of the tour at its start), with a line «Came: 4–11 °C, 3 mm rain, wind up to 28 km/h». You change it with one tap; once you tapped an answer, the app never changes it again.', href: '#/debrief', words: 'erlebtes wetter rückblick gekommen kälter wärmer wie geplant archiv tatsächlich temperatur regen wind tour bewertung', moment: 'zurueck' },
  ],
  howto: { 'f.wxlived': ['Open the debrief of a finished tour and «How was it?».', 'Read «Came: …» under «Weather»; the answer is already chosen.', 'Tap another answer if it felt different.'] },
  handbook: {
    'f.wxlived': {
      on: 'Needs a finished tour with a place and the planned weather.',
      steps: ['Open the debrief of a finished tour and «How was it?».', 'Read «Came: …» under «Weather»; the answer is already chosen.', 'Tap another answer if it felt different.'],
      example: 'Example: planned 6–14 °C, came 2–8 °C: «Colder» is chosen for you; it felt as planned, so you tap «As planned».',
    },
  },
  home: { 'f.wxlived': '#/debrief' },
};
