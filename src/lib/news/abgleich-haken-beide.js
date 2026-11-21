// «Haken von zwei Geräten bleiben beide» (Noah 21.11.2026 «1-5a», Punkt 4)
export default {
  title: 'Ticks from two devices both stay',
  lead: 'When you pack the same trip on the phone and the computer, or tick the same week of the weekly plan on both, the ticks of both devices stay.',
  points: [{ text: 'Packing list and weekly plan: no tick is lost when two devices change the same list', go: { href: '#/pack', where: 'Works by itself in the background whenever two synced devices tick in the same packing list or the same week.' } }],
  small: [],
  test: [
    'Open Pack with a trip: tick an item and watch the count of packed items go up.',
    'On a second synced device, tick another item of the same trip: after the sync both items are ticked on both devices.',
  ],
  since: [],
  de: {
    'Ticks from two devices both stay': 'Haken von zwei Geräten bleiben beide',
    'When you pack the same trip on the phone and the computer, or tick the same week of the weekly plan on both, the ticks of both devices stay.': 'Packst du dieselbe Tour am Handy und am Computer oder hakst dieselbe Woche des Wochenplans auf beiden ab, bleiben die Haken beider Geräte.',
    'Packing list and weekly plan: no tick is lost when two devices change the same list': 'Packliste und Wochenplan: Kein Haken geht verloren, wenn zwei Geräte dieselbe Liste ändern',
    'Works by itself in the background whenever two synced devices tick in the same packing list or the same week.': 'Läuft von selbst im Hintergrund, sobald zwei abgeglichene Geräte in derselben Packliste oder in derselben Woche abhaken.',
    'Open Pack with a trip: tick an item and watch the count of packed items go up.': 'Öffne Packen mit einer Tour: Hake einen Gegenstand ab und sieh, wie die Zahl der gepackten Dinge steigt.',
    'On a second synced device, tick another item of the same trip: after the sync both items are ticked on both devices.': 'Hake auf einem zweiten abgeglichenen Gerät einen anderen Gegenstand derselben Tour ab: Nach dem Abgleich sind beide auf beiden Geräten abgehakt.',
  },
};
