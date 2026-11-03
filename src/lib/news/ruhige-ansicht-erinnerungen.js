// «Ruhige Ansicht» Schritt 6 (Noah 02.11.2026 «bauen alles»): phone reminders rest during the calm view
export default {
  title: 'Phone reminders rest too',
  lead: 'During a calm view with a time, phone reminders wait until its end. Warnings still come on time.',
  points: [{ text: 'Reminders inside your calm time move to just after the end; nothing is lost', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  small: [{ box: 'new', text: 'Weather, ice, light and eating warnings always come on time', go: { href: '#/me/ruhig/weniger?open=calm', steps: [{ text: 'Calm view' }] } }],
  test: [
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «clean the bike», choose «30 min», tap «Calm view».',
    'The card says «Phone reminders wait until the end». Tap «Done»: they go back to their own time.',
  ],
  since: [],
  de: {
    'Phone reminders rest too': 'Auch Handy-Erinnerungen ruhen',
    'During a calm view with a time, phone reminders wait until its end. Warnings still come on time.': 'Während einer Ruhigen Ansicht mit Zeit warten Handy-Erinnerungen bis zum Ende. Warnungen kommen weiter pünktlich.',
    'Reminders inside your calm time move to just after the end; nothing is lost': 'Erinnerungen in deiner ruhigen Zeit rücken kurz hinter das Ende; nichts geht verloren',
    'Weather, ice, light and eating warnings always come on time': 'Warnungen für Wetter, Eis, Licht und Essen kommen immer pünktlich',
    'Open Me › Calm and personal › Less app for the moment › Calm view, write «clean the bike», choose «30 min», tap «Calm view».': 'Öffne Ich › Ruhig und persönlich › Weniger App für den Moment › Ruhige Ansicht, schreib «Velo putzen», wähle «30 Min.», tippe «Ruhige Ansicht».',
    'The card says «Phone reminders wait until the end». Tap «Done»: they go back to their own time.': 'Die Karte sagt «Handy-Erinnerungen warten bis zum Ende». Tippe «Fertig»: sie gehen zurück auf ihre eigene Zeit.',
  },
};
