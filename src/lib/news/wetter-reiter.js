// «Wetter neu» PR 2 (Noah 04.11.2026 «5 alle»): the weather page in four parts
export default {
  title: 'The weather page in four parts',
  lead: 'The weather page is shorter: Now, Radar and cameras, Plan and Look back.',
  points: [{ text: 'Tap «Radar and cameras» for the rain radar, the SRF webcams and your own webcams', go: { href: '#/wetter?tab=radar', steps: [{ sel: '[data-wx-tab="radar"]' }] } }],
  small: [{ box: 'new', text: 'The page remembers the part you looked at last' }],
  test: [
    'Open Weather (Me › Weather): under your place you see four parts. «Now» shows today, the next hours, the lake and the air.',
    'Tap «Plan»: the best time for a ride, compare places and the usual weather far ahead.',
    'Tap «Look back», then open the page again: it opens on «Look back».',
  ],
  since: [],
  de: {
    'The weather page in four parts': 'Die Wetterseite in vier Teilen',
    'The weather page is shorter: Now, Radar and cameras, Plan and Look back.': 'Die Wetterseite ist kürzer: Jetzt, Radar und Kameras, Planen und Rückblick.',
    'Tap «Radar and cameras» for the rain radar, the SRF webcams and your own webcams': 'Tippe auf «Radar und Kameras» für den Regenradar, die SRF-Webcams und deine eigenen Webcams',
    'The page remembers the part you looked at last': 'Die Seite merkt sich den Teil, den du zuletzt angesehen hast',
    'Open Weather (Me › Weather): under your place you see four parts. «Now» shows today, the next hours, the lake and the air.': 'Öffne Wetter (Ich › Wetter): unter deinem Ort siehst du vier Teile. «Jetzt» zeigt heute, die nächsten Stunden, den Zürisee und die Luft.',
    'Tap «Plan»: the best time for a ride, compare places and the usual weather far ahead.': 'Tippe auf «Planen»: die beste Zeit für eine Fahrt, Orte vergleichen und das übliche Wetter weit voraus.',
    'Tap «Look back», then open the page again: it opens on «Look back».': 'Tippe auf «Rückblick» und öffne die Seite danach nochmals: sie öffnet auf «Rückblick».',
  },
};
