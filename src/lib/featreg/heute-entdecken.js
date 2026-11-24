// «Heute entdecken» (Noah 23.11.2026 «1a 2b 3a 4a 5a», thread «Versteckte Inhalte auffindbar machen»)
export default {
  features: [
    { id: 'f.heuteentdecken', group: 'data', title: 'Discover today', text: 'One idea a day in a row under the chips on Today, always with its «Why»: a star that is almost there, the debrief of the tour you just came back from, the tour suggestions, what the app learned from your debriefs, what is new, or a function you never opened. «More ideas» shows three; «Later» and «Not for me» come with Undo, and a switch takes the row away.', href: '#/', words: 'heute entdecken idee vorschlag entdecken unbekannt nie geöffnet warum mehr ideen später nicht für mich stern tourenvorschläge neu', moment: 'app' },
  ],
  howto: { 'f.heuteentdecken': ['Open Today and look under the chips: the row «Discover today».', 'Tap «Look at it» to go there, or «More ideas» for three.', 'Tap «Later» or «Not for me» if it is not for you; a switch takes the row away.'] },
  handbook: {
    'f.heuteentdecken': {
      on: null,
      steps: ['Open Today: under the chips the row «Discover today» says one idea and why.', 'Tap «Look at it» to go there, or «More ideas» for three ideas.', 'Tap × (back tomorrow) or «Not for me» (never again); both come with Undo.'],
      example: 'Example: «Tour suggestions · You keep 3 dreams but never opened the tour suggestions.»',
    },
  },
  home: { 'f.heuteentdecken': '#/' },
};
