// «Abgleich ruhiger» (Noah 11.11.2026 «1-4 umsetzen», Messung 10.11.): a quiet sync round does less
export default {
  title: 'Sync: calmer when nothing is new',
  lead: 'A sync round without news now does less work, so the app stays calmer in the background.',
  points: [{ text: 'When the other device sent nothing, the round reads your change list once instead of twice', go: 'f.sync' }],
  small: [{ box: 'new', text: 'Reminders are only checked after a round that took or sent something' }],
  test: ['Leave the app open on Heute for a minute: it stays calm.', 'Change a trip on the phone: it shows up on the computer, and ticked-off reminders still go away.'],
  since: [],
  de: {
    'Sync: calmer when nothing is new': 'Abgleich: ruhiger, wenn nichts Neues da ist',
    'A sync round without news now does less work, so the app stays calmer in the background.': 'Eine Abgleich-Runde ohne Neues macht jetzt weniger Arbeit, damit die App im Hintergrund ruhiger bleibt.',
    'When the other device sent nothing, the round reads your change list once instead of twice': 'Wenn das andere Gerät nichts geschickt hat, liest die Runde deine Änderungsliste einmal statt zweimal',
    'Reminders are only checked after a round that took or sent something': 'Erinnerungen werden nur nach einer Runde geprüft, die etwas geholt oder geschickt hat',
    'Leave the app open on Heute for a minute: it stays calm.': 'Lass die App eine Minute auf Heute offen: sie bleibt ruhig.',
    'Change a trip on the phone: it shows up on the computer, and ticked-off reminders still go away.': 'Ändere eine Tour am Handy: sie erscheint am Computer, und abgehakte Erinnerungen verschwinden weiterhin.',
  },
};
