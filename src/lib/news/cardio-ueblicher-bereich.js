// «Üblicher Bereich» (Noah 07.11.2026 «alle A–F», Idee C): a grey band for values that add up, too
export default {
  title: 'Your usual range for sums',
  lead: 'Values that add up, like your cardio load, now show a grey band where your days usually lie.',
  points: [{ text: 'See at a glance whether a day or a week lies in your usual range', go: { href: '#/auswerten/analyse/cardioLoad', steps: [{ sel: '[data-typ-band]' }], where: 'Analyse › Cardio load › under «Course»: the grey band behind the bars.' } }],
  small: [],
  test: ['Open Analyse › Cardio load: behind the bars a grey band shows where the middle half of your days of the last 3 months lay.', 'Below the course the legend says «your usual range per day», and a line explains the band.'],
  since: [],
  de: {
    'Your usual range for sums': 'Dein üblicher Bereich bei Summen',
    'Values that add up, like your cardio load, now show a grey band where your days usually lie.': 'Werte, die sich aufaddieren, wie deine Cardio-Belastung, zeigen jetzt ein graues Band, in dem deine Tage meist liegen.',
    'See at a glance whether a day or a week lies in your usual range': 'Sieh auf einen Blick, ob ein Tag oder eine Woche in deinem üblichen Bereich liegt',
    'Analyse › Cardio load › under «Course»: the grey band behind the bars.': 'Analyse › Cardio-Belastung › unter «Verlauf»: das graue Band hinter den Balken.',
    'Open Analyse › Cardio load: behind the bars a grey band shows where the middle half of your days of the last 3 months lay.': 'Öffne Analyse › Cardio-Belastung: hinter den Balken zeigt ein graues Band, wo die mittlere Hälfte deiner Tage der letzten 3 Monate lag.',
    'Below the course the legend says «your usual range per day», and a line explains the band.': 'Unter dem Verlauf steht in der Legende «dein üblicher Bereich pro Tag», und eine Zeile erklärt das Band.',
  },
};
