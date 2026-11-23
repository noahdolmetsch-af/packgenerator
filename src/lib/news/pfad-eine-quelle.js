// «Pfad aus einer Quelle» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»): the path above a page says the place and tab the sidebar lights
export default {
  title: 'The path always matches the sidebar',
  lead: 'The path above a page now starts with the place and tab that are lit on the left, never an old name.',
  points: [
    { text: 'On every page the path starts with the place and the tab you see lit (for example Week › Training › Recovery)', go: { href: '#/flow/rest', where: 'Week › Training › Recovery: the path says «Week › Training», as the sidebar does.' } },
    { text: 'Pages of Me that belong elsewhere (Insights, Weight, What is good for me) start with Analysis', go: { href: '#/me/insights', where: 'Analysis › Body › Insights.' } },
  ],
  small: [{ box: 'new', text: 'Material pages say «Bikes and gear › Material» like the place' }],
  test: [
    'Open Week › Training › Recovery: above the title the path starts with «Week › Training».',
    'Open Analysis › Body › Insights: the path starts with «Analysis › Body», not «Me › Data».',
    'Open Bikes and gear › Material › Favourites: the path starts with «Bikes and gear › Material».',
  ],
  since: [],
  de: {
    'The path always matches the sidebar': 'Der Pfad passt immer zur Seitenleiste',
    'The path above a page now starts with the place and tab that are lit on the left, never an old name.': 'Der Pfad über einer Seite beginnt jetzt mit dem Ort und dem Reiter, die links markiert sind, nie mit einem alten Namen.',
    'On every page the path starts with the place and the tab you see lit (for example Week › Training › Recovery)': 'Auf jeder Seite beginnt der Pfad mit dem Ort und dem Reiter, die du markiert siehst (zum Beispiel Woche › Training › Erholung)',
    'Week › Training › Recovery: the path says «Week › Training», as the sidebar does.': 'Woche › Training › Erholung: Der Pfad sagt «Woche › Training», wie die Seitenleiste.',
    'Pages of Me that belong elsewhere (Insights, Weight, What is good for me) start with Analysis': 'Seiten aus Ich, die anderswo hingehören (Zusammenhänge, Gewicht, Was mir gut tut), beginnen mit Auswerten',
    'Analysis › Body › Insights.': 'Auswerten › Körper › Zusammenhänge.',
    'Material pages say «Bikes and gear › Material» like the place': 'Material-Seiten sagen «Velos und Material › Material» wie der Ort',
    'Open Week › Training › Recovery: above the title the path starts with «Week › Training».': 'Öffne Woche › Training › Erholung: Über dem Titel beginnt der Pfad mit «Woche › Training».',
    'Open Analysis › Body › Insights: the path starts with «Analysis › Body», not «Me › Data».': 'Öffne Auswerten › Körper › Zusammenhänge: Der Pfad beginnt mit «Auswerten › Körper», nicht mit «Ich › Daten».',
    'Open Bikes and gear › Material › Favourites: the path starts with «Bikes and gear › Material».': 'Öffne Velos und Material › Material › Favoriten: Der Pfad beginnt mit «Velos und Material › Material».',
  },
};
