# Höchstens 4 PRs in der Prüfung, Reihenfolge der Wichtigkeit, Massnahmen gegen rote Tests

PR (Nummer steht im PR) · 24.11.2026 · Auftrag: Noah «wenn main wieder grün ist, bitte nur 4 tests gleichzeitig laufen lassen ab sofort» und die Reihenfolge der Bereiche (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- `docs/regeln.md` Block 4: höchstens **4** PRs gleichzeitig in der Prüfung (vorher 5–6), sobald main grün ist; 8 offen und 6–10 Threads bleiben.
- `docs/regeln.md` Block 4: **Reihenfolge der Wichtigkeit**: Auswerten, App schöner, Suche, Rennen, Versteckte Inhalte, weitere Bereiche, alle anderen. Reparaturen von rotem main gehen immer vor.
- `docs/regeln.md` Block 4 und 7, `CLAUDE.md`: **Gegen rote Tests** (Noah «a-c alle»): nie zwei PRs gleichzeitig mergen und jeden PR zuerst auf das neueste main bringen; Wackel-Wächter (ein einmal zufällig roter Test wird noch am selben Tag stabil, vor neuen PRs); Nachtlauf mit allen Tests und Morgenmeldung.
- `CLAUDE.md`: gleicher Punkt unter «Limits».
- `docs/regeln-archiv.md`: die Fassung «5–6 gleichzeitig in der Prüfung» steht wörtlich dort.
- Nur Doku, nichts sichtbar in der App.

## Was fällt weg oder rutscht tiefer
- «Höchstens 5–6 PRs gleichzeitig in der Prüfung» (jetzt 4).
- Die Wackel-Regel «2× zufällig» (jetzt: schon einmal rot genügt).

## Selbst entschieden
- «4 tests gleichzeitig» als «4 PRs gleichzeitig in der Prüfung» gelesen (wie der Koordinator); 8 offen und 6–10 Threads bleiben.
- Der Nachtlauf (`volle-pruefung.yml`) und der Rundgang um 08:00 gibt es schon; neu ist nur die Regel, dass die Morgenmeldung «alles grün?» enthält. Ob dafür noch Technik nötig ist, klärt der Bündler.
- Keine «Was ist neu»-Datei: nichts sichtbar.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Höchstens 4 PRs in der Prüfung, Reihenfolge der Wichtigkeit – siehe `docs/decisions/pruefung-vier-prioritaet.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` öffnen: Block 4 nennt «höchstens 4 PRs gleichzeitig in der Prüfung» und die Reihenfolge der Wichtigkeit.
