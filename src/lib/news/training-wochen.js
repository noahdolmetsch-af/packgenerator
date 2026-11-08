// «Training verbessern» 11 «Ganze Wochen merken» (Noah 03.11.2026, «1a 2a 3a 4a» 07.11.2026)
export default {
  title: 'Keep whole weeks',
  lead: 'A good week can be kept and put in again, in any other week. Weekday, name, kind, minutes and zone are kept, no dates. You see the week first, then you add it or replace the sessions that are not done. Everything can be renamed, grouped, moved and removed, with Undo.',
  points: [
    { text: 'Aktiv › Training, in the week: «Keep this week» and «My weeks»', go: { href: '#/flow/training', steps: [{ sel: '[data-saved-weeks]' }] } },
    { text: '«Put in» shows the week, then «Add to my sessions» (preselected) or «Replace my sessions»', go: { href: '#/flow/training', steps: [{ sel: '[data-saved-weeks]' }] } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training, plan two or three sessions in a week, tap «Keep this week», give it a name and tap «Keep».',
    'Go to another week, open «My weeks», tap «Put in»: you see the week. «Add to my sessions» puts it in, «Undo» takes it out again.',
    '«Manage my weeks»: make a group with «New group …», rename or delete it, move with the arrows, remove a week and undo it.',
  ],
  since: [],
  de: {
    'Keep whole weeks': 'Ganze Wochen merken',
    'A good week can be kept and put in again, in any other week. Weekday, name, kind, minutes and zone are kept, no dates. You see the week first, then you add it or replace the sessions that are not done. Everything can be renamed, grouped, moved and removed, with Undo.': 'Eine gute Woche kannst du merken und in jeder anderen Woche wieder einsetzen. Gemerkt werden Wochentag, Name, Art, Minuten und Zone, keine Daten. Du siehst die Woche zuerst, dann fügst du sie hinzu oder ersetzt die Einheiten, die nicht erledigt sind. Alles lässt sich umbenennen, gruppieren, verschieben und entfernen, mit Rückgängig.',
    'Aktiv › Training, in the week: «Keep this week» and «My weeks»': 'Aktiv › Training, bei der Woche: «Woche merken» und «Meine Wochen»',
    '«Put in» shows the week, then «Add to my sessions» (preselected) or «Replace my sessions»': '«Einsetzen» zeigt die Woche, dann «Zu meinen Einheiten hinzufügen» (vorgewählt) oder «Meine Einheiten ersetzen»',
    'Open Aktiv › Training, plan two or three sessions in a week, tap «Keep this week», give it a name and tap «Keep».': 'Öffne Aktiv › Training, plane zwei oder drei Einheiten in einer Woche, tippe «Woche merken», gib einen Namen und tippe «Merken».',
    'Go to another week, open «My weeks», tap «Put in»: you see the week. «Add to my sessions» puts it in, «Undo» takes it out again.': 'Geh in eine andere Woche, öffne «Meine Wochen», tippe «Einsetzen»: du siehst die Woche. «Zu meinen Einheiten hinzufügen» setzt sie ein, «Rückgängig» nimmt sie wieder heraus.',
    '«Manage my weeks»: make a group with «New group …», rename or delete it, move with the arrows, remove a week and undo it.': '«Meine Wochen verwalten»: Lege mit «Neue Gruppe …» eine Gruppe an, benenne sie um oder lösche sie, verschiebe mit den Pfeilen, entferne eine Woche und mach es rückgängig.',
  },
};
