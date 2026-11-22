// UI-Test 26.10.2026 T11 «Links und Rückwege» (G1-13, G1-12, G3-04, G4-11): the + menu opens Inspiration at #/inspiration (the old address still works); Freie Zeit and Verträge und Abos lead back to Planen and Alltag, Form and Haken ausgewertet to Auswerten; the sidebar list shows a soft edge where it goes on and scrolls the open place into view
export default {
  title: 'Right links and ways back',
  lead: 'Links lead to the right page, and the way back names the right place.',
  points: [{ text: '«Inspiration link» in the + menu opens Inspiration', href: '#/inspiration', go: 'f.inspiration' }, { text: 'Free time leads back to Plan, Form and recovery to Analysis', href: '#/me/frei', go: 'f.frei' }],
  small: [{ box: 'nicer', text: 'On the computer the list of places shows where it goes on, so «Material» is never hidden', go: null }],
  test: ['Tap + › «Inspiration link»: the Inspiration page opens.', 'Open Plan › Free time: above the title it says «‹ Plan».'],
  since: [],
  de: {
    'Right links and ways back': 'Richtige Links und Rückwege',
    'Links lead to the right page, and the way back names the right place.': 'Links führen auf die richtige Seite, und der Rückweg nennt den richtigen Ort.',
    '«Inspiration link» in the + menu opens Inspiration': '«Inspiration-Link» im +-Menü öffnet Inspiration',
    'Free time leads back to Plan, Form and recovery to Analysis': 'Freie Zeit führt zurück zu Planen, Form und Erholung zu Auswerten',
    'On the computer the list of places shows where it goes on, so «Material» is never hidden': 'Am Computer zeigt die Liste der Orte, wo sie weitergeht, so ist «Material» nie versteckt',
    'Tap + › «Inspiration link»: the Inspiration page opens.': 'Tippe + › «Inspiration-Link»: Die Seite Inspiration öffnet sich.',
    'Open Plan › Free time: above the title it says «‹ Plan».': 'Öffne Planen › Freie Zeit: Über dem Titel steht «‹ Planen».',
  },
};
