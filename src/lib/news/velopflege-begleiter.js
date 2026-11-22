// «Inspektions-Begleiter» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Thread «Velopflege zum Inspektions-Begleiter machen», Schritt C)
export default {
  title: 'Bike check, step by step',
  lead: 'The check now guides you: first the tools you need, then one point at a time with tip and steps, at the end a summary with the to-dos.',
  points: [
    { text: 'First the tools, then one point per step, last time and tip included', go: { href: '#/bikes?tab=care&view=inspect', where: 'Start a check on a bike: the first step lists the tools.', steps: [{ sel: '[data-inspect-run]' }] } },
    { text: 'At the end a summary: what is fine, what needs a look, what to do', go: { href: '#/bikes?tab=care&view=inspect', where: 'Start a check on a bike: the last step is the summary.', steps: [{ sel: '[data-inspect-run]' }] } },
  ],
  small: [{ box: 'new', text: '«All points as a list» still shows the old list' }],
  test: [
    'Bikes › Care › Inspection: start a quick check. The first step shows the tools you need.',
    'Tap «Start» and go through the points with «Next»; at the end the summary lists what to do.',
  ],
  since: [],
  de: {
    'Bike check, step by step': 'Velo-Check, Schritt für Schritt',
    'The check now guides you: first the tools you need, then one point at a time with tip and steps, at the end a summary with the to-dos.': 'Der Check führt dich jetzt: zuerst das Werkzeug, das du brauchst, dann ein Punkt nach dem anderen mit Tipp und Schritten, am Ende eine Zusammenfassung mit den Aufgaben.',
    'First the tools, then one point per step, last time and tip included': 'Zuerst das Werkzeug, dann ein Punkt pro Schritt, mit «Letztes Mal» und Tipp',
    'Start a check on a bike: the first step lists the tools.': 'Starte einen Check bei einem Velo: Der erste Schritt zeigt das Werkzeug.',
    'At the end a summary: what is fine, what needs a look, what to do': 'Am Ende eine Zusammenfassung: was in Ordnung ist, was einen Blick braucht, was zu tun ist',
    'Start a check on a bike: the last step is the summary.': 'Starte einen Check bei einem Velo: Der letzte Schritt ist die Zusammenfassung.',
    '«All points as a list» still shows the old list': '«Alle Punkte als Liste» zeigt weiter die alte Liste',
    'Bikes › Care › Inspection: start a quick check. The first step shows the tools you need.': 'Velos › Pflege › Inspektion: Starte einen Schnellcheck. Der erste Schritt zeigt das Werkzeug, das du brauchst.',
    'Tap «Start» and go through the points with «Next»; at the end the summary lists what to do.': 'Tippe auf «Los geht’s» und geh die Punkte mit «Weiter» durch; am Ende listet die Zusammenfassung, was zu tun ist.',
  },
};
