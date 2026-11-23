// «Velos aufräumen» (Noah 23.11.2026): the bikes stand once, no chips under «Bikes», German texts, cleats under gear
export default {
  title: 'Bikes tidied up',
  lead: 'The Bikes page shows every bike once, has one help line and no second row of navigation.',
  points: [
    { text: 'Every bike stands once, as a card on top; «Show details» chooses it and leads down to its page, «Add bike» is the last card', go: { href: '#/bikes', steps: [{ sel: '[data-velo-card]' }], where: 'Bikes and gear › Bikes.' } },
    { text: 'The chips Overview, Equipment and My setup under «Bikes» are gone: «Equipment» and «My setup» are rows on the bike page', go: { href: '#/bikes', steps: [{ sel: '[data-my-setup-row]' }], where: 'Bikes and gear › Bikes, under «More».' } },
    { text: 'Work on shoes and cleats is no bike care any more: it stands in Gear under «Work on gear»', go: { href: '#/gear', where: 'Bikes and gear › Gear, at the end of the page, when such a job exists.' } },
  ],
  small: [
    { box: 'fixed', text: 'Bag, mount and photo names from the first import show in German (Bottle cage → Flaschenhalter)', go: { href: '#/bikes', steps: [{ sel: '[data-bike-detail]' }], where: 'Bikes and gear › Bikes, bags under the drawing.' } },
    { box: 'nicer', text: '«So geht\'s» lives in the «?» window; the tiles Workshop, Bike care and Compare bikes at the end are gone (they are a tab and a row)', go: { href: '#/bikes', steps: [{ sel: '[data-help-open]' }], where: 'The «?» at the top.' } },
  ],
  test: [
    'Open «Bikes and gear»: every bike stands once as a card; under the cards there is no second row of the same bikes.',
    'Tap «Show details» on another bike: its page shows below, the card is framed.',
    'Tap «?»: «Here are your bikes …» and the short tour are there; on the page itself there is no «How it works» line.',
  ],
  since: [],
  de: {
    'Bikes tidied up': 'Velos aufgeräumt',
    'The Bikes page shows every bike once, has one help line and no second row of navigation.': 'Die Seite Velos zeigt jedes Velo einmal, hat eine Hilfe-Zeile und keine zweite Reihe zum Navigieren.',
    'Every bike stands once, as a card on top; «Show details» chooses it and leads down to its page, «Add bike» is the last card': 'Jedes Velo steht einmal, als Karte oben; «Details zeigen» wählt es und führt zu seiner Seite weiter unten, «Velo hinzufügen» ist die letzte Karte',
    'Bikes and gear › Bikes.': 'Velos und Material › Velos.',
    'The chips Overview, Equipment and My setup under «Bikes» are gone: «Equipment» and «My setup» are rows on the bike page': 'Die Chips Übersicht, Ausstattung und Mein Setup unter «Velos» sind weg: «Teile» und «Mein Setup» sind Zeilen auf der Velo-Seite',
    'Bikes and gear › Bikes, under «More».': 'Velos und Material › Velos, unter «Mehr».',
    'Work on shoes and cleats is no bike care any more: it stands in Gear under «Work on gear»': 'Arbeit an Schuhen und Cleats gehört nicht mehr zur Velopflege: Sie steht im Material unter «Arbeit am Material»',
    'Bikes and gear › Gear, at the end of the page, when such a job exists.': 'Velos und Material › Material, am Seitenende, wenn es so eine Arbeit gibt.',
    'Bag, mount and photo names from the first import show in German (Bottle cage → Flaschenhalter)': 'Namen von Taschen, Haltern und Fotos aus dem ersten Import stehen auf Deutsch (Bottle cage → Flaschenhalter)',
    'Bikes and gear › Bikes, bags under the drawing.': 'Velos und Material › Velos, Taschen unter der Zeichnung.',
    '«So geht\'s» lives in the «?» window; the tiles Workshop, Bike care and Compare bikes at the end are gone (they are a tab and a row)': '«So geht\'s» steht im «?»-Fenster; die Kacheln Werkstatt, Velopflege und Velos vergleichen am Ende sind weg (sie sind ein Reiter und eine Zeile)',
    'The «?» at the top.': 'Das «?» oben.',
    'Open «Bikes and gear»: every bike stands once as a card; under the cards there is no second row of the same bikes.': 'Öffne «Velos und Material»: Jedes Velo steht einmal als Karte; unter den Karten gibt es keine zweite Reihe derselben Velos.',
    'Tap «Show details» on another bike: its page shows below, the card is framed.': 'Tippe bei einem anderen Velo auf «Details zeigen»: Seine Seite erscheint unten, die Karte hat einen Rahmen.',
    'Tap «?»: «Here are your bikes …» and the short tour are there; on the page itself there is no «How it works» line.': 'Tippe auf «?»: «Hier stehen deine Velos …» und die kurze Tour sind da; auf der Seite selbst steht keine Zeile «So geht\'s».',
  },
};
