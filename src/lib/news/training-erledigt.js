// «Ein Wort: Erledigt» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 8)
export default {
  title: 'One word on Training: done',
  lead: 'A finished session says «Erledigt» everywhere on Training: the button, the legend, the look back and the messages. The strange words «Relative Effort» and «TSS» in the help get a plain sentence.',
  points: [
    { text: 'Training › Woche: «Erledigt» on the button, in the legend and in the look back (before: Gemacht, gemacht, Fertig)', go: { href: '#/flow/training', steps: [{ sel: '[data-planned]' }], where: 'Training, in der Woche.' } },
    { text: 'Training › Analysen: «Belastung» is explained with time and strength, without «TSS»', go: { href: '#/flow/training?view=ana', steps: [{ sel: '[data-section="week-analyses"] .words' }], where: 'Training, above the analyses.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training, tap a planned session: the button says «Erledigt».',
    'Under the week plan the legend says «grün = erledigt»; in the look back the line says «Erledigt».',
  ],
  since: [],
  de: {
    'One word on Training: done': 'Ein Wort auf Training: erledigt',
    'A finished session says «Erledigt» everywhere on Training: the button, the legend, the look back and the messages. The strange words «Relative Effort» and «TSS» in the help get a plain sentence.': 'Eine fertige Einheit heisst auf Training überall «Erledigt»: Knopf, Legende, Rückblick und Meldungen. Die fremden Wörter «Relative Effort» und «TSS» in der Hilfe bekommen einen einfachen Satz.',
    'Training › Woche: «Erledigt» on the button, in the legend and in the look back (before: Gemacht, gemacht, Fertig)': 'Training › Woche: «Erledigt» auf dem Knopf, in der Legende und im Rückblick (vorher: Gemacht, gemacht, Fertig)',
    'Training, in der Woche.': 'Training, im Reiter «Woche».',
    'Training › Analysen: «Belastung» is explained with time and strength, without «TSS»': 'Training › Analysen: «Belastung» wird mit Dauer und Stärke erklärt, ohne «TSS»',
    'Training, above the analyses.': 'Training, über den Analysen.',
    'Open Aktiv › Training, tap a planned session: the button says «Erledigt».': 'Öffne Aktiv › Training, tippe eine geplante Einheit an: der Knopf heisst «Erledigt».',
    'Under the week plan the legend says «grün = erledigt»; in the look back the line says «Erledigt».': 'Unter dem Wochenplan sagt die Legende «grün = erledigt»; im Rückblick heisst die Zeile «Erledigt».',
  },
};
