// «Klingel wackelt» (Noah 03.11.2026 «b», Paket C «Das Velo lebt», Idee 17)
export default {
  title: 'The bike bell rings',
  lead: 'When Today shows that bike care is due, a small bike bell wobbles once.',
  points: [{ text: 'Today: the chip «Care points due» carries a bell that wobbles once when the line appears', go: { href: '#/', where: 'Today, in the line «Due today», when bike care is due.' } }],
  small: [{ box: 'new', text: 'No sound, and no movement with «Reduce motion» on your device' }],
  test: ['Open Today while a bike has care due: the line «Due today» shows a bell, which wobbles once after half a second.', 'Switch «Reduce motion» on in the device settings and reload: the bell stands still.'],
  since: [],
  de: {
    'The bike bell rings': 'Die Velo-Klingel wackelt',
    'When Today shows that bike care is due, a small bike bell wobbles once.': 'Wenn Heute zeigt, dass Velopflege fällig ist, wackelt eine kleine Velo-Klingel einmal.',
    'Today: the chip «Care points due» carries a bell that wobbles once when the line appears': 'Heute: Der Chip «Pflegepunkte fällig» trägt eine Klingel, die einmal wackelt, wenn die Zeile erscheint',
    'Today, in the line «Due today», when bike care is due.': 'Heute, in der Zeile «Heute fällig», wenn Velopflege fällig ist.',
    'No sound, and no movement with «Reduce motion» on your device': 'Kein Ton, und mit «Bewegung reduzieren» am Gerät keine Bewegung',
    'Open Today while a bike has care due: the line «Due today» shows a bell, which wobbles once after half a second.': 'Öffne Heute, während bei einem Velo Pflege fällig ist: Die Zeile «Heute fällig» zeigt eine Klingel, die nach einer halben Sekunde einmal wackelt.',
    'Switch «Reduce motion» on in the device settings and reload: the bell stands still.': 'Schalte in den Geräteeinstellungen «Bewegung reduzieren» ein und lade neu: Die Klingel steht still.',
  },
};
