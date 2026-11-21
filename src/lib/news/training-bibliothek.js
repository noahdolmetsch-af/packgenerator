// «Training verbessern» 7 «Einheiten-Bibliothek» (Noah 03.11.2026)
export default {
  title: 'Your session library',
  lead: 'Keep a session you plan often (name, kind, minutes, zone) and plan it again with one tap. It starts with examples, you can sort them into your own groups, and the most used stand first. Everything can be renamed, moved and removed, with Undo.',
  points: [
    { text: 'In the form of a session: «Keep this session» and «From your library», with examples to start', go: { href: '#/flow/training', steps: [{ sel: '[data-add]' }] } },
    { text: 'Own groups, the most used first, arrows and drag in «Manage the library»', go: { href: '#/flow/training', steps: [{ sel: '[data-add]' }] } },
  ],
  small: [],
  test: [
    'Open Aktiv › Training, tap + on a day, fill name, minutes and zone, tap «Keep this session».',
    'Tap + on another day: your session stands under «From your library», one tap fills the form. The more you use one, the further up it stands.',
    '«Manage the library»: make a group with «New group …», rename or delete it, move with the arrows. Tap a done session in an earlier week and choose «Keep this session».',
  ],
  since: [],
  de: {
    'Your session library': 'Deine Einheiten-Bibliothek',
    'Keep a session you plan often (name, kind, minutes, zone) and plan it again with one tap. It starts with examples, you can sort them into your own groups, and the most used stand first. Everything can be renamed, moved and removed, with Undo.': 'Behalte eine Einheit, die du oft planst (Name, Art, Minuten, Zone), und plane sie mit einem Tipp wieder. Es gibt Beispiele zum Start, du kannst sie in eigene Gruppen ordnen, und die meist genutzten stehen vorn. Alles lässt sich umbenennen, verschieben und entfernen, mit Rückgängig.',
    'In the form of a session: «Keep this session» and «From your library», with examples to start': 'Im Formular einer Einheit: «Einheit behalten» und «Aus deiner Bibliothek», mit Beispielen zum Start',
    'Own groups, the most used first, arrows and drag in «Manage the library»': 'Eigene Gruppen, die meist genutzten zuerst, Pfeile und Ziehen in «Bibliothek verwalten»',
    'Open Aktiv › Training, tap + on a day, fill name, minutes and zone, tap «Keep this session».': 'Öffne Aktiv › Training, tippe + bei einem Tag, fülle Name, Minuten und Zone aus, tippe «Einheit behalten».',
    'Tap + on another day: your session stands under «From your library», one tap fills the form. The more you use one, the further up it stands.': 'Tippe + bei einem anderen Tag: deine Einheit steht unter «Aus deiner Bibliothek», ein Tipp füllt das Formular. Je öfter du eine nimmst, desto weiter oben steht sie.',
    '«Manage the library»: make a group with «New group …», rename or delete it, move with the arrows. Tap a done session in an earlier week and choose «Keep this session».': '«Bibliothek verwalten»: Lege mit «Neue Gruppe …» eine Gruppe an, benenne sie um oder lösche sie, verschiebe mit den Pfeilen. Tippe eine erledigte Einheit einer früheren Woche an und wähle «Einheit behalten».',
  },
};
