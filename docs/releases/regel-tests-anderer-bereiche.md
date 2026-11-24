# Regeln auf neun Blöcke gekürzt: Tests anderer Bereiche, ausführlichere Antworten, PR-Grenzen, Bilder zu jedem PR

PR (Nummer steht im PR) · 24.11.2026 · Auftrag: Noah «a» (Tests anderer Bereiche) und «ich möchte, dass du ab sofort mehr antwortest» (R32), «Jede Nachricht sagt klar, wovon die Rede ist» (R33) (Thread «Regeln und Anweisungen auf neuen Stand bringen»)

## Was ist neu
- Neue Regeln dieses Tages, jetzt in den neun Blöcken: Tests anderer Bereiche vor dem PR (Block 7), ausführlichere und klare Antworten (Block 2), PR-Grenzen: 5–6 gleichzeitig in der Prüfung, bis 8 offen, 6–10 Threads (Block 4), Projekt-Anweisung bereinigt: Massstab nur Klarheit, Auffindbarkeit, Leitfaden, Datenschutz ausdrücklich (Block 1 und 8).
- **Neun Blöcke statt 33 Regeln** (Noah «1-5a» 24.11.2026 16:50): `docs/regeln.md` ist jetzt etwa eine Seite mit neun Blöcken. Die alten R1–R33 stehen wörtlich in `docs/regeln-archiv.md`; die Namen R31 bis R33 oben gelten als Block 7 und Block 2.
- `docs/regeln.md`: Normalfall ohne Freigabe, aber bei möglichem Datenverlust fragt der Thread zuerst Noah (Block 5); melden nur mit Ergebnis, Blocker oder Frage plus die Rundgänge 08:00 und 20:00 (Block 2).
- `docs/regeln.md` und `CLAUDE.md`: **Bilder zu jedem PR** schon beim Öffnen (Noah 24.11.2026 16:53); ohne sichtbare Änderung genügt ein Satz (Noah «1a» 16:54).
- `CLAUDE.md`: Technisches aus den alten Regeln (Merge-Prüfung, Label `ok`, Wackel-Tests, volle Prüfung, Datenbank-PRs) steht jetzt dort; Verweise zeigen auf «Block n» statt «R n».
- `tests/regeln-doku.test.js`: prüft neun Blöcke in Reihenfolge, je mit Datum und Quelle, und dass `CLAUDE.md` nur vorhandene Blöcke nennt.
- Nur Doku und ein Doku-Test, nichts sichtbar in der App.

## Was fällt weg oder rutscht tiefer
- nichts

## Selbst entschieden
- Die Regeln R31, R32, R33 und die PR-Grenze, die dieser PR zuerst als Einzelregeln brachte, sind in der gleichen PR-Reihe in die neun Blöcke eingegangen (Tests anderer Bereiche: Block 7; Antworten: Block 2; PR-Grenzen: Block 4).
- Keine «Was ist neu»-Datei: nichts sichtbar.

## Entscheide (eigene Datei `docs/decisions/<name>.md`)
- 24.11.2026: Tests anderer Bereiche lokal laufen lassen – siehe `docs/decisions/regel-tests-anderer-bereiche.md`

## Stand im Plan (roadmap.md / vorhaben.md)
- unverändert

## Prüfschritte (nach dem Merge auf der echten Seite)
1. Nichts zu prüfen in der App. Auf GitHub `docs/regeln.md` öffnen: neun Blöcke, Block 7 «Tests» nennt die Tests anderer Bereiche, Block 5 die Bilder zu jedem PR.
