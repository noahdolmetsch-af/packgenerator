// Gruss «Wi gahts?» B (Noah 05.11.2026 «alle umsetzen», Thread «Planen: Tagescheck mit Fragen»): die Knöpfe selbst anpassen
export default {
  title: 'Your own buttons behind the greeting',
  lead: 'Add, rename, hide, delete and sort the buttons of the greeting: faces, feelings, groups and plans.',
  points: [{ text: 'Greeting › «Adjust buttons»: add your own feelings (with an emoji) and plans, rename, hide, delete with Undo, sort by arrows or drag', go: { href: '#/', steps: [{ sel: '[data-hello-tap]' }, { sel: '[data-hello-adjust]' }], where: 'Today › the greeting at the top › «Adjust buttons» at the bottom.' } }],
  small: [
    { box: 'new', text: 'The same editor sits on «Your questions» under «Buttons of the greeting»' },
    { box: 'nicer', text: 'Answers you gave with a renamed or deleted button keep their words in the history' },
  ],
  test: [
    'Open Today, tap the greeting and then «Adjust buttons» at the bottom of the window.',
    'Add a feeling with an emoji, rename another one, hide one and delete one (then Undo).',
    'Tap «Back»: the window offers exactly your buttons. Open Me › Your questions: «Buttons of the greeting» shows the same list.',
  ],
  since: [],
  de: {
    'Your own buttons behind the greeting': 'Deine eigenen Knöpfe hinter dem Gruss',
    'Add, rename, hide, delete and sort the buttons of the greeting: faces, feelings, groups and plans.': 'Füge die Knöpfe des Grusses hinzu, benenne sie um, blende sie aus, lösche und ordne sie: Gesichter, Gefühle, Gruppen und Pläne.',
    'Greeting › «Adjust buttons»: add your own feelings (with an emoji) and plans, rename, hide, delete with Undo, sort by arrows or drag': 'Gruss › «Knöpfe anpassen»: eigene Gefühle (mit Emoji) und Pläne hinzufügen, umbenennen, ausblenden, löschen mit Rückgängig, ordnen mit Pfeilen oder Ziehen',
    'Today › the greeting at the top › «Adjust buttons» at the bottom.': 'Heute › der Gruss oben › «Knöpfe anpassen» unten.',
    'The same editor sits on «Your questions» under «Buttons of the greeting»': 'Derselbe Editor steht auf «Deine Fragen» unter «Knöpfe im Gruss»',
    'Answers you gave with a renamed or deleted button keep their words in the history': 'Antworten mit einem umbenannten oder gelöschten Knopf behalten ihre Worte im Verlauf',
    'Open Today, tap the greeting and then «Adjust buttons» at the bottom of the window.': 'Öffne Heute, tippe auf den Gruss und unten im Fenster auf «Knöpfe anpassen».',
    'Add a feeling with an emoji, rename another one, hide one and delete one (then Undo).': 'Füge ein Gefühl mit Emoji hinzu, benenne ein anderes um, blende eines aus und lösche eines (dann Rückgängig).',
    'Tap «Back»: the window offers exactly your buttons. Open Me › Your questions: «Buttons of the greeting» shows the same list.': 'Tippe «Zurück»: das Fenster bietet genau deine Knöpfe. Öffne Ich › Deine Fragen: «Knöpfe im Gruss» zeigt dieselbe Liste.',
  },
};
