// «Draussen-Challenge» PR 2 (Noah 21.11.2026 «2b»): the daily reminder on the phone at 16:00
export default {
  title: 'Outdoors reminder on the phone',
  lead: 'The outdoors challenge can remind you on the phone every day at 16:00, while the day is not reached yet.',
  points: [
    { text: 'On the card «Outdoors» the button «Remind me on the phone every day at 16:00» switches the reminder on; the time can be changed behind the pencil', go: { href: '#/', steps: [{ sel: '[data-outdoor-remind], [data-outdoor-start], [data-outdoor-card]' }] } },
    { text: 'The reminder says how many minutes are still missing; a day that is already reached sends none', go: { href: '#/me/push' } },
  ],
  small: [{ box: 'new', text: 'In Reminders on the phone there is a new switch «Outdoors challenge» under «Everyday life»' }],
  test: ['On Today, on the card «Outdoors», tap «Remind me on the phone every day at 16:00»: the phone asks once for notifications, then the line «Reminder on the phone every day at 16:00» appears.', 'Open Me › Reminders on the phone: the switch «Outdoors challenge» is on. Tap «Switch off» on the card: the switch is off again.'],
  since: [],
  de: {
    'Outdoors reminder on the phone': 'Erinnerung Draussen aufs Handy',
    'The outdoors challenge can remind you on the phone every day at 16:00, while the day is not reached yet.': 'Die Challenge Draussen kann dich jeden Tag um 16:00 aufs Handy erinnern, solange der Tag noch nicht erreicht ist.',
    'On the card «Outdoors» the button «Remind me on the phone every day at 16:00» switches the reminder on; the time can be changed behind the pencil': 'Auf der Karte «Draussen» schaltet der Knopf «Täglich um 16:00 aufs Handy erinnern» die Erinnerung ein; die Zeit änderst du hinter dem Stift',
    'The reminder says how many minutes are still missing; a day that is already reached sends none': 'Die Erinnerung sagt, wie viele Minuten noch fehlen; ein Tag, der schon erreicht ist, schickt keine',
    'In Reminders on the phone there is a new switch «Outdoors challenge» under «Everyday life»': 'In Erinnerungen aufs Handy gibt es unter «Alltag» einen neuen Schalter «Challenge Draussen»',
    'On Today, on the card «Outdoors», tap «Remind me on the phone every day at 16:00»: the phone asks once for notifications, then the line «Reminder on the phone every day at 16:00» appears.': 'Tippe auf Heute auf der Karte «Draussen» auf «Täglich um 16:00 aufs Handy erinnern»: das Handy fragt einmal nach Mitteilungen, danach steht die Zeile «Erinnerung aufs Handy: täglich um 16:00».',
    'Open Me › Reminders on the phone: the switch «Outdoors challenge» is on. Tap «Switch off» on the card: the switch is off again.': 'Öffne Ich › Erinnerungen aufs Handy: der Schalter «Challenge Draussen» ist an. Tippe auf der Karte auf «Ausschalten»: der Schalter ist wieder aus.',
  },
};
