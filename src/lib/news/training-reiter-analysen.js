// «Reiter Analysen» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 4): planning and analysing are two views of Training
export default {
  title: 'Training: a tab for the analyses',
  lead: 'Training now has three tabs: «Week» to plan and look back, «Activities» and the new «Analyses» with the analyses over the weeks, your heart rate zones and your FTP. The week page is shorter.',
  points: [
    { text: 'Tap the tab «Analyses» on Training: the analyses, the heart rate zones and the FTP are there', go: { href: '#/flow/training?view=ana', steps: [{ sel: '[data-section="week-analyses"]' }], where: 'Training, tab «Analyses».' } },
  ],
  small: [{ box: 'new', text: 'The chip «Power and analyses» on Training opens the tab' }],
  test: [
    'Open Aktiv › Training: under the plan of the week and the look back nothing follows any more.',
    'Tap the tab «Analyses»: the analyses over the weeks, the heart rate zones and the FTP stand there.',
  ],
  since: [],
  de: {
    'Training: a tab for the analyses': 'Training: ein Reiter für die Analysen',
    'Training now has three tabs: «Week» to plan and look back, «Activities» and the new «Analyses» with the analyses over the weeks, your heart rate zones and your FTP. The week page is shorter.': 'Training hat jetzt drei Reiter: «Woche» zum Planen und Zurückschauen, «Aktivitäten» und neu «Analysen» mit den Auswertungen über die Wochen, deinen Pulszonen und deiner FTP. Die Wochen-Ansicht ist kürzer.',
    'Tap the tab «Analyses» on Training: the analyses, the heart rate zones and the FTP are there': 'Tippe auf Training auf den Reiter «Analysen»: Dort stehen die Auswertungen, die Pulszonen und die FTP',
    'Training, tab «Analyses».': 'Training, Reiter «Analysen».',
    'The chip «Power and analyses» on Training opens the tab': 'Der Sprung «Leistung und Analysen» auf Training öffnet den Reiter',
    'Open Aktiv › Training: under the plan of the week and the look back nothing follows any more.': 'Öffne Aktiv › Training: Unter dem Plan der Woche und dem Rückblick folgt nichts mehr.',
    'Tap the tab «Analyses»: the analyses over the weeks, the heart rate zones and the FTP stand there.': 'Tippe auf den Reiter «Analysen»: Dort stehen die Auswertungen über die Wochen, die Pulszonen und die FTP.',
  },
};
