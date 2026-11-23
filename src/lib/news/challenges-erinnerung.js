// «Challenges» (Noah 22.11.2026): a phone reminder for own challenges, at a time set in the challenge
export default {
  title: 'Reminder for own challenges',
  lead: 'An own challenge can now remind you on the phone every day at a time you choose.',
  points: [
    { text: 'In the window of an own challenge, «Reminder time on the phone» sets the time; every day while it runs you get a message, unless the goal is already reached', go: { href: '#/flow/challenges', steps: [{ sel: '[data-challenges-page]' }] } },
    { text: 'Ich › Reminders on the phone has a new switch «Own challenges» for these messages; it switches on by itself when you set a time', go: { href: '#/me/push', steps: [{ sel: '[data-push-group]' }] } },
  ],
  small: [{ box: 'new', text: 'The time is optional: without a time an own challenge sends nothing, as before' }],
  test: ['Open the page Challenges, tap the pencil on an own challenge, set «Reminder time on the phone» (for example 18:30) and save.', 'Open Ich › Reminders on the phone: the switch «Own challenges» is on (the browser asks for notifications once).'],
  since: [],
  de: {
    'Reminder for own challenges': 'Erinnerung für eigene Challenges',
    'An own challenge can now remind you on the phone every day at a time you choose.': 'Eine eigene Challenge kann dich jetzt jeden Tag zu einer Zeit deiner Wahl aufs Handy erinnern.',
    'In the window of an own challenge, «Reminder time on the phone» sets the time; every day while it runs you get a message, unless the goal is already reached': 'Im Fenster einer eigenen Challenge legt «Zeit der Erinnerung aufs Handy» die Zeit fest; jeden Tag, solange sie läuft, kommt eine Mitteilung, ausser das Ziel ist schon erreicht',
    'Ich › Reminders on the phone has a new switch «Own challenges» for these messages; it switches on by itself when you set a time': 'Unter Ich › Erinnerungen aufs Handy gibt es den neuen Schalter «Eigene Challenges» für diese Mitteilungen; er geht von selbst an, wenn du eine Zeit setzt',
    'The time is optional: without a time an own challenge sends nothing, as before': 'Die Zeit ist freiwillig: ohne Zeit sendet eine eigene Challenge nichts, wie bisher',
    'Open the page Challenges, tap the pencil on an own challenge, set «Reminder time on the phone» (for example 18:30) and save.': 'Öffne die Seite Challenges, tippe auf den Stift einer eigenen Challenge, stelle «Zeit der Erinnerung aufs Handy» ein (zum Beispiel 18:30) und speichere.',
    'Open Ich › Reminders on the phone: the switch «Own challenges» is on (the browser asks for notifications once).': 'Öffne Ich › Erinnerungen aufs Handy: der Schalter «Eigene Challenges» ist an (der Browser fragt einmal nach Mitteilungen).',
  },
};
