// «Fahrtechnik-Tagebuch» (Noah 04.11.2026 «4a», Persönliches Lernen Idee 3)
export default {
  features: [
    { id: 'f.technik', group: 'after', title: 'Riding technique diary', text: 'After a ride tick the riding techniques you worked on, say how it went, and mark the ones you want to practise, with a place. The techniques are a list you change.', href: '#/debrief/technik', words: 'fahrtechnik tagebuch spitzkehren bremsen bremsdosierung steile anstiege üben übungsort technik fahrkönnen rückblick nasse strasse schotter wiegetritt gruppe', moment: 'zurueck' },
  ],
  howto: { 'f.technik': ['Open the debrief of a ride and tick the techniques you worked on.', 'Say «Went well» or «Still unsure» under each one.', 'Open the diary under Look back and mark what you want to practise, with a place.'] },
  handbook: {
    'f.technik': {
      on: 'Needs nothing: the techniques are suggestions, tick only what you want.',
      steps: ['Open the debrief of a ride (Trips › Look back) and tick the techniques you worked on.', 'Say «Went well» or «Still unsure» under each ticked one; the same tap again goes back.', 'Open Trips › Look back › Riding technique diary: counts, last time, and your wishes with a place. Techniques: Me › Lists and types.'],
      example: 'Example: «Hairpins» ticked three times, last «still unsure» → mark «I want to practise this», write a place.',
    },
  },
  home: { 'f.technik': '#/debrief/technik' },
};
