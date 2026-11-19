// «Tage-Knöpfe sagen, was sie tun» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 6)
export default {
  title: 'Day buttons say what they do',
  lead: 'In the suggestion for the week, a day without a limit says «any» instead of «open», and the line under the days names the whole row of taps.',
  points: [
    { text: 'Vorschlag für die Woche: a day says «beliebig» (not «offen»), the line below lists every step', go: { href: '#/flow/training', steps: [{ sel: '[data-suggest-open]' }], where: 'Training, in der Woche.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training, tap «Vorschlag für diese Woche». Each day shows «beliebig».',
    'Tap a day: it goes to «≤1h», «≤30m», «frei» and back to «beliebig». The line below the days names these steps.',
  ],
  since: [],
  de: {
    'Day buttons say what they do': 'Tage-Knöpfe sagen, was sie tun',
    'In the suggestion for the week, a day without a limit says «any» instead of «open», and the line under the days names the whole row of taps.': 'Im Vorschlag für die Woche steht bei einem Tag ohne Grenze «beliebig» statt «offen», und der Satz unter den Tagen nennt die ganze Reihe der Tipps.',
    'Vorschlag für die Woche: a day says «beliebig» (not «offen»), the line below lists every step': 'Vorschlag für die Woche: ein Tag sagt «beliebig» (nicht «offen»), der Satz darunter nennt jeden Schritt',
    'Training, in der Woche.': 'Training, im Reiter «Woche».',
    'Open Aktiv › Training, tap «Vorschlag für diese Woche». Each day shows «beliebig».': 'Öffne Aktiv › Training, tippe auf «Vorschlag für diese Woche». Jeder Tag zeigt «beliebig».',
    'Tap a day: it goes to «≤1h», «≤30m», «frei» and back to «beliebig». The line below the days names these steps.': 'Tippe einen Tag an: er geht auf «≤1h», «≤30m», «frei» und zurück auf «beliebig». Der Satz unter den Tagen nennt diese Schritte.',
  },
};
