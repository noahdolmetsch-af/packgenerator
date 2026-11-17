// «Weitere Orte» deckt nichts zu (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 10)
export default {
  title: 'The side bar button no longer covers a place',
  lead: 'On a laptop screen the button «More places» under the list of places sits in its own row and no longer covers the last place.',
  points: [
    { text: 'Side bar on a laptop: «More places» stands under the list, not over «Quick Links»', go: { href: '#/', steps: [{ sel: '[data-menu-more]' }], where: 'On the computer, left side bar, when the list does not fit.' } },
  ],
  small: [],
  test: [
    'On a computer with a low window (about 780 px high), open any page.',
    'Under the places of the left bar stands «Weitere Orte» in its own row; a tap scrolls the list on.',
  ],
  since: [],
  de: {
    'The side bar button no longer covers a place': 'Der Knopf in der Seitenleiste deckt keinen Ort mehr zu',
    'On a laptop screen the button «More places» under the list of places sits in its own row and no longer covers the last place.': 'Auf einem Laptop-Bildschirm steht der Knopf «Weitere Orte» unter der Liste der Orte in einer eigenen Zeile und deckt den letzten Ort nicht mehr zu.',
    'Side bar on a laptop: «More places» stands under the list, not over «Quick Links»': 'Seitenleiste am Laptop: «Weitere Orte» steht unter der Liste, nicht über «Quick Links»',
    'On the computer, left side bar, when the list does not fit.': 'Am Computer, linke Seitenleiste, wenn die Liste nicht ganz passt.',
    'On a computer with a low window (about 780 px high), open any page.': 'Öffne an einem Computer mit niedrigem Fenster (etwa 780 px hoch) eine beliebige Seite.',
    'Under the places of the left bar stands «Weitere Orte» in its own row; a tap scrolls the list on.': 'Unter den Orten der linken Leiste steht «Weitere Orte» in einer eigenen Zeile; ein Tipp scrollt die Liste weiter.',
  },
};
