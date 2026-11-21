// «Ganze App neu denken» Schritt 12b (Noah 18.11.2026 «1a 2a 3b 4b 5b»): the chart first, the three choices below it
export default {
  title: 'Own diagram: the chart comes first',
  lead: 'In «Own diagram» the chart now stands on top. What you show, how long and the filter sit below it.',
  points: [
    { text: 'The chart first, then three boxes: What, How long, Filter and look', go: { href: '#/auswerten/analyse', steps: [{ sel: '[data-tab="diagramm"]' }, { sel: '[data-dg-change]' }], where: 'Analysis › Own diagram: the chart on top, the three boxes below it.' } },
  ],
  small: [],
  test: [
    'Open Analysis › Own diagram: the chart is on top.',
    'Scroll down: three boxes «What», «How long» and «Filter and look».',
    'Choose another period in «How long»: the chart above changes.',
  ],
  since: [],
  de: {
    'Own diagram: the chart comes first': 'Eigenes Diagramm: das Diagramm steht zuerst',
    'In «Own diagram» the chart now stands on top. What you show, how long and the filter sit below it.': 'In «Eigenes Diagramm» steht jetzt das Diagramm oben. Was du zeigst, wie lange und der Filter stehen darunter.',
    'The chart first, then three boxes: What, How long, Filter and look': 'Erst das Diagramm, darunter drei Kästchen: Was, Wie lange, Filter und Ansicht',
    'Analysis › Own diagram: the chart on top, the three boxes below it.': 'Auswerten › Eigenes Diagramm: oben das Diagramm, darunter die drei Kästchen.',
    'Open Analysis › Own diagram: the chart is on top.': 'Öffne Auswerten › Eigenes Diagramm: oben steht das Diagramm.',
    'Scroll down: three boxes «What», «How long» and «Filter and look».': 'Scrolle nach unten: drei Kästchen «Was», «Wie lange» und «Filter und Ansicht».',
    'Choose another period in «How long»: the chart above changes.': 'Wähle in «Wie lange» einen anderen Zeitraum: das Diagramm darüber ändert sich.',
  },
};
