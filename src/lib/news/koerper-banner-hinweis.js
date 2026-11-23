// «Dein Körper heute» als Band, Schritt 3 (Noah 23.11.2026 «1-4a», Thread «Körper-Banner auf Heute bauen»): eine leise Hinweiszeile
export default {
  title: 'One quiet line under the body band',
  lead: 'Under «Your body today» one line shows up, but only when something stands out.',
  points: [
    { text: 'Your resting pulse is above your usual for some days', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'Your last 7 days of active zone minutes are far from your usual week', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
    { text: 'While your outdoors challenge runs, the line tells when the daylight gets short for the missing minutes', go: { href: '#/', steps: [{ sel: '[data-section="body"]' }] } },
  ],
  small: [{ box: 'new', text: '«Not today» sends a line away until tomorrow. It only says what it sees, never good or bad.', go: null }],
  test: ['Open Heute and look at «Your body today».', 'When a line stands under the values, tap «Not today»: it goes away for today.', 'Tap «See»: the page with the history opens.'],
  since: [],
  de: {
    'One quiet line under the body band': 'Eine leise Zeile unter dem Körper-Band',
    'Under «Your body today» one line shows up, but only when something stands out.': 'Unter «Dein Körper heute» erscheint eine Zeile, aber nur, wenn etwas auffällt.',
    'Your resting pulse is above your usual for some days': 'Dein Ruhepuls liegt seit ein paar Tagen über deinem Üblichen',
    'Your last 7 days of active zone minutes are far from your usual week': 'Deine Aktivzonenminuten der letzten 7 Tage liegen weit von deiner üblichen Woche',
    'While your outdoors challenge runs, the line tells when the daylight gets short for the missing minutes': 'Solange deine Challenge «Draussen» läuft, sagt die Zeile, wann das Tageslicht für die fehlenden Minuten knapp wird',
    '«Not today» sends a line away until tomorrow. It only says what it sees, never good or bad.': '«Heute nicht» schickt eine Zeile bis morgen weg. Sie sagt nur, was sie sieht, nie gut oder schlecht.',
    'When a line stands under the values, tap «Not today»: it goes away for today.': 'Steht eine Zeile unter den Werten, tippe «Heute nicht»: Sie ist für heute weg.',
    'Tap «See»: the page with the history opens.': 'Tippe «Ansehen»: Die Seite mit dem Verlauf öffnet sich.',
  },
};
