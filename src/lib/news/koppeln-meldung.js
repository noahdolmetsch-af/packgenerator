// «Koppeln sagt, was wirklich passiert ist» (found while making the Dokumente test robust, Noah «3a»,
// thread «Einzelideen Ich»): pairing while a sync round already ran said «Gekoppelt» from the older
// round; now the panel waits for its own round and shows its result or its error
export default {
  title: 'Pairing tells what really happened',
  lead: 'Pairing two devices shows the result of its own first round.',
  points: [{ text: 'Pairing during a running sync no longer says «Paired» too early', href: '#/me/data' }],
  small: [],
  test: ['Open Ich › Daten und Backup › Handy und Computer and pair with a code while the phone has no network.', 'The panel says «Gerade kein Netz. Der Abgleich holt es später nach.» instead of «Gekoppelt».'],
  since: [],
  de: {
    'Pairing tells what really happened': 'Koppeln sagt, was wirklich passiert ist',
    'Pairing two devices shows the result of its own first round.': 'Beim Koppeln von zwei Geräten siehst du das Ergebnis des eigenen ersten Abgleichs.',
    'Pairing during a running sync no longer says «Paired» too early': 'Koppeln während eines laufenden Abgleichs meldet nicht mehr zu früh «Gekoppelt»',
    'Open Ich › Daten und Backup › Handy und Computer and pair with a code while the phone has no network.': 'Öffne Ich › Daten und Backup › Handy und Computer und kopple mit einem Code, während das Handy kein Netz hat.',
    'The panel says «Gerade kein Netz. Der Abgleich holt es später nach.» instead of «Gekoppelt».': 'Das Feld sagt «Gerade kein Netz. Der Abgleich holt es später nach.» statt «Gekoppelt».',
  },
};
