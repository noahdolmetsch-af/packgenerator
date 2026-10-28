// Idee A1 «Ein Morgen-Push statt vieler» (Noah 27.10.2026 «alle umsetzen 1a 2a 3a 4a 5a», answer 3a)
export default {
  title: 'One message in the morning',
  lead: 'The reminders of 08:00 now come together at 07:00.',
  points: [{ text: 'Your trip, the first appointments and the reminders of the day in one message', href: '#/me/push' }],
  small: [{ box: 'new', text: 'Warnings (weather, ice, light, rain) still come on their own' }],
  test: [
    'Open Me › Reminders on the phone: under «In the morning» the switch «One message in the morning» is on.',
    'With a reminder at 08:00 (e.g. Parts worn), the phone shows «Your morning» at 07:00 instead.',
  ],
  since: ['f.morningpush'],
  de: {
    'One message in the morning': 'Eine Nachricht am Morgen',
    'The reminders of 08:00 now come together at 07:00.': 'Die Erinnerungen von 08:00 kommen jetzt zusammen um 07:00.',
    'Your trip, the first appointments and the reminders of the day in one message': 'Deine Tour, die ersten Termine und die Erinnerungen des Tages in einer Nachricht',
    'Warnings (weather, ice, light, rain) still come on their own': 'Warnungen (Wetter, Glätte, Licht, Regen) kommen weiter einzeln',
    'Open Me › Reminders on the phone: under «In the morning» the switch «One message in the morning» is on.': 'Öffne Ich › Erinnerungen aufs Handy: unter «Am Morgen» ist der Schalter «Eine Nachricht am Morgen» an.',
    'With a reminder at 08:00 (e.g. Parts worn), the phone shows «Your morning» at 07:00 instead.': 'Mit einer Erinnerung um 08:00 (z. B. Verschleiss) zeigt das Handy stattdessen um 07:00 «Dein Morgen».',
  },
};
