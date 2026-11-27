// «Haken-Verlauf» (Noah 27.11.2026 «1a 2a 3a 4a 5a», Thread «Abhaken auf einen Blick verbessern», Schritt 2: Auswerten › Woche)
export default {
  title: 'Your ticks, day by day',
  lead: 'Auswerten › Woche now starts with a grid: every activity against the days, so you see at a glance when you ticked what.',
  points: [
    { text: 'The grid shows the last 10 days; switch to 30 days, 3 months or a year', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-haken-verlauf]' }] } },
    { text: 'Activities without a tick in the period are named in one line below', go: { href: '#/auswerten/woche', steps: [{ sel: '[data-haken-verlauf]' }] } },
  ],
  small: [{ box: 'new', text: 'From 3 months on, one column is a week; the darker, the more days of it with a tick' }],
  test: [
    'Open Auswerten › Woche: the card «Tick history» stands on top with the last 10 days.',
    'Tap «30 days», then «Year»: the columns get thinner, the number at the end of each row is its days with a tick.',
    'Leave the page and come back: your choice of the period is still there.',
  ],
  since: [],
  de: {
    'Your ticks, day by day': 'Deine Haken, Tag für Tag',
    'Auswerten › Woche now starts with a grid: every activity against the days, so you see at a glance when you ticked what.': 'Auswerten › Woche beginnt jetzt mit einer Tabelle: jede Aktivität gegen die Tage, so siehst du auf einen Blick, wann du was abgehakt hast.',
    'The grid shows the last 10 days; switch to 30 days, 3 months or a year': 'Die Tabelle zeigt die letzten 10 Tage; schalte auf 30 Tage, 3 Monate oder ein Jahr um',
    'Activities without a tick in the period are named in one line below': 'Aktivitäten ohne Haken im Zeitraum stehen in einer Zeile darunter',
    'From 3 months on, one column is a week; the darker, the more days of it with a tick': 'Ab 3 Monaten ist eine Spalte eine Woche; je dunkler, desto mehr Tage davon mit Haken',
    'Open Auswerten › Woche: the card «Tick history» stands on top with the last 10 days.': 'Öffne Auswerten › Woche: oben steht die Karte «Haken-Verlauf» mit den letzten 10 Tagen.',
    'Tap «30 days», then «Year»: the columns get thinner, the number at the end of each row is its days with a tick.': 'Tippe «30 Tage», dann «Jahr»: die Spalten werden schmaler, die Zahl am Ende jeder Zeile sind ihre Tage mit Haken.',
    'Leave the page and come back: your choice of the period is still there.': 'Verlasse die Seite und komm zurück: deine Wahl des Zeitraums ist noch da.',
  },
};
