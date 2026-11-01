// Noah 1.11.2026: after «Fetch now» for the health values a clear line says whether it worked
export default {
  title: 'Health values say when they are fetched',
  lead: 'After «Fetch now» a line says how many days came, or that nothing is new.',
  points: [{ text: 'Health data: «Fetch now» ends with «Done: … days fetched»', go: { href: '#/me/data', where: 'Shows under «Fetch now» in the health data card, once Fitbit is connected.' } }],
  small: [],
  test: ['Ich › Daten › Health data: tap «Fetch now».', 'A line says «Done: … days fetched» or that nothing is new.'],
  since: [],
  de: {
    'Health values say when they are fetched': 'Gesundheitswerte sagen, wann sie geholt sind',
    'After «Fetch now» a line says how many days came, or that nothing is new.': 'Nach «Jetzt holen» sagt eine Zeile, wie viele Tage kamen oder dass nichts Neues da ist.',
    'Health data: «Fetch now» ends with «Done: … days fetched»': 'Gesundheitsdaten: «Jetzt holen» endet mit «Fertig: … Tage geholt»',
    'Shows under «Fetch now» in the health data card, once Fitbit is connected.': 'Zeigt sich unter «Jetzt holen» in der Karte Gesundheitsdaten, sobald Fitbit verbunden ist.',
    'Ich › Daten › Health data: tap «Fetch now».': 'Ich › Daten › Gesundheitsdaten: Tippe «Jetzt holen».',
    'A line says «Done: … days fetched» or that nothing is new.': 'Eine Zeile sagt «Fertig: … Tage geholt» oder dass nichts Neues da ist.',
  },
};
