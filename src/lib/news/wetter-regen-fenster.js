// «Wetter neu» PR 1 (Noah 04.11.2026 «1a 2a 3a 4b»): rain strip for 24 hours and windows for the Landi radar and the SRF webcams
export default {
  title: 'Rain strip and two windows on the weather page',
  lead: 'At the bottom of the weather page: when the rain comes in the next 24 hours, the Landi rain radar and the SRF Meteo webcams.',
  points: [
    { text: 'The rain strip shows hour by hour when it rains, e.g. «Rain from about 16:00»', go: { href: '#/wetter', steps: [{ sel: '[data-wx-r24]' }] } },
    { text: 'Open the Landi rain radar or the SRF webcams in a window, or in a new tab', go: { href: '#/wetter', steps: [{ sel: '[data-wx-window-toggle="landi"]' }] } },
  ],
  small: [{ box: 'new', text: 'A window that stays empty can be switched off on this device' }],
  test: [
    'Open Weather (Me › Weather) and scroll down. Under the lake and air cards you see «Rain in the next 24 hours» with one bar per hour.',
    'Tap «Landi rain radar»: the window opens. If it stays empty, tap «Open in a new tab» or «Stays empty? Show only the button».',
    'Tap «SRF Meteo webcams» the same way.',
  ],
  since: [],
  de: {
    'Rain strip and two windows on the weather page': 'Regenstreifen und zwei Fenster auf der Wetterseite',
    'At the bottom of the weather page: when the rain comes in the next 24 hours, the Landi rain radar and the SRF Meteo webcams.': 'Unten auf der Wetterseite: wann in den nächsten 24 Stunden der Regen kommt, der Landi-Regenradar und die SRF-Meteo-Webcams.',
    'The rain strip shows hour by hour when it rains, e.g. «Rain from about 16:00»': 'Der Regenstreifen zeigt Stunde für Stunde, wann es regnet, zum Beispiel «Regen ab etwa 16:00»',
    'Open the Landi rain radar or the SRF webcams in a window, or in a new tab': 'Den Landi-Regenradar oder die SRF-Webcams in einem Fenster öffnen, oder in einem neuen Tab',
    'A window that stays empty can be switched off on this device': 'Ein Fenster, das leer bleibt, lässt sich auf diesem Gerät ausschalten',
    'Open Weather (Me › Weather) and scroll down. Under the lake and air cards you see «Rain in the next 24 hours» with one bar per hour.': 'Öffne Wetter (Ich › Wetter) und scrolle nach unten. Unter den Karten Zürisee und Luft siehst du «Regen in den nächsten 24 Stunden» mit einer Säule pro Stunde.',
    'Tap «Landi rain radar»: the window opens. If it stays empty, tap «Open in a new tab» or «Stays empty? Show only the button».': 'Tippe auf «Landi-Regenradar»: das Fenster öffnet sich. Bleibt es leer, tippe auf «In neuem Tab öffnen» oder «Bleibt leer? Nur den Knopf zeigen».',
    'Tap «SRF Meteo webcams» the same way.': 'Tippe genauso auf «SRF-Meteo-Webcams».',
  },
};
