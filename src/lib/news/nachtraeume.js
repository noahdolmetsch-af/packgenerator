// «Nachtträume» (Noah 04./05.11.2026, Thread «Wi gaht's? um Träume und Visionen erweitern»): a morning question about the night, the sentence also lands in the Tagebuch
export default {
  title: 'Night dreams in the morning',
  lead: 'The morning questions ask what you dreamed, and the sentence you write is also kept in your diary.',
  points: [
    { text: 'A new morning question «What did you dream last night?» with chips and one sentence', go: { href: '#/check/morning', steps: [{ sel: '[data-q="erholung.traum"]' }], where: 'Today › Wi gaht\'s? in the morning: under «How well did you sleep».' } },
    { text: 'The sentence also becomes a Tagebuch entry with the tag «Traum», one entry per day', go: { href: '#/tagebuch' } },
  ],
  small: [{ box: 'fixed', text: 'Switch the question off any time in Me › Your questions' }],
  test: [
    'Open Today › Wi gaht\'s? in the morning: under the sleep question stands «What did you dream last night?».',
    'Tap «nice», write a short sentence and reload: chips and sentence are still there.',
    'Open the Tagebuch: an entry with the tag «Traum» holds your sentence.',
  ],
  since: [],
  de: {
    'Night dreams in the morning': 'Nachtträume am Morgen',
    'The morning questions ask what you dreamed, and the sentence you write is also kept in your diary.': 'Die Morgenfragen fragen, was du geträumt hast, und der Satz, den du schreibst, steht auch in deinem Tagebuch.',
    'A new morning question «What did you dream last night?» with chips and one sentence': 'Neue Morgenfrage «Was hast du heute Nacht geträumt?» mit Chips und einem Satz',
    'Today › Wi gaht\'s? in the morning: under «How well did you sleep».': 'Heute › «Wi gaht\'s?» am Morgen: unter «Wie gut hast du geschlafen».',
    'The sentence also becomes a Tagebuch entry with the tag «Traum», one entry per day': 'Der Satz wird auch ein Tagebuch-Eintrag mit dem Schlagwort «Traum», ein Eintrag pro Tag',
    'Switch the question off any time in Me › Your questions': 'Schalte die Frage jederzeit unter Ich › Deine Fragen aus',
    'Open Today › Wi gaht\'s? in the morning: under the sleep question stands «What did you dream last night?».': 'Öffne Heute › «Wi gaht\'s?» am Morgen: unter der Schlaffrage steht «Was hast du heute Nacht geträumt?».',
    'Tap «nice», write a short sentence and reload: chips and sentence are still there.': 'Tippe «schön», schreibe einen kurzen Satz und lade neu: Chips und Satz stehen noch da.',
    'Open the Tagebuch: an entry with the tag «Traum» holds your sentence.': 'Öffne das Tagebuch: ein Eintrag mit dem Schlagwort «Traum» enthält deinen Satz.',
  },
};
