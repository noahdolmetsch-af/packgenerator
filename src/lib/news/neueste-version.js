// «Neueste Version» in Ich (Noah 27.10.2026 «1-5 a», questions 1 and 2): the device's version next to the online
// one, and «Neueste laden» always there
export default {
  title: 'Which version is online?',
  lead: 'Ich shows the version on this device and the one online, with «Load newest».',
  points: [{ text: 'Version on this device and online, in Ich › Help', href: '#/me', go: { href: '#/me', steps: [{ sel: '[data-version-row]' }], where: 'Shows in Me under Help.' } }],
  small: [{ box: 'new', text: '«Load newest» loads the app fresh from the internet, your data stays', go: { href: '#/me', steps: [{ sel: '[data-version-row]' }], where: 'Shows in Me under Help.' } }],
  test: ['Open Ich and scroll to «Help»: the row «Version … on this device» says which version is online.', 'Tap «Load newest»: the app loads anew and your data is still there.'],
  since: [],
  de: {
    'Which version is online?': 'Welche Version ist online?',
    'Ich shows the version on this device and the one online, with «Load newest».': 'Ich zeigt die Version auf diesem Gerät und die Version online, mit «Neueste laden».',
    'Version on this device and online, in Ich › Help': 'Version auf diesem Gerät und online, unter Ich › Hilfe',
    '«Load newest» loads the app fresh from the internet, your data stays': '«Neueste laden» lädt die App frisch aus dem Internet, deine Daten bleiben',
    'Open Ich and scroll to «Help»: the row «Version … on this device» says which version is online.': 'Öffne Ich und scrolle zu «Hilfe»: Die Zeile «Version … auf diesem Gerät» sagt, welche Version online ist.',
    'Tap «Load newest»: the app loads anew and your data is still there.': 'Tippe auf «Neueste laden»: Die App lädt neu, und deine Daten sind noch da.',
  },
};
