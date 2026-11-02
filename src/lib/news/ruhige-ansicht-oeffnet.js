// «Ruhige Ansicht» Schritt 2 (Noah 02.11.2026 «bauen alles»): the strip opens the matching page by itself
export default {
  title: 'The calm view opens your page',
  lead: 'Write what you do, and «Open» on the strip takes you to the matching page.',
  points: [{ text: 'The strip finds the page from your words, e.g. «chain» opens bike care', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  small: [{ box: 'new', text: 'You no longer have to pick a function first', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  test: [
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «check chain», tap «Calm view».',
    'Open any page: the strip shows «Open». Tap it: the matching page opens and the strip stays.',
  ],
  since: [],
  de: {
    'The calm view opens your page': 'Die Ruhige Ansicht öffnet deine Seite',
    'Write what you do, and «Open» on the strip takes you to the matching page.': 'Schreib, was du tust, und «Öffnen» in der Leiste führt dich zur passenden Seite.',
    'The strip finds the page from your words, e.g. «chain» opens bike care': 'Die Leiste findet die Seite aus deinen Worten, z. B. «Kette» öffnet die Velopflege',
    'You no longer have to pick a function first': 'Du musst nicht mehr zuerst eine Funktion wählen',
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «check chain», tap «Calm view».': 'Öffne Ich › Ruhig und persönlich › Weniger App für den Moment › Ruhige Ansicht, schreib «Kette prüfen», tippe «Ruhige Ansicht».',
    'Open any page: the strip shows «Open». Tap it: the matching page opens and the strip stays.': 'Öffne irgendeine Seite: die Leiste zeigt «Öffnen». Tippe darauf: die passende Seite öffnet sich und die Leiste bleibt.',
  },
};
