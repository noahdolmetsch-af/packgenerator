// «Muster» (Noah 23.11.2026, Thread «Zusammenhänge nützlicher machen»): was nach wenig Schlaf und nach Tagen mit über 200 Aktivzonenminuten passiert
export default {
  title: 'Patterns after a short night and a hard day',
  lead: 'Insights now also look at what a night does to your pulse, HRV and moving, and what a day over 200 active zone minutes does to the night after, the next morning and your mood.',
  points: [
    { text: 'Sleep against resting pulse, HRV, active zone minutes and steps of the same day', go: { href: '#/me/insights', steps: [{ sel: '[data-section="insights"]' }], where: 'Analysis › Body › Insights, once enough days are there.' } },
    { text: 'Days over 200 active zone minutes against the next morning (HRV, resting pulse), the night after, battery and mood', go: { href: '#/me/insights', steps: [{ sel: '[data-section="insights"]' }], where: 'Analysis › Body › Insights, once enough days are there.' } },
  ],
  small: [{ box: 'nicer', text: 'Active zone minutes are cut at a round number (200, 150, 100 …) when enough days lie on both sides' }],
  test: [
    'Open Analysis › Body › Insights.',
    'Look for sentences like «On days with more than 200 active zone minutes …» (they show once there are 14 days with both values).',
  ],
  since: [],
  de: {
    'Patterns after a short night and a hard day': 'Muster nach einer kurzen Nacht und einem harten Tag',
    'Insights now also look at what a night does to your pulse, HRV and moving, and what a day over 200 active zone minutes does to the night after, the next morning and your mood.': 'Die Zusammenhänge schauen jetzt auch, was eine Nacht mit Puls, HRV und Bewegung macht und was ein Tag über 200 Aktivzonenminuten mit der Nacht danach, dem nächsten Morgen und deiner Stimmung macht.',
    'Sleep against resting pulse, HRV, active zone minutes and steps of the same day': 'Schlaf gegen Ruhepuls, HRV, Aktivzonenminuten und Schritte am gleichen Tag',
    'Analysis › Body › Insights, once enough days are there.': 'Auswerten › Körper › Zusammenhänge, sobald genug Tage da sind.',
    'Days over 200 active zone minutes against the next morning (HRV, resting pulse), the night after, battery and mood': 'Tage über 200 Aktivzonenminuten gegen den nächsten Morgen (HRV, Ruhepuls), die Nacht danach, Akku und Stimmung',
    'Active zone minutes are cut at a round number (200, 150, 100 …) when enough days lie on both sides': 'Aktivzonenminuten werden an einer runden Zahl geteilt (200, 150, 100 …), wenn auf beiden Seiten genug Tage liegen',
    'Open Analysis › Body › Insights.': 'Öffne Auswerten › Körper › Zusammenhänge.',
    'Look for sentences like «On days with more than 200 active zone minutes …» (they show once there are 14 days with both values).': 'Suche Sätze wie «An Tagen mit mehr als 200 Aktivzonenminuten …» (sie erscheinen, sobald es 14 Tage mit beiden Werten gibt).',
  },
};
