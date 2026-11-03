// «Freunde mit eigenem Strava» (Noah 27.10.2026 «bauen, dass wir in zukunft jederzeit umstellen können», Vorschlag ★ 1a 2a 3a)
export default {
  title: 'Invite friends to Strava',
  lead: 'You decide in the app who may connect their own Strava, and change it at any time.',
  points: [{ text: 'Bike › Care › Strava › «Invite a friend» makes a link that works once within 7 days', href: '#/bikes?tab=care&view=strava', go: 'f.strava' }],
  small: [{ box: 'new', text: 'The list of friends, each with «Remove» and «Undo»', go: 'f.strava' }],
  test: ['Open Bike › Care › Strava and tap «Invite a friend».', 'A link appears with «Copy link» and the note about Strava’s own limit.', 'Under «Friends with their own Strava» it says «Only you are connected».'],
  since: [],
  de: {
    'Invite friends to Strava': 'Freunde zu Strava einladen',
    'You decide in the app who may connect their own Strava, and change it at any time.': 'Du entscheidest in der App, wer sein eigenes Strava verbinden darf, und kannst es jederzeit ändern.',
    'Bike › Care › Strava › «Invite a friend» makes a link that works once within 7 days': 'Velo › Pflege › Strava › «Freund einladen» macht einen Link, der einmal und 7 Tage gilt',
    'The list of friends, each with «Remove» and «Undo»': 'Die Liste der Freunde, jeweils mit «Entfernen» und «Rückgängig»',
    'Open Bike › Care › Strava and tap «Invite a friend».': 'Öffne Velo › Pflege › Strava und tippe «Freund einladen».',
    'A link appears with «Copy link» and the note about Strava’s own limit.': 'Ein Link erscheint mit «Link kopieren» und dem Hinweis zu Stravas eigener Grenze.',
    'Under «Friends with their own Strava» it says «Only you are connected».': 'Unter «Freunde mit eigenem Strava» steht «Nur du bist verbunden».',
  },
};
