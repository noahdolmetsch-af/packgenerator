// «Mehr Muster» (Noah 23.11.2026, Thread «Zusammenhänge nützlicher machen»): Neu diese Woche, Wochentage, Erholung, Bester Bereich, Gegenbeispiele im Bild, Wetter und Training, Heute-Zeile
export default {
  title: 'More patterns in your insights',
  lead: 'What is new this week, the days of the week, how you recover after a hard day, the best range of a value, and the strongest lever on Today.',
  points: [
    { text: '«New this week»: the insights that appeared since a week ago or got clearer, one or two at the top', go: { href: '#/me/insights', steps: [{ sel: '[data-section="insights"]' }], where: 'Analysis › Body › Insights, only when something is new.' } },
    { text: 'The days of the week and the recovery: when is your battery lowest, and after how many days is your resting pulse back to normal after more than 200 active zone minutes', go: { href: '#/me/insights', steps: [{ sel: '[data-section="insights"]' }], where: 'Analysis › Body › Insights, further down, once there are enough days.' } },
    { text: 'On Today the check tile shows your strongest lever as one line with a tip', go: { href: '#/', steps: [{ sel: '[data-section="heutecheck"]' }], where: 'Today, in the tile «Today\'s check», once there is a clear link.' } },
  ],
  small: [
    { box: 'new', text: 'In an opened sentence: the best range of the value and the days against the sentence' },
    { box: 'new', text: 'Weather and training: rain, cold and sun against rides, steps and active zone minutes' },
    { box: 'nicer', text: 'Active zone minutes are cut at a round number (200, 150, 100 …)' },
  ],
  test: [
    'Open Analysis › Body › Insights: at the top «New this week» (when something is new), further down «Days of the week» and «Recovery».',
    'Tap a sentence: the picture, «Best range» and, when there are such days, «Against it: N days».',
    'Open Today: in the tile «Today\'s check» stands one line with your strongest lever (when there is one); a tap opens the insights.',
  ],
  since: [],
  de: {
    'More patterns in your insights': 'Mehr Muster in deinen Zusammenhängen',
    'What is new this week, the days of the week, how you recover after a hard day, the best range of a value, and the strongest lever on Today.': 'Was diese Woche neu ist, die Wochentage, wie du dich nach einem harten Tag erholst, der beste Bereich eines Werts und der stärkste Hebel auf Heute.',
    '«New this week»: the insights that appeared since a week ago or got clearer, one or two at the top': '«Neu diese Woche entdeckt»: die Zusammenhänge, die seit einer Woche dazugekommen oder deutlicher geworden sind, einer oder zwei ganz oben',
    'Analysis › Body › Insights, only when something is new.': 'Auswerten › Körper › Zusammenhänge, nur wenn etwas neu ist.',
    'The days of the week and the recovery: when is your battery lowest, and after how many days is your resting pulse back to normal after more than 200 active zone minutes': 'Die Wochentage und die Erholung: wann dein Akku am tiefsten ist und nach wie vielen Tagen dein Ruhepuls nach mehr als 200 Aktivzonenminuten wieder normal ist',
    'Analysis › Body › Insights, further down, once there are enough days.': 'Auswerten › Körper › Zusammenhänge, weiter unten, sobald genug Tage da sind.',
    'On Today the check tile shows your strongest lever as one line with a tip': 'Auf Heute zeigt die Karte «Heute-Check» deinen stärksten Hebel als eine Zeile mit Tipp',
    'Today, in the tile «Today\'s check», once there is a clear link.': 'Heute, in der Karte «Heute-Check», sobald ein klarer Zusammenhang da ist.',
    'In an opened sentence: the best range of the value and the days against the sentence': 'Im geöffneten Satz: der beste Bereich des Werts und die Tage gegen den Satz',
    'Weather and training: rain, cold and sun against rides, steps and active zone minutes': 'Wetter und Training: Regen, Kälte und Sonne gegen Fahrten, Schritte und Aktivzonenminuten',
    'Active zone minutes are cut at a round number (200, 150, 100 …)': 'Aktivzonenminuten werden an einer runden Zahl geteilt (200, 150, 100 …)',
    'Open Analysis › Body › Insights: at the top «New this week» (when something is new), further down «Days of the week» and «Recovery».': 'Öffne Auswerten › Körper › Zusammenhänge: oben «Neu diese Woche entdeckt» (wenn etwas neu ist), weiter unten «Wochentage» und «Erholung».',
    'Tap a sentence: the picture, «Best range» and, when there are such days, «Against it: N days».': 'Tippe auf einen Satz: das Bild, «Bester Bereich» und, wenn es solche Tage gibt, «Dagegen: N Tage».',
    'Open Today: in the tile «Today\'s check» stands one line with your strongest lever (when there is one); a tap opens the insights.': 'Öffne Heute: in der Karte «Heute-Check» steht eine Zeile mit deinem stärksten Hebel (wenn es einen gibt); ein Tipp öffnet die Zusammenhänge.',
  },
};
