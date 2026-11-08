// «Tour-Pfad» (Noah 08.11.2026 «1 go A», Tour von A bis Z, Schritt 1): eine Tour als Pfad in vier Phasen
export default {
  features: [
    { id: 'f.tourpfad', group: 'before', title: 'Tour path', text: 'One tour from the idea to the debrief in four phases: planning, preparing, on the way, afterwards. Every row opens the page where you do it and shows where you stand. One button leads to the next open row.', href: '#/trips/pfad', words: 'tour pfad phasen planen vorbereiten unterwegs danach schritte ablauf stand weiter nächster schritt path phases steps', moment: 'planen' },
  ],
  howto: { 'f.tourpfad': ['Open a tour and tap «Tour path» under the steps.', 'Read the four phases; the current one is open.', 'Tap the big button to go on with the next open row.'] },
  handbook: {
    'f.tourpfad': {
      on: null,
      steps: ['Open a tour and tap «Tour path» under the steps.', 'Read the four phases; the current one is open.', 'Tap the big button to go on with the next open row.'],
      example: 'Example: «Preparing 3 of 5 · Packing: 24 of 32 packed».',
    },
  },
  home: { 'f.tourpfad': '#/trips/pfad' },
};
