// «Velos-Pflege einbauen» (Noah 03.11.2026 «4a»): what is at home for a due part
export default {
  title: 'Spare parts at home on due parts',
  lead: 'A due part shows what you have at home for it, and a tap leads to «Spare parts at home».',
  points: [{ text: 'Bikes › Care › «Due now»: «At home: Chain (2)» under the part', go: { href: '#/bikes?tab=care', where: 'Shows under a due part that has a row in «Spare parts at home».' } }],
  small: [{ box: 'new', text: 'The «…» of a due part has «Spare parts at home»', go: null }],
  test: [
    'Under Bikes › Care › «Spare parts at home» add «Chain», follow the part «Chain», count 2.',
    'When the chain is due, «Due now» shows «At home: Chain (2)»; the «…» opens the stock page.',
  ],
  since: [],
  de: {
    'Spare parts at home on due parts': 'Ersatzteile zu Hause bei fälligen Teilen',
    'A due part shows what you have at home for it, and a tap leads to «Spare parts at home».': 'Ein fälliges Teil zeigt, was du dafür zu Hause hast, und ein Tipp führt zu «Ersatzteile zu Hause».',
    'Bikes › Care › «Due now»: «At home: Chain (2)» under the part': 'Velos › Pflege › «Jetzt fällig»: «Im Vorrat: Kette (2)» unter dem Teil',
    'Shows under a due part that has a row in «Spare parts at home».': 'Steht unter einem fälligen Teil, für das es in «Ersatzteile zu Hause» eine Zeile gibt.',
    'The «…» of a due part has «Spare parts at home»': 'Im «…» eines fälligen Teils steht «Ersatzteile zu Hause»',
    'Under Bikes › Care › «Spare parts at home» add «Chain», follow the part «Chain», count 2.': 'Lege unter Velos › Pflege › «Ersatzteile zu Hause» «Kette» an, Teil «Kette», Anzahl 2.',
    'When the chain is due, «Due now» shows «At home: Chain (2)»; the «…» opens the stock page.': 'Ist die Kette fällig, zeigt «Jetzt fällig» «Im Vorrat: Kette (2)»; das «…» öffnet die Vorrats-Seite.',
  },
};
