// «Jetzt dran» steuern (Noah 05.11.2026 «4a»): «Später» bei ruhigen Zeilen und ein Schalter pro Zeilenart
export default {
  title: 'Up now: put rows off or switch them off',
  lead: 'Calm rows get «Later» (gone for a week, with Undo). In one window you switch off whole kinds of rows.',
  points: [
    { text: 'Every calm row under «Good to know» has «Later»: it hides for a week and comes back by itself', go: null },
    { text: '«Choose rows» lists each kind of row with a switch; reminders that protect your data stay', go: null },
  ],
  small: [
    { box: 'new', text: 'In the window you see what is put off and can bring it back with «Show again»', go: null },
  ],
  test: [
    'Open Today, then «Gut zu wissen · N»: a calm row has the button «Später». Tap it: the row is gone and a message offers «Rückgängig».',
    'Tap «Zeilen wählen» below «Jetzt dran»: switch off «Verschleiss-Ausblick». The row is gone from Today.',
    'Open «Zeilen wählen» again: tap «Wieder zeigen» at the put-off row or switch the kind on; the row is back.',
  ],
  since: [],
  de: {
    'Up now: put rows off or switch them off': 'Jetzt dran: Zeilen weglegen oder ausschalten',
    'Calm rows get «Later» (gone for a week, with Undo). In one window you switch off whole kinds of rows.': 'Ruhige Zeilen bekommen «Später» (eine Woche weg, mit Rückgängig). In einem Fenster schaltest du ganze Zeilenarten aus.',
    'Every calm row under «Good to know» has «Later»: it hides for a week and comes back by itself': 'Jede ruhige Zeile unter «Gut zu wissen» hat «Später»: Sie ist eine Woche weg und kommt von selbst wieder',
    '«Choose rows» lists each kind of row with a switch; reminders that protect your data stay': '«Zeilen wählen» listet jede Zeilenart mit einem Schalter; Erinnerungen, die deine Daten schützen, bleiben',
    'In the window you see what is put off and can bring it back with «Show again»': 'Im Fenster siehst du, was weggelegt ist, und holst es mit «Wieder zeigen» zurück',
    'Open Today, then «Gut zu wissen · N»: a calm row has the button «Später». Tap it: the row is gone and a message offers «Rückgängig».': 'Öffne Heute, dann «Gut zu wissen · N»: Eine ruhige Zeile hat den Knopf «Später». Tippe darauf: Die Zeile ist weg und eine Meldung bietet «Rückgängig» an.',
    'Tap «Zeilen wählen» below «Jetzt dran»: switch off «Verschleiss-Ausblick». The row is gone from Today.': 'Tippe unter «Jetzt dran» auf «Zeilen wählen»: Schalte «Verschleiss-Ausblick» aus. Die Zeile ist von Heute weg.',
    'Open «Zeilen wählen» again: tap «Wieder zeigen» at the put-off row or switch the kind on; the row is back.': 'Öffne «Zeilen wählen» nochmals: Tippe bei der weggelegten Zeile auf «Wieder zeigen» oder schalte die Art wieder ein; die Zeile ist zurück.',
  },
};
