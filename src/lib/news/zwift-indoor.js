// «Zwift und Indoor sichtbar» (Noah 19.11.2026 «1a 2b 3a 4a 5b»): rides on the trainer or in Zwift get their own word
export default {
  title: 'Indoor and Zwift rides stand out',
  lead: 'Rides on the trainer or in Zwift now say «Indoor / Zwift» and can be shown on their own.',
  points: [
    { text: 'In Training › Activities a ride on the trainer or in Zwift says «Indoor / Zwift»; a button shows only these rides', go: { href: '#/flow/training?view=list', where: 'Training › Activities, once Strava has brought a ride on the trainer or in Zwift.' } },
    { text: 'Older Zwift rides: «Import rides» explains how to get the FIT file from Zwift', go: { href: '#/bikes?tab=care&view=import', steps: [{ text: 'Import rides' }] } },
  ],
  small: [{ box: 'new', text: 'A FIT file from Zwift without a position is read: the day and the km count' }],
  test: [
    'Open Training › Activities: a ride on the trainer or in Zwift says «Indoor / Zwift» under its name.',
    'Tap the button «Indoor / Zwift»: only these rides stay; tap it again for all.',
    'Open such a ride: «Indoor / Zwift» stands among its facts.',
  ],
  since: [],
  de: {
    'Indoor and Zwift rides stand out': 'Indoor- und Zwift-Fahrten fallen auf',
    'Rides on the trainer or in Zwift now say «Indoor / Zwift» and can be shown on their own.': 'Fahrten auf der Rolle oder in Zwift heissen jetzt «Indoor / Zwift» und lassen sich einzeln zeigen.',
    'In Training › Activities a ride on the trainer or in Zwift says «Indoor / Zwift»; a button shows only these rides': 'In Training › Aktivitäten steht bei einer Fahrt auf der Rolle oder in Zwift «Indoor / Zwift»; ein Knopf zeigt nur diese Fahrten',
    'Training › Activities, once Strava has brought a ride on the trainer or in Zwift.': 'Training › Aktivitäten, sobald Strava eine Fahrt auf der Rolle oder in Zwift gebracht hat.',
    'Older Zwift rides: «Import rides» explains how to get the FIT file from Zwift': 'Ältere Zwift-Fahrten: «Fahrten importieren» erklärt, wie du die FIT-Datei aus Zwift holst',
    'A FIT file from Zwift without a position is read: the day and the km count': 'Eine FIT-Datei aus Zwift ohne Position wird gelesen: Der Tag und die km zählen',
    'Open Training › Activities: a ride on the trainer or in Zwift says «Indoor / Zwift» under its name.': 'Öffne Training › Aktivitäten: Eine Fahrt auf der Rolle oder in Zwift trägt unter dem Namen «Indoor / Zwift».',
    'Tap the button «Indoor / Zwift»: only these rides stay; tap it again for all.': 'Tippe auf den Knopf «Indoor / Zwift»: Nur diese Fahrten bleiben; tippe noch einmal für alle.',
    'Open such a ride: «Indoor / Zwift» stands among its facts.': 'Öffne so eine Fahrt: «Indoor / Zwift» steht unter ihren Angaben.',
  },
};
