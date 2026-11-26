// Noah 24.11.2026 «a» (on the picture of the packing steps): the arrows that move a step stand at the step's heading
export default {
  title: 'Packing steps: the arrows stand at the heading',
  lead: 'In the packing list by steps, the two arrows that move a whole step now stand beside its title, not under the items, so nobody reads them as «this item earlier».',
  points: [{ text: 'Move a packing step: the arrows up and down stand beside the step title; «Next: …» stays at the bottom', go: { href: '#/trips', steps: [{ sel: '[data-pack-cards]' }], where: 'Trips › a pack card › Continue: the arrows beside each step title.' } }],
  small: [{ box: 'new', text: 'The links «Earlier» and «Later» under the items are gone' }],
  test: ['Open a packing list by steps (Trips › «Continue with …»): each step has two small arrows beside its title.', 'Tap the down arrow of the first step: it moves behind the second one.', 'Open the first step: under the items only «Next: …» and «Add an item» are left.'],
  since: [],
  de: {
    'Packing steps: the arrows stand at the heading': 'Packschritte: die Pfeile stehen bei der Überschrift',
    'In the packing list by steps, the two arrows that move a whole step now stand beside its title, not under the items, so nobody reads them as «this item earlier».': 'In der Packliste nach Schritten stehen die zwei Pfeile, die einen ganzen Schritt verschieben, jetzt neben seinem Titel und nicht mehr unter den Teilen. So liest sie niemand als «dieses Teil früher».',
    'Move a packing step: the arrows up and down stand beside the step title; «Next: …» stays at the bottom': 'Packschritt verschieben: die Pfeile nach oben und unten stehen neben dem Titel des Schritts; «Weiter: …» bleibt unten',
    'Trips › a pack card › Continue: the arrows beside each step title.': 'Touren › eine Pack-Karte › Weiter: die Pfeile neben jedem Schritt-Titel.',
    'The links «Earlier» and «Later» under the items are gone': 'Die Links «Früher» und «Später» unter den Teilen sind weg',
    'Open a packing list by steps (Trips › «Continue with …»): each step has two small arrows beside its title.': 'Öffne eine Packliste nach Schritten (Touren › «Weiter mit …»): jeder Schritt hat zwei kleine Pfeile neben dem Titel.',
    'Tap the down arrow of the first step: it moves behind the second one.': 'Tippe den Pfeil nach unten beim ersten Schritt: er rutscht hinter den zweiten.',
    'Open the first step: under the items only «Next: …» and «Add an item» are left.': 'Öffne den ersten Schritt: unter den Teilen bleiben nur «Weiter: …» und «Teil hinzufügen».',
  },
};
