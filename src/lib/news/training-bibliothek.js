// «Training verbessern» 7 «Einheiten-Bibliothek» (Noah 03.11.2026)
export default {
  title: 'Your session library',
  lead: 'Keep a session you plan often (name, kind, minutes, zone) and plan it again with one tap. Rename and remove them any time, with Undo.',
  points: [{ text: 'In the form of a new session: «Keep this session» and «From your library»', go: { href: '#/flow/training', steps: [{ sel: '[data-add]' }] } }],
  small: [],
  test: [
    'Open Aktiv › Training, tap + on a day, fill name, minutes and zone, tap «Keep this session».',
    'Tap + on another day: your session stands under «From your library», one tap fills the form. «Manage the library» renames and removes (with Undo).',
  ],
  since: [],
  de: {
    'Your session library': 'Deine Einheiten-Bibliothek',
    'Keep a session you plan often (name, kind, minutes, zone) and plan it again with one tap. Rename and remove them any time, with Undo.': 'Behalte eine Einheit, die du oft planst (Name, Art, Minuten, Zone), und plane sie mit einem Tipp wieder. Umbenennen und Entfernen jederzeit, mit Rückgängig.',
    'In the form of a new session: «Keep this session» and «From your library»': 'Im Formular einer neuen Einheit: «Einheit behalten» und «Aus deiner Bibliothek»',
    'Open Aktiv › Training, tap + on a day, fill name, minutes and zone, tap «Keep this session».': 'Öffne Aktiv › Training, tippe + bei einem Tag, fülle Name, Minuten und Zone aus, tippe «Einheit behalten».',
    'Tap + on another day: your session stands under «From your library», one tap fills the form. «Manage the library» renames and removes (with Undo).': 'Tippe + bei einem anderen Tag: deine Einheit steht unter «Aus deiner Bibliothek», ein Tipp füllt das Formular. «Bibliothek verwalten» benennt um und entfernt (mit Rückgängig).',
  },
};
