// «Was mir gut tut» stürzte ab (Noah 21.11.2026, Fehlerbild «Illegal invocation»): Energieräuber anzeigen
export default {
  title: 'What is good for me opens again',
  lead: 'The page «What is good for me» crashed when «Show energy drains» was switched on. It works again.',
  points: [
    {
      text: '«What is good for me» no longer crashes with «Show energy drains» on',
      go: { href: '#/me/wohl', steps: [{ text: 'Energy drains' }] },
    },
  ],
  small: [],
  test: [
    'Open Analysis › What is good for me and scroll to «Energy drains».',
    'Switch on «Show energy drains»: the page stays, and the days that cost energy show with «How does the app know?».',
  ],
  since: [],
  de: {
    'What is good for me opens again': 'Was mir gut tut öffnet wieder',
    'The page «What is good for me» crashed when «Show energy drains» was switched on. It works again.': 'Die Seite «Was mir gut tut» stürzte ab, wenn «Energieräuber anzeigen» eingeschaltet war. Jetzt geht sie wieder.',
    '«What is good for me» no longer crashes with «Show energy drains» on': '«Was mir gut tut» stürzt mit «Energieräuber anzeigen» nicht mehr ab',
    'Open Analysis › What is good for me and scroll to «Energy drains».': 'Öffne Auswerten › Was mir gut tut und scrolle zu «Energieräuber».',
    'Switch on «Show energy drains»: the page stays, and the days that cost energy show with «How does the app know?».': 'Schalte «Energieräuber anzeigen» ein: Die Seite bleibt, und die Tage, die Energie kosten, erscheinen mit «Wie kommt die App darauf?».',
  },
};
