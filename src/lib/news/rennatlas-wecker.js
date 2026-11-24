// «Anmelde-Wecker» im Rennatlas (Noah 24.11.2026, Idee 2): ein Wecker pro Rennen, der aufs Handy erinnert
export default {
  title: 'An alarm for the registration of a race',
  lead: 'A race of your race atlas can now remind you on the phone when its registration opens and shortly before it closes.',
  points: [
    { text: 'Race atlas › open a race › «Remind me on the phone»: the phone reminds you at 08:00 on the day the registration opens, and 3 days and 1 day before it closes', go: { href: '#/race', steps: [{ text: 'Open the race atlas' }] } },
    { text: 'The window names the days of the reminders; «Alarm on» switches it off again, and a race you mark as registered needs none', go: { href: '#/race', steps: [{ text: 'Open the race atlas' }] } },
  ],
  test: [
    'Go to Trips › Races › «Race atlas» (with your file loaded) and open a race whose registration is still to come.',
    'Tap «Remind me on the phone»: the button turns to «Alarm on» and the window names the days.',
    'Tap «Alarm on» again: the alarm is off.',
  ],
  since: [],
  de: {
    'An alarm for the registration of a race': 'Ein Wecker für die Anmeldung zu einem Rennen',
    'A race of your race atlas can now remind you on the phone when its registration opens and shortly before it closes.': 'Ein Rennen aus deinem Rennatlas kann dich jetzt aufs Handy erinnern, wenn die Anmeldung öffnet und kurz bevor sie schliesst.',
    'Race atlas › open a race › «Remind me on the phone»: the phone reminds you at 08:00 on the day the registration opens, and 3 days and 1 day before it closes': 'Rennatlas › ein Rennen öffnen › «Aufs Handy erinnern»: Das Handy erinnert dich um 08:00 am Tag, an dem die Anmeldung öffnet, und 3 Tage und 1 Tag vor Anmeldeschluss',
    'The window names the days of the reminders; «Alarm on» switches it off again, and a race you mark as registered needs none': 'Das Fenster nennt die Tage der Erinnerungen; mit «Wecker an» schaltest du ihn wieder aus, und ein Rennen, das du als angemeldet markierst, braucht keinen',
    'Go to Trips › Races › «Race atlas» (with your file loaded) and open a race whose registration is still to come.': 'Geh zu Touren › Rennen › «Rennatlas» (mit geladener Datei) und öffne ein Rennen, dessen Anmeldung noch bevorsteht.',
    'Tap «Remind me on the phone»: the button turns to «Alarm on» and the window names the days.': 'Tippe auf «Aufs Handy erinnern»: Der Knopf wird zu «Wecker an», und das Fenster nennt die Tage.',
    'Tap «Alarm on» again: the alarm is off.': 'Tippe nochmals auf «Wecker an»: Der Wecker ist aus.',
  },
};
