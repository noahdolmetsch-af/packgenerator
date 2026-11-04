// «Freude als Auswertung» (Noah 04.11.2026 «3a», Persönliches Lernen Idee 6)
export default {
  features: [
    { id: 'f.joy', group: 'after', title: 'What made it good?', text: 'In the debrief four small scales, riding fun, nature, flow and company, each 1 to 5 and all optional. A page shows the means and every tour; from three tours on the debrief says which was highest.', href: '#/debrief/freude', words: 'freude fahrspass natur flow gesellschaft schieber skala was war gut genuss auswertung glück rückblick', moment: 'zurueck' },
  ],
  howto: { 'f.joy': ['Open the debrief of a tour.', 'Tap a number from 1 to 5 under riding fun, nature, flow or company.', 'Open Look back › What made it good? for the means and every tour.'] },
  handbook: {
    'f.joy': {
      on: null,
      steps: ['Open the debrief of a tour (Trips › Look back).', 'Under «What made it good?» tap a number from 1 to 5 for the scales you want to answer.', 'Open Trips › Look back › What made it good?: the means and every tour. A second tap on a number takes it away.'],
      example: 'Example: riding fun 4, nature 5, flow 3 → after three tours «Nature was highest on average (4.7 of 5)».',
    },
  },
  home: { 'f.joy': '#/debrief/freude' },
};
