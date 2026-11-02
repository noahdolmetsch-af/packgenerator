// «Meilensteine aktiver machen» PR 2 (Noah 01.11.2026 «2a und b»): a friendly card when a sport waits too long
export default {
  title: 'Not for a while',
  lead: 'A friendly card on Today when you have not done a sport for longer than your rhythm',
  points: [{ text: 'A card under «Active today» when a sport waits too long, with «Do it today», «Later» and «Pause»', go: { href: '#/', steps: [{ sel: '[data-section="acts"]' }], where: 'Shows under «Active today» when a sport has not been ticked for longer than its rhythm.' } }],
  small: [{ box: 'new', text: 'On a sport page you set after how many days it shows, or switch it off', go: { href: '#/flow/sports', where: 'Open a sport under Active › My sports: «Reminder when it has been a while».' } }],
  test: ['Open a sport under Active › My sports: «Reminder when it has been a while» shows the days.', 'Change the days with + and −, or switch it off.'],
  since: [],
  de: {
    'Not for a while': 'Schon lange nicht',
    'A friendly card on Today when you have not done a sport for longer than your rhythm': 'Eine freundliche Karte auf Heute, wenn du eine Sportart länger nicht gemacht hast als dein Rhythmus',
    'A card under «Active today» when a sport waits too long, with «Do it today», «Later» and «Pause»': 'Eine Karte unter «Aktiv heute», wenn eine Sportart zu lange wartet, mit «Heute machen», «Später» und «Pause»',
    'Shows under «Active today» when a sport has not been ticked for longer than its rhythm.': 'Erscheint unter «Aktiv heute», wenn eine Sportart länger nicht abgehakt wurde als ihr Rhythmus.',
    'On a sport page you set after how many days it shows, or switch it off': 'Auf der Sportart-Seite stellst du ein, nach wie vielen Tagen sie erscheint, oder schaltest sie aus',
    'Open a sport under Active › My sports: «Reminder when it has been a while».': 'Öffne eine Sportart unter Aktiv › Meine Sportarten: «Erinnerung, wenn es länger her ist».',
    'Open a sport under Active › My sports: «Reminder when it has been a while» shows the days.': 'Öffne eine Sportart unter Aktiv › Meine Sportarten: «Erinnerung, wenn es länger her ist» zeigt die Tage.',
    'Change the days with + and −, or switch it off.': 'Ändere die Tage mit + und −, oder schalte es aus.',
  },
};
