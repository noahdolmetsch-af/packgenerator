// «Starte hier» (Noah 23.11.2026 «1-5a», V2 Klarheit und Auffindbarkeit): the empty Heute with one main button
export default {
  title: 'An empty Today says where to start',
  lead: 'Without data Today shows one card «Start here» with one main button.',
  points: [
    { text: 'The card «Start here» has one main button for the next step: bike, then gear, then trip', go: null },
    { text: 'Tour, sample race and a backup from before are quiet lines on the same card', go: null },
  ],
  small: [{ box: 'new', text: 'Body, «Up now» and the weather lines show up as soon as there is something to show; «Show everything now» brings them at once' }],
  test: [
    'Open the app in a new browser without data and choose «Start empty»: Today shows the card «Start here».',
    'Tap the main button: it leads to the first bike. Add one: the button now says «Add your first item».',
    'Tap «Show everything now» under the card: the whole Today shows.',
  ],
  since: [],
  de: {
    'An empty Today says where to start': 'Ein leeres Heute sagt, wo du anfängst',
    'Without data Today shows one card «Start here» with one main button.': 'Ohne Daten zeigt Heute eine Karte «Starte hier» mit einem Hauptknopf.',
    'The card «Start here» has one main button for the next step: bike, then gear, then trip': 'Die Karte «Starte hier» hat einen Hauptknopf für den nächsten Schritt: Velo, dann Material, dann Tour',
    'Tour, sample race and a backup from before are quiet lines on the same card': 'Rundgang, Muster-Rennen und ein Backup von früher sind leise Zeilen auf derselben Karte',
    'Body, «Up now» and the weather lines show up as soon as there is something to show; «Show everything now» brings them at once': 'Körper, «Jetzt dran» und die Wetter-Zeilen erscheinen, sobald es etwas zu zeigen gibt; «Jetzt alles zeigen» bringt sie sofort',
    'Open the app in a new browser without data and choose «Start empty»: Today shows the card «Start here».': 'Öffne die App in einem neuen Browser ohne Daten und wähle «Leer starten»: Heute zeigt die Karte «Starte hier».',
    'Tap the main button: it leads to the first bike. Add one: the button now says «Add your first item».': 'Tippe auf den Hauptknopf: Er führt zum ersten Velo. Lege eins an: Der Knopf sagt jetzt «Erstes Teil eintragen».',
    'Tap «Show everything now» under the card: the whole Today shows.': 'Tippe unter der Karte auf «Jetzt alles zeigen»: Das ganze Heute erscheint.',
  },
};
