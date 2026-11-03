// «Wegweiser statt Katalog» step 26b (Noah 01.11.2026 plan «freigabe» 1–26, 02.11.2026 «fortfahren»): the pages that had no
// content in the robot check of 02.11.2026 get the card «What you can do here» with «Good to know»
export default {
  title: 'Touren and more pages explain themselves',
  lead: 'Touren, Food and water, New ground, Free time, Collections, two Calm pages, Ski tours and the race check now show what you can do there.',
  points: [
    {
      text: 'Touren, Ski tours and seven more pages show «What you can do here» with a tip «Good to know» per function; on Touren and Ski tours it starts as one line',
      go: { href: '#/me/ruhig/zahlen', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
  ],
  small: [],
  test: [
    'Open Touren: on top is one line «What you can do here»; a tap opens it with «Good to know» per function.',
    'Open Me › Calm and personal › Numbers that stay clear: the card shows each function with a tip.',
  ],
  since: [],
  de: {
    'Touren and more pages explain themselves': 'Touren und weitere Seiten erklären sich selbst',
    'Touren, Food and water, New ground, Free time, Collections, two Calm pages, Ski tours and the race check now show what you can do there.': 'Touren, Verpflegung, Neuland, Freie Zeit, Sammlungen, zwei Ruhiger-Seiten, Skitouren und der Renn-Check zeigen jetzt, was du dort tun kannst.',
    'Touren, Ski tours and seven more pages show «What you can do here» with a tip «Good to know» per function; on Touren and Ski tours it starts as one line': 'Touren, Skitouren und sieben weitere Seiten zeigen «Was du hier tun kannst» mit einem Tipp «Gut zu wissen» pro Funktion; auf Touren und Skitouren startet die Karte als eine Zeile',
    'Open Touren: on top is one line «What you can do here»; a tap opens it with «Good to know» per function.': 'Öffne Touren: oben steht eine Zeile «Was du hier tun kannst»; ein Tipp klappt sie auf, mit «Gut zu wissen» pro Funktion.',
    'Open Me › Calm and personal › Numbers that stay clear: the card shows each function with a tip.': 'Öffne Ich › Ruhig und persönlich › Zahlen, die klar bleiben: die Karte zeigt jede Funktion mit einem Tipp.',
  },
};
