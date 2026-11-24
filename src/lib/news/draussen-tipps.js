// «Challenges nach Gelegenheit» (Noah 23.11.2026 «3a»): aus der Draussen-Karte zu den Ausflugstipps
export default {
  title: 'From the Outdoors card to a trip tip',
  lead: 'While today\'s minutes are still open, the Outdoors card links to three new places that fit your time.',
  points: [{ text: 'Today › Outdoors card: tap «Trip tips for your time»', href: '#/trips/dreams', go: { href: '#/', where: 'The link shows in the Outdoors card while today\'s goal is open.', steps: [{ sel: '[data-outdoor-tips]' }] } }],
  small: [{ box: 'new', text: 'The link disappears when the goal of the day is reached' }],
  test: [
    'On Today, find the Outdoors card (start a challenge if there is none).',
    'While the day is open, tap «Trip tips for your time».',
    'Trips › Dreams opens with «Fits today» at the top.',
  ],
  since: [],
  de: {
    'From the Outdoors card to a trip tip': 'Von der Draussen-Karte zum Ausflugstipp',
    'While today\'s minutes are still open, the Outdoors card links to three new places that fit your time.': 'Solange die Minuten von heute offen sind, führt die Draussen-Karte zu drei neuen Orten, die zu deiner Zeit passen.',
    'Today › Outdoors card: tap «Trip tips for your time»': 'Heute › Draussen-Karte: tippe auf «Ausflugstipps für deine Zeit»',
    'The link shows in the Outdoors card while today\'s goal is open.': 'Der Link steht in der Draussen-Karte, solange das Tagesziel offen ist.',
    'The link disappears when the goal of the day is reached': 'Der Link verschwindet, wenn das Tagesziel erreicht ist',
    'On Today, find the Outdoors card (start a challenge if there is none).': 'Suche auf Heute die Draussen-Karte (starte eine Challenge, falls es keine gibt).',
    'While the day is open, tap «Trip tips for your time».': 'Tippe, solange der Tag offen ist, auf «Ausflugstipps für deine Zeit».',
    'Trips › Dreams opens with «Fits today» at the top.': 'Touren › Träume öffnet sich, «Heute passt» steht oben.',
  },
};
