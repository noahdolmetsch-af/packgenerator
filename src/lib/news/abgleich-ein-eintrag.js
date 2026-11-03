// «Abgleich bleibt nicht mehr hängen» (Noah 03.11.2026, Handy bekam nach dem Koppeln nur einen Teil der Daten)
export default {
  title: 'The sync no longer gets stuck',
  lead: 'If one entry cannot be saved on the phone, all the others still arrive.',
  points: [{ text: 'The sync names an entry it could not save and tries it again later', go: { href: '#/me/data', where: 'Me › Data and backup › Phone and computer. The line appears only when an entry could not be saved.' } }],
  small: [{ box: 'new', text: 'A full phone says so, instead of «server error»' }],
  test: ['Open Me › Data and backup › Phone and computer and tap «Sync now»: «Done» shows.', 'If an entry could not be saved, a line names it. After 30 minutes the sync tries it again by itself.'],
  since: [],
  de: {
    'The sync no longer gets stuck': 'Der Abgleich bleibt nicht mehr hängen',
    'If one entry cannot be saved on the phone, all the others still arrive.': 'Wenn ein Eintrag auf dem Handy nicht gespeichert werden kann, kommen alle anderen trotzdem an.',
    'The sync names an entry it could not save and tries it again later': 'Der Abgleich nennt einen Eintrag, den er nicht speichern konnte, und versucht ihn später wieder',
    'Me › Data and backup › Phone and computer. The line appears only when an entry could not be saved.': 'Ich › Daten und Backup › Handy und Computer. Die Zeile erscheint nur, wenn ein Eintrag nicht gespeichert werden konnte.',
    'A full phone says so, instead of «server error»': 'Ein volles Handy sagt das, statt «Serverfehler»',
    'Open Me › Data and backup › Phone and computer and tap «Sync now»: «Done» shows.': 'Öffne Ich › Daten und Backup › Handy und Computer und tippe «Jetzt abgleichen»: «Fertig» erscheint.',
    'If an entry could not be saved, a line names it. After 30 minutes the sync tries it again by itself.': 'Wenn ein Eintrag nicht gespeichert werden konnte, nennt eine Zeile ihn. Nach 30 Minuten versucht der Abgleich es von selbst wieder.',
  },
};
