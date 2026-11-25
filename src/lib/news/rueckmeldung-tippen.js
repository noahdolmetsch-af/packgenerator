// «Rückmeldung beim Tippen» (Noah 25.11.2026 «1-5a»): a tick buzzes briefly and lights up, a finished moment buzzes twice
export default {
  title: 'You feel every tick',
  lead: 'Ticking off now buzzes briefly and the tile lights up once, so you know it worked.',
  points: [
    { text: 'In «Tick off today», habits, to-dos and the challenge «+30 min» a tick buzzes briefly and lights up', go: { href: '#/', steps: [{ sel: '[data-section="flow"] .tile' }], where: 'Today › Tick off today: tap a tile.' } },
    { text: 'A new star, a reached day goal, a saved debrief and a bike service buzz twice', go: null },
    { text: 'One switch for the buzz: Me › Look › «Short vibration when ticking»', go: { href: '#/me/look', steps: [{ text: 'Short vibration when ticking' }] } },
  ],
  small: [{ box: 'nicer', text: 'Tiles and buttons shrink a little while your finger is on them; with «Reduce motion» or «Motion: Off» the light and the shrinking stay still', go: null }],
  test: [
    'On Today tap a tile in «Tick off today» (an Android phone): it buzzes once and the tile lights up softly. Tap it again: it stays quiet.',
    'Me › Look: switch off «Short vibration when ticking», tick again: no buzz.',
    'Tick off a to-do: it buzzes and folds away.',
  ],
  since: [],
  de: {
    'You feel every tick': 'Du spürst jedes Abhaken',
    'Ticking off now buzzes briefly and the tile lights up once, so you know it worked.': 'Beim Abhaken vibriert das Handy jetzt kurz und die Kachel leuchtet einmal auf, damit du sicher weisst, dass es geklappt hat.',
    'In «Tick off today», habits, to-dos and the challenge «+30 min» a tick buzzes briefly and lights up': 'In «Heute abhaken», bei Gewohnheiten, To-dos und «+30 Min» der Challenge vibriert ein Haken kurz und leuchtet auf',
    'Today › Tick off today: tap a tile.': 'Heute › Heute abhaken: tippe auf eine Kachel.',
    'A new star, a reached day goal, a saved debrief and a bike service buzz twice': 'Ein neuer Stern, ein erreichtes Tagesziel, ein gespeicherter Debrief und ein Velo-Service vibrieren doppelt',
    'One switch for the buzz: Me › Look › «Short vibration when ticking»': 'Ein Schalter fürs Vibrieren: Ich › Aussehen › «Kurzes Vibrieren beim Abhaken»',
    'Tiles and buttons shrink a little while your finger is on them; with «Reduce motion» or «Motion: Off» the light and the shrinking stay still': 'Kacheln und Knöpfe schrumpfen kurz, solange dein Finger drauf ist; bei «Bewegung reduzieren» oder «Bewegung: Aus» stehen Licht und Schrumpfen still',
    'On Today tap a tile in «Tick off today» (an Android phone): it buzzes once and the tile lights up softly. Tap it again: it stays quiet.': 'Tippe auf Heute eine Kachel in «Heute abhaken» (Android-Handy): es vibriert einmal und die Kachel leuchtet weich auf. Tippe nochmals: es bleibt still.',
    'Me › Look: switch off «Short vibration when ticking», tick again: no buzz.': 'Ich › Aussehen: schalte «Kurzes Vibrieren beim Abhaken» aus und hake nochmals ab: kein Vibrieren.',
    'Tick off a to-do: it buzzes and folds away.': 'Hake ein To-do ab: es vibriert und klappt weg.',
  },
};
