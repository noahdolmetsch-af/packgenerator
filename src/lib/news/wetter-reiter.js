// «Wetter neu» PR 2 (Noah 04.11.2026 «5 alle»): the weather page in four parts
export default {
  title: 'The weather page in four parts',
  lead: 'The weather page is shorter: Now, Radar and cameras, Plan and Look back.',
  points: [{ text: 'Tap «Radar and cameras» for the rain radar, the SRF webcams and your own webcams', go: { href: '#/wetter?tab=radar', steps: [{ sel: '[data-wx-tab="radar"]' }] } }],
  small: [{ box: 'new', text: 'Your place is chosen in «Now»; the other parts show it and lead back there' }],
  test: [
    'Open Weather (Me › Weather): under your place you see four parts. «Now» shows today, the next hours, the lake and the air.',
    'Tap «Plan»: the best time for a ride, compare places and the usual weather far ahead.',
    'Tap «Radar and cameras»: the place shows as a name with «Change place», which leads back to «Now».',
  ],
  since: [],
  de: {
    'The weather page in four parts': 'Die Wetterseite in vier Teilen',
    'The weather page is shorter: Now, Radar and cameras, Plan and Look back.': 'Die Wetterseite ist kürzer: Jetzt, Radar und Kameras, Planen und Rückblick.',
    'Tap «Radar and cameras» for the rain radar, the SRF webcams and your own webcams': 'Tippe auf «Radar und Kameras» für den Regenradar, die SRF-Webcams und deine eigenen Webcams',
    'Your place is chosen in «Now»; the other parts show it and lead back there': 'Den Ort wählst du in «Jetzt»; die anderen Teile zeigen ihn und führen dorthin zurück',
    'Open Weather (Me › Weather): under your place you see four parts. «Now» shows today, the next hours, the lake and the air.': 'Öffne Wetter (Ich › Wetter): unter deinem Ort siehst du vier Teile. «Jetzt» zeigt heute, die nächsten Stunden, den Zürisee und die Luft.',
    'Tap «Plan»: the best time for a ride, compare places and the usual weather far ahead.': 'Tippe auf «Planen»: die beste Zeit für eine Fahrt, Orte vergleichen und das übliche Wetter weit voraus.',
    'Tap «Radar and cameras»: the place shows as a name with «Change place», which leads back to «Now».': 'Tippe auf «Radar und Kameras»: der Ort steht als Name mit «Ort ändern», das zurück zu «Jetzt» führt.',
  },
};
