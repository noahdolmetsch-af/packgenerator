// «Wetter gedreht» (C2) and «Welches Velo» (C3) of «App denkt mit» (Noah 02.11.2026 «3b», «unbedingt» 03.11.2026):
// both show only in their situation in Packen, so their home is the page «How the app decides», where a card names them.
export default {
  features: [
    { id: 'f.wxturn', group: 'before', title: 'Weather turned: what changes', text: 'When the forecast says something else than the list is packed for, the notice in Packen says what to add and what can stay at home.', href: '#/pack', words: 'wetter gedreht prognose kälter regen packliste ändern dazu weg kleider', moment: 'packen' },
    { id: 'f.bikefit', group: 'before', title: 'Which bike fits the trip', text: 'The bike comparison names the bike that fits this trip best: bags with room, no care due before the start, the lightest on a climbing route.', href: '#/pack', words: 'welches velo passt tour vergleichen empfehlung taschen gewicht pflege', moment: 'packen' },
  ],
  howto: {
    'f.wxturn': ['Pack a trip in Planen with the weather of the day.', 'When the forecast turns, Packen says what is new on the list and what can stay at home.', '«Forecast first» packs for the forecast.'],
    'f.bikefit': ['Open a trip in Packen.', 'Open the bike comparison.', 'The line on top names the bike that fits best and why.'],
  },
  handbook: {
    'f.wxturn': {
      on: null,
      steps: ['Pack a trip in Planen with the weather of the day.', 'When the forecast turns, Packen shows «The forecast is …» with a line «New on the list» and «Can stay at home».', '«Forecast first» packs for the forecast; nothing changes before you tap it.'],
      example: 'Example: 15 °C became 4 °C → gloves and jacket new on the list, shorts can stay at home.',
    },
    'f.bikefit': {
      on: 'Needs a trip and at least two bikes.',
      steps: ['Open the trip in Pack and look at the bike comparison.', 'On top, one line names the bike that fits the trip best and why.', 'Switch the bike with one tap, or keep yours.'],
      example: 'Example: the touring bike has tight bags for 24 L of gear → «Fits this trip best: Gravel bike».',
    },
  },
  home: { 'f.wxturn': '#/me/regeln', 'f.bikefit': '#/me/regeln' },
};
