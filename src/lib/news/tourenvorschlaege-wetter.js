// «Tourenvorschläge: Wetter» (Noah 24.11.2026 «a»): Ampel pro Tour, bester Tag, nasse Wege, Filter nach Tag. Eine Datei für den ganzen PR.
export default {
  title: 'Tour suggestions: the weather',
  lead: 'Every suggested tour shows how the weather is today, tomorrow and the day after, and which day is the best.',
  points: [
    { text: 'Each tour has a light for today, tomorrow and the day after (fits, with care, better not) and the best day of the next ten', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-view="list"]' }, { sel: '[data-vs-wx]' }], where: 'Trips › Dreams › Tour suggestions, «List»: the line under the numbers of a tour.' } },
    { text: 'The filter «Weather» keeps the tours that fit on the day you choose: today, tomorrow, the day after or the weekend; the best come first', go: { href: '#/trips/vorschlaege', steps: [{ sel: '[data-vs-wx-group]' }], where: 'Trips › Dreams › Tour suggestions, filters: the group «Weather».' } },
    { text: 'On a tour the week with temperature up to its highest point, rain and gusts, the best start time for each of the next three days, what to wear, and «wet trails»: after rain roots and stones are slippery', go: { href: '#/trips/vorschlaege/sm-33', steps: [{ sel: '[data-vs-wx-week]' }] } },
  ],
  small: [
    { box: 'nicer', text: 'On the map a ring around every dot shows the weather of the day (green, yellow, red dashed)', go: null },
  ],
  test: ['Open Trips › Dreams › Tour suggestions › «List»: every tour has a line with Today, Tomorrow and the day after, and a best day when today does not fit.', 'Under the filters tap «Weather» › «Tomorrow»: the tours with bad weather tomorrow disappear, the good ones come first. Tap «Any»: all are back.', 'Open a tour: «Weather for this tour» shows the next seven days, the start times and what to wear. «Why this suggestion?» has a weather line. On the map tap «Map»: the dots have rings.'],
  since: [],
  de: {
    'Tour suggestions: the weather': 'Tourenvorschläge: das Wetter',
    'Every suggested tour shows how the weather is today, tomorrow and the day after, and which day is the best.': 'Jede vorgeschlagene Tour zeigt, wie das Wetter heute, morgen und übermorgen ist und welcher Tag der beste ist.',
    'Each tour has a light for today, tomorrow and the day after (fits, with care, better not) and the best day of the next ten': 'Jede Tour hat eine Ampel für heute, morgen und übermorgen (passt, mit Vorsicht, lieber nicht) und den besten Tag der nächsten zehn',
    'Trips › Dreams › Tour suggestions, «List»: the line under the numbers of a tour.': 'Touren › Träume › Tourenvorschläge, «Liste»: die Zeile unter den Zahlen einer Tour.',
    'The filter «Weather» keeps the tours that fit on the day you choose: today, tomorrow, the day after or the weekend; the best come first': 'Der Filter «Wetter» behält die Touren, die an deinem Tag passen: heute, morgen, übermorgen oder am Wochenende; die besten stehen zuerst',
    'Trips › Dreams › Tour suggestions, filters: the group «Weather».': 'Touren › Träume › Tourenvorschläge, Filter: die Gruppe «Wetter».',
    'On a tour the week with temperature up to its highest point, rain and gusts, the best start time for each of the next three days, what to wear, and «wet trails»: after rain roots and stones are slippery': 'Auf einer Tour die Woche mit Temperatur bis zum höchsten Punkt, Regen und Böen, die beste Startzeit für die nächsten drei Tage, was du anziehst, und «Nasse Wege»: nach Regen sind Wurzeln und Steine rutschig',
    'On the map a ring around every dot shows the weather of the day (green, yellow, red dashed)': 'Auf der Karte zeigt ein Ring um jeden Punkt das Wetter des Tages (grün, gelb, rot gestrichelt)',
    'Open Trips › Dreams › Tour suggestions › «List»: every tour has a line with Today, Tomorrow and the day after, and a best day when today does not fit.': 'Öffne Touren › Träume › Tourenvorschläge › «Liste»: jede Tour hat eine Zeile mit Heute, Morgen und Übermorgen und einen besten Tag, wenn heute nicht passt.',
    'Under the filters tap «Weather» › «Tomorrow»: the tours with bad weather tomorrow disappear, the good ones come first. Tap «Any»: all are back.': 'Tippe unter den Filtern bei «Wetter» auf «Morgen»: die Touren mit schlechtem Wetter morgen verschwinden, die guten stehen zuerst. Tippe «Egal»: alle sind zurück.',
    'Open a tour: «Weather for this tour» shows the next seven days, the start times and what to wear. «Why this suggestion?» has a weather line. On the map tap «Map»: the dots have rings.': 'Öffne eine Tour: «Wetter für diese Tour» zeigt die nächsten sieben Tage. «Warum dieser Vorschlag?» hat eine Wetter-Zeile.',
  },
};
