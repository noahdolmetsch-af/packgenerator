// «Beat your Ghost» (Noah 03.11.2026, Cockpit-Idee 4): a ride against an earlier ride of your own
export default {
  title: 'Beat your ghost',
  lead: 'On a ride the new card «Beat your ghost» sets it against an earlier ride of yours: same power with less heart rate? And it shows how alike the two rides are, so you know how fair the comparison is.',
  points: [
    { text: 'The app picks the most alike earlier ride (the same route first); you can pick another one', go: { href: '#/flow/training', steps: [{ text: 'Training' }], where: 'Open a ride with heart rate, scroll to «Beat your ghost».' } },
    { text: 'Power, heart rate, watts per beat, speed, time and drift side by side, with one calm sentence', go: { href: '#/flow/training', steps: [{ text: 'Training' }], where: 'Open a ride with heart rate, scroll to «Beat your ghost».' } },
    { text: 'Route, distance, climbing, temperature and wind: how alike the two rides are, and what is not known', go: { href: '#/flow/training', steps: [{ text: 'Training' }], where: 'Open a ride with heart rate, scroll to «Beat your ghost».' } },
  ],
  small: [{ box: 'new', text: 'The card can be hidden or moved like every analysis' }],
  test: [
    'Open Training and a bike ride with a heart rate that has an earlier ride of a similar length.',
    'Scroll to «Beat your ghost»: the card names the sentence, then the table with this ride and the ghost.',
    'Pick another ghost in the list: the table and the sentence change; the chips say how alike the two rides are.',
  ],
  since: [],
  de: {
    'Beat your ghost': 'Schlag deinen Geist',
    'On a ride the new card «Beat your ghost» sets it against an earlier ride of yours: same power with less heart rate? And it shows how alike the two rides are, so you know how fair the comparison is.': 'Auf einer Fahrt stellt die neue Karte «Schlag deinen Geist» sie einer früheren Fahrt von dir gegenüber: gleiche Leistung mit weniger Puls? Und sie zeigt, wie ähnlich die beiden Fahrten sind, damit du weisst, wie fair der Vergleich ist.',
    'The app picks the most alike earlier ride (the same route first); you can pick another one': 'Die App wählt die ähnlichste frühere Fahrt (zuerst dieselbe Strecke); du kannst eine andere wählen',
    'Open a ride with heart rate, scroll to «Beat your ghost».': 'Öffne eine Fahrt mit Puls und scrolle zu «Schlag deinen Geist».',
    'Power, heart rate, watts per beat, speed, time and drift side by side, with one calm sentence': 'Leistung, Puls, Watt pro Schlag, Tempo, Zeit und Drift nebeneinander, mit einem ruhigen Satz',
    'Route, distance, climbing, temperature and wind: how alike the two rides are, and what is not known': 'Strecke, Distanz, Höhenmeter, Temperatur und Wind: wie ähnlich die beiden Fahrten sind und was nicht bekannt ist',
    'The card can be hidden or moved like every analysis': 'Die Karte lässt sich ausblenden oder verschieben wie jede Analyse',
    'Open Training and a bike ride with a heart rate that has an earlier ride of a similar length.': 'Öffne Training und eine Velofahrt mit Puls, zu der es eine frühere Fahrt ähnlicher Länge gibt.',
    'Scroll to «Beat your ghost»: the card names the sentence, then the table with this ride and the ghost.': 'Scrolle zu «Schlag deinen Geist»: die Karte nennt den Satz, darunter die Tabelle mit dieser Fahrt und dem Geist.',
    'Pick another ghost in the list: the table and the sentence change; the chips say how alike the two rides are.': 'Wähle in der Liste einen anderen Geist: Tabelle und Satz ändern sich; die Felder sagen, wie ähnlich die beiden Fahrten sind.',
  },
};
