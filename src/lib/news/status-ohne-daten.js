// «Status ohne Daten» (Noah 1.11.2026 «1a»): Care says «no maintenance data yet» where nothing was set up
export default {
  title: 'Care says when there is no data',
  lead: 'Where no part has an interval yet, Care no longer says «nothing due». It says there is no maintenance data yet.',
  points: [{ text: 'The Care header and the «Due now» box say «no maintenance data yet» until a part has an interval', go: { href: '#/bikes?tab=care', where: 'Bikes › Care, with a bike whose parts have no intervals.' } }],
  small: [],
  test: ['Add a bike with no intervals and open Bikes › Care: the header says «no maintenance data yet».', 'Set an interval for a part: the usual «nothing due» or the due card comes back.'],
  since: [],
  de: {
    'Care says when there is no data': 'Die Pflege sagt, wenn Daten fehlen',
    'Where no part has an interval yet, Care no longer says «nothing due». It says there is no maintenance data yet.': 'Wo noch kein Teil ein Intervall hat, sagt die Pflege nicht mehr «nichts fällig», sondern dass noch keine Wartungsdaten da sind.',
    'The Care header and the «Due now» box say «no maintenance data yet» until a part has an interval': 'Kopfzeile und Kasten «Jetzt fällig» der Pflege sagen «noch keine Wartungsdaten», bis ein Teil ein Intervall hat',
    'Bikes › Care, with a bike whose parts have no intervals.': 'Velos › Pflege, mit einem Velo, dessen Teile kein Intervall haben.',
    'Add a bike with no intervals and open Bikes › Care: the header says «no maintenance data yet».': 'Lege ein Velo ohne Intervalle an und öffne Velos › Pflege: die Kopfzeile sagt «noch keine Wartungsdaten».',
    'Set an interval for a part: the usual «nothing due» or the due card comes back.': 'Lege bei einem Teil ein Intervall fest: das gewohnte «nichts fällig» oder die Karte mit Fälligem kommt zurück.',
  },
};
