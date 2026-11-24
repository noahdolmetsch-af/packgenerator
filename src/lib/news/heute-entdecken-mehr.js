// «Heute entdecken» 3a/4a (Noah 23.11.2026 «3a 4a 5a»): zwei neue Quellen für die Zeile unter den Chips, der Rückblick zur letzten Tour und Gelerntes
export default {
  title: 'Debrief and learned things on Today',
  lead: 'The row «Discover today» now reminds you of the debrief after a tour, and shows what the app learned from your debriefs.',
  points: [
    { text: 'Back from a tour: the row asks for its debrief, with the tour name and why it helps', go: { href: '#/', steps: [{ sel: '[data-ideas-row]' }], where: 'Today, right under the chips, for two weeks after a tour.' } },
    { text: 'New learned from your debriefs: «More ideas» names the newest learning of the last weeks and leads to «Learned»', go: { href: '#/', steps: [{ sel: '[data-ideas-more]' }], where: 'Today › Discover today › More ideas.' } },
  ],
  small: [{ box: 'new', text: 'Both come with «Later» and «Not for me» (with Undo), like every idea in the row' }],
  test: ['Open Today after a tour without a debrief: the row says «Debrief of your last tour».', 'Tap «More ideas»: with a new learning, «New learned from your debriefs» stands in the list.'],
  since: [],
  de: {
    'Debrief and learned things on Today': 'Rückblick und Gelerntes auf Heute',
    'The row «Discover today» now reminds you of the debrief after a tour, and shows what the app learned from your debriefs.': 'Die Zeile «Heute entdecken» erinnert dich nach einer Tour an den Rückblick und zeigt, was die App aus deinen Rückblicken gelernt hat.',
    'Back from a tour: the row asks for its debrief, with the tour name and why it helps': 'Zurück von einer Tour: die Zeile fragt nach dem Rückblick, mit dem Namen der Tour und warum er hilft',
    'Today, right under the chips, for two weeks after a tour.': 'Heute, direkt unter den Chips, zwei Wochen lang nach einer Tour.',
    'New learned from your debriefs: «More ideas» names the newest learning of the last weeks and leads to «Learned»': 'Neu gelernt aus deinen Rückblicken: «Mehr Ideen» nennt die neueste Erkenntnis der letzten Wochen und führt zu «Gelernt»',
    'Today › Discover today › More ideas.': 'Heute › Heute entdecken › Mehr Ideen.',
    'Both come with «Later» and «Not for me» (with Undo), like every idea in the row': 'Beide haben «Später» und «Nicht für mich» (mit Rückgängig), wie jede Idee in der Zeile',
    'Open Today after a tour without a debrief: the row says «Debrief of your last tour».': 'Öffne Heute nach einer Tour ohne Rückblick: die Zeile sagt «Rückblick zur letzten Tour».',
    'Tap «More ideas»: with a new learning, «New learned from your debriefs» stands in the list.': 'Tippe auf «Mehr Ideen»: bei einer neuen Erkenntnis steht «Neu gelernt aus deinen Rückblicken» in der Liste.',
  },
};
