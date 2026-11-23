// «Abendblick» (Noah 23.11.2026 «G2»): on the evening of a tour of several days, tap what you did not use
export default {
  title: 'Evening look: what did you not use today?',
  lead: 'On a tour of several days you tap in 30 seconds what you did not use, what broke and what was missing.',
  points: [
    { text: 'On the way, under «Evening», the fold «Evening look»: tap a thing once for «not used», twice for «broken»', go: { href: '#/ride', where: 'Shows on the way on a tour of several days, until the evening before the last day.', steps: [{ sel: '[data-fold="abend"]' }] } },
    { text: 'The marks are the ones of the debrief, so after the tour it is already filled in and the next list learns from it', go: { href: '#/ride', where: 'Shows on the way on a tour of several days, until the evening before the last day.', steps: [{ sel: '[data-fold="abend"]' }] } },
  ],
  small: [{ box: 'new', text: 'A line says how many things and how many grams were not used so far, to decide what to send home' }],
  test: [
    'Open a tour of several days under «Unterwegs» and open «Evening» and then «Evening look».',
    'Tap a thing: it says «Not used». Tap it again: «Broken». A third tap makes it «Used» again.',
    'Type a thing under «What was missing?» and tap «Add». After the tour the debrief shows these marks already.',
  ],
  since: [],
  de: {
    'Evening look: what did you not use today?': 'Abendblick: was hast du heute nicht gebraucht?',
    'On a tour of several days you tap in 30 seconds what you did not use, what broke and what was missing.': 'Bei einer Tour über mehrere Tage tippst du in 30 Sekunden an, was du nicht gebraucht hast, was kaputtging und was gefehlt hat.',
    'On the way, under «Evening», the fold «Evening look»: tap a thing once for «not used», twice for «broken»': 'Unterwegs unter «Abend» die Zeile «Abendblick»: tippe ein Teil einmal an für «Nicht gebraucht», zweimal für «Kaputt»',
    'Shows on the way on a tour of several days, until the evening before the last day.': 'Steht unterwegs bei einer Tour über mehrere Tage, bis zum Abend vor dem letzten Tag.',
    'The marks are the ones of the debrief, so after the tour it is already filled in and the next list learns from it': 'Es sind die Marken des Rückblicks: nach der Tour ist er schon ausgefüllt, und die nächste Liste lernt daraus',
    'A line says how many things and how many grams were not used so far, to decide what to send home': 'Eine Zeile sagt, wie viele Teile und wie viele Gramm bis jetzt nicht gebraucht wurden, damit du entscheiden kannst, was du heimschickst',
    'Open a tour of several days under «Unterwegs» and open «Evening» and then «Evening look».': 'Öffne unter «Unterwegs» eine Tour über mehrere Tage, dann «Abend» und «Abendblick».',
    'Tap a thing: it says «Not used». Tap it again: «Broken». A third tap makes it «Used» again.': 'Tippe ein Teil an: es heisst «Nicht gebraucht». Noch einmal: «Kaputt». Beim dritten Tipp ist es wieder «Gebraucht».',
    'Type a thing under «What was missing?» and tap «Add». After the tour the debrief shows these marks already.': 'Schreibe unter «Was hat gefehlt?» ein Teil auf und tippe «Hinzufügen». Nach der Tour zeigt der Rückblick diese Marken schon.',
  },
};
