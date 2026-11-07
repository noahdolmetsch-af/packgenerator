// «Zahlen mit Weg» in Auswerten (UI-Prüfung 07.11.2026, Noah «alle Vorschläge», Rang 3, A1): week values and calories open their value in Analyse
export default {
  title: 'Numbers that lead somewhere',
  lead: 'On Auswerten, the week values for sleep, resting pulse and active minutes and the calories now open their value in Analyse.',
  points: [{ text: 'Tap a value in «Your week in numbers»: «Open … in Analyse ›» shows its course over 3 months', go: { href: '#/auswerten', steps: [{ sel: '[data-wn="rhr"]' }], where: 'Auswerten › Last 7 days › Your week in numbers, under the 12 weeks.' } }],
  small: [{ box: 'new', text: 'The calories in «Last 7 days» are a link as well' }],
  test: ['Open Auswerten › Last 7 days › Your week in numbers and tap «Resting pulse»: under the 12 weeks, «Open «Resting pulse» in Analyse ›» appears.', 'Tap it: the page of the resting pulse opens, over 3 months.'],
  since: [],
  de: {
    'Numbers that lead somewhere': 'Zahlen, die weiterführen',
    'On Auswerten, the week values for sleep, resting pulse and active minutes and the calories now open their value in Analyse.': 'In Auswerten öffnen die Wochenwerte für Schlaf, Ruhepuls und aktive Minuten sowie die Kalorien jetzt ihren Wert in der Analyse.',
    'Tap a value in «Your week in numbers»: «Open … in Analyse ›» shows its course over 3 months': 'Tippe in «Deine Woche in Zahlen» auf einen Wert: «Öffne … in der Analyse ›» zeigt seinen Verlauf über 3 Monate',
    'Auswerten › Last 7 days › Your week in numbers, under the 12 weeks.': 'Auswerten › Letzte 7 Tage › Deine Woche in Zahlen, unter den 12 Wochen.',
    'The calories in «Last 7 days» are a link as well': 'Auch die Kalorien in «Letzte 7 Tage» sind ein Link',
    'Open Auswerten › Last 7 days › Your week in numbers and tap «Resting pulse»: under the 12 weeks, «Open «Resting pulse» in Analyse ›» appears.': 'Öffne Auswerten › Letzte 7 Tage › Deine Woche in Zahlen und tippe auf «Ruhepuls»: unter den 12 Wochen erscheint «Öffne «Ruhepuls» in der Analyse ›».',
    'Tap it: the page of the resting pulse opens, over 3 months.': 'Tippe darauf: die Seite des Ruhepulses öffnet sich, über 3 Monate.',
  },
};
