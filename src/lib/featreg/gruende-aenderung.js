// «Gründe für Planänderungen» (Noah 04.11.2026 «2a», Persönliches Lernen Idee 4)
export default {
  features: [
    { id: 'f.changewhy', group: 'after', title: 'Reasons for a different tour', text: 'When a tour is marked «Not riding», or the ridden km are far from the planned km, one tap says why: no time, tired legs, weather … The reasons are a list you change; from three answers on one line says what came up most often.', href: '#/me/lists', words: 'gründe planänderung absage warum anders kürzer länger zeit beine müde wetter keine lust muster lernen', moment: 'zurueck' },
  ],
  howto: { 'f.changewhy': ['Mark a tour «Not riding» in Planen, or open a tour ridden much shorter or longer.', 'Tap the reason that fits, or «Not now».', 'Change or add reasons under Me › Lists and types.'] },
  handbook: {
    'f.changewhy': {
      on: 'Needs a tour marked «Not riding», or a ridden tour with a planned route (km).',
      steps: ['Mark a tour «Not riding» in Planen (⋯ menu), or open a tour whose ridden km are a quarter or more away from the planned km.', 'Tap the reason that fits. A second tap on it takes it away; «Not now» puts the question away.', 'From three answers on, a line says which reason came up most often. Reasons: Me › Lists and types.'],
      example: 'Example: planned 110 km, rode 70 km → «Weather». Later: «Over 5 changes most often Weather (3 times)».',
    },
  },
  home: { 'f.changewhy': '#/me/lists' },
};
