// «Zonen ändern springt zum Formular» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 1)
export default {
  title: 'Change zones: straight to the form',
  lead: 'A tap on «Change zones» on an activity now brings you to the zones form, no scrolling for it.',
  points: [
    { text: 'On an activity, «Change zones» opens Training with the zones form in view', go: { href: '#/flow/training?zones=1', steps: [{ sel: '[data-bound="0"]' }], where: 'Training, at the heart rate zones.' } },
  ],
  small: [],
  test: [
    'Open any activity under Aktiv › Training › Activities and tap «Change zones» above its zone bars.',
    'The page opens at the heart rate zones, the four fields are in view and you can change them at once.',
  ],
  since: [],
  de: {
    'Change zones: straight to the form': 'Zonen ändern: gleich zum Formular',
    'A tap on «Change zones» on an activity now brings you to the zones form, no scrolling for it.': 'Ein Tipp auf «Zonen ändern» bei einer Aktivität bringt dich jetzt gleich zum Formular der Zonen, ohne Scrollen.',
    'On an activity, «Change zones» opens Training with the zones form in view': 'Bei einer Aktivität öffnet «Zonen ändern» das Training mit dem Formular der Zonen im Bild',
    'Training, at the heart rate zones.': 'Training, bei den Pulszonen.',
    'Open any activity under Aktiv › Training › Activities and tap «Change zones» above its zone bars.': 'Öffne unter Aktiv › Training › Aktivitäten eine Aktivität und tippe über den Zonen-Balken auf «Zonen ändern».',
    'The page opens at the heart rate zones, the four fields are in view and you can change them at once.': 'Die Seite öffnet bei den Pulszonen, die vier Felder sind im Bild und du kannst sie gleich ändern.',
  },
};
