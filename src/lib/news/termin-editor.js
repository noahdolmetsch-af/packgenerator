// «Kalender 1:1» Schritt 1 (Noah 28.10.2026 «1a 2a 3b»): the appointment editor knows what Google knows
export default {
  title: 'Appointments like in Google',
  lead: 'The appointment form now has description, reminders, availability, who sees it and the time zone.',
  points: [
    { text: 'New appointment: add reminders (a day before, an hour before), a description and the time zone', go: 'f.agenda' },
    { text: 'Show yourself as «Free» or «Busy» and choose who sees an appointment', go: { href: '#/me/agenda', where: 'Shows once Google Calendar is connected: «Show me as» and «Who sees it» are in the appointment form.' } },
    { text: 'Open an appointment and tap «Duplicate» or «Copy to another calendar»', go: { href: '#/me/agenda', where: 'Shows once Google Calendar is connected: open an appointment in the list, the buttons are below it.' } },
  ],
  small: [{ box: 'new', text: 'The description comes from Google as plain text; it is sent back only when you change it' }],
  test: ['Open Ich › Termine und Aufgaben, tap «New appointment» and add a reminder «1 day» before.', 'Enter it, then open the appointment in Google: the reminder and the description are there.', 'Open an appointment in the app and tap «Duplicate»: the form is filled in, nothing is sent until you tap «Enter in Google».'],
  since: [],
  de: {
    'Shows once Google Calendar is connected: «Show me as» and «Who sees it» are in the appointment form.': 'Erscheint, sobald Google Kalender verbunden ist: «Anzeigen als» und «Wer sieht es» stehen im Termin-Formular.',
    'Shows once Google Calendar is connected: open an appointment in the list, the buttons are below it.': 'Erscheint, sobald Google Kalender verbunden ist: öffne einen Termin in der Liste, die Knöpfe stehen darunter.',
    'Appointments like in Google': 'Termine wie in Google',
    'The appointment form now has description, reminders, availability, who sees it and the time zone.': 'Das Termin-Formular hat jetzt Beschreibung, Erinnerungen, Verfügbarkeit, wer es sieht und die Zeitzone.',
    'New appointment: add reminders (a day before, an hour before), a description and the time zone': 'Neuer Termin: Erinnerungen (einen Tag vorher, eine Stunde vorher), Beschreibung und Zeitzone',
    'Show yourself as «Free» or «Busy» and choose who sees an appointment': 'Zeige dich als «Frei» oder «Beschäftigt» und wähle, wer einen Termin sieht',
    'Open an appointment and tap «Duplicate» or «Copy to another calendar»': 'Öffne einen Termin und tippe auf «Duplizieren» oder «In anderen Kalender kopieren»',
    'The description comes from Google as plain text; it is sent back only when you change it': 'Die Beschreibung kommt als einfacher Text von Google; sie geht nur zurück, wenn du sie änderst',
    'Open Ich › Termine und Aufgaben, tap «New appointment» and add a reminder «1 day» before.': 'Öffne Ich › Termine und Aufgaben, tippe auf «Termin eintragen» und füge eine Erinnerung «1 Tag» vorher hinzu.',
    'Enter it, then open the appointment in Google: the reminder and the description are there.': 'Trage ihn ein und öffne den Termin in Google: Erinnerung und Beschreibung sind da.',
    'Open an appointment in the app and tap «Duplicate»: the form is filled in, nothing is sent until you tap «Enter in Google».': 'Öffne einen Termin in der App und tippe auf «Duplizieren»: das Formular ist ausgefüllt, nichts geht weg, bis du «In Google eintragen» tippst.',
  },
};
