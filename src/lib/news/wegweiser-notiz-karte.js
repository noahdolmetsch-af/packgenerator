// «Wegweiser statt Katalog» step 26c (Noah 01.11.2026 plan «freigabe» 1–26, 02.11.2026 «kannst du damit schon beginnen»):
// the six functions of an open note show in the card on Notes, because the open note covers the card
export default {
  title: 'Notes explains what an open note can do',
  lead: 'Remind at a point of the route, linked notes, sketch, format, files and «Remind me» now show in the card on Notes, each with a tip.',
  points: [
    {
      text: 'Notes lists the functions of an open note in «What you can do here», each with «Good to know»',
      go: { href: '#/notes', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
  ],
  small: [],
  test: [
    'Open Planen › Notes and tap «Show all» in «What you can do here».',
    '«Remind me», «Sketch» and «Remind at a point of the route» show with a line «Good to know».',
  ],
  since: [],
  de: {
    'Notes explains what an open note can do': 'Notizen erklärt, was eine offene Notiz kann',
    'Remind at a point of the route, linked notes, sketch, format, files and «Remind me» now show in the card on Notes, each with a tip.': 'Erinnern an einem Ort der Strecke, verknüpfte Notizen, Skizze, Formatieren, Dateien und «Erinnern» stehen jetzt in der Karte auf Notizen, je mit einem Tipp.',
    'Notes lists the functions of an open note in «What you can do here», each with «Good to know»': 'Notizen zeigt die Funktionen einer offenen Notiz in «Was du hier tun kannst», je mit «Gut zu wissen»',
    'Open Planen › Notes and tap «Show all» in «What you can do here».': 'Öffne Planen › Notizen und tippe in «Was du hier tun kannst» auf «Alle … zeigen».',
    '«Remind me», «Sketch» and «Remind at a point of the route» show with a line «Good to know».': '«Erinnern», «Skizze» und «Erinnern an einem Ort der Strecke» stehen dort mit einer Zeile «Gut zu wissen».',
  },
};
