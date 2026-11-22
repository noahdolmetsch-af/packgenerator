// «Weckruf für den Server in Alltagsworten» (Impeccable-Test 08.11.2026, Arbeitsliste 7b-08 zweiter Teil; Noah «alles»)
export default {
  title: 'The wake-up call in plain words',
  lead: 'On Reminders on the phone, the box «Wake-up call for the server» now says in two sentences what it is for. The steps sit under «Step by step».',
  points: [{ text: 'Open «Step by step» in the wake-up call box for the four steps', go: { href: '#/me/push', steps: [{ sel: '[data-push-cron-steps] summary' }] } }],
  small: [],
  test: [
    'Open Me › Reminders on the phone and scroll to «Wake-up call for the server»: two plain sentences and the copy button.',
    'Tap «Step by step»: four numbered steps open; tap again and they fold away.',
  ],
  since: [],
  de: {
    'The wake-up call in plain words': 'Der Weckruf in Alltagsworten',
    'On Reminders on the phone, the box «Wake-up call for the server» now says in two sentences what it is for. The steps sit under «Step by step».': 'Auf «Erinnerungen aufs Handy» sagt der Kasten «Weckruf für den Server» jetzt in zwei Sätzen, wofür er da ist. Die Schritte stehen unter «Schritt für Schritt».',
    'Open «Step by step» in the wake-up call box for the four steps': 'Öffne im Weckruf-Kasten «Schritt für Schritt» für die vier Schritte',
    'Open Me › Reminders on the phone and scroll to «Wake-up call for the server»: two plain sentences and the copy button.': 'Öffne Ich › Erinnerungen aufs Handy und scrolle zu «Weckruf für den Server»: zwei einfache Sätze und der Kopier-Knopf.',
    'Tap «Step by step»: four numbered steps open; tap again and they fold away.': 'Tippe auf «Schritt für Schritt»: Vier nummerierte Schritte öffnen sich; tippe nochmal und sie klappen zu.',
  },
};
