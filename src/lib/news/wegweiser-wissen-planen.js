// «Wegweiser statt Katalog» PR 13 (Noah 01.11.2026 «1-5a», plan «freigabe» 1–26): the card «What you can do here» with «Good to know» on the pages of Planen
export default {
  title: 'Planen explains itself',
  lead: 'Week, Remember, Appointments, Notes, Diary, Inbox, Mail and Everyday now show what you can do there, with a tip each.',
  points: [
    {
      text: 'The pages of Planen show «What you can do here»: every function with what it is for, how it works and «Good to know»',
      go: { href: '#/notes', steps: [{ sel: '[data-seiteninhalt]' }] },
    },
  ],
  small: [],
  test: [
    'Open Planen › Notes: on top is «What you can do here» with a line «Good to know» per function.',
    'Tap × on the card: it becomes one line and stays like that after a reload.',
  ],
  since: [],
  de: {
    'Planen explains itself': 'Planen erklärt sich selbst',
    'Week, Remember, Appointments, Notes, Diary, Inbox, Mail and Everyday now show what you can do there, with a tip each.': 'Woche, Merken, Termine, Notizen, Tagebuch, Eingang, Mail und Alltag zeigen jetzt, was du dort tun kannst, je mit einem Tipp.',
    'The pages of Planen show «What you can do here»: every function with what it is for, how it works and «Good to know»': 'Die Seiten von Planen zeigen «Was du hier tun kannst»: jede Funktion mit wozu, so geht\'s und «Gut zu wissen»',
    'Open Planen › Notes: on top is «What you can do here» with a line «Good to know» per function.': 'Öffne Planen › Notizen: oben steht «Was du hier tun kannst» mit einer Zeile «Gut zu wissen» pro Funktion.',
    'Tap × on the card: it becomes one line and stays like that after a reload.': 'Tippe auf × in der Karte: sie wird eine Zeile und bleibt so, auch nach dem Neuladen.',
  },
};
