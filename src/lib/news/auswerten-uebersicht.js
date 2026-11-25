// «Auswerten-Übersicht» (Noah 24.11.2026 «1-5a», Impeccable ganze App, Paket 5): the answer of the day first, the period in one line, a suggestion under the answer
export default {
  title: 'Analysis: the answer of the day first',
  lead: 'The readiness stands right under the title, the period is one line, and under the answer one line says what fits today.',
  points: [
    { text: 'The card «Readiness» stands directly under the title; «In focus» follows', go: { href: '#/auswerten/uebersicht', steps: [{ sel: '[data-section="form"]' }], where: 'Analysis › Overview, at the top.' } },
    { text: 'The period is one line «Period: Week · …» with «Change», right above «Overview and last 7 days»', go: { href: '#/auswerten/uebersicht', steps: [{ sel: '[data-period-line]' }] } },
    { text: 'Under the answer one line leads on: rest → «Tick off recovery», easy → trip tips, normal → weekly plan, ready → «Which mountain calls?» (also on the page «Form and recovery»; off with «Performance tips»)', go: { href: '#/auswerten/uebersicht', steps: [{ sel: '[data-day-suggest]' }], where: 'Analysis › Overview, under the card «Readiness» (it shows once your sleep and pulse of the last days are known).' } },
  ],
  small: [{ box: 'nicer', text: 'The sentence about what the period touches moved to the «?» window of the page' }],
  test: [
    'Open Analysis: right under the title stands the card «Readiness», then «In focus», then the line «Period: Week · …».',
    'Tap «Change»: the switch for week, month, year and own range opens; your choice shows in the line.',
    'Under the answer of the day tap the link (for example «Weekly plan» or «Tick off recovery»): it opens that page.',
  ],
  since: [],
  de: {
    'Analysis: the answer of the day first': 'Auswerten: zuerst die Antwort für heute',
    'The readiness stands right under the title, the period is one line, and under the answer one line says what fits today.': 'Die Bereitschaft steht gleich unter dem Titel, der Zeitraum ist eine Zeile, und unter der Antwort sagt eine Zeile, was heute passt.',
    'The card «Readiness» stands directly under the title; «In focus» follows': 'Die Karte «Bereitschaft» steht direkt unter dem Titel, danach «Im Fokus»',
    'Analysis › Overview, at the top.': 'Auswerten › Übersicht, ganz oben.',
    'The period is one line «Period: Week · …» with «Change», right above «Overview and last 7 days»': 'Der Zeitraum ist eine Zeile «Zeitraum: Woche · …» mit «Ändern», gleich über «Überblick und letzte 7 Tage»',
    'Under the answer one line leads on: rest → «Tick off recovery», easy → trip tips, normal → weekly plan, ready → «Which mountain calls?» (also on the page «Form and recovery»; off with «Performance tips»)': 'Unter der Antwort führt eine Zeile weiter: Ruhe → «Erholung abhaken», locker → Ausflugstipps, normal → Wochenplan, bereit → «Welcher Berg ruft?» (auch auf der Seite «Form und Erholung»; abschaltbar mit «Leistungstipps»)',
    'Analysis › Overview, under the card «Readiness» (it shows once your sleep and pulse of the last days are known).': 'Auswerten › Übersicht, unter der Karte «Bereitschaft» (sie erscheint, sobald dein Schlaf und dein Puls der letzten Tage bekannt sind).',
    'The sentence about what the period touches moved to the «?» window of the page': 'Der Satz, was der Zeitraum betrifft, steht jetzt im «?»-Fenster der Seite',
    'Open Analysis: right under the title stands the card «Readiness», then «In focus», then the line «Period: Week · …».': 'Öffne Auswerten: direkt unter dem Titel steht die Karte «Bereitschaft», dann «Im Fokus», dann die Zeile «Zeitraum: Woche · …».',
    'Tap «Change»: the switch for week, month, year and own range opens; your choice shows in the line.': 'Tippe «Ändern»: der Schalter für Woche, Monat, Jahr und eigenen Zeitraum klappt auf; deine Wahl steht in der Zeile.',
    'Under the answer of the day tap the link (for example «Weekly plan» or «Tick off recovery»): it opens that page.': 'Tippe unter der Antwort für heute den Link (zum Beispiel «Wochenplan» oder «Erholung abhaken»): die Seite öffnet sich.',
  },
};
