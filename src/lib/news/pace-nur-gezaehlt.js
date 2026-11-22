// «Pro Velo und Untergrund» counts only rides that belong to the bike (Noah 22.11.2026: Canyon Lux «236 Fahrten»)
export default {
  title: 'Pace per bike counts only real rides',
  lead: 'Rides that still wait in «To check» no longer count for a bike. Before, a bike could show far too many rides.',
  points: [
    { text: 'In «Per bike and surface» a ride counts for a bike only when it counts in the bike’s km or lies in its start value', go: { href: '#/debrief/pace', steps: [{ sel: '[data-pace-grid]' }], where: 'Trips › Review › Per bike and surface' } },
  ],
  small: [{ box: 'new', text: 'Rides without a clear bike wait in «To check» until you decide' }],
  test: ['Open Trips › Review › Per bike and surface: the number of rides of each bike matches the rides in Velos › the bike.', 'A ride that is still in «To check» is not in the number.'],
  since: [],
  de: {
    'Pace per bike counts only real rides': 'Tempo pro Velo zählt nur echte Fahrten',
    'Rides that still wait in «To check» no longer count for a bike. Before, a bike could show far too many rides.': 'Fahrten, die noch in «Zum Prüfen» warten, zählen nicht mehr für ein Velo. Vorher konnte ein Velo viel zu viele Fahrten zeigen.',
    'In «Per bike and surface» a ride counts for a bike only when it counts in the bike’s km or lies in its start value': 'In «Pro Velo und Untergrund» zählt eine Fahrt nur für ein Velo, wenn sie in dessen km zählt oder in seinem Startwert liegt',
    'Trips › Review › Per bike and surface': 'Touren › Rückblick › Pro Velo und Untergrund',
    'Rides without a clear bike wait in «To check» until you decide': 'Fahrten ohne klares Velo warten in «Zum Prüfen», bis du entscheidest',
    'Open Trips › Review › Per bike and surface: the number of rides of each bike matches the rides in Velos › the bike.': 'Öffne Touren › Rückblick › Pro Velo und Untergrund: Die Zahl der Fahrten je Velo passt zu den Fahrten bei Velos › das Velo.',
    'A ride that is still in «To check» is not in the number.': 'Eine Fahrt, die noch in «Zum Prüfen» liegt, ist nicht in der Zahl.',
  },
};
