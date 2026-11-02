// «Wegweiser statt Katalog» PR 7 (Noah 01.11.2026 «1a 2a 3a 4a 5a», plan «1-26» approved): «Fits here» on Insights, Your questions and My sports
export default {
  title: 'Body and sport: the quiet helpers nearby',
  lead: 'Counter-examples, scale meanings and the tennis page now sit where you look at your values and sports.',
  points: [
    {
      text: 'Insights: «Fits here» with counter-examples, special days and an experiment with an end',
      go: { href: '#/me/insights', steps: [{ sel: '[data-passt-hier="insights"]' }], where: 'At the end of Me › Insights.' },
    },
    {
      text: 'Your questions: «Fits here» with what a scale meant and a talk about body values',
      go: { href: '#/me/abfragen', steps: [{ sel: '[data-passt-hier="abfragen"]' }], where: 'Under «Where the answers go» on Me › Your questions.' },
    },
    {
      text: 'My sports: «Fits here» with the tennis page, one ride with two roles and rewards without buying',
      go: { href: '#/flow/sports', steps: [{ sel: '[data-passt-hier="sports"]' }], where: 'At the end of Active › My sports.' },
    },
  ],
  small: [{ box: 'new', text: 'Only observations: the app suggests no diagnosis', go: 'f.bodytalk' }],
  test: [
    'Open Me › Insights and scroll to the end: «Fits here» shows three buttons.',
    'Open Me › Your questions and tap «What a scale meant»: the page with your scales opens.',
  ],
  since: [],
  de: {
    'Body and sport: the quiet helpers nearby': 'Körper und Sport: die ruhigen Helfer gleich daneben',
    'Counter-examples, scale meanings and the tennis page now sit where you look at your values and sports.': 'Gegenbeispiele, die Bedeutung einer Skala und die Tennis-Seite stehen jetzt dort, wo du deine Werte und Sportarten anschaust.',
    'Insights: «Fits here» with counter-examples, special days and an experiment with an end': 'Erkenntnisse: «Passt hier» mit Gegenbeispielen, besonderen Tagen und einem Experiment mit Ende',
    'At the end of Me › Insights.': 'Am Ende von Ich › Erkenntnisse.',
    'Your questions: «Fits here» with what a scale meant and a talk about body values': 'Wi gaht\'s?: «Passt hier» mit der Bedeutung einer Skala und einem Gespräch über Körperwerte',
    'Under «Where the answers go» on Me › Your questions.': 'Unter «Wo die Antworten landen» bei Ich › Wi gaht\'s?.',
    'My sports: «Fits here» with the tennis page, one ride with two roles and rewards without buying': 'Meine Sportarten: «Passt hier» mit der Tennis-Seite, einer Fahrt mit zwei Rollen und Belohnungen ohne Kauf',
    'At the end of Active › My sports.': 'Am Ende von Aktiv › Meine Sportarten.',
    'Only observations: the app suggests no diagnosis': 'Nur Beobachtungen: die App schlägt keine Diagnose vor',
    'Open Me › Insights and scroll to the end: «Fits here» shows three buttons.': 'Öffne Ich › Erkenntnisse und scrolle ans Ende: «Passt hier» zeigt drei Knöpfe.',
    'Open Me › Your questions and tap «What a scale meant»: the page with your scales opens.': 'Öffne Ich › Wi gaht\'s? und tippe auf «Was eine Skala bedeutete»: die Seite mit deinen Skalen öffnet sich.',
  },
};
