// «Wörter und Fragen klarer» (Noah 17.11.2026 «alle umsetzen 1-10», UI-Test der Seite Training, Fund 5)
export default {
  title: 'Clearer words at the end of a page',
  lead: 'The fold at the end of a page now says «Shows up later, when it fits», and on Training the explanation of the words opens below the line instead of squeezed beside it.',
  points: [
    { text: 'The fold «Only in the right situation» is now «Shows up later, when it fits»', go: { href: '#/flow/training', steps: [], where: 'At the end of most pages.' } },
    { text: 'Training › Analyses: «What the words mean» opens its explanation below the line', go: { href: '#/flow/training?view=ana', steps: [{ sel: '[data-section="week-analyses"] .words' }], where: 'Training, above the analyses.' } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training and scroll to the analyses: tap the «?» next to «What the words mean».',
    'The explanation opens in its own row below the line, not squeezed beside the «?».',
  ],
  since: [],
  de: {
    'Clearer words at the end of a page': 'Klarere Wörter am Seitenende',
    'The fold at the end of a page now says «Shows up later, when it fits», and on Training the explanation of the words opens below the line instead of squeezed beside it.': 'Der Klappteil am Seitenende heisst jetzt «Kommt später, wenn es passt», und auf Training öffnet sich die Erklärung der Wörter unter der Zeile statt gequetscht daneben.',
    'The fold «Only in the right situation» is now «Shows up later, when it fits»': 'Der Klappteil «Nur in der passenden Lage» heisst jetzt «Kommt später, wenn es passt»',
    'At the end of most pages.': 'Am Ende der meisten Seiten.',
    'Training › Analyses: «What the words mean» opens its explanation below the line': 'Training › Analysen: «Was die Wörter heissen» öffnet die Erklärung unter der Zeile',
    'Training, above the analyses.': 'Training, über den Analysen.',
    'Open Aktiv › Training and scroll to the analyses: tap the «?» next to «What the words mean».': 'Öffne Aktiv › Training und scrolle zu den Analysen: tippe auf das «?» neben «Was die Wörter heissen».',
    'The explanation opens in its own row below the line, not squeezed beside the «?».': 'Die Erklärung öffnet sich in einer eigenen Zeile unter der Zeile, nicht gequetscht neben dem «?».',
  },
};
