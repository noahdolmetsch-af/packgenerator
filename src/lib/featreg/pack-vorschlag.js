// «Dein Vorschlag» (Warteliste 4; Noah 22.11.2026 «1b», «5a»): the list of a trip as an offer to look at
export default {
  features: [
    { id: 'f.packvorschlag', group: 'before', title: 'Your suggestion', text: 'The list of your tour as an offer: pieces and weight step by step, what was left out, what is missing and how it compares with last time.', href: '#/pack/vorschlag', words: 'vorschlag in einer minute packvorschlag liste angebot weggelassen fehlt wie letztes mal vergleichen gewicht schritte', moment: 'packen' },
  ],
  howto: { 'f.packvorschlag': ['In «New trip» tap «Suggestion in a minute», or open Trips › Your suggestion.', 'Look at the steps with their weight; tap «Change» to go to that step of the packing list.', 'Take a left-out piece along again, or compare with the last trip like this one.'] },
  handbook: {
    'f.packvorschlag': {
      on: 'Needs a trip with a packing list.',
      steps: ['In «New trip» tap «Suggestion in a minute», or open Trips › Your suggestion.', 'Look at the steps with their weight; tap «Change» to go to that step of the packing list.', 'Take a left-out piece along again, or compare with the last trip like this one.'],
      example: 'Example: 46 pieces, 7.9 kg; «You are missing: warm gloves for 3°»; «Like last time?» shows the autumn round and what differs.',
    },
  },
  home: { 'f.packvorschlag': '#/pack/vorschlag' },
};
