// «Heute als Begleiter» PR 9 (Noah 28.10.2026 «1a 2a 3a»): «Gehört dazu» on Me (Ich)
export default {
  title: 'Belongs to: links on Me',
  lead: 'On top of Me a row shows the functions that belong to the app and help.',
  points: [{ text: 'On Me a row «Belongs to App and help» links to functions that are easy to miss, with «all n ›» for the rest', href: '#/me', go: { href: '#/me', steps: [{ sel: '[data-gehoert]' }], where: 'Shows on top of Me.' } }],
  small: [],
  test: ['Open Me: on top stands «Belongs to App and help» with up to five small links.', 'Tap «all …›»: «What the app can do» opens by moment.'],
  since: [],
  de: {
    'Belongs to: links on Me': 'Gehört dazu: Sprunglinks auf Ich',
    'On top of Me a row shows the functions that belong to the app and help.': 'Oben auf Ich zeigt eine Zeile die Funktionen, die zu App und Hilfe gehören.',
    'On Me a row «Belongs to App and help» links to functions that are easy to miss, with «all n ›» for the rest': 'Auf Ich verlinkt eine Zeile «Gehört zu: App und Hilfe» Funktionen, die man leicht übersieht, mit «alle n ›» für den Rest',
    'Shows on top of Me.': 'Zeigt sich oben auf Ich.',
    'Open Me: on top stands «Belongs to App and help» with up to five small links.': 'Öffne Ich: Oben steht «Gehört zu: App und Hilfe» mit bis zu fünf kleinen Links.',
    'Tap «all …›»: «What the app can do» opens by moment.': 'Tippe auf «alle …›»: «Was die App kann» öffnet sich nach Moment.',
  },
};
