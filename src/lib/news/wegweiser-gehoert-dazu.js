// «Wegweiser statt Katalog» PR 10 (Noah 01.11.2026 «1a 2a 3a 4a 5a»): «Belongs to» on Bikes, Gear and Active
export default {
  title: 'Belongs to: links on Bikes, Gear and Active',
  lead: 'On top of Bikes, Gear and Active a row shows the functions of the same moment that are easy to miss.',
  points: [
    { text: 'Bikes and Gear: a row «Belongs to Bike and gear» with up to five small links', go: { href: '#/bikes', steps: [{ sel: '[data-gehoert="velo"]' }], where: 'Shows on top of Bikes and of Gear.' } },
    { text: 'Active: a row «Belongs to Body and training» with up to five small links', go: { href: '#/flow', steps: [{ sel: '[data-gehoert="koerper"]' }], where: 'Shows on top of Active, not on its sub-pages.' } },
  ],
  small: [],
  test: [
    'Open Bikes: on top stands «Belongs to Bike and gear» with up to five small links.',
    'Open Active: on top stands «Belongs to Body and training»; tap a link and the function opens.',
    'Tap «all …›»: «What the app can do» opens by moment.',
  ],
  since: [],
  de: {
    'Belongs to: links on Bikes, Gear and Active': 'Gehört dazu: Sprunglinks auf Velos, Material und Aktiv',
    'On top of Bikes, Gear and Active a row shows the functions of the same moment that are easy to miss.': 'Oben auf Velos, Material und Aktiv zeigt eine Zeile die Funktionen desselben Moments, die man leicht übersieht.',
    'Bikes and Gear: a row «Belongs to Bike and gear» with up to five small links': 'Velos und Material: eine Zeile «Gehört zu: Velo und Material» mit bis zu fünf kleinen Links',
    'Shows on top of Bikes and of Gear.': 'Zeigt sich oben auf Velos und auf Material.',
    'Active: a row «Belongs to Body and training» with up to five small links': 'Aktiv: eine Zeile «Gehört zu: Körper und Training» mit bis zu fünf kleinen Links',
    'Shows on top of Active, not on its sub-pages.': 'Zeigt sich oben auf Aktiv, nicht auf seinen Unterseiten.',
    'Open Bikes: on top stands «Belongs to Bike and gear» with up to five small links.': 'Öffne Velos: Oben steht «Gehört zu: Velo und Material» mit bis zu fünf kleinen Links.',
    'Open Active: on top stands «Belongs to Body and training»; tap a link and the function opens.': 'Öffne Aktiv: Oben steht «Gehört zu: Körper und Training»; ein Tipp auf einen Link öffnet die Funktion.',
    'Tap «all …›»: «What the app can do» opens by moment.': 'Tippe auf «alle …›»: «Was die App kann» öffnet sich nach Moment.',
  },
};
