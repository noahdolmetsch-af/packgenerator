// «Kosten-Schätzung» (Noah 21.11.2026 «1a 2a 3a 4a 5a», Thread «Velopflege zum Inspektions-Begleiter machen», Schritt E)
export default {
  title: 'What a new part will cost, in the check',
  lead: 'While you check the bike, the companion says what a replacement costs about, from the last price you paid for that part, and adds it up at the end.',
  points: [
    { text: 'A worn part shows «a new one costs about CHF …» right at its point', go: { href: '#/bikes?tab=care', where: 'Start a check on a bike\'s care page, at a worn part like the chain.', steps: [{ sel: '[data-inspect-card]' }] } },
    { text: 'The summary at the end adds up the estimated costs of what you fix or take to the bike shop', go: { href: '#/bikes?tab=care', where: 'At the end of a check: «What to do».', steps: [{ sel: '[data-inspect-card]' }] } },
  ],
  small: [{ box: 'new', text: 'Without a recorded price nothing is guessed: the summary says how many points have no known price' }],
  test: [
    'Bikes › Care › start a monthly check, at the chain type 0.55: it says what a new one costs about (if you recorded a price).',
    'Go on to the end: under «What to do» stands «Estimated cost» with the sum.',
  ],
  since: [],
  de: {
    'What a new part will cost, in the check': 'Was ein neues Teil kostet, im Check',
    'While you check the bike, the companion says what a replacement costs about, from the last price you paid for that part, and adds it up at the end.': 'Während du das Velo prüfst, sagt der Begleiter, was ein Ersatz ungefähr kostet, aus dem letzten Preis, den du für das Teil bezahlt hast, und rechnet am Ende alles zusammen.',
    'A worn part shows «a new one costs about CHF …» right at its point': 'Ein abgenutztes Teil zeigt gleich beim Punkt «ein neues kostet etwa CHF …»',
    'Start a check on a bike\'s care page, at a worn part like the chain.': 'Starte auf der Pflege-Seite eines Velos einen Check, bei einem abgenutzten Teil wie der Kette.',
    'The summary at the end adds up the estimated costs of what you fix or take to the bike shop': 'Die Zusammenfassung am Ende zählt die geschätzten Kosten dessen zusammen, was du richtest oder in die Werkstatt bringst',
    'At the end of a check: «What to do».': 'Am Ende eines Checks: «Was zu tun ist».',
    'Without a recorded price nothing is guessed: the summary says how many points have no known price': 'Ohne erfassten Preis wird nichts erfunden: die Zusammenfassung sagt, bei wie vielen Punkten kein Preis bekannt ist',
    'Bikes › Care › start a monthly check, at the chain type 0.55: it says what a new one costs about (if you recorded a price).': 'Velos › Pflege › Monatlichen Check starten, bei der Kette 0,55 eintragen: es steht, was ein neues etwa kostet (wenn du einen Preis erfasst hast).',
    'Go on to the end: under «What to do» stands «Estimated cost» with the sum.': 'Geh bis zum Ende: unter «Was zu tun ist» steht «Geschätzte Kosten» mit der Summe.',
  },
};
