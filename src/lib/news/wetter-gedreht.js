// «Wetter gedreht: was ändert sich» (Idee C2 «App denkt mit», Noah 02.11.2026 «3b»)
export default {
  title: 'Weather turned: what changes',
  lead: 'When the forecast turns, Packen says what to add and what can stay at home.',
  points: [{ text: 'Packen: under «The forecast is …» new lines «New on the list» and «Can stay at home»', href: '#/pack', go: { href: '#/pack?day', where: 'Shows in Packen when the forecast turned after you made the list.' } }],
  small: [{ box: 'new', go: { href: '#/pack?day', where: 'Shows in Packen when the forecast turned after you made the list.' }, text: 'A line for rain: rain protection comes or can stay at home' }],
  test: [
    'Pack a trip for 15 °C, then let the forecast turn colder.',
    'Open Packen: the notice «The forecast is …» shows what is new on the list.',
    'Tap «Forecast first»: the list is packed for the forecast.',
  ],
  de: {
    'Shows in Packen when the forecast turned after you made the list.': 'Zeigt sich in Packen, wenn die Prognose nach dem Erstellen der Liste gedreht hat.',
    'Weather turned: what changes': 'Wetter gedreht: was ändert sich',
    'When the forecast turns, Packen says what to add and what can stay at home.': 'Dreht die Prognose, sagt Packen, was dazukommt und was zuhause bleiben kann.',
    'Packen: under «The forecast is …» new lines «New on the list» and «Can stay at home»': 'Packen: unter «Die Vorhersage: …» neue Zeilen «Neu auf der Liste» und «Kann zuhause bleiben»',
    'A line for rain: rain protection comes or can stay at home': 'Eine Zeile für Regen: Regenschutz kommt dazu oder kann zuhause bleiben',
    'Pack a trip for 15 °C, then let the forecast turn colder.': 'Pack eine Tour für 15 °C und lass die Prognose dann kälter werden.',
    'Open Packen: the notice «The forecast is …» shows what is new on the list.': 'Öffne Packen: der Hinweis «Die Vorhersage: …» zeigt, was neu auf der Liste steht.',
    'Tap «Forecast first»: the list is packed for the forecast.': 'Tipp «Wetter zuerst»: die Liste ist für die Prognose gepackt.',
  },
};
