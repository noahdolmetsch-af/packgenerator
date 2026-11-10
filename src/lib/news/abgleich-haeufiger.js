// «Abgleich viel häufiger» (Noah 10.11.2026 «1 ok 2 ok», «a»): a tick on one device shows on the other within seconds
export default {
  title: 'Phone and computer in step within seconds',
  lead: 'A tick on one device now shows on the other within seconds while the app is open.',
  points: [
    {
      text: 'The app sends a change after 2 seconds and asks for news every 20 seconds while it is open',
      go: { href: '#/me/data', where: 'Me › Data and backup › Phone and computer: «On · last synced …» (only with the sync switched on).' },
    },
    {
      text: 'A grey line under «Tick off today» says when phone and computer were last in step',
      go: { href: '#/flow', where: 'Under the tiles of «Tick off today» on Aktiv, only with the sync switched on: «Synced 12 s ago».' },
    },
    {
      text: 'Pulling down on Today or Aktiv also syncs phone and computer',
      go: { href: '#/', where: 'On a phone, at the very top of Today or Aktiv, pull down with a finger.' },
    },
  ],
  small: [],
  test: [
    'Tick Tennis on your phone under Aktiv › Tick off today and keep the app open.',
    'Look at the computer (Aktiv open): after a few seconds Tennis is ticked there too.',
    'Under the tiles the grey line says «Synced … ago». If it says «Sync is stuck», tap it.',
  ],
  since: [],
  de: {
    'Phone and computer in step within seconds': 'Handy und Computer in Sekunden gleich',
    'A tick on one device now shows on the other within seconds while the app is open.': 'Ein Haken auf einem Gerät steht jetzt innerhalb von Sekunden auch auf dem anderen, solange die App offen ist.',
    'The app sends a change after 2 seconds and asks for news every 20 seconds while it is open': 'Die App sendet eine Änderung nach 2 Sekunden und fragt alle 20 Sekunden nach Neuem, solange sie offen ist',
    'Me › Data and backup › Phone and computer: «On · last synced …» (only with the sync switched on).': 'Ich › Daten und Backup › Handy und Computer: «Eingeschaltet · zuletzt abgeglichen …» (nur bei eingeschaltetem Abgleich).',
    'A grey line under «Tick off today» says when phone and computer were last in step': 'Eine graue Zeile unter «Heute abhaken» zeigt, wann Handy und Computer zuletzt gleich waren',
    'Under the tiles of «Tick off today» on Aktiv, only with the sync switched on: «Synced 12 s ago».': 'Unter den Kacheln von «Heute abhaken» auf Aktiv, nur bei eingeschaltetem Abgleich: «Abgeglichen vor 12 s».',
    'Pulling down on Today or Aktiv also syncs phone and computer': 'Ziehen auf Heute oder Aktiv gleicht auch Handy und Computer ab',
    'On a phone, at the very top of Today or Aktiv, pull down with a finger.': 'Auf dem Handy ganz oben auf Heute oder Aktiv mit dem Finger nach unten ziehen.',
    'Tick Tennis on your phone under Aktiv › Tick off today and keep the app open.': 'Hake Tennis auf dem Handy unter Aktiv › Heute abhaken ab und lass die App offen.',
    'Look at the computer (Aktiv open): after a few seconds Tennis is ticked there too.': 'Schau auf den Computer (Aktiv offen): Nach einigen Sekunden ist Tennis auch dort abgehakt.',
    'Under the tiles the grey line says «Synced … ago». If it says «Sync is stuck», tap it.': 'Unter den Kacheln steht die graue Zeile «Abgeglichen vor …». Steht dort «Abgleich hängt», tippe darauf.',
  },
};
