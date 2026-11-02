// «Wegweiser statt Katalog» PR 19 (Noah 01.11.2026 «1-5a», Plan «freigabe» 1–26): the card with «Good to know» on Bikes and Gear
export default {
  title: 'Bike knowledge where you need it',
  lead: 'Bikes, Bike care, Setup, Gear and Wardrobe now show what you can do there, each function with a tip.',
  points: [
    {
      text: 'Bikes › Wear: «What you can do here» with «Good to know», for example when a chain is due',
      go: { href: '#/bikes?tab=care&view=wear', steps: [{ sel: '[data-seiteninhalt-know]' }] },
    },
    {
      text: 'Gear: the card lists weighing, wishlist, supplies and more, each with a tip',
      go: { href: '#/gear', steps: [{ sel: '[data-seiteninhalt-line]' }] },
    },
  ],
  small: [],
  test: [
    'Open Bikes › Bike care › Wear: at the top is «What you can do here», each function with «Good to know».',
    'Open Gear: at the top is one line «What you can do here»; tap it to open the card, tap × to fold it, and it stays that way after a reload.',
  ],
  since: [],
  de: {
    'Bike knowledge where you need it': 'Velo-Wissen dort, wo du es brauchst',
    'Bikes, Bike care, Setup, Gear and Wardrobe now show what you can do there, each function with a tip.': 'Velos, Velopflege, Setup, Material und Kleider zeigen jetzt, was du dort tun kannst, jede Funktion mit einem Tipp.',
    'Bikes › Wear: «What you can do here» with «Good to know», for example when a chain is due': 'Velos › Verschleiss: «Was du hier tun kannst» mit «Gut zu wissen», zum Beispiel wann eine Kette fällig ist',
    'Gear: the card lists weighing, wishlist, supplies and more, each with a tip': 'Material: die Karte zeigt Wägen, Wunschliste, Vorräte und mehr, je mit einem Tipp',
    'Open Bikes › Bike care › Wear: at the top is «What you can do here», each function with «Good to know».': 'Öffne Velos › Velopflege › Verschleiss: oben steht «Was du hier tun kannst», jede Funktion mit «Gut zu wissen».',
    'Open Gear: at the top is one line «What you can do here»; tap it to open the card, tap × to fold it, and it stays that way after a reload.': 'Öffne Material: oben steht eine Zeile «Was du hier tun kannst»; ein Tipp öffnet die Karte, × klappt sie zu, und das bleibt nach dem Neuladen so.',
  },
};
