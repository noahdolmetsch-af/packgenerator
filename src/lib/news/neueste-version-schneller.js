// «Neueste Version schneller» (Noah 27.10.2026 «1-5 a», questions 3 and 4): the bar after 2 minutes instead of 15,
// and once per version the app loads itself fresh 30 seconds after the start
export default {
  title: 'The new version comes sooner',
  lead: 'If a newer version is online but not on this device, the app loads it by itself.',
  points: [{ text: '30 seconds after the start the app loads a newer version fresh, once per version', href: '#/me' }],
  small: [{ box: 'nicer', text: 'The bar «Version … is online» comes after 2 minutes instead of 15' }],
  test: ['After the next «Online: …» open the app and wait half a minute: it loads anew by itself.', 'Ich › Help shows «this device is up to date».'],
  since: [],
  de: {
    'The new version comes sooner': 'Die neue Version kommt schneller',
    'If a newer version is online but not on this device, the app loads it by itself.': 'Ist online eine neuere Version, aber noch nicht auf diesem Gerät, lädt die App sie von selbst.',
    '30 seconds after the start the app loads a newer version fresh, once per version': '30 Sekunden nach dem Start lädt die App eine neuere Version frisch, einmal pro Version',
    'The bar «Version … is online» comes after 2 minutes instead of 15': 'Der Balken «Version … ist online» kommt nach 2 statt nach 15 Minuten',
    'After the next «Online: …» open the app and wait half a minute: it loads anew by itself.': 'Öffne nach dem nächsten «Online: …» die App und warte eine halbe Minute: Sie lädt von selbst neu.',
    'Ich › Help shows «this device is up to date».': 'Ich › Hilfe zeigt «dieses Gerät ist aktuell».',
  },
};
