// «Pfad ohne doppelten Namen» (Durchklick Etappe 2, Frage 2a, Noah 05.11.2026)
export default {
  title: 'The path above a page says each name once',
  lead: 'The path line no longer ends with the place twice, like «Trips › Overview › Trips».',
  points: [{ text: 'Path line: the page title is left out when the place or the tab already has that name', go: { href: '#/trips', steps: [{ sel: '[data-pathline]' }], where: 'Only on a page with a title of its own, like Week › This week; on the tab pages the sidebar and the tabs say it.' } }],
  small: [],
  test: ['Open Trips: the small path above the title reads «Touren › Übersicht», not «Touren › Übersicht › Touren».', 'Open Material and Active: the same, no name twice.'],
  since: [],
  de: {
    'The path above a page says each name once': 'Der Pfad über einer Seite nennt jeden Namen nur einmal',
    'The path line no longer ends with the place twice, like «Trips › Overview › Trips».': 'Die Pfadzeile endet nicht mehr zweimal mit dem Ort, zum Beispiel «Touren › Übersicht › Touren».',
    'Path line: the page title is left out when the place or the tab already has that name': 'Pfadzeile: Der Seitentitel fällt weg, wenn der Ort oder der Reiter schon so heisst',
    'Only on a page with a title of its own, like Week › This week; on the tab pages the sidebar and the tabs say it.': 'Nur auf einer Seite mit eigenem Titel, zum Beispiel Woche › Diese Woche; auf den Reiter-Seiten sagen es die Seitenleiste und die Reiter.',
    'Open Trips: the small path above the title reads «Touren › Übersicht», not «Touren › Übersicht › Touren».': 'Öffne Touren: Der kleine Pfad über dem Titel heisst «Touren › Übersicht», nicht «Touren › Übersicht › Touren».',
    'Open Material and Active: the same, no name twice.': 'Öffne Material und Aktiv: Auch dort kommt kein Name doppelt vor.',
  },
};
