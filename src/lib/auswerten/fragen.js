/**
 * «Auswerten neu» (Noah 24.11.2026): the four questions of the start «Heute». Each leads to the page that answers it.
 * (Teil 2 and 3 point «trained» to the tab Woche and «good» to Verlauf.) English source, German via t().
 */
export const QUESTIONS = [
  { key: 'ready', title: 'How ready am I?', text: 'Form, recovery and what today suits.', href: '#/flow/form' },
  { key: 'trained', title: 'What did I do?', text: 'Hours per sport and your rides.', href: '#/auswerten/sportjahr' },
  { key: 'body', title: 'How do I sleep and recover?', text: 'Resting pulse, HRV and sleep, day by day.', href: '#/flow/stats/hr' },
  { key: 'good', title: 'What does me good?', text: 'What your answers and your watch show.', href: '#/me/wohl' },
];
