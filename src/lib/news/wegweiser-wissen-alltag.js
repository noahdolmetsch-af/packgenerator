// «Wegweiser statt Katalog» PR 17 (Noah 01.11.2026 «1-5a»): the card «What you can do here» with «Good to know» on the everyday pages
export default {
  title: 'Good to know in everyday life',
  lead: 'Documents, reminders, calm and the small group tools now explain themselves on the page.',
  points: [
    {
      text: '«What you can do here» with «Good to know» on 19 everyday pages, e.g. Documents, Reminders, Calm and personal',
      go: { href: '#/me/docs', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
  ],
  small: [],
  test: [
    'Open Me › Documents: on top is «What you can do here»; each function has a line «Good to know».',
    'Open Me › Reminders: the card shows «Good to know» there too; × folds it to one line.',
  ],
  since: [],
  de: {
    'Good to know in everyday life': 'Gut zu wissen im Alltag',
    'Documents, reminders, calm and the small group tools now explain themselves on the page.': 'Dokumente, Erinnerungen, Ruhiger und die kleinen Gruppen-Werkzeuge erklären sich jetzt auf der Seite.',
    '«What you can do here» with «Good to know» on 19 everyday pages, e.g. Documents, Reminders, Calm and personal': '«Was du hier tun kannst» mit «Gut zu wissen» auf 19 Alltags-Seiten, z. B. Dokumente, Erinnerungen, Ruhig und persönlich',
    'Open Me › Documents: on top is «What you can do here»; each function has a line «Good to know».': 'Öffne Ich › Dokumente: oben steht «Was du hier tun kannst»; jede Funktion hat eine Zeile «Gut zu wissen».',
    'Open Me › Reminders: the card shows «Good to know» there too; × folds it to one line.': 'Öffne Ich › Erinnerungen: auch dort zeigt die Karte «Gut zu wissen»; × klappt sie auf eine Zeile zu.',
  },
};
