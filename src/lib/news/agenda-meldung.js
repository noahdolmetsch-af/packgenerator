// Noah 1.11.2026: after «Fetch now» on the agenda a clear line says it worked
export default {
  title: 'Agenda says when it is fetched',
  lead: 'After «Fetch now» a line says the appointments and tasks are up to date.',
  points: [{ text: 'Agenda: «Fetch now» ends with «Done»', go: { href: '#/agenda', where: 'Shows at the top of the agenda after «Fetch now», once Google is connected.' } }],
  small: [],
  test: ['Open the agenda and tap «Fetch now».', 'A line says «Done: appointments and tasks are up to date from Google.»'],
  since: [],
  de: {
    'Agenda says when it is fetched': 'Die Agenda sagt, wann sie geholt ist',
    'After «Fetch now» a line says the appointments and tasks are up to date.': 'Nach «Jetzt holen» sagt eine Zeile, dass Termine und Aufgaben auf dem neuesten Stand sind.',
    'Agenda: «Fetch now» ends with «Done»': 'Agenda: «Jetzt holen» endet mit «Fertig»',
    'Shows at the top of the agenda after «Fetch now», once Google is connected.': 'Zeigt sich oben in der Agenda nach «Jetzt holen», sobald Google verbunden ist.',
    'Open the agenda and tap «Fetch now».': 'Öffne die Agenda und tippe «Jetzt holen».',
    'A line says «Done: appointments and tasks are up to date from Google.»': 'Eine Zeile sagt «Fertig: Termine und Aufgaben sind von Google auf dem neuesten Stand.»',
  },
};
