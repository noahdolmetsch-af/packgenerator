// «Wetter ausbauen» (Noah 22.11.2026 «a»; Thread «Wetter besser machen»)
export default {
  title: 'More from the weather',
  lead: 'Rain in steps of 15 minutes, the weather along your route and a place of its own.',
  points: [
    { text: 'Weather is a place of its own in the sidebar on a computer, with four parts: Now, Radar and cameras, Plan, Look back', go: { href: '#/wetter', steps: [{ sel: '[data-wx-tabs]' }] } },
    { text: 'The rain of the next three hours in steps of 15 minutes, with one sentence like «Rain from 14:30, until about 15:15»', go: { href: '#/wetter', steps: [{ sel: '[data-wx-r3]' }], where: 'Weather › Now, «Rain in the next 3 hours»: shows as soon as the weather service has answered.' } },
    { text: 'On a trip with a route: headwind share, coldest point, packing hints for the whole way, the webcams on the way and one line per riding day', go: 'f.wxroute' },
  ],
  small: [
    { box: 'new', text: 'One line says if the road is wet or dry, and «Share this window» copies the best ride window as a text', go: { href: '#/wetter', steps: [{ sel: '[data-wx-tabs]' }] } },
    { box: 'new', text: 'On Today the snow, fog and night lines sit in one closed line «Weather today»', go: { href: '#/', steps: [{ sel: '[data-heute-wetter-fold-sum]' }], where: 'Today › the closed line «Weather today»: it shows on a day with a planned trip and a forecast.' } },
  ],
  test: ['Open Weather in the sidebar (on a computer) or from Today; «Now» shows the rain of the next 3 hours with one sentence.', 'Open «Plan», pick how long you ride and tap «Share this window (copy the text)».', 'Open a planned trip with a route: «Weather along the route» now names the headwind and the coldest point.'],
  since: ['f.wxrain15', 'f.wxroute', 'f.wxroad', 'f.wxshare'],
  de: {
    'Weather › Now, «Rain in the next 3 hours»: shows as soon as the weather service has answered.': 'Wetter › Jetzt, «Regen in den nächsten 3 Stunden»: erscheint, sobald der Wetterdienst geantwortet hat.',
    'Today › the closed line «Weather today»: it shows on a day with a planned trip and a forecast.': 'Heute › die geschlossene Zeile «Wetter heute»: sie erscheint an einem Tag mit geplanter Tour und mit Vorhersage.',
    'More from the weather': 'Mehr aus dem Wetter',
    'Rain in steps of 15 minutes, the weather along your route and a place of its own.': 'Regen in 15-Minuten-Schritten, das Wetter entlang deiner Route und ein eigener Platz.',
    'Weather is a place of its own in the sidebar on a computer, with four parts: Now, Radar and cameras, Plan, Look back': 'Wetter ist am Computer ein eigener Platz in der Seitenleiste, mit vier Teilen: Jetzt, Radar und Kameras, Planen, Rückblick',
    'The rain of the next three hours in steps of 15 minutes, with one sentence like «Rain from 14:30, until about 15:15»': 'Der Regen der nächsten drei Stunden in 15-Minuten-Schritten, mit einem Satz wie «Regen ab 14:30, bis etwa 15:15»',
    'On a trip with a route: headwind share, coldest point, packing hints for the whole way, the webcams on the way and one line per riding day': 'Auf einer Tour mit Strecke: Anteil Gegenwind, kälteste Stelle, Packhinweise für den ganzen Weg, die Webcams am Weg und eine Zeile pro Fahrtag',
    'One line says if the road is wet or dry, and «Share this window» copies the best ride window as a text': 'Eine Zeile sagt, ob die Strasse nass oder trocken ist, und «Fenster teilen» kopiert das beste Fahrfenster als Text',
    'On Today the snow, fog and night lines sit in one closed line «Weather today»': 'Auf Heute stehen die Zeilen zu Schnee, Nebel und Nacht in einer geschlossenen Zeile «Wetter heute»',
    'Open Weather in the sidebar (on a computer) or from Today; «Now» shows the rain of the next 3 hours with one sentence.': 'Öffne Wetter in der Seitenleiste (am Computer) oder von Heute aus; «Jetzt» zeigt den Regen der nächsten 3 Stunden mit einem Satz.',
    'Open «Plan», pick how long you ride and tap «Share this window (copy the text)».': 'Öffne «Planen», wähle, wie lange du fährst, und tippe auf «Fenster teilen (Text kopieren)».',
    'Open a planned trip with a route: «Weather along the route» now names the headwind and the coldest point.': 'Öffne eine geplante Tour mit Strecke: «Wetter entlang der Route» nennt jetzt den Gegenwind und die kälteste Stelle.',
  },
};
