// «Griffbereit» (Noah 23.11.2026 «G3»): food and rain gear lie where a hand reaches while riding
export default {
  title: 'Within reach: the bar and the rain jacket not at the bottom',
  lead: 'Food, rain gear and things you mark lie in a bag you reach while riding: Pack suggests it, you decide.',
  points: [
    { text: 'On a planned trip the card «Ready to go?» gets a line «Within reach: … lies deep in a bag»; a tap opens a window that puts it into the top tube bag, the mini bag or a pouch', go: { href: '#/pack', where: 'Shows on Pack when food, rain gear or a marked thing lies in the seat pack, a side bag or the frame bag.', steps: [{ sel: '[data-ampel]' }] } },
    { text: 'In the window of an item, the row «Within reach»: automatic for food and rain gear, or yes for a thing you reach for, or never', go: { href: '#/gear', where: 'Open a thing in Material: the row «Within reach» is under «Where it goes».', steps: [{ text: 'Where it goes' }] } },
  ],
  small: [{ box: 'new', text: '«Not this time» leaves a suggestion out for one trip only; nothing moves by itself and «Undo» puts it back' }],
  test: [
    'In Material open a thing, for example a rain jacket: under «Where it goes» the row «Within reach» says «Automatic».',
    'Open a planned trip in Pack that has a bar in the seat pack, and open the card «Ready to go?»: a line says it lies deep in a bag.',
    'Tap the line and then «Move to …»: the bar lies in the top tube bag and the line is gone; «Undo» puts it back.',
  ],
  since: [],
  de: {
    'Within reach: the bar and the rain jacket not at the bottom': 'Griffbereit: der Riegel und die Regenjacke nicht ganz unten',
    'Food, rain gear and things you mark lie in a bag you reach while riding: Pack suggests it, you decide.': 'Essen, Regenzeug und Teile, die du markierst, liegen in einer Tasche, die du beim Fahren erreichst: Packen schlägt es vor, du entscheidest.',
    'On a planned trip the card «Ready to go?» gets a line «Within reach: … lies deep in a bag»; a tap opens a window that puts it into the top tube bag, the mini bag or a pouch': 'Bei einer geplanten Tour hat die Karte «Bereit zur Abfahrt?» eine Zeile «Griffbereit: … liegt tief in einer Tasche»; ein Tipp öffnet ein Fenster, das es in die Oberrohrtasche, die Minitasche oder einen Beutel legt',
    'Shows on Pack when food, rain gear or a marked thing lies in the seat pack, a side bag or the frame bag.': 'Steht in Packen, wenn Essen, Regenzeug oder ein markiertes Teil in der Satteltasche, einer Seitentasche oder der Rahmentasche liegt.',
    'In the window of an item, the row «Within reach»: automatic for food and rain gear, or yes for a thing you reach for, or never': 'Im Fenster eines Teils die Zeile «Griffbereit»: automatisch für Essen und Regenzeug, ja für ein Teil, nach dem du greifst, oder nie',
    'Open a thing in Material: the row «Within reach» is under «Where it goes».': 'Öffne ein Teil in Material: die Zeile «Griffbereit» steht unter «Wo es hinkommt».',
    '«Not this time» leaves a suggestion out for one trip only; nothing moves by itself and «Undo» puts it back': '«Diesmal nicht» lässt einen Vorschlag nur für diese Tour weg; nichts bewegt sich von selbst und «Rückgängig» legt es zurück',
    'In Material open a thing, for example a rain jacket: under «Where it goes» the row «Within reach» says «Automatic».': 'Öffne in Material ein Teil, zum Beispiel eine Regenjacke: unter «Wo es hinkommt» steht in der Zeile «Griffbereit» «Automatisch».',
    'Open a planned trip in Pack that has a bar in the seat pack, and open the card «Ready to go?»: a line says it lies deep in a bag.': 'Öffne in Packen eine geplante Tour mit einem Riegel in der Satteltasche und klappe die Karte «Bereit zur Abfahrt?» auf: eine Zeile sagt, dass er tief in einer Tasche liegt.',
    'Tap the line and then «Move to …»: the bar lies in the top tube bag and the line is gone; «Undo» puts it back.': 'Tippe auf die Zeile und dann auf «In … legen»: der Riegel liegt in der Oberrohrtasche und die Zeile ist weg; «Rückgängig» legt ihn zurück.',
  },
};
