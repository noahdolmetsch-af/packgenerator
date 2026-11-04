// «Fahrtechnik-Tagebuch» (Noah 04.11.2026 «4a», Persönliches Lernen Idee 3): tick techniques in the debrief, a diary page
export default {
  title: 'Riding technique diary',
  lead: 'After a ride you can tick the riding techniques you worked on, and keep a diary of what you want to practise and where.',
  points: [
    { text: 'The debrief asks «What did you practise?»: hairpins, braking control, steep climbs … tick what you worked on and say how it went', go: { href: '#/debrief', where: 'Debrief of a ride, under «How hard was it?».' } },
    { text: 'The diary shows how often you worked on each technique and the last time, and you mark what you want to practise, with a place', go: { href: '#/debrief/technik', where: 'Trips › Look back › Riding technique diary.' } },
    { text: 'The techniques are a list: rename, add or hide them', go: { href: '#/me/lists', where: 'Me › Lists and types › Riding techniques.' } },
  ],
  small: [{ box: 'new', text: 'A second tap on a ticked technique takes it away' }],
  test: ['Open the debrief of a ride: under «What did you practise?» tick «Hairpins», then tap «Still unsure».', 'Open Trips › Look back › Riding technique diary: «Hairpins» says «Worked on 1 time».', 'Tap «I want to practise this» and write a place; it stays after you leave the page.'],
  since: ['f.technik'],
  de: {
    'Riding technique diary': 'Fahrtechnik-Tagebuch',
    'After a ride you can tick the riding techniques you worked on, and keep a diary of what you want to practise and where.': 'Nach einer Fahrt kannst du die Fahrtechniken abhaken, an denen du gearbeitet hast, und ein Tagebuch führen, was du üben willst und wo.',
    'The debrief asks «What did you practise?»: hairpins, braking control, steep climbs … tick what you worked on and say how it went': 'Der Rückblick fragt «Was hast du geübt?»: Spitzkehren, Bremsdosierung, steile Anstiege … hak ab, woran du gearbeitet hast, und sag, wie es ging',
    'Debrief of a ride, under «How hard was it?».': 'Rückblick einer Fahrt, unter «Wie anstrengend war es?».',
    'The diary shows how often you worked on each technique and the last time, and you mark what you want to practise, with a place': 'Das Tagebuch zeigt, wie oft du an jeder Technik gearbeitet hast und das letzte Mal; du markierst, was du üben willst, mit einem Ort',
    'Trips › Look back › Riding technique diary.': 'Touren › Rückblick › Fahrtechnik-Tagebuch.',
    'The techniques are a list: rename, add or hide them': 'Die Techniken sind eine Liste: umbenennen, ergänzen oder ausblenden',
    'Me › Lists and types › Riding techniques.': 'Ich › Listen und Typen › Fahrtechniken.',
    'A second tap on a ticked technique takes it away': 'Ein zweiter Tipp auf eine abgehakte Technik nimmt sie weg',
    'Open the debrief of a ride: under «What did you practise?» tick «Hairpins», then tap «Still unsure».': 'Öffne den Rückblick einer Fahrt: hak unter «Was hast du geübt?» «Spitzkehren» ab und tipp dann «Noch unsicher».',
    'Open Trips › Look back › Riding technique diary: «Hairpins» says «Worked on 1 time».': 'Öffne Touren › Rückblick › Fahrtechnik-Tagebuch: bei «Spitzkehren» steht «1-mal geübt».',
    'Tap «I want to practise this» and write a place; it stays after you leave the page.': 'Tipp «Das will ich üben» und schreib einen Ort; er bleibt, auch wenn du die Seite verlässt.',
  },
};
