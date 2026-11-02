// «Meilensteine aktiver machen» PR 5 (Noah 01.11.2026 «5a»): on Monday the stars of last week
export default {
  title: 'Stars of the week',
  lead: 'On Monday and Tuesday Today shows the stars you reached last week',
  points: [{ text: 'Under «Active today» a card «Last week: N new stars» on Monday and Tuesday, each star opens its sport', go: { href: '#/', steps: [{ sel: '[data-section="acts"]' }], where: 'Shows on Monday and Tuesday when last week brought a star; «Close» hides it until next Monday.' } }],
  test: ['On a Monday: under «Active today» the card «Last week: …new stars» lists the stars.', 'Tap «Close»: the card is gone until next Monday.'],
  since: [],
  de: {
    'Stars of the week': 'Sterne der Woche',
    'On Monday and Tuesday Today shows the stars you reached last week': 'Am Montag und Dienstag zeigt Heute die Sterne, die du letzte Woche erreicht hast',
    'Under «Active today» a card «Last week: N new stars» on Monday and Tuesday, each star opens its sport': 'Unter «Aktiv heute» eine Karte «Letzte Woche: N neue Sterne» am Montag und Dienstag, jeder Stern öffnet seine Sportart',
    'Shows on Monday and Tuesday when last week brought a star; «Close» hides it until next Monday.': 'Erscheint am Montag und Dienstag, wenn die letzte Woche einen Stern gebracht hat; «Schliessen» blendet sie bis nächsten Montag aus.',
    'On a Monday: under «Active today» the card «Last week: …new stars» lists the stars.': 'An einem Montag: unter «Aktiv heute» listet die Karte «Letzte Woche: … neue Sterne» die Sterne.',
    'Tap «Close»: the card is gone until next Monday.': 'Tippe «Schliessen»: die Karte ist bis nächsten Montag weg.',
  },
};
