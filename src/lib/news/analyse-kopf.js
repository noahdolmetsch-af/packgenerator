// «Kurzer Kopf» (Noah 08.11.2026 «4a», UI-Test der Analyse-Seite): the sentence under the title of Analyse is short
export default {
  title: 'Analyse: a short sentence under the title',
  lead: 'Under the title «Analyse» there is now one short sentence. The explanation of what you can do stays in the card above it, no longer said twice.',
  points: [
    { text: 'Under «Analyse» one short line instead of a long sentence that repeated the card above', go: { href: '#/auswerten/analyse', steps: [{ sel: '.an > header h1' }], where: 'Auswerten › Analyse, under the title.' } },
  ],
  small: [],
  test: [
    'Open Auswerten › Analyse on a phone: under the title stands one line, «Only to look at, nothing is rated.»',
    'The card above, «What you can do here», still explains the page.',
  ],
  since: [],
  de: {
    'Analyse: a short sentence under the title': 'Analyse: ein kurzer Satz unter dem Titel',
    'Under the title «Analyse» there is now one short sentence. The explanation of what you can do stays in the card above it, no longer said twice.': 'Unter dem Titel «Analyse» steht jetzt ein kurzer Satz. Die Erklärung, was du tun kannst, bleibt in der Karte darüber und wird nicht mehr doppelt gesagt.',
    'Under «Analyse» one short line instead of a long sentence that repeated the card above': 'Unter «Analyse» steht eine kurze Zeile statt eines langen Satzes, der die Karte darüber wiederholte',
    'Auswerten › Analyse, under the title.': 'Auswerten › Analyse, unter dem Titel.',
    'Open Auswerten › Analyse on a phone: under the title stands one line, «Only to look at, nothing is rated.»': 'Öffne am Handy Auswerten › Analyse: Unter dem Titel steht eine Zeile, «Nur zum Anschauen, nichts wird bewertet.»',
    'The card above, «What you can do here», still explains the page.': 'Die Karte darüber, «Was du hier tun kannst», erklärt die Seite weiterhin.',
  },
};
