// «Training verbessern» 3a (Noah 3.11.2026 «3a»): free days and time per day in the week suggestion
export default {
  title: 'Free days and time per day',
  lead: 'In «Suggestion for this week» you tap a weekday: 1 h at most, 30 min at most, or free. The week is built around it, and the app remembers your choice.',
  points: [{ text: 'Tap the days in «Suggestion for this week»', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }, { sel: '[data-sug-day-btn="0"]' }] } }],
  small: [],
  test: [
    'Open Aktiv › Training, tap «Suggestion for this week», then tap a weekday once: «max. 1 h».',
    'Tap it until it says «free»: that day has no session. Close and open the suggestion again: your choice is still there.',
  ],
  since: [],
  de: {
    'Free days and time per day': 'Freie Tage und Zeit pro Tag',
    'In «Suggestion for this week» you tap a weekday: 1 h at most, 30 min at most, or free. The week is built around it, and the app remembers your choice.': 'Bei «Vorschlag für diese Woche» tippst du einen Wochentag an: höchstens 1 Std., höchstens 30 Min. oder frei. Die Woche wird darum herum gebaut, und die App merkt sich deine Wahl.',
    'Tap the days in «Suggestion for this week»': 'Tippe bei «Vorschlag für diese Woche» die Tage an',
    'Open Aktiv › Training, tap «Suggestion for this week», then tap a weekday once: «max. 1 h».': 'Öffne Aktiv › Training, tippe auf «Vorschlag für diese Woche» und dann einmal einen Wochentag an: «max. 1 Std.».',
    'Tap it until it says «free»: that day has no session. Close and open the suggestion again: your choice is still there.': 'Tippe weiter, bis «frei» steht: der Tag hat keine Einheit. Schliesse den Vorschlag und öffne ihn neu: deine Wahl ist noch da.',
  },
};
