// «Packen in Schritten» (Warteliste 4; Noah 22.11.2026 «2a», «3a»): die Packliste Schritt für Schritt
export default {
  title: 'Pack step by step',
  lead: 'The packing list can show one step after the other: Clothes, Sleeping, Food, Tech, Bike, Check. «Next» leads on, the whole list stays one tap away.',
  points: [
    { text: 'Packing list: the new view «Steps» with «Next: Food and water» at the end of each step; the arrows change the order', go: { href: '#/pack', steps: [{ sel: '[data-pack-view]' }] } },
    { text: 'The view you choose (Steps, by bags, by category) and your order of the steps are kept', go: null },
  ],
  small: [{ box: 'new', text: 'A list with nothing packed yet opens in Steps; a list under way keeps its bags', go: null }],
  test: [
    'Open a trip (Plan) and choose «Steps» above the packing list: the list shows Clothes, Sleeping and so on.',
    'Open a step and tap «Next: …»: the next step opens. Tap «Earlier» on it: it moves up.',
    'Choose «By bags»: the whole list is as before.',
  ],
  since: [],
  de: {
    'Pack step by step': 'Schritt für Schritt packen',
    'The packing list can show one step after the other: Clothes, Sleeping, Food, Tech, Bike, Check. «Next» leads on, the whole list stays one tap away.': 'Die Packliste kann einen Schritt nach dem anderen zeigen: Kleider, Schlafen, Essen, Technik, Velo, Prüfen. «Weiter» führt voran, die ganze Liste bleibt einen Tipp entfernt.',
    'Packing list: the new view «Steps» with «Next: Food and water» at the end of each step; the arrows change the order': 'Packliste: die neue Ansicht «Schritte» mit «Weiter: Verpflegung und Wasser» am Ende jedes Schritts; die Pfeile ändern die Reihenfolge',
    'The view you choose (Steps, by bags, by category) and your order of the steps are kept': 'Die gewählte Ansicht (Schritte, nach Taschen, nach Kategorie) und deine Reihenfolge der Schritte werden gemerkt',
    'A list with nothing packed yet opens in Steps; a list under way keeps its bags': 'Eine Liste, in der noch nichts gepackt ist, öffnet in Schritten; eine begonnene bleibt bei den Taschen',
    'Open a trip (Plan) and choose «Steps» above the packing list: the list shows Clothes, Sleeping and so on.': 'Eine Tour öffnen (Planen) und über der Packliste «Schritte» wählen: die Liste zeigt Kleider, Schlafen und so weiter.',
    'Open a step and tap «Next: …»: the next step opens. Tap «Earlier» on it: it moves up.': 'Einen Schritt öffnen und «Weiter: …» antippen: der nächste Schritt öffnet sich. «Früher» antippen: er rückt nach oben.',
    'Choose «By bags»: the whole list is as before.': '«Nach Taschen» wählen: die ganze Liste ist wie vorher.',
  },
};
