// «Zeit lesbar» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 9)
export default {
  title: 'Readable time on an activity',
  lead: 'On the activity page of Training the elapsed time and the breaks read «1:48:20» instead of «00:01:48:20». Only a tour of a day or more keeps days in front.',
  points: [
    { text: 'Training › Aktivität: «Zeit verstrichen» and «Pausen» as h:mm:ss, days only from 24 hours', go: { href: '#/flow/training?view=list', steps: [{ sel: 'a[data-activity]' }], where: 'Training › Aktivitäten, then one activity.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training › Aktivitäten and tap one activity.',
    'Under «Zeit verstrichen» the time reads like «1:48:20», without «00:» in front.',
  ],
  since: [],
  de: {
    'Readable time on an activity': 'Lesbare Zeit bei einer Aktivität',
    'On the activity page of Training the elapsed time and the breaks read «1:48:20» instead of «00:01:48:20». Only a tour of a day or more keeps days in front.': 'Auf der Aktivitätsseite von Training steht die verstrichene Zeit und die Pausenzeit als «1:48:20» statt «00:01:48:20». Nur eine Tour von einem Tag oder mehr behält die Tage vorne.',
    'Training › Aktivität: «Zeit verstrichen» and «Pausen» as h:mm:ss, days only from 24 hours': 'Training › Aktivität: «Zeit verstrichen» und «Pausen» als h:mm:ss, Tage erst ab 24 Stunden',
    'Training › Aktivitäten, then one activity.': 'Training › Aktivitäten, dann eine Aktivität.',
    'Open Aktiv › Training › Aktivitäten and tap one activity.': 'Öffne Aktiv › Training › Aktivitäten und tippe eine Aktivität an.',
    'Under «Zeit verstrichen» the time reads like «1:48:20», without «00:» in front.': 'Unter «Zeit verstrichen» steht die Zeit wie «1:48:20», ohne «00:» davor.',
  },
};
