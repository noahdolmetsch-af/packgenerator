// «Kochen» Schritt 2 (Noah 28.10.2026 «5a», «ok kochen»): cooking mode, one step per screen, timer, screen stays on
export default {
  title: 'Cooking mode',
  lead: 'Cook step by step: one step per screen, a timer where needed, and the screen stays on.',
  points: [
    { text: 'A recipe has «Start cooking»: big letters, «Back» and «Next», dots show where you are', href: '#/me/alltag/kochen', go: 'f.cook' },
    { text: 'Steps with a waiting time have a timer; it keeps running on the next step and rings at the end', href: '#/me/alltag/kochen', go: 'f.cook' },
  ],
  small: [{ box: 'new', text: '«All steps» shows the whole order with the ingredients; a tap on a step jumps there', go: 'f.cook' }],
  test: ['Open Planen › Alltag › Kochen › «Teigwarensalat mit Pesto» and tap «Kochen starten».', 'In step 1 tap «Start» on the timer, then «Weiter»: a small line shows the running timer.', 'Tap «Alle Schritte», then step 4: it shows step 4 of 4 with «Fertig».'],
  since: [],
  de: {
    'Cooking mode': 'Kochmodus',
    'Cook step by step: one step per screen, a timer where needed, and the screen stays on.': 'Schritt für Schritt kochen: ein Schritt pro Bildschirm, ein Timer wo nötig, und der Bildschirm bleibt an.',
    'A recipe has «Start cooking»: big letters, «Back» and «Next», dots show where you are': 'Ein Rezept hat «Kochen starten»: grosse Schrift, «Zurück» und «Weiter», Punkte zeigen, wo du bist',
    'Steps with a waiting time have a timer; it keeps running on the next step and rings at the end': 'Schritte mit Wartezeit haben einen Timer; er läuft im nächsten Schritt weiter und klingelt am Ende',
    '«All steps» shows the whole order with the ingredients; a tap on a step jumps there': '«Alle Schritte» zeigt den ganzen Ablauf mit den Zutaten; ein Tipp auf einen Schritt springt dorthin',
    'Open Planen › Alltag › Kochen › «Teigwarensalat mit Pesto» and tap «Kochen starten».': 'Öffne Planen › Alltag › Kochen › «Teigwarensalat mit Pesto» und tippe auf «Kochen starten».',
    'In step 1 tap «Start» on the timer, then «Weiter»: a small line shows the running timer.': 'Tippe in Schritt 1 beim Timer auf «Start», dann auf «Weiter»: eine kleine Zeile zeigt den laufenden Timer.',
    'Tap «Alle Schritte», then step 4: it shows step 4 of 4 with «Fertig».': 'Tippe auf «Alle Schritte», dann auf Schritt 4: es zeigt Schritt 4 von 4 mit «Fertig».',
  },
};
