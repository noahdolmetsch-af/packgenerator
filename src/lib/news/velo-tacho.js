// «Tacho-Ziffern» (Noah 03.11.2026 «b», Paket C «Das Velo lebt», Idee 12)
export default {
  title: 'Odometer digits',
  lead: 'The km of a bike roll up like an old bike odometer when you open the page, then the number stands still.',
  points: [
    { text: 'Bikes: the km on a bike card roll up when the card appears', go: { href: '#/bikes', steps: [{ sel: '[data-velo-card]' }] } },
    { text: 'The same on the care page of a bike, under its name', go: { href: '#/bikes?tab=care', where: 'Bikes › Care: the km under the name of a bike.' } },
  ],
  small: [{ box: 'new', text: 'With «Reduce motion» on your device the number just stands there' }],
  test: ['Open Bikes: the km on the card roll up for about a second, the right digits first.', 'Open the care page of a bike: its km roll up too.', 'Switch «Reduce motion» on in the device settings and reload: the number stands still.'],
  since: [],
  de: {
    'Odometer digits': 'Tacho-Ziffern',
    'The km of a bike roll up like an old bike odometer when you open the page, then the number stands still.': 'Die Kilometer eines Velos rollen beim Öffnen hoch wie bei einem alten Velotacho, dann steht die Zahl ruhig.',
    'Bikes: the km on a bike card roll up when the card appears': 'Velos: Die km auf der Velo-Karte rollen hoch, wenn die Karte erscheint',
    'The same on the care page of a bike, under its name': 'Dasselbe auf der Pflegeseite eines Velos, unter seinem Namen',
    'Bikes › Care: the km under the name of a bike.': 'Velos › Pflege: die km unter dem Namen eines Velos.',
    'With «Reduce motion» on your device the number just stands there': 'Mit «Bewegung reduzieren» am Gerät steht die Zahl einfach da',
    'Open Bikes: the km on the card roll up for about a second, the right digits first.': 'Öffne Velos: Die km auf der Karte rollen etwa eine Sekunde hoch, die rechten Ziffern zuerst.',
    'Open the care page of a bike: its km roll up too.': 'Öffne die Pflegeseite eines Velos: Seine km rollen auch hoch.',
    'Switch «Reduce motion» on in the device settings and reload: the number stands still.': 'Schalte in den Geräteeinstellungen «Bewegung reduzieren» ein und lade neu: Die Zahl steht still.',
  },
};
