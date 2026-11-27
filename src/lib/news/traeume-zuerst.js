// «Träume: deine Träume zuerst» (impeccable F3, Noah «1-5a» 24.11.2026): the list first, the intro and «How it works» at the end, the outing tips under the list.
export default {
  title: 'Dreams: your dreams first',
  lead: 'On the dreams page the field to add a dream and the list come right behind the title; the intro and the guide moved to the end.',
  points: [
    { text: 'The field to add a dream and the views List · Map · Year stand right behind the title; the intro sentence and «How it works» moved to the end of the page', go: { href: '#/trips/dreams', steps: [{ sel: '[data-dreams-views]' }] } },
    { text: '«Fits today: trip tips» stand under the list of dreams', go: { href: '#/trips/dreams', steps: [{ sel: '[data-trip-tips]' }], where: 'Dreams, under the list' } },
  ],
  test: [
    'Open Trips › Dreams: the field «Add» and the views List · Map · Year stand right behind the title.',
    'Scroll down: the trip tips stand under the list, the guide at the very end.',
  ],
  since: [],
  de: {
    'Dreams: your dreams first': 'Träume: deine Träume zuerst',
    'On the dreams page the field to add a dream and the list come right behind the title; the intro and the guide moved to the end.': 'Auf der Träume-Seite stehen das Feld zum Hinzufügen und die Liste direkt hinter dem Titel; der Einleitungssatz und die Anleitung sind ans Ende gerückt.',
    'The field to add a dream and the views List · Map · Year stand right behind the title; the intro sentence and «How it works» moved to the end of the page': 'Das Feld zum Hinzufügen und die Ansichten Liste · Karte · Jahr stehen direkt hinter dem Titel; der Einleitungssatz und «So geht\'s» sind ans Seitenende gerückt',
    '«Fits today: trip tips» stand under the list of dreams': '«Heute passt: Ausflugstipps» stehen unter der Liste der Träume',
    'Dreams, under the list': 'Träume, unter der Liste',
    'Open Trips › Dreams: the field «Add» and the views List · Map · Year stand right behind the title.': 'Touren › Träume öffnen: das Feld «Hinzufügen» und die Ansichten Liste · Karte · Jahr stehen direkt hinter dem Titel.',
    'Scroll down: the trip tips stand under the list, the guide at the very end.': 'Nach unten scrollen: die Ausflugstipps stehen unter der Liste, die Anleitung ganz am Ende.',
  },
};
