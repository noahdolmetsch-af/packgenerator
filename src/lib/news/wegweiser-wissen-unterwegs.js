// «Wegweiser statt Katalog» PR 15 (Noah 01.11.2026 «1-5a»): the card «What you can do here» with «Good to know» on the way
export default {
  title: 'Good to know on the way',
  lead: 'On the way, before you leave, in the mountains and at the weather, the card shows what each function is for, with a tip.',
  points: [
    {
      text: '«What you can do here» on On the way, Before you leave, Mountain, Weather and Ski start, each function with «Good to know»',
      go: { href: '#/ride/abfahrt', steps: [{ sel: '[data-seiteninhalt-know]' }], where: 'On the way shows while a trip is running.' },
    },
  ],
  small: [],
  test: [
    'Start a trip (or the playground «On the way») and open On the way: on top is «What you can do here» with «Good to know».',
    'Open On the way › Before you leave: the card shows a tip for the departure sheet.',
    'Tap × on the card: it becomes one line and stays like that after a reload.',
  ],
  since: [],
  de: {
    'Good to know on the way': 'Gut zu wissen unterwegs',
    'On the way, before you leave, in the mountains and at the weather, the card shows what each function is for, with a tip.': 'Unterwegs, vor der Abfahrt, in den Bergen und beim Wetter zeigt die Karte, wozu jede Funktion gut ist, mit einem Tipp.',
    '«What you can do here» on On the way, Before you leave, Mountain, Weather and Ski start, each function with «Good to know»': '«Was du hier tun kannst» auf Unterwegs, Vor der Abfahrt, Berg, Wetter und Skitour-Start, jede Funktion mit «Gut zu wissen»',
    'On the way shows while a trip is running.': 'Unterwegs erscheint, während eine Tour läuft.',
    'Start a trip (or the playground «On the way») and open On the way: on top is «What you can do here» with «Good to know».': 'Starte eine Tour (oder das Beispiel «Unterwegs») und öffne Unterwegs: oben steht «Was du hier tun kannst» mit «Gut zu wissen».',
    'Open On the way › Before you leave: the card shows a tip for the departure sheet.': 'Öffne Unterwegs › Vor der Abfahrt: die Karte zeigt einen Tipp zum Abfahrtsblatt.',
    'Tap × on the card: it becomes one line and stays like that after a reload.': 'Tippe auf × in der Karte: sie wird zu einer Zeile und bleibt so, auch nach dem Neuladen.',
  },
};
