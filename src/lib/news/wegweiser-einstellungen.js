// «Wegweiser statt Katalog» step 26a (Noah 01.11.2026 plan «freigabe» 1–26, 03.11.2026 «freigabe bitte fortfahren»):
// the pages left out for the 2.5-screen rule get the card, starting as one line
export default {
  title: 'Settings and care explain themselves too',
  lead: 'Data and backup, Appearance, Connections, Reminders on the phone, Care and the timer now have «What you can do here» as one line that opens.',
  points: [
    {
      text: 'Data and backup, Reminders on the phone and four more pages show «What you can do here» with «Good to know»',
      go: { href: '#/me/data', steps: [{ sel: '[data-seiteninhalt-line]' }] },
    },
  ],
  small: [],
  test: [
    'Open Me › Data and backup: at the top is one line «What you can do here». Tap it.',
    'Under «Check your backup» stands a line «Good to know». Reminders on the phone has tips too.',
  ],
  since: [],
  de: {
    'Settings and care explain themselves too': 'Einstellungen und Pflege erklären sich jetzt auch',
    'Data and backup, Appearance, Connections, Reminders on the phone, Care and the timer now have «What you can do here» as one line that opens.': 'Daten und Backup, Aussehen, Verbindungen, Erinnerungen aufs Handy, Pflege und der Timer haben jetzt «Was du hier tun kannst» als eine Zeile, die aufgeht.',
    'Data and backup, Reminders on the phone and four more pages show «What you can do here» with «Good to know»': 'Daten und Backup, Erinnerungen aufs Handy und vier weitere Seiten zeigen «Was du hier tun kannst» mit «Gut zu wissen»',
    'Open Me › Data and backup: at the top is one line «What you can do here». Tap it.': 'Öffne Ich › Daten und Backup: oben steht eine Zeile «Was du hier tun kannst». Tipp darauf.',
    'Under «Check your backup» stands a line «Good to know». Reminders on the phone has tips too.': 'Unter «Sicherung prüfen» steht eine Zeile «Gut zu wissen». Auch Erinnerungen aufs Handy hat Tipps.',
  },
};
