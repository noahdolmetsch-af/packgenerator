// «Kalender und Achsen» (Noah 07.11.2026 «6 ja», UI-Test der Analyse-Seite): even calendar fields, whole-number count axes
export default {
  title: 'Analyse: calendar and axes tidied up',
  lead: 'The calendar «Every day a field» has fields of one size that are easier to tap, and axes of counts only show whole numbers.',
  points: [
    { text: 'Calendar «Every day a field»: all fields the same size and bigger, weekday and month names on their rows and columns, a small legend', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-overview] .cal' }], where: 'Auswerten › Analyse › Overview, card «Every day a field».' } },
    { text: 'A long period starts at the newest weeks on a phone, older ones are a swipe away', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-overview] .cal' }], where: 'Auswerten › Analyse › Overview, period «90 days».' } },
    { text: 'Axes of counts (ticks per week, sessions) only show whole numbers, never «0.5»', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-weekly]' }], where: 'Auswerten › Analyse › Overview, card «Course».' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse › Overview and look at the card «Every day a field»: all fields have the same size.',
    'Switch the period to «90 days» on a phone: the newest weeks are on the right, swipe the calendar to see older ones; the weekday names stay on the left.',
    'Look at the axis of the card «Course»: only whole numbers (0, 1, 2 …), no halves.',
  ],
  since: [],
  de: {
    'Analyse: calendar and axes tidied up': 'Analyse: Kalender und Achsen aufgeräumt',
    'The calendar «Every day a field» has fields of one size that are easier to tap, and axes of counts only show whole numbers.': 'Der Kalender «Jeder Tag ein Feld» hat gleich grosse Felder, die sich besser antippen lassen, und Achsen von Anzahlen zeigen nur ganze Zahlen.',
    'Calendar «Every day a field»: all fields the same size and bigger, weekday and month names on their rows and columns, a small legend': 'Kalender «Jeder Tag ein Feld»: alle Felder gleich gross und grösser, Wochentage und Monate genau an ihrer Zeile und Spalte, dazu eine kleine Legende',
    'Auswerten › Analyse › Overview, card «Every day a field».': 'Auswerten › Analyse › Übersicht, Karte «Jeder Tag ein Feld».',
    'A long period starts at the newest weeks on a phone, older ones are a swipe away': 'Ein langer Zeitraum beginnt am Handy bei den neuesten Wochen, ältere sind einen Wisch entfernt',
    'Auswerten › Analyse › Overview, period «90 days».': 'Auswerten › Analyse › Übersicht, Zeitraum «90 Tage».',
    'Axes of counts (ticks per week, sessions) only show whole numbers, never «0.5»': 'Achsen von Anzahlen (Haken pro Woche, Einheiten) zeigen nur ganze Zahlen, nie «0,5»',
    'Auswerten › Analyse › Overview, card «Course».': 'Auswerten › Analyse › Übersicht, Karte «Verlauf».',
    'Open Auswerten › Analyse › Overview and look at the card «Every day a field»: all fields have the same size.': 'Öffne Auswerten › Analyse › Übersicht und schau die Karte «Jeder Tag ein Feld» an: alle Felder sind gleich gross.',
    'Switch the period to «90 days» on a phone: the newest weeks are on the right, swipe the calendar to see older ones; the weekday names stay on the left.': 'Stelle am Handy den Zeitraum auf «90 Tage»: Die neuesten Wochen sind rechts, wische den Kalender, um ältere zu sehen; die Wochentage bleiben links stehen.',
    'Look at the axis of the card «Course»: only whole numbers (0, 1, 2 …), no halves.': 'Schau die Achse der Karte «Verlauf» an: nur ganze Zahlen (0, 1, 2 …), keine halben.',
  },
};
