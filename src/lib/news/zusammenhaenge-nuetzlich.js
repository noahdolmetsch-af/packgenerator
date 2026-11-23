// «Zusammenhänge nützlicher machen» (Noah 23.11.2026 «ja», Thread «Zusammenhänge nützlicher machen»): Hebel mit Tipp, alle Aktivitäten, Bild mit/ohne, «Bald sichtbar», Test mit Ende
export default {
  title: 'Insights you can use',
  lead: 'The page «Insights» now says what you can do with it: your strongest levers, every activity compared, a picture for each sentence.',
  points: [
    { text: 'At the top: your three strongest levers, each with a tip for today', go: { href: '#/me/insights', steps: [{ sel: '[data-levers]' }], where: 'Analysis › Body › Insights, once enough days are there.' } },
    { text: 'Every activity you tick in Aktiv (training, sauna, cold water, friends, meditation, habits) is compared with sleep, resting pulse, HRV, battery and mood, also the day after', go: { href: '#/me/insights', steps: [{ sel: '[data-insights-sources]' }], where: 'Analysis › Body › Insights, in the list and under «Also compared».' } },
    { text: 'Tap a sentence: the days with it and without it side by side, and a button «Test it for 14 days»', go: { href: '#/me/insights', steps: [{ sel: '[data-insight] button.row' }], where: 'Analysis › Body › Insights, once a sentence is there.' } },
  ],
  small: [
    { box: 'new', text: 'Instead of the long list: «Soon visible: N links» with a first trend; the list stays behind it' },
    { box: 'new', text: 'The cuts are round now («more than 10 km», «more than 5.5 h»)' },
    { box: 'fixed', text: 'The path says Analysis › Body (it said Me › Data)' },
  ],
  test: [
    'Open Analysis › Body › Insights: at the top stand up to three levers with a tip («Try it today: …»).',
    'Tap a lever or a sentence: a small picture shows the days with and without it, one dot per day.',
    'Tap «Test it for 14 days»: the try starts in «Experiment mit Ende» and the page says «Your try runs.»',
    'Further down: «Soon visible: N links», and «Everything that is still collecting days» opens the old list.',
  ],
  since: [],
  de: {
    'Insights you can use': 'Zusammenhänge, mit denen du etwas anfangen kannst',
    'The page «Insights» now says what you can do with it: your strongest levers, every activity compared, a picture for each sentence.': 'Die Seite «Zusammenhänge» sagt jetzt, was du damit tun kannst: deine stärksten Hebel, jede Aktivität verglichen, zu jedem Satz ein Bild.',
    'At the top: your three strongest levers, each with a tip for today': 'Ganz oben: deine drei stärksten Hebel, je mit einem Tipp für heute',
    'Analysis › Body › Insights, once enough days are there.': 'Auswerten › Körper › Zusammenhänge, sobald genug Tage da sind.',
    'Every activity you tick in Aktiv (training, sauna, cold water, friends, meditation, habits) is compared with sleep, resting pulse, HRV, battery and mood, also the day after': 'Jede Aktivität, die du in Aktiv abhakst (Training, Sauna, Kaltwasser, Freunde, Meditation, Gewohnheiten), wird mit Schlaf, Ruhepuls, HRV, Akku und Stimmung verglichen, auch am Tag danach',
    'Analysis › Body › Insights, in the list and under «Also compared».': 'Auswerten › Körper › Zusammenhänge, in der Liste und unter «Ebenfalls verglichen».',
    'Tap a sentence: the days with it and without it side by side, and a button «Test it for 14 days»': 'Tippe auf einen Satz: die Tage mit und ohne nebeneinander, und ein Knopf «Teste es 14 Tage»',
    'Analysis › Body › Insights, once a sentence is there.': 'Auswerten › Körper › Zusammenhänge, sobald ein Satz da ist.',
    'Instead of the long list: «Soon visible: N links» with a first trend; the list stays behind it': 'Statt der langen Liste: «Bald sichtbar: N Zusammenhänge» mit einem ersten Trend; die Liste bleibt dahinter',
    'The cuts are round now («more than 10 km», «more than 5.5 h»)': 'Die Schwellen sind jetzt rund («mehr als 10 km», «mehr als 5.5 h»)',
    'The path says Analysis › Body (it said Me › Data)': 'Der Pfad sagt Auswerten › Körper (vorher Ich › Daten)',
    'Open Analysis › Body › Insights: at the top stand up to three levers with a tip («Try it today: …»).': 'Öffne Auswerten › Körper › Zusammenhänge: oben stehen bis zu drei Hebel mit einem Tipp («Probier es heute: …»).',
    'Tap a lever or a sentence: a small picture shows the days with and without it, one dot per day.': 'Tippe auf einen Hebel oder einen Satz: ein kleines Bild zeigt die Tage mit und ohne, ein Punkt pro Tag.',
    'Tap «Test it for 14 days»: the try starts in «Experiment mit Ende» and the page says «Your try runs.»': 'Tippe auf «Teste es 14 Tage»: der Test startet in «Experiment mit Ende» und die Seite sagt «Dein Test läuft.»',
    'Further down: «Soon visible: N links», and «Everything that is still collecting days» opens the old list.': 'Weiter unten: «Bald sichtbar: N Zusammenhänge», und «Alles, was noch Tage sammelt» öffnet die alte Liste.',
  },
};
