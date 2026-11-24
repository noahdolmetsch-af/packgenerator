// «Auswerten neu» Teil 1 (Noah 24.11.2026 «1b 2a 3b 4a 5a»): Auswerten › Heute
export default {
  features: [
    { id: 'f.auswertenheute', group: 'active', title: 'Analysis: Today', text: 'The start of Analysis: the answer for today with its reason, your resting pulse, HRV and sleep against your own usual range of the last 12 months (the last 4 weeks as the second number), and your four questions. «Note it for today» puts the suggestion into Merken, «I see it differently» opens the morning check. Only to look at: where a value stands, never why.', href: '#/auswerten', words: 'auswerten heute start antwort normal eigenes normal ueblich bereitschaft hrv ruhepuls schlaf zwoelf monate 12 monate vier fragen vormerken ich sehe das anders beobachtung analysis today own normal usual range', moment: 'app' },
  ],
  howto: { 'f.auswertenheute': ['Open Analysis: the first tab is «Today».', 'Read the answer for today and tap «Why does the app say this?» to see what counted.', 'Check where your HRV, resting pulse and sleep stand in your own usual range.'] },
  handbook: {
    'f.auswertenheute': {
      on: null,
      steps: ['Open Analysis: the first tab is «Today».', 'Read the answer for today and tap «Why does the app say this?» to see what counted.', 'Check where your HRV, resting pulse and sleep stand in your own usual range.'],
      example: 'Example: your HRV is 62 ms, below your usual 72 to 76: the band shows the dot left of the dark middle band.',
    },
  },
  home: { 'f.auswertenheute': '#/auswerten' },
};
